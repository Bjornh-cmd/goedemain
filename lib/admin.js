const bcrypt = require('bcryptjs');
const { GUEST_ID } = require('./guest');
const { loadConfigWithMeta, saveConfigWithMeta } = require('./config');

function getAdminVisitorId() {
  return (process.env.ADMIN_VISITOR_ID || 'bjorn').trim().toLowerCase();
}

function isAdminVisitor(visitor) {
  if (!visitor) return false;
  if (visitor.admin === true) return true;
  const id = String(visitor.id || '').trim().toLowerCase();
  const name = String(visitor.name || '').trim().toLowerCase();
  const adminId = getAdminVisitorId();
  return id === adminId || name === adminId;
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function isValidUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return false;
  const value = url.trim();
  if (value.startsWith('/') && !value.startsWith('//')) {
    return value.length > 0 && !value.includes(' ');
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function publicVisitor(visitor) {
  return {
    id: visitor.id,
    name: visitor.name,
    admin: isAdminVisitor(visitor),
    mode: visitor.mode || 'custom',
    buttons: visitor.buttons || [],
    exclude: visitor.exclude || [],
    buttonCount: (visitor.buttons || []).length,
    isGuest: visitor.id === GUEST_ID,
  };
}

async function listPublicVisitors() {
  const config = await loadConfigWithMeta();
  return config.visitors.map(publicVisitor);
}

async function getPublicVisitor(slug) {
  const config = await loadConfigWithMeta();
  const visitor = config.visitors.find((v) => v.id === slug);
  if (!visitor) return null;
  return publicVisitor(visitor);
}

async function addVisitor({ name, password, id }) {
  if (!name?.trim()) {
    throw new Error('Naam is verplicht');
  }

  const slug = id?.trim() || slugify(name);
  if (!slug) throw new Error('Ongeldige id');

  const config = await loadConfigWithMeta();
  if (config.visitors.some((v) => v.id === slug)) {
    throw new Error('Bezoeker met deze id bestaat al');
  }

  const isGuest = slug === GUEST_ID;
  let passwordHash;
  if (isGuest) {
    passwordHash = await bcrypt.hash('__guest__', 10);
  } else {
    if (!password) throw new Error('Wachtwoord is verplicht');
    passwordHash = await bcrypt.hash(password, 10);
  }

  config.visitors.push({
    id: slug,
    name: name.trim(),
    passwordHash,
    mode: 'custom',
    buttons: [],
    exclude: [],
  });

  const saved = await saveConfigWithMeta(config);
  const created = saved.visitors.find((v) => v.id === slug);
  return publicVisitor(created);
}

async function patchVisitor(slug, updates) {
  const config = await loadConfigWithMeta();
  const visitor = config.visitors.find((v) => v.id === slug);
  if (!visitor) return null;

  if (updates.name !== undefined) {
    if (!updates.name.trim()) throw new Error('Naam is verplicht');
    visitor.name = updates.name.trim();
  }

  if (updates.mode !== undefined) {
    const allowed = ['custom', 'all', 'allExcept'];
    if (!allowed.includes(updates.mode)) throw new Error('Ongeldige modus');
    visitor.mode = updates.mode;
  }

  if (updates.exclude !== undefined) {
    visitor.exclude = updates.exclude;
  }

  if (updates.password && visitor.id !== GUEST_ID) {
    visitor.passwordHash = await bcrypt.hash(updates.password, 10);
  }

  const saved = await saveConfigWithMeta(config);
  const updated = saved.visitors.find((v) => v.id === slug);
  return publicVisitor(updated);
}

async function removeVisitor(slug) {
  if (slug === getAdminVisitorId()) {
    throw new Error('De admin-bezoeker kan niet worden verwijderd');
  }

  const config = await loadConfigWithMeta();
  const index = config.visitors.findIndex((v) => v.id === slug);
  if (index === -1) return false;

  config.visitors.splice(index, 1);
  await saveConfigWithMeta(config);
  return true;
}

async function addButton(slug, { label, url }) {
  if (!label?.trim()) throw new Error('Label is verplicht');
  if (!isValidUrl(url)) throw new Error('Voer een geldige URL of pad in (https://... of /video)');

  const config = await loadConfigWithMeta();
  const visitor = config.visitors.find((v) => v.id === slug);
  if (!visitor) return null;

  if (visitor.mode !== 'custom') {
    visitor.mode = 'custom';
  }

  const key = url.trim().toLowerCase();
  if (visitor.buttons.some((b) => b.url.trim().toLowerCase() === key)) {
    throw new Error('Deze URL bestaat al voor deze bezoeker');
  }

  visitor.buttons.push({ label: label.trim(), url: url.trim() });
  const saved = await saveConfigWithMeta(config);
  const updated = saved.visitors.find((v) => v.id === slug);
  return publicVisitor(updated);
}

async function addButtonsBulk(slug, buttons) {
  if (!Array.isArray(buttons) || !buttons.length) {
    throw new Error('Geen knoppen om toe te voegen');
  }

  const config = await loadConfigWithMeta();
  const visitor = config.visitors.find((v) => v.id === slug);
  if (!visitor) return null;

  if (visitor.mode !== 'custom') {
    visitor.mode = 'custom';
  }

  let added = 0;
  let skipped = 0;

  for (const item of buttons) {
    const label = String(item.label || '').trim();
    const url = String(item.url || '').trim();
    if (!label || !isValidUrl(url)) {
      skipped += 1;
      continue;
    }
    const key = url.toLowerCase();
    if (visitor.buttons.some((b) => b.url.trim().toLowerCase() === key)) {
      skipped += 1;
      continue;
    }
    visitor.buttons.push({ label, url });
    added += 1;
  }

  const saved = await saveConfigWithMeta(config);
  const updated = saved.visitors.find((v) => v.id === slug);
  return { visitor: publicVisitor(updated), added, skipped };
}

async function patchButton(slug, index, { label, url }) {
  const config = await loadConfigWithMeta();
  const visitor = config.visitors.find((v) => v.id === slug);
  if (!visitor) return null;

  const btnIndex = Number(index);
  if (!visitor.buttons[btnIndex]) return null;

  if (label !== undefined) {
    if (!label.trim()) throw new Error('Label is verplicht');
    visitor.buttons[btnIndex].label = label.trim();
  }

  if (url !== undefined) {
    if (!isValidUrl(url)) throw new Error('Voer een geldige URL of pad in (https://... of /video)');
    visitor.buttons[btnIndex].url = url.trim();
  }

  const saved = await saveConfigWithMeta(config);
  const updated = saved.visitors.find((v) => v.id === slug);
  return publicVisitor(updated);
}

async function removeButton(slug, index) {
  const config = await loadConfigWithMeta();
  const visitor = config.visitors.find((v) => v.id === slug);
  if (!visitor) return null;

  const btnIndex = Number(index);
  if (!visitor.buttons[btnIndex]) return null;

  visitor.buttons.splice(btnIndex, 1);
  const saved = await saveConfigWithMeta(config);
  const updated = saved.visitors.find((v) => v.id === slug);
  return publicVisitor(updated);
}

module.exports = {
  getAdminVisitorId,
  isAdminVisitor,
  listPublicVisitors,
  getPublicVisitor,
  addVisitor,
  patchVisitor,
  removeVisitor,
  addButton,
  addButtonsBulk,
  patchButton,
  removeButton,
};
