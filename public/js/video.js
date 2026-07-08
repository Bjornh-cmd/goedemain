const desktopEl = document.getElementById('desktop');
const outputEl = document.getElementById('terminal-output');
const videoScreenEl = document.getElementById('video-screen');
const videoEl = document.getElementById('vlog-video');
const disconnectBtn = document.getElementById('disconnect-btn');
const terminalWindow = document.getElementById('terminal-window');
const titlebar = document.getElementById('terminal-titlebar');
const browserWindow = document.getElementById('browser-window');
const browserFrame = document.getElementById('browser-frame');
const browserUrl = document.getElementById('browser-url');
const browserForm = document.getElementById('browser-form');
const browserBack = document.getElementById('browser-back');
const browserForward = document.getElementById('browser-forward');
const browserRefresh = document.getElementById('browser-refresh');
const startBtn = document.getElementById('start-btn');
const startMenu = document.getElementById('start-menu');
const taskbarApps = document.getElementById('taskbar-apps');
const taskbarClock = document.getElementById('taskbar-clock');

const PROMPT_SHELL = 'guest@vlog:~$ ';
const PROMPT_USER = 'username: ';
const PROMPT_PASS = 'password: ';

const STATES = {
  COMMAND: 'command',
  USERNAME: 'username',
  PASSWORD: 'password',
};

const COMMANDS = [
  { name: 'access', aliases: ['acces'], desc: 'Beveiligde video openen' },
  { name: 'browser', aliases: ['browse', 'web', 'chrome'], desc: 'Google Chrome openen' },
  { name: 'clear', aliases: [], desc: 'Terminal scherm wissen' },
  { name: 'help', aliases: ['?'], desc: 'Commando-overzicht tonen' },
  { name: 'whoami', aliases: [], desc: 'Huidige gebruiker tonen' },
  { name: 'exit', aliases: ['quit'], desc: 'Huidige actie annuleren' },
];

const BANNER = [
  'VIDEO SECURE ACCESS TERMINAL v2.3',
  '────────────────────────────────────────',
  '',
];

const APP_META = {
  terminal: { label: 'Terminal', iconId: 'icon-terminal' },
  browser: { label: 'Google Chrome', iconId: 'icon-chrome' },
};

const BROWSER_HOME = 'https://www.google.com';
const BROWSER_SEARCH = 'https://www.google.com/search?q=';
const PROXY_PATH = '/api/browse';

let browserHistory = [];
let browserHistoryIndex = -1;
let browserLoaded = false;
let zIndexCounter = 10;
let state = STATES.COMMAND;
let username = '';
let activeForm = null;
let activeInput = null;

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
  if (activeInput) {
    activeInput.focus({ preventScroll: true });
    return;
  }
  if (state === STATES.USERNAME) showPrompt(PROMPT_USER);
  else if (state === STATES.PASSWORD) showPrompt(PROMPT_PASS, 'password');
  else showPrompt(PROMPT_SHELL);
}

function showPrompt(promptText, inputType = 'text') {
  if (activeForm) activeForm.remove();

  activeForm = document.createElement('form');
  activeForm.className = 'terminal-active-line';
  activeForm.autocomplete = 'off';

  const prompt = document.createElement('span');
  prompt.className = 'terminal-prompt';
  prompt.textContent = promptText;

  activeInput = document.createElement('input');
  activeInput.type = inputType;
  activeInput.className = 'terminal-input';
  activeInput.autocomplete = 'off';
  activeInput.autocorrect = 'off';
  activeInput.autocapitalize = 'off';
  activeInput.spellcheck = false;

  activeForm.append(prompt, activeInput);
  outputEl.appendChild(activeForm);
  activeForm.addEventListener('submit', onSubmit);
  activeInput.focus({ preventScroll: true });
  scrollToBottom();
}

function printBanner() {
  BANNER.forEach((line) =>
    appendLine(line, line.startsWith('─') ? 'terminal-line--dim' : '')
  );
}

function cancelFlow(message) {
  state = STATES.COMMAND;
  username = '';
  if (message) appendLine(message, 'terminal-line--dim');
  showPrompt(PROMPT_SHELL);
}

function resetTerminalPosition() {
  if (!terminalWindow) return;
  terminalWindow.style.position = '';
  terminalWindow.style.left = '';
  terminalWindow.style.top = '';
  terminalWindow.style.width = '';
  terminalWindow.style.height = '';
  terminalWindow.style.margin = '';
  terminalWindow.style.transform = '';
  terminalWindow.classList.remove('terminal-window--dragging', 'os-window--maximized');
}

function resetTerminal(resetPosition = false) {
  state = STATES.COMMAND;
  username = '';
  outputEl.innerHTML = '';
  printBanner();
  if (resetPosition) resetTerminalPosition();
  showPrompt(PROMPT_SHELL);
}

function resolveCommand(input) {
  const cmd = input.trim().toLowerCase();
  return COMMANDS.find(
    (c) => c.name === cmd || c.aliases.some((a) => a === cmd)
  );
}

function printHelp() {
  appendLine('Beschikbare commando\'s:', 'terminal-line--dim');
  for (const cmd of COMMANDS) {
    const aliases = cmd.aliases.length ? ` (${cmd.aliases.join(', ')})` : '';
    appendLine(`  ${cmd.name}${aliases} — ${cmd.desc}`, 'terminal-line--dim');
  }
}

function showVideo(id) {
  desktopEl.classList.add('hidden');
  videoScreenEl.classList.remove('hidden');
  videoEl.src = `/api/vlogs/${encodeURIComponent(id)}/video`;
  videoEl.load();
}

function showDesktop() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  videoEl.pause();
  videoEl.removeAttribute('src');
  videoEl.load();
  videoScreenEl.classList.add('hidden');
  desktopEl.classList.remove('hidden');
  resetTerminal(true);
  openApp('terminal');
}

async function tryUnlock(id, code) {
  const res = await fetch(`/api/vlogs/${encodeURIComponent(id)}/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, error: data.error };
}

async function handleUsernameInput(name) {
  const trimmed = name.trim();
  if (!trimmed) {
    appendLine('Fout: username is verplicht.', 'terminal-line--error');
    showPrompt(PROMPT_USER);
    return;
  }

  username = trimmed;
  commitActiveLine(trimmed);

  const statusRes = await fetch(`/api/vlogs/${encodeURIComponent(username)}/status`);
  if (!statusRes.ok) {
    appendLine(`Fout: vlog "${username}" niet gevonden.`, 'terminal-line--error');
    cancelFlow();
    return;
  }

  state = STATES.PASSWORD;
  showPrompt(PROMPT_PASS, 'password');
}

async function handlePasswordInput(password) {
  if (!password.trim()) {
    appendLine('Fout: password is verplicht.', 'terminal-line--error');
    showPrompt(PROMPT_PASS, 'password');
    return;
  }

  commitActiveLine(password, true);
  appendLine('Authenticeren...', 'terminal-line--dim');

  const { ok, error } = await tryUnlock(username, password);

  if (!ok) {
    appendLine(error || 'Toegang geweigerd.', 'terminal-line--error');
    showPrompt(PROMPT_PASS, 'password');
    return;
  }

  appendLine('Toegang verleend. Druk op play om te starten.', 'terminal-line--success');
  await new Promise((r) => setTimeout(r, 400));
  showVideo(username);
  requestVideoFullscreen();
}

function handleCommandInput(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;

  commitActiveLine(raw);
  const cmd = resolveCommand(trimmed);

  if (cmd?.name === 'access') {
    state = STATES.USERNAME;
    username = '';
    showPrompt(PROMPT_USER);
    return;
  }

  if (cmd?.name === 'browser') {
    openApp('browser');
    showPrompt(PROMPT_SHELL);
    return;
  }

  if (cmd?.name === 'clear') {
    outputEl.innerHTML = '';
    printBanner();
    showPrompt(PROMPT_SHELL);
    return;
  }

  if (cmd?.name === 'help') {
    printHelp();
    showPrompt(PROMPT_SHELL);
    return;
  }

  if (cmd?.name === 'whoami') {
    appendLine('guest@vlog', 'terminal-line--dim');
    showPrompt(PROMPT_SHELL);
    return;
  }

  if (cmd?.name === 'exit') {
    cancelFlow('Geen actieve sessie.');
    return;
  }

  appendLine(`Onbekend commando: "${trimmed}". Type "help" voor een overzicht.`, 'terminal-line--error');
  showPrompt(PROMPT_SHELL);
}

async function onSubmit(e) {
  e.preventDefault();
  const value = activeInput?.value ?? '';
  const trimmed = value.trim();

  if (state !== STATES.COMMAND) {
    const flowCmd = trimmed ? resolveCommand(trimmed) : null;
    if (flowCmd?.name === 'exit' || flowCmd?.name === 'help') {
      commitActiveLine(trimmed);
      if (flowCmd.name === 'exit') {
        cancelFlow('Actie geannuleerd.');
      } else {
        printHelp();
        if (state === STATES.USERNAME) showPrompt(PROMPT_USER);
        else if (state === STATES.PASSWORD) showPrompt(PROMPT_PASS);
      }
      return;
    }
  }

  if (state === STATES.COMMAND) {
    handleCommandInput(value);
    return;
  }

  if (state === STATES.USERNAME) {
    await handleUsernameInput(value);
  } else if (state === STATES.PASSWORD) {
    await handlePasswordInput(value);
  }
}

function requestVideoFullscreen() {
  const target = videoScreenEl;
  const req =
    target.requestFullscreen?.() ||
    target.webkitRequestFullscreen?.() ||
    target.msRequestFullscreen?.();
  if (req && typeof req.then === 'function') {
    req.catch(() => {});
  }
}

function normalizeUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return BROWSER_HOME;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }

  return `${BROWSER_SEARCH}${encodeURIComponent(trimmed)}`;
}

function proxyUrl(rawUrl) {
  return `${PROXY_PATH}?url=${encodeURIComponent(normalizeUrl(rawUrl))}`;
}

function navigateBrowser(rawUrl, pushHistory = true) {
  const url = normalizeUrl(rawUrl);
  if (pushHistory) {
    browserHistory = browserHistory.slice(0, browserHistoryIndex + 1);
    browserHistory.push(url);
    browserHistoryIndex = browserHistory.length - 1;
  }
  browserUrl.value = url;
  browserFrame.src = proxyUrl(url);
  browserLoaded = true;
}

function syncBrowserFromFrame() {
  try {
    const frameUrl = new URL(browserFrame.contentWindow.location.href);
    const actual = frameUrl.searchParams.get('url');
    if (actual) browserUrl.value = actual;
  } catch {
    /* ignore */
  }
}

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
    btn.innerHTML = `<svg class="os-app-icon" aria-hidden="true"><use href="#${meta.iconId}"/></svg><span>${meta.label}</span>`;
    btn.addEventListener('click', () => toggleApp(appId));
    taskbarApps.appendChild(btn);
  }
}

function focusWindow(win) {
  zIndexCounter += 1;
  win.style.zIndex = String(zIndexCounter);
  document.querySelectorAll('.os-window').forEach((w) => w.classList.remove('os-window--focused'));
  win.classList.add('os-window--focused');
}

function centerWindow(win) {
  const rect = win.getBoundingClientRect();
  const desktopRect = desktopEl.getBoundingClientRect();
  const taskbarHeight = 48;
  const left = Math.max(16, (desktopRect.width - rect.width) / 2);
  const top = Math.max(16, (desktopRect.height - taskbarHeight - rect.height) / 2);
  win.style.position = 'fixed';
  win.style.left = `${left}px`;
  win.style.top = `${top}px`;
  win.style.margin = '0';
}

function openApp(appId) {
  const win = getWindowEl(appId);
  if (!win) return;

  win.classList.remove('hidden');
  if (!win.style.left) centerWindow(win);
  focusWindow(win);
  updateTaskbar();

  if (appId === 'terminal') {
    focusTerminalInput();
  } else if (appId === 'browser' && !browserLoaded) {
    navigateBrowser(BROWSER_HOME);
  }
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
    return;
  }

  if (win.classList.contains('os-window--focused')) {
    win.classList.add('hidden');
    win.classList.remove('os-window--focused');
  } else {
    focusWindow(win);
    if (appId === 'terminal') focusTerminalInput();
  }
  updateTaskbar();
}

function toggleStartMenu() {
  startMenu.classList.toggle('hidden');
}

function closeStartMenu() {
  startMenu.classList.add('hidden');
}

function initWindowControls() {
  document.querySelectorAll('.os-window').forEach((win) => {
    win.addEventListener('mousedown', () => focusWindow(win));

    win.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const appId = win.dataset.app;
        const action = btn.dataset.action;

        if (action === 'close') {
          closeApp(appId);
          return;
        }

        if (action === 'minimize') {
          win.classList.add('hidden');
          win.classList.remove('os-window--focused');
          updateTaskbar();
          return;
        }

        if (action === 'maximize') {
          win.classList.toggle('os-window--maximized');
        }
      });
    });
  });
}

function initWindowDrag() {
  document.querySelectorAll('.os-window').forEach((win) => {
    const handle = win.querySelector('[data-drag-handle], .os-titlebar');
    if (!handle) return;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('[data-action]')) return;
      if (e.button !== undefined && e.button !== 0) return;
      if (win.classList.contains('os-window--maximized')) return;

      dragging = true;
      const rect = win.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;

      win.classList.add('terminal-window--dragging');
      win.style.position = 'fixed';
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
      win.style.left = `${startLeft + (e.clientX - startX)}px`;
      win.style.top = `${startTop + (e.clientY - startY)}px`;
    });

    const stopDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      win.classList.remove('terminal-window--dragging');
      handle.releasePointerCapture?.(e.pointerId);
    };

    handle.addEventListener('pointerup', stopDrag);
    handle.addEventListener('pointercancel', stopDrag);
  });
}

function initTerminalClickFocus() {
  outputEl.addEventListener('mousedown', (e) => {
    e.preventDefault();
    focusWindow(terminalWindow);
    focusTerminalInput();
  });

  terminalWindow.addEventListener('mousedown', (e) => {
    if (e.target.closest('.os-titlebar-controls')) return;
    focusWindow(terminalWindow);
  });
}

function initBrowser() {
  browserForm.addEventListener('submit', (e) => {
    e.preventDefault();
    navigateBrowser(browserUrl.value);
  });

  browserBack.addEventListener('click', () => {
    if (browserHistoryIndex <= 0) return;
    browserHistoryIndex -= 1;
    navigateBrowser(browserHistory[browserHistoryIndex], false);
  });

  browserForward.addEventListener('click', () => {
    if (browserHistoryIndex >= browserHistory.length - 1) return;
    browserHistoryIndex += 1;
    navigateBrowser(browserHistory[browserHistoryIndex], false);
  });

  browserRefresh.addEventListener('click', () => {
    navigateBrowser(browserUrl.value, false);
  });

  browserFrame.addEventListener('load', syncBrowserFromFrame);

  window.addEventListener('message', (e) => {
    if (e.data?.type !== 'browser-navigate' || !e.data.url) return;
    const url = normalizeUrl(e.data.url);
    browserUrl.value = url;
    browserHistory = browserHistory.slice(0, browserHistoryIndex + 1);
    browserHistory.push(url);
    browserHistoryIndex = browserHistory.length - 1;
  });
}

function initDesktop() {
  document.querySelectorAll('[data-launch]').forEach((el) => {
    el.addEventListener('click', () => {
      openApp(el.dataset.launch);
      closeStartMenu();
    });
  });

  startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleStartMenu();
  });

  document.addEventListener('click', (e) => {
    if (!startMenu.contains(e.target) && e.target !== startBtn) {
      closeStartMenu();
    }
  });

  desktopEl.addEventListener('mousedown', (e) => {
    if (e.target === desktopEl || e.target.classList.contains('desktop-wallpaper')) {
      closeStartMenu();
    }
  });
}

function updateClock() {
  const now = new Date();
  taskbarClock.textContent = now.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

disconnectBtn.addEventListener('click', showDesktop);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !videoScreenEl.classList.contains('hidden')) {
    showDesktop();
    return;
  }

  if (
    terminalWindow.classList.contains('hidden') ||
    !terminalWindow.classList.contains('os-window--focused') ||
    videoScreenEl.classList.contains('hidden') === false
  ) {
    return;
  }

  if (e.target.closest('.browser-toolbar, .browser-url-input, .start-menu, .taskbar')) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length !== 1) return;

  focusTerminalInput();
  if (activeInput && document.activeElement !== activeInput) {
    activeInput.value += e.key;
    e.preventDefault();
  }
});

initWindowControls();
initWindowDrag();
initTerminalClickFocus();
initBrowser();
initDesktop();
updateClock();
setInterval(updateClock, 30000);

resetTerminal();
openApp('terminal');
