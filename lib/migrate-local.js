const fs = require('fs');
const path = require('path');
const { loadConfigFromFile, saveConfigToFile, CONFIG_PATH } = require('./config-file');

const CONFIG_SEED_PATH = path.join(__dirname, '..', 'config.seed.json');

/**
 * Bij een lege persistent volume (Coolify/Docker) config uit image-seed kopiëren.
 */
function ensureLocalConfigFile() {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const hasSeed = fs.existsSync(CONFIG_SEED_PATH);
  if (!fs.existsSync(CONFIG_PATH)) {
    if (hasSeed) {
      fs.copyFileSync(CONFIG_SEED_PATH, CONFIG_PATH);
      console.log('Config aangemaakt vanuit config.seed.json');
    } else {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify({ visitors: [] }, null, 2) + '\n', 'utf8');
    }
    return;
  }

  if (!hasSeed) return;

  try {
    const current = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    if (!Array.isArray(current.visitors) || current.visitors.length === 0) {
      fs.copyFileSync(CONFIG_SEED_PATH, CONFIG_PATH);
      console.log('Lege config.json vervangen vanuit config.seed.json');
    }
  } catch {
    fs.copyFileSync(CONFIG_SEED_PATH, CONFIG_PATH);
    console.log('Ongeldige config.json vervangen vanuit config.seed.json');
  }
}

/**
 * Zorgt dat lokale data/config.json klopt: Bjorn is altijd admin.
 */
function migrateLocalConfig() {
  ensureLocalConfigFile();
  const config = loadConfigFromFile();
  let changed = false;

  for (const visitor of config.visitors) {
    const id = String(visitor.id || '').toLowerCase();
    const name = String(visitor.name || '').toLowerCase();

    if (id === 'bjorn' || name === 'bjorn') {
      if (visitor.id !== 'bjorn') {
        visitor.id = 'bjorn';
        changed = true;
      }
      if (visitor.admin !== true) {
        visitor.admin = true;
        changed = true;
      }
    }
  }

  const hasBjorn = config.visitors.some((v) => String(v.id).toLowerCase() === 'bjorn');
  if (!hasBjorn) {
    console.warn('Migratie: geen bezoeker "bjorn" gevonden in data/config.json');
  }

  if (changed) {
    saveConfigToFile(config);
    console.log('Migratie: Bjorn is als admin gezet in data/config.json');
  }

  return { changed, hasBjorn };
}

module.exports = { migrateLocalConfig, ensureLocalConfigFile };
