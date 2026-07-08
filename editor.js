const bcrypt = require('bcryptjs');
const { select, input, confirm, checkbox } = require('@inquirer/prompts');
require('dotenv').config();
const { loadConfigFromFile, saveConfigToFile } = require('./lib/config-file');
const { getAllButtons, resolveButtons, modeLabel } = require('./lib/buttons');
const { GUEST_ID } = require('./lib/guest');

let config = { visitors: [] };

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function uniqueId(baseName) {
  let id = slugify(baseName);
  if (!id) id = 'bezoeker';
  let candidate = id;
  let counter = 2;
  while (config.visitors.some((v) => v.id === candidate)) {
    candidate = `${id}-${counter}`;
    counter++;
  }
  return candidate;
}

function visitorSummary(visitor) {
  const count = resolveButtons(visitor, config).length;
  const guestTag = visitor.id === GUEST_ID ? ' — gastknop op login' : '';
  return `${visitor.name} (${modeLabel(visitor.mode)}, ${count} zichtbaar)${guestTag}`;
}

async function ensureCustomMode(target, label) {
  if (target.mode && target.mode !== 'custom') {
    target.mode = 'custom';
    await persistConfig(`Modus van ${label} gewijzigd naar "eigen knoppen"`);
  }
}

async function persistConfig(message) {
  try {
    config = saveConfigToFile(config);
    if (message) console.log(`\n${message}`);
    console.log('  → opgeslagen naar data/config.json');
  } catch (err) {
    console.error('\nOpslaan mislukt:', err.message);
  }
}

async function addVisitor() {
  const name = await input({
    message: 'Naam van de bezoeker:',
    validate: (value) => (value.trim() ? true : 'Naam is verplicht'),
  });

  const isGuest = slugify(name) === GUEST_ID;
  if (isGuest && config.visitors.some((v) => v.id === GUEST_ID)) {
    console.log('\nGast (id: gast) bestaat al. Bewerk de bestaande gast.');
    return;
  }

  let passwordHash;
  if (isGuest) {
    passwordHash = await bcrypt.hash('__guest__', 10);
    console.log('\nGast heeft geen wachtwoord — bezoekers loggen in via de Gast-knop.');
  } else {
    const password = await input({
      message: 'Wachtwoord:',
      validate: (value) => (value.length >= 1 ? true : 'Wachtwoord is verplicht'),
    });
    passwordHash = await bcrypt.hash(password, 10);
  }

  const id = isGuest ? GUEST_ID : uniqueId(name);

  config.visitors.push({
    id,
    name: name.trim(),
    passwordHash,
    mode: 'custom',
    buttons: [],
    exclude: [],
  });

  await persistConfig(`Bezoeker "${name.trim()}" toegevoegd (id: ${id}).`);
}

async function pickVisitor(message = 'Kies een bezoeker:', excludeId = null) {
  const visitors = config.visitors.filter((v) => v.id !== excludeId);
  if (!visitors.length) {
    console.log('\nGeen bezoekers beschikbaar.');
    return null;
  }

  return select({
    message,
    choices: visitors.map((v) => ({
      name: visitorSummary(v),
      value: v,
    })),
  });
}

async function setVisitorMode(visitor) {
  const mode = await select({
    message: `Knoppenmodus voor "${visitor.name}":`,
    choices: [
      { name: 'Eigen knoppen', value: 'custom' },
      { name: 'Alle knoppen', value: 'all' },
      { name: 'Alles behalve (uitgesloten knoppen)', value: 'allExcept' },
    ],
  });

  visitor.mode = mode;
  await persistConfig(`Modus ingesteld op "${modeLabel(mode)}".`);

  if (mode === 'allExcept') {
    await manageExcludeList(visitor, `uitgesloten knoppen voor "${visitor.name}"`);
  }
}

async function manageExcludeList(target, title) {
  const all = getAllButtons(config);
  if (!all.length) {
    console.log('\nGeen knoppen beschikbaar om uit te sluiten.');
    return;
  }

  const excludedKeys = new Set((target.exclude || []).map((b) => b.url.trim().toLowerCase()));
  const selected = await checkbox({
    message: title,
    choices: all.map((btn) => ({
      name: `${btn.label} → ${btn.url}`,
      value: btn,
      checked: excludedKeys.has(btn.url.trim().toLowerCase()),
    })),
  });

  target.exclude = selected;
  await persistConfig(`${selected.length} knop(pen) uitgesloten.`);
}

async function editVisitor() {
  const visitor = await pickVisitor('Welke bezoeker bewerken?');
  if (!visitor) return;

  const isGuest = visitor.id === GUEST_ID;
  const action = await select({
    message: `Bewerk "${visitor.name}":`,
    choices: [
      { name: 'Naam wijzigen', value: 'name' },
      {
        name: 'Wachtwoord wijzigen',
        value: 'password',
        disabled: isGuest ? 'Gast gebruikt de Gast-knop, geen wachtwoord' : false,
      },
      { name: 'Knoppenmodus wijzigen', value: 'mode' },
      { name: 'Uitgesloten knoppen beheren', value: 'exclude', disabled: visitor.mode !== 'allExcept' },
      { name: 'Annuleren', value: 'cancel' },
    ],
  });

  if (action === 'cancel') return;

  if (action === 'mode') {
    await setVisitorMode(visitor);
    return;
  }

  if (action === 'exclude') {
    await manageExcludeList(visitor, `Welke knoppen uitsluiten voor "${visitor.name}"?`);
    return;
  }

  if (action === 'name') {
    const name = await input({
      message: 'Nieuwe naam:',
      default: visitor.name,
      validate: (value) => (value.trim() ? true : 'Naam is verplicht'),
    });
    visitor.name = name.trim();
    await persistConfig('Naam bijgewerkt.');
    return;
  }

  const password = await input({
    message: 'Nieuw wachtwoord:',
    validate: (value) => (value.length >= 1 ? true : 'Wachtwoord is verplicht'),
  });
  visitor.passwordHash = await bcrypt.hash(password, 10);
  await persistConfig('Wachtwoord bijgewerkt.');
}

async function deleteVisitor() {
  const visitor = await pickVisitor('Welke bezoeker verwijderen?');
  if (!visitor) return;

  const extra =
    visitor.id === GUEST_ID
      ? ' De Gast-knop op de loginpagina verdwijnt ook.'
      : '';
  const ok = await confirm({
    message: `Weet je zeker dat je "${visitor.name}" wilt verwijderen?${extra}`,
    default: false,
  });

  if (!ok) return;

  config.visitors = config.visitors.filter((v) => v.id !== visitor.id);
  await persistConfig(`Bezoeker "${visitor.name}" verwijderd.`);
}

async function copyButtons(target) {
  const source = await pickVisitor('Van welke bezoeker knoppen kopiëren?', target.id);
  if (!source) return;

  const sourceButtons = resolveButtons(source, config);
  if (!sourceButtons.length) {
    console.log('\nDeze bezoeker heeft geen knoppen om te kopiëren.');
    return;
  }

  const selected = await checkbox({
    message: 'Welke knoppen kopiëren?',
    choices: sourceButtons.map((btn) => ({
      name: `${btn.label} → ${btn.url}`,
      value: btn,
      checked: true,
    })),
  });

  if (!selected.length) {
    console.log('\nGeen knoppen geselecteerd.');
    return;
  }

  await ensureCustomMode(target, `"${target.name}"`);

  const existing = new Set(target.buttons.map((b) => b.url.trim().toLowerCase()));
  let added = 0;

  for (const btn of selected) {
    const key = btn.url.trim().toLowerCase();
    if (!existing.has(key)) {
      target.buttons.push({ label: btn.label, url: btn.url });
      existing.add(key);
      added++;
    }
  }

  await persistConfig(`${added} knop(pen) gekopieerd naar "${target.name}".`);
}

async function manageButtons() {
  const visitor = await pickVisitor('Voor welke bezoeker knoppen beheren?');
  if (!visitor) return;

  let running = true;
  while (running) {
    const visible = resolveButtons(visitor, config).length;
    const action = await select({
      message: `"${visitor.name}" — ${modeLabel(visitor.mode)}, ${visible} zichtbaar:`,
      choices: [
        { name: '1. Knop toevoegen', value: 'add' },
        { name: '2. Knop bewerken', value: 'edit', disabled: visitor.mode !== 'custom' || !visitor.buttons.length },
        { name: '3. Knop verwijderen', value: 'delete', disabled: visitor.mode !== 'custom' || !visitor.buttons.length },
        { name: '4. Knoppen kopiëren van andere bezoeker', value: 'copy' },
        { name: '5. Knoppenmodus wijzigen', value: 'mode' },
        { name: '6. Uitgesloten knoppen beheren', value: 'exclude', disabled: visitor.mode !== 'allExcept' },
        { name: '7. Terug', value: 'back' },
      ],
    });

    if (action === 'back') {
      running = false;
      continue;
    }

    if (action === 'mode') {
      await setVisitorMode(visitor);
      continue;
    }

    if (action === 'exclude') {
      await manageExcludeList(visitor, `Welke knoppen uitsluiten voor "${visitor.name}"?`);
      continue;
    }

    if (action === 'copy') {
      await copyButtons(visitor);
      continue;
    }

    if (action === 'add') {
      await ensureCustomMode(visitor, `"${visitor.name}"`);
      await addButton(visitor);
      continue;
    }

    if (action === 'edit') {
      await editButton(visitor);
    } else if (action === 'delete') {
      await deleteButton(visitor);
    }
  }
}

async function addButton(visitor) {
  const label = await input({
    message: 'Label van de knop:',
    validate: (value) => (value.trim() ? true : 'Label is verplicht'),
  });

  const url = await input({
    message: 'URL (https://...):',
    validate: (value) => (isValidUrl(value) ? true : 'Voer een geldige http(s) URL in'),
  });

  visitor.buttons.push({ label: label.trim(), url: url.trim() });
  await persistConfig(`Knop "${label.trim()}" toegevoegd.`);
}

async function pickButton(visitor) {
  return select({
    message: 'Kies een knop:',
    choices: visitor.buttons.map((btn, index) => ({
      name: `${btn.label} → ${btn.url}`,
      value: index,
    })),
  });
}

async function editButton(visitor) {
  const index = await pickButton(visitor);
  const button = visitor.buttons[index];

  const label = await input({
    message: 'Label:',
    default: button.label,
    validate: (value) => (value.trim() ? true : 'Label is verplicht'),
  });

  const url = await input({
    message: 'URL:',
    default: button.url,
    validate: (value) => (isValidUrl(value) ? true : 'Voer een geldige http(s) URL in'),
  });

  button.label = label.trim();
  button.url = url.trim();
  await persistConfig('Knop bijgewerkt.');
}

async function deleteButton(visitor) {
  const index = await pickButton(visitor);
  const button = visitor.buttons[index];

  const ok = await confirm({
    message: `Knop "${button.label}" verwijderen?`,
    default: false,
  });

  if (!ok) return;

  visitor.buttons.splice(index, 1);
  await persistConfig('Knop verwijderd.');
}

async function saveAndExit() {
  console.log('\nAfsluiten.');
  process.exit(0);
}

async function mainMenu() {
  console.log('\n=== Button Portal Editor ===');
  console.log('Wijzigingen worden opgeslagen in data/config.json');

  const action = await select({
    message: 'Wat wil je doen?',
    choices: [
      { name: '1. Bezoeker toevoegen', value: 'add-visitor' },
      { name: '2. Bezoeker bewerken', value: 'edit-visitor' },
      { name: '3. Bezoeker verwijderen', value: 'delete-visitor' },
      { name: '4. Knoppen beheren', value: 'buttons' },
      { name: '5. Afsluiten', value: 'save' },
    ],
  });

  switch (action) {
    case 'add-visitor':
      await addVisitor();
      break;
    case 'edit-visitor':
      await editVisitor();
      break;
    case 'delete-visitor':
      await deleteVisitor();
      break;
    case 'buttons':
      await manageButtons();
      break;
    case 'save':
      await saveAndExit();
      return;
    default:
      break;
  }

  await mainMenu();
}

async function startEditor() {
  config = loadConfigFromFile();
  await mainMenu();
}

startEditor().catch((err) => {
  console.error('Editor fout:', err.message);
  process.exit(1);
});
