const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const { loadConfig } = require('./lib/config');
const { resolveButtons } = require('./lib/buttons');
const { getGuestVisitor, hasGuest } = require('./lib/guest');
const {
  signToken,
  verifyToken,
  getCookieOptions,
  findVisitorByPassword,
} = require('./lib/auth');
const {
  listVlogs,
  getVlog,
  verifyCode,
  signVlogToken,
  verifyVlogToken,
  getVlogCookieName,
  getVlogCookieOptions,
  getVlogPlayback,
  streamVideo,
} = require('./lib/vlog');
const {
  isAdminVisitor,
  listPublicVisitors,
  addVisitor,
  patchVisitor,
  removeVisitor,
  addButton,
  patchButton,
  removeButton,
} = require('./lib/admin');
const { isLocalMode, isVercel } = require('./lib/local-mode');
const { parseTargetUrl, fetchProxied } = require('./lib/browse-proxy');

const app = express();
const isDev = process.env.NODE_ENV !== 'production';
const SERVER_BUILD = String(Date.now());

app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

if (isDev) {
  app.get('/api/dev-version', (_req, res) => {
    res.json({ build: SERVER_BUILD });
  });
}

app.get('/api/health', (_req, res) => {
  const health = {
    ok: Boolean(process.env.SESSION_SECRET),
    mode: 'local',
    vercel: isVercel(),
    hasSessionSecret: Boolean(process.env.SESSION_SECRET),
    source: 'data/config.json',
  };

  res.status(health.ok ? 200 : 503).json(health);
});

app.get('/api/browse', async (req, res) => {
  const target = parseTargetUrl(req.query.url);
  if (!target) {
    return res.status(400).send('Ongeldige URL');
  }

  try {
    const result = await fetchProxied(target);
    res.status(result.status);
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    res.send(result.body);
  } catch (err) {
    console.error('Browse proxy error:', err.message);
    res.status(502).send(`Pagina laden mislukt: ${err.message}`);
  }
});

async function getVisitorFromRequest(req) {
  const token = req.cookies?.session;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload?.visitorId) return null;

  const config = await loadConfig();
  return config.visitors.find((v) => v.id === payload.visitorId) || null;
}

async function requireAuth(req, res, next) {
  const visitor = await getVisitorFromRequest(req);
  if (!visitor) {
    return res.status(401).json({ error: 'Niet ingelogd' });
  }
  req.visitor = visitor;
  next();
}

async function requireAdminAuth(req, res, next) {
  if (isLocalMode()) {
    return res.status(503).json({
      error: 'Admin niet beschikbaar in lokale modus. Gebruik npm run editor.',
    });
  }

  const visitor = await getVisitorFromRequest(req);
  if (!visitor) {
    return res.status(401).json({ error: 'Niet ingelogd' });
  }
  if (!isAdminVisitor(visitor)) {
    return res.status(403).json({ error: 'Geen admin toegang' });
  }
  req.visitor = visitor;
  next();
}

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', async (req, res) => {
  const visitor = await getVisitorFromRequest(req);
  if (!visitor) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

const videoPage = path.join(__dirname, 'public', 'video.html');

app.get('/video', (_req, res) => {
  res.sendFile(videoPage);
});

app.get('/vid', (_req, res) => {
  res.sendFile(videoPage);
});

const bjornjachtPage = path.join(__dirname, 'public', 'bjornjacht.html');
const finoviappsDir = path.join(__dirname, 'public', 'finoviapps');

app.get('/finoviapps', (_req, res) => {
  res.sendFile(path.join(finoviappsDir, 'index.html'));
});

app.get('/finoviapps/:app', (req, res) => {
  const file = path.join(finoviappsDir, `${req.params.app}.html`);
  res.sendFile(file, (err) => {
    if (err) res.status(404).send('Pagina niet gevonden');
  });
});

app.get('/bjornjacht', (_req, res) => {
  res.sendFile(bjornjachtPage);
});

app.get('/bjornjacht/video', (req, res) => {
  const vlog = getVlog('bjornjacht');
  if (!vlog) {
    return res.status(404).send('Video niet gevonden');
  }
  try {
    streamVideo(vlog, req, res);
  } catch (err) {
    console.error('Bjornjacht stream error:', err);
    res.status(500).send('Video afspelen mislukt');
  }
});

app.get('/videos', (_req, res) => {
  res.sendFile(videoPage);
});

app.get('/vlog', (_req, res) => {
  res.redirect(301, '/video');
});

app.get('/admin', async (req, res) => {
  if (isLocalMode()) {
    return res.redirect('/dashboard');
  }

  const visitor = await getVisitorFromRequest(req);
  if (!visitor) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/vlogs', (_req, res) => {
  try {
    const vlogs = listVlogs().map(({ id, title }) => ({ id, title }));
    res.json({ vlogs });
  } catch (err) {
    console.error('Vlog list error:', err);
    res.status(500).json({ error: 'Vlogs laden mislukt' });
  }
});

app.get('/api/vlogs/:id/status', (req, res) => {
  const vlog = getVlog(req.params.id);
  if (!vlog) {
    return res.status(404).json({ error: 'Vlog niet gevonden' });
  }

  const token = req.cookies[getVlogCookieName(vlog.id)];
  res.json({
    unlocked: verifyVlogToken(token, vlog.id),
    noPassword: Boolean(vlog.noPassword),
  });
});

app.post('/api/vlogs/:id/unlock', (req, res) => {
  const vlog = getVlog(req.params.id);
  if (!vlog) {
    return res.status(404).json({ error: 'Vlog niet gevonden' });
  }

  if (!vlog.noPassword) {
    const { code } = req.body;
    if (!verifyCode(vlog, code)) {
      return res.status(401).json({ error: 'Onjuiste code' });
    }
  }

  const token = signVlogToken(vlog.id);
  res.cookie(getVlogCookieName(vlog.id), token, getVlogCookieOptions());
  res.json({ ok: true });
});

app.get('/api/vlogs/:id/playback', (req, res) => {
  const vlog = getVlog(req.params.id);
  if (!vlog) return res.status(404).json({ error: 'Vlog niet gevonden' });
  const token = req.cookies[getVlogCookieName(vlog.id)];
  if (!verifyVlogToken(token, vlog.id)) return res.status(403).json({ error: 'Code vereist' });
  res.json(getVlogPlayback(vlog));
});

app.get('/api/vlogs/:id/video', (req, res) => {
  const vlog = getVlog(req.params.id);
  if (!vlog) {
    return res.status(404).json({ error: 'Vlog niet gevonden' });
  }

  const token = req.cookies[getVlogCookieName(vlog.id)];
  if (!verifyVlogToken(token, vlog.id)) {
    return res.status(403).json({ error: 'Code vereist' });
  }

  try {
    streamVideo(vlog, req, res);
  } catch (err) {
    console.error('Video stream error:', err);
    res.status(500).json({ error: 'Video afspelen mislukt' });
  }
});

app.post('/api/login', async (req, res) => {
  const { password } = req.body;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Wachtwoord is verplicht' });
  }

  try {
    const config = await loadConfig();

    if (!config.visitors.length) {
      return res.status(503).json({ error: 'Geen bezoekers geconfigureerd' });
    }

    const loginVisitors = config.visitors.filter((v) => v.id !== 'gast');
    const visitor = await findVisitorByPassword(loginVisitors, password);
    if (!visitor) {
      return res.status(401).json({ error: 'Onjuist wachtwoord' });
    }

    const token = signToken(visitor.id);
    res.cookie('session', token, getCookieOptions());
    res.json({ name: visitor.name });
  } catch (err) {
    console.error('Login error:', err);
    const msg = err.message?.includes('SESSION_SECRET') ? err.message : 'Inloggen mislukt';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/logout', (_req, res) => {
  res.clearCookie('session', { path: '/' });
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const config = await loadConfig();
    res.json({
      id: req.visitor.id,
      name: req.visitor.name,
      mode: req.visitor.mode || 'custom',
      buttonCount: resolveButtons(req.visitor, config).length,
      isAdmin: !isLocalMode() && isAdminVisitor(req.visitor),
    });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Profiel laden mislukt' });
  }
});

app.get('/api/buttons', requireAuth, async (req, res) => {
  try {
    const config = await loadConfig();
    res.json({ buttons: resolveButtons(req.visitor, config) });
  } catch (err) {
    console.error('Buttons error:', err);
    res.status(500).json({ error: 'Knoppen laden mislukt' });
  }
});

app.get('/api/guest/info', async (_req, res) => {
  try {
    const config = await loadConfig();
    const guest = getGuestVisitor(config);
    res.json({
      enabled: hasGuest(config),
      name: guest?.name || 'Gast',
    });
  } catch (err) {
    console.error('Guest info error:', err);
    res.status(500).json({ error: 'Gast-info laden mislukt' });
  }
});

app.post('/api/login/guest', async (_req, res) => {
  try {
    const config = await loadConfig();
    const guest = getGuestVisitor(config);

    if (!guest) {
      return res.status(404).json({ error: 'Gast is niet geconfigureerd' });
    }

    const token = signToken(guest.id);
    res.cookie('session', token, getCookieOptions());
    res.json({ name: guest.name });
  } catch (err) {
    console.error('Guest login error:', err);
    res.status(500).json({ error: 'Inloggen als gast mislukt' });
  }
});

app.get('/api/admin/visitors', requireAdminAuth, async (_req, res) => {
  try {
    const visitors = await listPublicVisitors();
    res.json({ visitors });
  } catch (err) {
    console.error('Admin list error:', err);
    res.status(500).json({ error: err.message || 'Bezoekers laden mislukt' });
  }
});

app.post('/api/admin/visitors', requireAdminAuth, async (req, res) => {
  try {
    const visitor = await addVisitor(req.body);
    res.status(201).json({ visitor });
  } catch (err) {
    console.error('Admin create visitor error:', err);
    res.status(422).json({ error: err.message || 'Bezoeker toevoegen mislukt' });
  }
});

app.patch('/api/admin/visitors/:id', requireAdminAuth, async (req, res) => {
  try {
    const visitor = await patchVisitor(req.params.id, req.body);
    if (!visitor) return res.status(404).json({ error: 'Bezoeker niet gevonden' });
    res.json({ visitor });
  } catch (err) {
    console.error('Admin patch visitor error:', err);
    res.status(422).json({ error: err.message || 'Bezoeker bijwerken mislukt' });
  }
});

app.delete('/api/admin/visitors/:id', requireAdminAuth, async (req, res) => {
  try {
    const removed = await removeVisitor(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Bezoeker niet gevonden' });
    res.json({ ok: true });
  } catch (err) {
    console.error('Admin delete visitor error:', err);
    res.status(500).json({ error: err.message || 'Bezoeker verwijderen mislukt' });
  }
});

app.post('/api/admin/visitors/:id/buttons', requireAdminAuth, async (req, res) => {
  try {
    const visitor = await addButton(req.params.id, req.body);
    if (!visitor) return res.status(404).json({ error: 'Bezoeker niet gevonden' });
    res.status(201).json({ visitor });
  } catch (err) {
    console.error('Admin add button error:', err);
    res.status(422).json({ error: err.message || 'Knop toevoegen mislukt' });
  }
});

app.patch('/api/admin/visitors/:id/buttons/:index', requireAdminAuth, async (req, res) => {
  try {
    const visitor = await patchButton(req.params.id, req.params.index, req.body);
    if (!visitor) return res.status(404).json({ error: 'Bezoeker of knop niet gevonden' });
    res.json({ visitor });
  } catch (err) {
    console.error('Admin patch button error:', err);
    res.status(422).json({ error: err.message || 'Knop bijwerken mislukt' });
  }
});

app.delete('/api/admin/visitors/:id/buttons/:index', requireAdminAuth, async (req, res) => {
  try {
    const visitor = await removeButton(req.params.id, req.params.index);
    if (!visitor) return res.status(404).json({ error: 'Bezoeker of knop niet gevonden' });
    res.json({ visitor });
  } catch (err) {
    console.error('Admin delete button error:', err);
    res.status(500).json({ error: err.message || 'Knop verwijderen mislukt' });
  }
});

module.exports = app;
