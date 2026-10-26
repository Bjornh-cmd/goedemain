require('dotenv').config();

const readline = require('readline');
const { execSync } = require('child_process');
const { migrateLocalConfig } = require('./lib/migrate-local');
const { getListenHost, isCoolify } = require('./lib/http-env');
const app = require('./app');

const PORT = Number(process.env.PORT) || 3000;
const HOST = getListenHost();
const isProduction = process.env.NODE_ENV === 'production';

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getPidsOnPort(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const pids = new Set();
      for (const line of output.trim().split('\n')) {
        const parts = line.trim().split(/\s+/);
        const pid = parseInt(parts[parts.length - 1], 10);
        if (!Number.isNaN(pid) && pid !== process.pid) {
          pids.add(pid);
        }
      }
      return [...pids];
    }

    const output = execSync(`lsof -ti :${port}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    return output
      .trim()
      .split('\n')
      .map((value) => parseInt(value, 10))
      .filter((pid) => !Number.isNaN(pid) && pid !== process.pid);
  } catch {
    return [];
  }
}

function killProcess(pid) {
  if (process.platform === 'win32') {
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    return;
  }
  process.kill(pid, 'SIGTERM');
}

function listen() {
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, HOST, () => resolve(server));
    server.on('error', reject);
  });
}

async function handlePortInUse() {
  console.error(`\nPoort ${PORT} is al in gebruik (waarschijnlijk een andere Node.js server).`);
  const answer = await ask(
    `Wil je het andere proces stoppen zodat de server op poort ${PORT} kan draaien? (j/n): `
  );

  if (!['j', 'ja', 'y', 'yes'].includes(answer)) {
    console.log('\nServer niet gestart. Sluit de bestaande server en probeer opnieuw.');
    process.exit(1);
  }

  const pids = getPidsOnPort(PORT);
  if (!pids.length) {
    console.error('\nKon het proces op deze poort niet vinden. Sluit het handmatig en probeer opnieuw.');
    process.exit(1);
  }

  for (const pid of pids) {
    try {
      killProcess(pid);
      console.log(`Proces ${pid} gestopt.`);
    } catch (err) {
      console.error(`Kon proces ${pid} niet stoppen: ${err.message}`);
      process.exit(1);
    }
  }

  await sleep(500);
}

async function startServer() {
  try {
    await listen();
  } catch (err) {
    if (err.code !== 'EADDRINUSE') {
      throw err;
    }
    if (isProduction || isCoolify()) {
      console.error(`Poort ${PORT} is al in gebruik. Stop het andere proces of wijzig PORT.`);
      process.exit(1);
    }
    await handlePortInUse();
    await listen();
  }

  console.log(`Button Portal draait op http://${HOST}:${PORT}`);
  if (isCoolify()) {
    console.log('Coolify: trust proxy actief, health check op /api/health');
  }
  console.log('Lokale database: data/config.json');
  console.log('Admin: log in als Bjorn → /admin');
  if (process.env.NODE_ENV !== 'production') {
    console.log('Dev-modus: pagina herlaadt automatisch bij wijzigingen (npm run dev)');
  }
}

async function start() {
  if (!process.env.SESSION_SECRET) {
    console.error('SESSION_SECRET ontbreekt in .env');
    console.error('Kopieer .env.example naar .env en vul SESSION_SECRET in.');
    process.exit(1);
  }

  try {
    const result = migrateLocalConfig();
    if (result.hasBjorn) {
      console.log('Admin-account: bjorn (klaar)');
    }
  } catch (err) {
    console.error('Migratie mislukt:', err.message);
    process.exit(1);
  }

  await startServer();
}

start().catch((err) => {
  console.error('Server start mislukt:', err);
  process.exit(1);
});
