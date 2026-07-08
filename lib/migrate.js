const fs = require('fs');
const path = require('path');
const { listRows, DbApiError } = require('./db');
const { createVisitor, TABLE: VISITORS_TABLE } = require('./db-visitors');
const { normalizeConfig } = require('./buttons');

const SEED_PATH = path.join(__dirname, '..', 'data', 'config.json');

function loadSeedConfig() {
  if (!fs.existsSync(SEED_PATH)) return null;
  const raw = fs.readFileSync(SEED_PATH, 'utf8');
  return normalizeConfig(JSON.parse(raw));
}

async function seedVisitorsFromFile() {
  const seed = loadSeedConfig();
  if (!seed?.visitors?.length) return 0;

  let count = 0;
  for (const visitor of seed.visitors) {
    await createVisitor(visitor);
    count++;
  }
  return count;
}

async function ensureDatabaseSeeded() {
  try {
    const rows = await listRows(VISITORS_TABLE, { limit: 1 });
    if (rows.length > 0) return { seeded: false, count: rows.length };

    const inserted = await seedVisitorsFromFile();
    return { seeded: inserted > 0, count: inserted };
  } catch (err) {
    if (err instanceof DbApiError && err.status === 404) {
      const inserted = await seedVisitorsFromFile();
      return { seeded: inserted > 0, count: inserted };
    }
    throw err;
  }
}

module.exports = { ensureDatabaseSeeded, loadSeedConfig, SEED_PATH };
