const bcrypt = require('bcryptjs');
const { GUEST_ID } = require('./guest');
const {
  listVisitors,
  getVisitorBySlug,
  createVisitor,
  updateVisitor,
  deleteVisitorByDbId,
} = require('./db-visitors');
const { loadConfigWithMeta, saveConfigWithMeta } = require('./config');

function getAdminVisitorId() {
  return process.env.ADMIN_VISITOR_ID || 'bjorn';
}

function isAdminVisitor(visitor) {
  return visitor?.id === getAdminVisitorId();
}

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

function publicVisitor(visitor) {
  return {
    id: visitor.id,
    name: visitor.name,
    mode: visitor.mode || 'custom',
    buttons: visitor.buttons || [],
    exclude: visitor.exclude || [],
    buttonCount: (visitor.buttons || []).length,
    isGuest: visitor.id === GUEST_ID,
  };
}

async function listPublicVisitors() {
  const visitors = await listVisitors();
  return visitors.map(publicVisitor);
}

async function getPublicVisitor(slug) {
  const visitor = await getVisitorBySlug(slug);
  if (!visitor) return null;
  return publicVisitor(visitor);
}

async function addVisitor({ name, password, id }) {
  if (!name?.trim()) {
    throw new Error('Naam is verplicht');
  }

  const slug = id?.trim() || slugify(name);
  if (!slug) throw new Error('Ongeldige id');

  const existing = await getVisitorBySlug(slug);
  if (existing) throw new Error('Bezoeker met deze id bestaat al');

  const isGuest = slug === GUEST_ID;
  let passwordHash;
  if (isGuest) {
    passwordHash = await bcrypt.hash('__guest__', 10);
  } else {
    if (!password) throw new Error('Wachtwoord is verplicht');
    passwordHash = await bcrypt.hash(password, 10);
  }

  const created = await createVisitor({
    id: slug,
    name: name.trim(),
    passwordHash,
    mode: 'custom',
    buttons: [],
    exclude: [],
  });

  return publicVisitor(created);
}

async function patchVisitor(slug, updates) {
  const visitor = await getVisitorBySlug(slug);
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

  const updated = await updateVisitor(visitor);
  return publicVisitor(updated);
}

async function removeVisitor(slug) {
  const visitor = await getVisitorBySlug(slug);
  if (!visitor) return false;
  await deleteVisitorByDbId(visitor._dbId);
  return true;
}

async function addButton(slug, { label, url }) {
  if (!label?.trim()) throw new Error('Label is verplicht');
  if (!isValidUrl(url)) throw new Error('Voer een geldige http(s) URL in');

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
    if (!isValidUrl(url)) throw new Error('Voer een geldige http(s) URL in');
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
  patchButton,
  removeButton,
};
