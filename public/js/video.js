/* Windows 12 Video Desktop */

const $ = (id) => document.getElementById(id);

const desktopEl = $('desktop');
const bootScreen = $('boot-screen');
const loginScreen = $('login-screen');
const loginForm = $('login-form');
const loginUsername = $('login-username');
const outputEl = $('terminal-output');
const videoScreenEl = $('video-screen');
const videoEl = $('vlog-video');
const embedEl = $('vlog-embed');
const disconnectBtn = $('disconnect-btn');
const terminalWindow = $('terminal-window');
const browserFrame = $('browser-frame');
const browserUrl = $('browser-url');
const browserForm = $('browser-form');
const browserRefresh = $('browser-refresh');
const startBtn = $('start-btn');
const startMenu = $('start-menu');
const startSearch = $('start-search');
const taskbarApps = $('taskbar-apps');
const taskbarWrap = document.querySelector('.taskbar-wrap');
const windowsLayer = $('windows-layer');
const clockTime = $('clock-time');
const clockDate = $('clock-date');
const powerBtn = $('power-btn');
const calcBody = $('calc-body');
const explorerBody = $('explorer-body');
const videoUnlockModal = $('video-unlock-modal');
const videoUnlockForm = $('video-unlock-form');
const videoUnlockTitle = $('video-unlock-title');
const videoUnlockSubtitle = $('video-unlock-subtitle');
const videoUnlockPassword = $('video-unlock-password');
const videoUnlockError = $('video-unlock-error');
const videoUnlockCancel = $('video-unlock-cancel');
const videoUnlockBackdrop = $('video-unlock-backdrop');

const PROMPT_USER = 'username: ';
const PROMPT_PASS = 'password: ';

function getShellPrompt() {
  return `C:\\Users\\${currentUser}> `;
}

const STATES = { COMMAND: 'command', USERNAME: 'username', PASSWORD: 'password' };

const APP_META = {
  terminal: { label: 'Terminal', iconId: 'icon-terminal' },
  browser: { label: 'Google Chrome', iconId: 'icon-chrome' },
  notepad: { label: 'Kladblok', iconId: 'icon-notepad' },
  calc: { label: 'Rekenmachine', iconId: 'icon-calc' },
  settings: { label: 'Instellingen', iconId: 'icon-settings' },
  explorer: { label: 'Verkenner', iconId: 'icon-explorer' },
  about: { label: 'Over Windows', iconId: 'icon-about' },
};

const BROWSER_HOME = 'https://www.google.com';
const BROWSER_SEARCH = 'https://www.google.com/search?q=';
const PROXY_PATH = '/api/browse';
const OS_VERSION = '12.0.26000';
const BOOT_TIME = Date.now();

const VFS = {
  '/': { type: 'dir', children: ['home'] },
  '/home': { type: 'dir', children: ['guest'] },
  '/home/guest': { type: 'dir', children: ['documents', 'videos', 'readme.txt'] },
  '/home/guest/documents': { type: 'dir', children: ['notes.txt'] },
  '/home/guest/videos': { type: 'dir', children: [] },
  '/home/guest/readme.txt': { type: 'file', content: 'Welkom op Windows 12 Web Edition.\nTyp "help" in de terminal voor commando\'s.\nTyp "access" voor beveiligde video\'s.' },
  '/home/guest/documents/notes.txt': { type: 'file', content: 'Notities:\n- access = video openen\n- browser = Chrome openen\n- list = vlogs tonen' },
};

const FORTUNES = [
  'De beste manier om de toekomst te voorspellen is hem te creëren.',
  'Het is altijd maandag tot je koffie hebt gedronken.',
  'Er zijn 10 soorten mensen: diegenen die binair begrijpen en diegenen die dat niet doen.',
  'Een bug is gewoon een ongedocumenteerde feature.',
  'Ctrl+S is je beste vriend.',
];

const COMMANDS = [
  { name: 'help', aliases: ['?', 'commands'], desc: 'Alle commando\'s tonen', category: 'Systeem' },
  { name: 'man', aliases: [], desc: 'Hulp bij één commando: man <cmd>', category: 'Systeem' },
  { name: 'clear', aliases: ['cls'], desc: 'Scherm wissen', category: 'Systeem' },
  { name: 'exit', aliases: ['quit'], desc: 'Huidige actie annuleren', category: 'Systeem' },
  { name: 'ver', aliases: ['winver'], desc: 'Windows-versie tonen', category: 'Systeem' },
  { name: 'hostname', aliases: [], desc: 'Computernaam tonen', category: 'Systeem' },
  { name: 'whoami', aliases: [], desc: 'Huidige gebruiker', category: 'Systeem' },
  { name: 'date', aliases: [], desc: 'Huidige datum', category: 'Systeem' },
  { name: 'time', aliases: [], desc: 'Huidige tijd', category: 'Systeem' },
  { name: 'uptime', aliases: [], desc: 'Systeem uptime', category: 'Systeem' },
  { name: 'echo', aliases: [], desc: 'Tekst herhalen: echo <tekst>', category: 'Systeem' },
  { name: 'color', aliases: [], desc: 'Terminalkleur: color <naam>', category: 'Systeem' },
  { name: 'history', aliases: [], desc: 'Commandogeschiedenis', category: 'Systeem' },
  { name: 'reboot', aliases: ['restart'], desc: 'Systeem herstarten', category: 'Systeem' },
  { name: 'shutdown', aliases: ['poweroff'], desc: 'Systeem afsluiten', category: 'Systeem' },
  { name: 'neofetch', aliases: ['systeminfo'], desc: 'Systeeminformatie', category: 'Systeem' },
  { name: 'fortune', aliases: [], desc: 'Willekeurige wijsheid', category: 'Leuk' },
  { name: 'cowsay', aliases: [], desc: 'Koe zegt iets: cowsay <tekst>', category: 'Leuk' },
  { name: 'sudo', aliases: [], desc: 'Admin rechten (grapje)', category: 'Leuk' },
  { name: 'vim', aliases: ['nano', 'emacs'], desc: 'Teksteditor (grapje)', category: 'Leuk' },
  { name: 'ping', aliases: [], desc: 'Ping host: ping <host>', category: 'Netwerk' },
  { name: 'ipconfig', aliases: ['ifconfig'], desc: 'Netwerkinstellingen', category: 'Netwerk' },
  { name: 'curl', aliases: ['wget'], desc: 'URL ophalen (simulatie)', category: 'Netwerk' },
  { name: 'pwd', aliases: [], desc: 'Huidige map', category: 'Bestanden' },
  { name: 'cd', aliases: ['chdir'], desc: 'Van map wisselen: cd <pad>', category: 'Bestanden' },
  { name: 'ls', aliases: ['dir', 'list'], desc: 'Bestanden of vlogs tonen', category: 'Bestanden' },
  { name: 'cat', aliases: ['type'], desc: 'Bestand lezen: cat <bestand>', category: 'Bestanden' },
  { name: 'tree', aliases: [], desc: 'Mappenstructuur tonen', category: 'Bestanden' },
  { name: 'access', aliases: ['acces'], desc: 'Beveiligde video openen', category: 'Apps' },
  { name: 'browser', aliases: ['chrome', 'edge', 'browse', 'web'], desc: 'Google Chrome openen', category: 'Apps' },
  { name: 'notepad', aliases: ['note'], desc: 'Kladblok openen', category: 'Apps' },
  { name: 'calc', aliases: ['calculator', 'rekenmachine'], desc: 'Rekenmachine openen', category: 'Apps' },
  { name: 'settings', aliases: ['instellingen'], desc: 'Instellingen openen', category: 'Apps' },
  { name: 'explorer', aliases: ['files', 'verkenner'], desc: 'Verkenner openen', category: 'Apps' },
  { name: 'about', aliases: [], desc: 'Over Windows', category: 'Apps' },
  { name: 'open', aliases: ['start'], desc: 'App openen: open <app>', category: 'Apps' },
  { name: 'taskmgr', aliases: ['tasks'], desc: 'Actieve processen tonen', category: 'Apps' },
];

let browserHistory = [];
let browserHistoryIndex = -1;
let browserLoaded = false;
let zIndexCounter = 10;
const MAX_WINDOW_Z = 500;
let state = STATES.COMMAND;
let currentUser = '';
let vlogId = '';
let pendingExplorerVlogId = '';
let activeForm = null;
let activeInput = null;
let cwd = '/home/guest';
let cmdHistory = [];
let historyIndex = -1;
let calcDisplay = '0';
let calcPrev = null;
let calcOp = null;

/* ── Terminal UI ── */

function scrollToBottom() {
  outputEl.scrollTop = outputEl.scrollHeight;
}

function appendLine(text, className = '') {
  const line = document.createElement('div');
  line.className = `terminal-line${className ? ` ${className}` : ''}`;
  line.textContent = text;
  outputEl.appendChild(line);
  scrollToBottom();
}

function commitActiveLine(value, masked = false) {
  if (!activeForm) return;
  const prompt = activeForm.querySelector('.terminal-prompt').textContent;
  const display = masked ? '*'.repeat(value.length) : value;
  const echo = document.createElement('div');
  echo.className = 'terminal-line terminal-line--echo';
  echo.textContent = `${prompt}${display}`;
  activeForm.replaceWith(echo);
  activeForm = null;
  activeInput = null;
  scrollToBottom();
}

function focusTerminalInput() {
  if (activeInput) { activeInput.focus({ preventScroll: true }); return; }
  if (state === STATES.USERNAME) showPrompt(PROMPT_USER);
  else if (state === STATES.PASSWORD) showPrompt(PROMPT_PASS, 'password');
  else showPrompt(getShellPrompt());
}

function showPrompt(promptText, inputType = 'text') {
  if (activeForm) activeForm.remove();
  activeForm = document.createElement('form');
  activeForm.className = 'terminal-active-line';
  activeForm.autocomplete = 'off';
  activeForm.setAttribute('data-lpignore', 'true');
  const prompt = document.createElement('span');
  prompt.className = 'terminal-prompt';
  prompt.textContent = promptText;
  activeInput = document.createElement('input');
  const isSecret = inputType === 'password';
  activeInput.type = 'text';
  activeInput.className = 'terminal-input' + (isSecret ? ' terminal-input--secret' : '');
  activeInput.autocomplete = 'off';
  activeInput.spellcheck = false;
  activeInput.autocapitalize = 'off';
  activeInput.autocorrect = 'off';
  activeInput.setAttribute('data-lpignore', 'true');
  activeInput.setAttribute('data-1p-ignore', 'true');
  if (isSecret) activeInput.setAttribute('inputmode', 'text');
  activeForm.append(prompt, activeInput);
  outputEl.appendChild(activeForm);
  activeForm.addEventListener('submit', onSubmit);
  activeInput.addEventListener('keydown', onInputKeydown);
  activeInput.focus({ preventScroll: true });
  scrollToBottom();
}

function onInputKeydown(e) {
  if (e.key === 'ArrowUp' && cmdHistory.length) {
    e.preventDefault();
    historyIndex = historyIndex < 0 ? cmdHistory.length - 1 : Math.max(0, historyIndex - 1);
    activeInput.value = cmdHistory[historyIndex];
  } else if (e.key === 'ArrowDown' && historyIndex >= 0) {
    e.preventDefault();
    historyIndex = Math.min(cmdHistory.length, historyIndex + 1);
    activeInput.value = historyIndex < cmdHistory.length ? cmdHistory[historyIndex] : '';
  }
}

function printBanner() {
  appendLine(`Microsoft Windows [Version ${OS_VERSION}]`, 'terminal-line--dim');
  appendLine('(c) Button Portal Corporation. Alle rechten voorbehouden.', 'terminal-line--dim');
  if (currentUser) appendLine(`Ingelogd als ${currentUser}`, 'terminal-line--dim');
  appendLine('');
  appendLine('Typ "help" voor alle commando\'s.', 'terminal-line--info');
  appendLine('');
}

function resetTerminal(resetPosition = false) {
  state = STATES.COMMAND;
  vlogId = '';
  outputEl.innerHTML = '';
  printBanner();
  if (resetPosition && terminalWindow) {
    terminalWindow.style.position = '';
    terminalWindow.style.left = '';
    terminalWindow.style.top = '';
    terminalWindow.style.width = '';
    terminalWindow.style.height = '';
    terminalWindow.classList.remove('os-window--maximized');
  }
  showPrompt(getShellPrompt());
}

function resolveCommand(input) {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase() || '';
  const def = COMMANDS.find((c) => c.name === cmd || c.aliases.some((a) => a === cmd));
  return def ? { def, args: parts.slice(1), raw: input.trim() } : null;
}

function printHelp(filter = '') {
  const groups = {};
  for (const cmd of COMMANDS) {
    if (filter && !cmd.name.includes(filter) && !cmd.aliases.some((a) => a.includes(filter)) && !cmd.desc.toLowerCase().includes(filter)) continue;
    if (!groups[cmd.category]) groups[cmd.category] = [];
    const aliases = cmd.aliases.length ? ` (${cmd.aliases.join(', ')})` : '';
    groups[cmd.category].push(`  ${cmd.name}${aliases} — ${cmd.desc}`);
  }
  appendLine('Beschikbare commando\'s:', 'terminal-line--info');
  for (const [cat, lines] of Object.entries(groups)) {
    appendLine(`[${cat}]`, 'terminal-line--warn');
    lines.forEach((l) => appendLine(l, 'terminal-line--dim'));
  }
}

function printMan(cmdName) {
  const def = COMMANDS.find((c) => c.name === cmdName || c.aliases.includes(cmdName));
  if (!def) { appendLine(`Geen handleiding voor "${cmdName}".`, 'terminal-line--error'); return; }
  appendLine(`NAAM: ${def.name}`, 'terminal-line--info');
  if (def.aliases.length) appendLine(`ALIASSEN: ${def.aliases.join(', ')}`, 'terminal-line--dim');
  appendLine(`BESCHRIJVING: ${def.desc}`, 'terminal-line--dim');
}

/* ── Virtual filesystem ── */

function normalizePath(p) {
  const base = cwd.endsWith('/') ? cwd.slice(0, -1) : cwd;
  let path = p.startsWith('/') ? p : `${base}/${p}`;
  const parts = [];
  for (const part of path.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return '/' + parts.join('/');
}

function vfsGet(path) {
  return VFS[normalizePath(path)] || null;
}

function vfsList(dir = cwd) {
  const node = vfsGet(dir);
  if (!node || node.type !== 'dir') return null;
  return node.children.map((name) => {
    const full = dir === '/' ? `/${name}` : `${dir}/${name}`;
    const child = VFS[full];
    return { name, type: child?.type || 'file', path: full };
  });
}

/* ── Commands ── */

async function runCommand(resolved) {
  const { def, args } = resolved;
  const cmd = def.name;

  const openers = {
    browser: 'browser', notepad: 'notepad', calc: 'calc',
    settings: 'settings', explorer: 'explorer', about: 'about', terminal: 'terminal',
  };

  if (openers[cmd]) { openApp(openers[cmd]); return; }

  if (cmd === 'open' || cmd === 'start') {
    const target = args[0]?.toLowerCase();
    if (!target) { appendLine('Gebruik: open <app>', 'terminal-line--error'); return; }
    const app = openers[target] || (['chrome', 'edge', 'browser'].includes(target) ? 'browser' : null);
    if (app) openApp(app);
    else appendLine(`Onbekende app: "${target}"`, 'terminal-line--error');
    return;
  }

  if (cmd === 'help') { printHelp(args[0] || ''); return; }
  if (cmd === 'man') { printMan(args[0] || ''); return; }
  if (cmd === 'clear') { outputEl.innerHTML = ''; printBanner(); return; }
  if (cmd === 'ver' || cmd === 'winver') { appendLine(`Microsoft Windows [Version ${OS_VERSION}]`); return; }
  if (cmd === 'hostname') { appendLine('VIDEO-OS-12'); return; }
  if (cmd === 'whoami') { appendLine(`video-os\\${currentUser || 'guest'}`); return; }
  if (cmd === 'date') { appendLine(new Date().toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })); return; }
  if (cmd === 'time') { appendLine(new Date().toLocaleTimeString('nl-NL')); return; }
  if (cmd === 'echo') { appendLine(args.join(' ') || ''); return; }
  if (cmd === 'fortune') { appendLine(FORTUNES[Math.floor(Math.random() * FORTUNES.length)], 'terminal-line--info'); return; }
  if (cmd === 'sudo') { appendLine(`${currentUser || 'guest'} is not in the sudoers file. This incident will be reported.`, 'terminal-line--error'); return; }
  if (cmd === 'vim' || cmd === 'nano' || cmd === 'emacs') { appendLine('Error: Geen teksteditor geïnstalleerd. Gebruik "notepad".', 'terminal-line--warn'); return; }

  if (cmd === 'uptime') {
    const ms = Date.now() - BOOT_TIME;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    appendLine(`Up ${h} uur, ${m} min, ${s} sec`, 'terminal-line--dim');
    return;
  }

  if (cmd === 'color') {
    const colors = { groen: '#3ddc84', blauw: '#569cd6', rood: '#f14c4c', geel: '#dcdcaa', wit: '#cccccc' };
    const c = colors[args[0]?.toLowerCase()];
    if (!c) { appendLine('Kleuren: groen, blauw, rood, geel, wit', 'terminal-line--dim'); return; }
    outputEl.style.color = c;
    appendLine(`Kleur gewijzigd naar ${args[0]}.`, 'terminal-line--success');
    return;
  }

  if (cmd === 'history') {
    if (!cmdHistory.length) appendLine('(geen geschiedenis)', 'terminal-line--dim');
    else cmdHistory.forEach((h, i) => appendLine(`  ${i + 1}  ${h}`, 'terminal-line--dim'));
    return;
  }

  if (cmd === 'neofetch' || cmd === 'systeminfo') {
    appendLine(`    VIDEO-OS@win12`, 'terminal-line--info');
    appendLine(`    ─────────────────────────`, 'terminal-line--dim');
    appendLine(`    OS: Windows 12 Web Edition ${OS_VERSION}`, 'terminal-line--dim');
    appendLine(`    Host: VIDEO-OS-12`, 'terminal-line--dim');
    appendLine(`    User: ${currentUser || 'guest'}`, 'terminal-line--dim');
    appendLine(`    Kernel: Chromium ${navigator.userAgent.includes('Chrome') ? 'ja' : 'nee'}`, 'terminal-line--dim');
    appendLine(`    Shell: video-terminal 3.0`, 'terminal-line--dim');
    appendLine(`    Resolutie: ${screen.width}x${screen.height}`, 'terminal-line--dim');
    appendLine(`    Geheugen: ${navigator.deviceMemory || '?'} GB`, 'terminal-line--dim');
    appendLine(`    Terminal: ${outputEl.clientWidth}x${outputEl.clientHeight}`, 'terminal-line--dim');
    return;
  }

  if (cmd === 'cowsay') {
    const msg = args.join(' ') || 'moo';
    appendLine(` ${'_'.repeat(msg.length + 2)}`, 'terminal-line--dim');
    appendLine(`< ${msg} >`, 'terminal-line--dim');
    appendLine(` ${'-'.repeat(msg.length + 2)}`, 'terminal-line--dim');
    appendLine('        \\   ^__^', 'terminal-line--dim');
    appendLine('         \\  (oo)\\_______', 'terminal-line--dim');
    appendLine('            (__)\\       )\\/\\', 'terminal-line--dim');
    return;
  }

  if (cmd === 'ipconfig' || cmd === 'ifconfig') {
    appendLine('Windows IP-configuratie', 'terminal-line--info');
    appendLine('');
    appendLine('Ethernet-adapter Ethernet:', 'terminal-line--dim');
    appendLine('   IPv4-adres. . . . . . . . . . . : 192.168.1.100', 'terminal-line--dim');
    appendLine('   Subnetmasker. . . . . . . . . . : 255.255.255.0', 'terminal-line--dim');
    appendLine('   Standaardgateway. . . . . . . . : 192.168.1.1', 'terminal-line--dim');
    appendLine('   DNS-servers . . . . . . . . . . : 8.8.8.8', 'terminal-line--dim');
    return;
  }

  if (cmd === 'ping') {
    const host = args[0] || 'localhost';
    appendLine(`Pingen naar ${host} met 32 bytes gegevens:`, 'terminal-line--dim');
    for (let i = 1; i <= 4; i++) {
      await new Promise((r) => setTimeout(r, 200));
      appendLine(`Antwoord van ${host}: bytes=32 tijd=${Math.floor(Math.random() * 30 + 5)}ms TTL=128`, 'terminal-line--dim');
    }
    appendLine(`Ping-statistieken voor ${host}:`, 'terminal-line--info');
    return;
  }

  if (cmd === 'curl' || cmd === 'wget') {
    const url = args[0];
    if (!url) { appendLine('Gebruik: curl <url>', 'terminal-line--error'); return; }
    appendLine(`Ophalen ${url}...`, 'terminal-line--dim');
    try {
      const res = await fetch(`/api/browse?url=${encodeURIComponent(url.startsWith('http') ? url : 'https://' + url)}`);
      appendLine(`HTTP ${res.status} — ${res.headers.get('content-type') || 'onbekend'}`, 'terminal-line--success');
    } catch {
      appendLine('Verbinding mislukt.', 'terminal-line--error');
    }
    return;
  }

  if (cmd === 'pwd') {
    const sub = cwd === '/home/guest' ? '' : cwd.replace('/home/guest', '').replace(/\//g, '\\');
    appendLine(`C:\\Users\\${currentUser || 'guest'}${sub}`);
    return;
  }

  if (cmd === 'cd' || cmd === 'chdir') {
    const target = args[0] || '/home/guest';
    const node = vfsGet(target);
    if (!node || node.type !== 'dir') { appendLine('Het systeem kan het opgegeven pad niet vinden.', 'terminal-line--error'); return; }
    cwd = normalizePath(target);
    return;
  }

  if (cmd === 'cat' || cmd === 'type') {
    const node = vfsGet(args[0] || '');
    if (!node || node.type !== 'file') { appendLine('Bestand niet gevonden.', 'terminal-line--error'); return; }
    node.content.split('\n').forEach((l) => appendLine(l));
    return;
  }

  if (cmd === 'tree') {
    function walk(dir, prefix = '') {
      const items = vfsList(dir);
      if (!items) return;
      items.forEach((item, i) => {
        const isLast = i === items.length - 1;
        appendLine(`${prefix}${isLast ? '└── ' : '├── '}${item.name}`, 'terminal-line--dim');
        if (item.type === 'dir') walk(item.path, prefix + (isLast ? '    ' : '│   '));
      });
    }
    appendLine(cwd.replace(/\//g, '\\'), 'terminal-line--info');
    walk(cwd);
    return;
  }

  if (cmd === 'ls' || cmd === 'dir' || cmd === 'list') {
    if (args[0] === '-a' || args.length === 0) {
      try {
        const res = await fetch('/api/vlogs');
        const data = await res.json();
        if (data.vlogs?.length) {
          appendLine('Vlogs:', 'terminal-line--info');
          data.vlogs.forEach((v) => appendLine(`  ${v.id.padEnd(16)} ${v.title}`, 'terminal-line--dim'));
        } else {
          appendLine('(geen vlogs gevonden)', 'terminal-line--dim');
        }
      } catch {
        appendLine('Kon vlogs niet laden.', 'terminal-line--error');
      }
    }
    const items = vfsList(args[0] ? normalizePath(args[0]) : cwd);
    if (items) {
      appendLine('');
      appendLine('Map van ' + (args[0] ? normalizePath(args[0]) : cwd).replace(/\//g, '\\'), 'terminal-line--info');
      items.forEach((item) => appendLine(`  ${item.type === 'dir' ? '<DIR>          ' : '               '} ${item.name}`, 'terminal-line--dim'));
    }
    return;
  }

  if (cmd === 'taskmgr' || cmd === 'tasks') {
    appendLine('PID   Naam                    Status', 'terminal-line--info');
    Object.entries(APP_META).forEach(([id, meta], i) => {
      const win = getWindowEl(id);
      const status = win && !win.classList.contains('hidden') ? 'Actief' : 'Gesloten';
      appendLine(`${(1000 + i).toString().padEnd(5)} ${meta.label.padEnd(24)} ${status}`, 'terminal-line--dim');
    });
    return;
  }

  if (cmd === 'reboot' || cmd === 'restart') {
    appendLine('Systeem wordt herstart...', 'terminal-line--warn');
    await new Promise((r) => setTimeout(r, 800));
    doReboot();
    return;
  }

  if (cmd === 'shutdown' || cmd === 'poweroff') {
    appendLine('Windows wordt afgesloten...', 'terminal-line--warn');
    await new Promise((r) => setTimeout(r, 800));
    doShutdown();
    return;
  }

  if (cmd === 'access') {
    state = STATES.USERNAME;
    vlogId = '';
    showPrompt(PROMPT_USER);
    return 'flow';
  }

  if (cmd === 'exit') {
    if (state !== STATES.COMMAND) {
      state = STATES.COMMAND;
      vlogId = '';
      appendLine('Actie geannuleerd.', 'terminal-line--dim');
    } else {
      appendLine('Geen actieve sessie.', 'terminal-line--dim');
    }
    return;
  }
}

function handleCommandInput(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;
  commitActiveLine(raw);
  cmdHistory.push(trimmed);
  historyIndex = -1;

  const resolved = resolveCommand(trimmed);
  if (!resolved) {
    appendLine(`'${trimmed.split(/\s+/)[0]}' is niet herkend als interne of externe opdracht.`, 'terminal-line--error');
    showPrompt(getShellPrompt());
    return;
  }

  runCommand(resolved).then((result) => {
    if (result !== 'flow') showPrompt(getShellPrompt());
  });
}

/* ── Video access flow ── */

function clearVideoPlayers() {
  videoEl.pause();
  videoEl.removeAttribute('src');
  videoEl.classList.add('hidden');
  embedEl.removeAttribute('src');
  embedEl.classList.add('hidden');
}

async function showVideo(id) {
  desktopEl.classList.add('hidden');
  videoScreenEl.classList.remove('hidden');
  clearVideoPlayers();

  const playbackRes = await fetch(`/api/vlogs/${encodeURIComponent(id)}/playback`);
  if (!playbackRes.ok) { showDesktop(); return; }
  const playback = await playbackRes.json();

  if (playback.type === 'embed') {
    embedEl.src = playback.embedUrl;
    embedEl.classList.remove('hidden');
  } else {
    videoEl.classList.remove('hidden');
    videoEl.src = `/api/vlogs/${encodeURIComponent(id)}/video`;
    videoEl.load();
  }
}

function showDesktop() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  clearVideoPlayers();
  videoScreenEl.classList.add('hidden');
  desktopEl.classList.remove('hidden');
  resetTerminal(true);
}

async function tryUnlock(id, code) {
  const res = await fetch(`/api/vlogs/${encodeURIComponent(id)}/unlock`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, error: data.error };
}

async function unlockAndPlayVideo(id, password) {
  const { ok, error } = await tryUnlock(id, password);
  if (!ok) return { ok: false, error: error || 'Toegang geweigerd.' };
  await showVideo(id);
  requestVideoFullscreen();
  return { ok: true };
}

function showVideoUnlockError(message) {
  if (!message) {
    videoUnlockError.classList.add('hidden');
    videoUnlockError.textContent = '';
    return;
  }
  videoUnlockError.textContent = message;
  videoUnlockError.classList.remove('hidden');
}

function closeVideoUnlockModal() {
  videoUnlockModal.classList.add('hidden');
  pendingExplorerVlogId = '';
  videoUnlockPassword.value = '';
  showVideoUnlockError('');
}

async function openVideoUnlockModal(id, title) {
  const statusRes = await fetch(`/api/vlogs/${encodeURIComponent(id)}/status`);
  if (!statusRes.ok) return;
  const status = await statusRes.json();

  if (status.noPassword) {
    await unlockAndPlayVideo(id, '');
    return;
  }

  pendingExplorerVlogId = id;
  videoUnlockTitle.textContent = 'Video openen';
  videoUnlockSubtitle.textContent = title ? `${title} — voer het wachtwoord in` : `Voer het wachtwoord in voor "${id}"`;
  showVideoUnlockError('');
  videoUnlockModal.classList.remove('hidden');
  setTimeout(() => videoUnlockPassword.focus(), 50);
}

async function handleVideoUnlockSubmit(e) {
  e.preventDefault();
  const password = videoUnlockPassword.value;
  if (!password.trim()) {
    showVideoUnlockError('Wachtwoord is verplicht.');
    return;
  }
  if (!pendingExplorerVlogId) return;

  const submitBtn = videoUnlockForm.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  showVideoUnlockError('');

  const { ok, error } = await unlockAndPlayVideo(pendingExplorerVlogId, password);
  submitBtn.disabled = false;

  if (!ok) {
    showVideoUnlockError(error);
    videoUnlockPassword.focus();
    videoUnlockPassword.select();
    return;
  }
  closeVideoUnlockModal();
}

async function handleUsernameInput(name) {
  const trimmed = name.trim();
  if (!trimmed) { appendLine('Fout: username is verplicht.', 'terminal-line--error'); showPrompt(PROMPT_USER); return; }
  vlogId = trimmed;
  commitActiveLine(trimmed);
  const statusRes = await fetch(`/api/vlogs/${encodeURIComponent(vlogId)}/status`);
  if (!statusRes.ok) { appendLine(`Fout: vlog "${vlogId}" niet gevonden.`, 'terminal-line--error'); state = STATES.COMMAND; showPrompt(getShellPrompt()); return; }
  const status = await statusRes.json();
  if (status.noPassword) {
    appendLine('Geen wachtwoord vereist. Video wordt geladen...', 'terminal-line--success');
    state = STATES.COMMAND;
    const { ok, error } = await unlockAndPlayVideo(vlogId, '');
    if (!ok) appendLine(error, 'terminal-line--error');
    showPrompt(getShellPrompt());
    return;
  }
  state = STATES.PASSWORD;
  showPrompt(PROMPT_PASS, 'password');
}

async function handlePasswordInput(password) {
  if (!password.trim()) { appendLine('Fout: password is verplicht.', 'terminal-line--error'); showPrompt(PROMPT_PASS, 'password'); return; }
  commitActiveLine(password, true);
  appendLine('Authenticeren...', 'terminal-line--dim');
  const { ok, error } = await unlockAndPlayVideo(vlogId, password);
  if (!ok) { appendLine(error, 'terminal-line--error'); showPrompt(PROMPT_PASS, 'password'); return; }
  appendLine('Toegang verleend. Video wordt geladen...', 'terminal-line--success');
}

async function onSubmit(e) {
  e.preventDefault();
  const value = activeInput?.value ?? '';
  const trimmed = value.trim();

  if (state !== STATES.COMMAND) {
    const flowCmd = trimmed ? resolveCommand(trimmed) : null;
    if (flowCmd?.def.name === 'exit' || flowCmd?.def.name === 'help') {
      commitActiveLine(trimmed);
      if (flowCmd.def.name === 'exit') { state = STATES.COMMAND; vlogId = ''; appendLine('Actie geannuleerd.', 'terminal-line--dim'); showPrompt(getShellPrompt()); }
      else { printHelp(); showPrompt(state === STATES.USERNAME ? PROMPT_USER : PROMPT_PASS); }
      return;
    }
  }

  if (state === STATES.COMMAND) { handleCommandInput(value); return; }
  if (state === STATES.USERNAME) await handleUsernameInput(value);
  else if (state === STATES.PASSWORD) await handlePasswordInput(value);
}

function requestVideoFullscreen() {
  const req = videoScreenEl.requestFullscreen?.() || videoScreenEl.webkitRequestFullscreen?.();
  if (req?.then) req.catch(() => {});
}

/* ── Browser (Google only) ── */

function isAllowedGoogleUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    const host = u.hostname.replace(/^www\./i, '').toLowerCase();
    if (host !== 'google.com') return false;
    const path = u.pathname.replace(/\/$/, '') || '/';
    return path === '/' || (path === '/search' && u.searchParams.has('q'));
  } catch {
    return false;
  }
}

function normalizeUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return BROWSER_HOME;
  if (/^https?:\/\//i.test(trimmed)) {
    return isAllowedGoogleUrl(trimmed) ? trimmed : `${BROWSER_SEARCH}${encodeURIComponent(trimmed)}`;
  }
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    const url = `https://${trimmed}`;
    return isAllowedGoogleUrl(url) ? url : `${BROWSER_SEARCH}${encodeURIComponent(trimmed)}`;
  }
  return `${BROWSER_SEARCH}${encodeURIComponent(trimmed)}`;
}

function navigateBrowser(rawUrl, pushHistory = true) {
  let url = normalizeUrl(rawUrl);
  if (!isAllowedGoogleUrl(url)) url = BROWSER_HOME;
  if (pushHistory) {
    browserHistory = browserHistory.slice(0, browserHistoryIndex + 1);
    browserHistory.push(url);
    browserHistoryIndex = browserHistory.length - 1;
  }
  browserUrl.value = url.includes('/search?') ? new URL(url).searchParams.get('q') || url : 'google.com';
  browserFrame.src = `${PROXY_PATH}?url=${encodeURIComponent(url)}`;
  browserLoaded = true;
}

/* ── Calculator ── */

function initCalculator() {
  const buttons = [
    'C', '±', '%', '÷',
    '7', '8', '9', '×',
    '4', '5', '6', '−',
    '1', '2', '3', '+',
    '0', '.', '=', '=',
  ];
  calcBody.innerHTML = `<div class="calc-display" id="calc-display">0</div>`;
  buttons.forEach((b, i) => {
    if (i === 16) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'calc-btn' + (['÷', '×', '−', '+'].includes(b) ? ' calc-btn--op' : b === '=' ? ' calc-btn--eq' : '');
    btn.textContent = b;
    if (b === '0') btn.style.gridColumn = 'span 2';
    btn.addEventListener('click', () => calcPress(b));
    calcBody.appendChild(btn);
  });
}

function calcUpdate() {
  const el = $('calc-display');
  if (el) el.textContent = calcDisplay;
}

function calcPress(key) {
  if (key === 'C') { calcDisplay = '0'; calcPrev = null; calcOp = null; }
  else if (key === '±') { calcDisplay = String(-parseFloat(calcDisplay)); }
  else if (key === '%') { calcDisplay = String(parseFloat(calcDisplay) / 100); }
  else if (['+', '−', '×', '÷'].includes(key)) { calcPrev = parseFloat(calcDisplay); calcOp = key; calcDisplay = '0'; }
  else if (key === '=') {
    if (calcPrev !== null && calcOp) {
      const cur = parseFloat(calcDisplay);
      const ops = { '+': calcPrev + cur, '−': calcPrev - cur, '×': calcPrev * cur, '÷': cur !== 0 ? calcPrev / cur : 'Error' };
      calcDisplay = String(ops[calcOp]);
      calcPrev = null; calcOp = null;
    }
  } else if (key === '.') { if (!calcDisplay.includes('.')) calcDisplay += '.'; }
  else { calcDisplay = calcDisplay === '0' ? key : calcDisplay + key; }
  calcUpdate();
}

/* ── Explorer ── */

async function renderExplorer(dir = '/home/guest') {
  explorerBody.innerHTML = `
    <nav class="explorer-sidebar">
      <button type="button" class="explorer-nav-item${dir === '/home/guest' ? ' active' : ''}" data-dir="/home/guest">
        <svg width="16" height="16"><use href="#icon-folder"/></svg> Home
      </button>
      <button type="button" class="explorer-nav-item${dir === '/home/guest/documents' ? ' active' : ''}" data-dir="/home/guest/documents">
        <svg width="16" height="16"><use href="#icon-folder"/></svg> Documenten
      </button>
      <button type="button" class="explorer-nav-item${dir === '/home/guest/videos' ? ' active' : ''}" data-dir="/home/guest/videos">
        <svg width="16" height="16"><use href="#icon-video"/></svg> Video's
      </button>
    </nav>
    <div class="explorer-main" id="explorer-files"></div>`;

  const filesEl = $('explorer-files');
  let items = vfsList(dir) || [];

  if (dir === '/home/guest/videos') {
    items = [];
    try {
      const res = await fetch('/api/vlogs');
      const data = await res.json();
      items = (data.vlogs || []).map((v) => ({
        name: `${v.id}.mp4`,
        sub: v.title,
        type: 'video',
        vlogId: v.id,
      }));
    } catch {
      filesEl.innerHTML = '<p class="explorer-empty">Kon video\'s niet laden.</p>';
      bindExplorerNav(dir);
      return;
    }
    if (!items.length) {
      filesEl.innerHTML = '<p class="explorer-empty">Geen video\'s gevonden in vid/</p>';
      bindExplorerNav(dir);
      return;
    }
  }

  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'explorer-item';
    const iconId = item.type === 'dir' ? 'folder' : item.type === 'video' ? 'video' : 'file';
    row.innerHTML = `
      <svg width="22" height="22"><use href="#icon-${iconId}"/></svg>
      <span class="explorer-item-name">${item.name}</span>
      ${item.sub ? `<span class="explorer-item-sub">${item.sub}</span>` : ''}`;
    if (item.type === 'dir') {
      row.style.cursor = 'pointer';
      row.addEventListener('dblclick', () => renderExplorer(item.path));
    }
    if (item.type === 'video') {
      row.classList.add('explorer-item--video');
      row.title = `Dubbelklik om "${item.sub || item.vlogId}" te openen`;
      row.addEventListener('dblclick', () => openVideoUnlockModal(item.vlogId, item.sub || item.name));
    }
    filesEl.appendChild(row);
  });

  bindExplorerNav(dir);
}

function bindExplorerNav(dir) {
  explorerBody.querySelectorAll('.explorer-nav-item').forEach((btn) => {
    btn.addEventListener('click', () => renderExplorer(btn.dataset.dir));
  });
}

/* ── Window management ── */

function getWindowEl(appId) {
  return document.querySelector(`.os-window[data-app="${appId}"]`);
}

function updateTaskbar() {
  taskbarApps.innerHTML = '';
  for (const [appId, meta] of Object.entries(APP_META)) {
    const win = getWindowEl(appId);
    if (!win) continue;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'taskbar-app';
    btn.dataset.app = appId;
    if (!win.classList.contains('hidden')) btn.classList.add('taskbar-app--active');
    btn.innerHTML = `<svg class="os-app-icon"><use href="#${meta.iconId}"/></svg>`;
    btn.title = meta.label;
    taskbarApps.appendChild(btn);
  }
}

function focusWindow(win) {
  zIndexCounter = Math.min(zIndexCounter + 1, MAX_WINDOW_Z);
  win.style.zIndex = String(zIndexCounter);
  document.querySelectorAll('.os-window').forEach((w) => w.classList.remove('os-window--focused'));
  win.classList.add('os-window--focused');
}

function centerWindow(win) {
  const layerW = windowsLayer?.clientWidth || window.innerWidth;
  const layerH = windowsLayer?.clientHeight || window.innerHeight;
  const w = win.offsetWidth || 400;
  const h = win.offsetHeight || 300;
  const left = Math.max(16, (layerW - w) / 2);
  const top = Math.max(16, (layerH - h) / 2);
  win.style.position = 'absolute';
  win.style.left = `${left}px`;
  win.style.top = `${top}px`;
}

function openApp(appId) {
  const win = getWindowEl(appId);
  if (!win) return;
  win.classList.remove('hidden');
  if (!win.style.left) centerWindow(win);
  focusWindow(win);
  updateTaskbar();
  closeStartMenu();
  if (appId === 'terminal') focusTerminalInput();
  else if (appId === 'browser' && !browserLoaded) navigateBrowser(BROWSER_HOME);
  else if (appId === 'explorer') renderExplorer();
}

function closeApp(appId) {
  const win = getWindowEl(appId);
  if (!win) return;
  win.classList.add('hidden');
  win.classList.remove('os-window--maximized');
  updateTaskbar();
}

function toggleApp(appId) {
  const win = getWindowEl(appId);
  if (!win) return;
  if (win.classList.contains('hidden')) {
    openApp(appId);
  } else {
    closeApp(appId);
  }
}

function toggleStartMenu() {
  const isOpen = startMenu.classList.toggle('hidden');
  const menuVisible = !isOpen;
  startBtn.classList.toggle('active', menuVisible);
  if (menuVisible) startSearch.focus();
}

function closeStartMenu() {
  startMenu.classList.add('hidden');
  startBtn.classList.remove('active');
  startSearch.value = '';
  document.querySelectorAll('.start-pin').forEach((p) => p.classList.remove('hidden-by-search'));
}

function doReboot() {
  desktopEl.classList.add('hidden');
  loginScreen.classList.add('hidden');
  bootScreen.classList.remove('hidden');
  currentUser = '';
  setTimeout(() => {
    bootScreen.classList.add('hidden');
    showLogin();
  }, 2000);
}

function doShutdown() {
  desktopEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;color:#666;font-family:Segoe UI,sans-serif">Het is nu veilig om deze pagina te sluiten.</div>';
}

/* ── Init ── */

function handleWindowAction(appId, action, win) {
  if (action === 'close') closeApp(appId);
  else if (action === 'minimize') {
    win.classList.add('hidden');
    win.classList.remove('os-window--focused');
    updateTaskbar();
  } else if (action === 'maximize') {
    win.classList.toggle('os-window--maximized');
  }
}

function initWindowControls() {
  document.querySelectorAll('.os-titlebar-controls').forEach((controls) => {
    controls.addEventListener('mousedown', (e) => e.stopPropagation());
    controls.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const win = controls.closest('.os-window');
      if (!win) return;
      e.preventDefault();
      e.stopPropagation();
      handleWindowAction(win.dataset.app, btn.dataset.action, win);
    });
  });

  document.querySelectorAll('.os-window').forEach((win) => {
    win.addEventListener('mousedown', (e) => {
      if (e.target.closest('.os-titlebar-controls, [data-action]')) return;
      focusWindow(win);
    });
  });
}

function initWindowDrag() {
  document.querySelectorAll('.os-window').forEach((win) => {
    const handle = win.querySelector('[data-drag-handle]');
    if (!handle) return;
    let dragging = false;
    let startX;
    let startY;
    let startLeft;
    let startTop;
    handle.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || win.classList.contains('os-window--maximized')) return;
      if (e.target.closest('[data-action], .os-titlebar-controls')) return;
      dragging = true;
      const layerRect = windowsLayer?.getBoundingClientRect() || { left: 0, top: 0 };
      const rect = win.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left - layerRect.left;
      startTop = rect.top - layerRect.top;
      win.classList.add('os-window--dragging');
      win.style.position = 'absolute';
      win.style.left = `${startLeft}px`;
      win.style.top = `${startTop}px`;
      win.style.width = `${rect.width}px`;
      win.style.margin = '0';
      handle.setPointerCapture?.(e.pointerId);
      focusWindow(win);
      e.preventDefault();
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      win.style.left = `${startLeft + e.clientX - startX}px`;
      win.style.top = `${startTop + e.clientY - startY}px`;
    });
    const stop = (e) => {
      if (!dragging) return;
      dragging = false;
      win.classList.remove('os-window--dragging');
      if (e?.pointerId != null) handle.releasePointerCapture?.(e.pointerId);
    };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  });
}

function initTerminalClickFocus() {
  outputEl.addEventListener('mousedown', (e) => {
    if (e.target.closest('.terminal-active-line')) return;
    focusWindow(terminalWindow);
    focusTerminalInput();
  });
}

function initBrowser() {
  browserForm.addEventListener('submit', (e) => { e.preventDefault(); navigateBrowser(browserUrl.value); });
  browserRefresh.addEventListener('click', () => {
    const q = browserUrl.value.trim();
    navigateBrowser(q || BROWSER_HOME, false);
  });
  browserFrame.addEventListener('load', () => {
    try {
      const u = new URL(browserFrame.contentWindow.location.href).searchParams.get('url');
      if (u && isAllowedGoogleUrl(u)) {
        browserUrl.value = u.includes('/search?') ? new URL(u).searchParams.get('q') || 'google.com' : 'google.com';
      }
    } catch { /* */ }
  });
}

function initTaskbar() {
  if (!taskbarWrap) return;
  taskbarWrap.addEventListener('click', (e) => {
    const appBtn = e.target.closest('.taskbar-app');
    if (appBtn?.dataset.app) {
      e.preventDefault();
      e.stopPropagation();
      toggleApp(appBtn.dataset.app);
    }
  });
  startBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleStartMenu();
  });
  updateTaskbar();
}

function initDesktop() {
  document.querySelectorAll('[data-launch]').forEach((el) => {
    el.addEventListener('click', () => toggleApp(el.dataset.launch));
  });
  powerBtn.addEventListener('click', doShutdown);
  startSearch.addEventListener('input', () => {
    const q = startSearch.value.toLowerCase();
    document.querySelectorAll('.start-pin').forEach((pin) => {
      const match = pin.dataset.search?.includes(q) || pin.textContent.toLowerCase().includes(q);
      pin.classList.toggle('hidden-by-search', q.length > 0 && !match);
    });
  });
  document.addEventListener('click', (e) => {
    if (startMenu.classList.contains('hidden')) return;
    if (e.target.closest('.start-menu, .taskbar-wrap')) return;
    closeStartMenu();
  });
}

function updateClock() {
  const now = new Date();
  clockTime.textContent = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  clockDate.textContent = now.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

function userInitial(name) {
  return (name.trim()[0] || '?').toUpperCase();
}

function updateUserDisplay() {
  const name = currentUser || 'Gebruiker';
  const avatar = userInitial(name);
  $('taskbar-user-name').textContent = name;
  $('taskbar-user-avatar').textContent = avatar;
  $('start-username').textContent = name;
  $('start-avatar').textContent = avatar;
  const taskbarUser = $('taskbar-user');
  if (taskbarUser) taskbarUser.title = `Ingelogd als ${name}`;
}

function showLogin() {
  desktopEl.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  loginUsername.value = '';
  setTimeout(() => loginUsername.focus(), 100);
}

function enterDesktop(name) {
  currentUser = name;
  updateUserDisplay();
  loginScreen.classList.add('hidden');
  desktopEl.classList.remove('hidden');
  resetTerminal();
  openApp('terminal');
}

function initVideoUnlockModal() {
  videoUnlockForm.addEventListener('submit', handleVideoUnlockSubmit);
  videoUnlockCancel.addEventListener('click', closeVideoUnlockModal);
  videoUnlockBackdrop.addEventListener('click', closeVideoUnlockModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !videoUnlockModal.classList.contains('hidden')) closeVideoUnlockModal();
  });
}

function initLogin() {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = loginUsername.value.trim();
    if (!name) {
      loginUsername.focus();
      return;
    }
    enterDesktop(name);
  });
}

function boot() {
  setTimeout(() => {
    bootScreen.classList.add('hidden');
    showLogin();
  }, 1800);
}

disconnectBtn.addEventListener('click', showDesktop);

document.addEventListener('keydown', (e) => {
  if (!loginScreen.classList.contains('hidden')) return;
  if (!videoUnlockModal.classList.contains('hidden')) return;
  if (e.key === 'Escape' && !videoScreenEl.classList.contains('hidden')) { showDesktop(); return; }
  if (terminalWindow.classList.contains('hidden') || !terminalWindow.classList.contains('os-window--focused') || !videoScreenEl.classList.contains('hidden')) return;
  if (e.target.closest('.browser-toolbar, .start-menu, .taskbar, textarea, input:not(.terminal-input)')) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length !== 1) return;
  focusTerminalInput();
  if (activeInput && document.activeElement !== activeInput) { activeInput.value += e.key; e.preventDefault(); }
});

initWindowControls();
initWindowDrag();
initTerminalClickFocus();
initBrowser();
initDesktop();
initTaskbar();
initVideoUnlockModal();
initLogin();
initCalculator();
updateClock();
setInterval(updateClock, 10000);
boot();
