require('dotenv').config();

const { ensureDatabaseSeeded } = require('../lib/migrate');
const { getDbInfo, getTables } = require('../lib/db');

async function main() {
  if (!process.env.DB_API_URL_LOCAL && !process.env.DB_API_URL) {
    console.error('DB_API_URL_LOCAL ontbreekt in .env');
    process.exit(1);
  }

  try {
    const info = await getDbInfo();
    console.log('Database info:', info);

    const tables = await getTables();
    console.log('Tabellen:', tables);

    const { seeded, count } = await ensureDatabaseSeeded();
    if (seeded) {
      console.log(`Database gevuld met ${count} bezoeker(s) uit data/config.json`);
    } else {
      console.log('Database bevat al data — geen seed nodig.');
    }
  } catch (err) {
    console.error('Seed mislukt:', err.message);
    process.exit(1);
  }
}

main();
