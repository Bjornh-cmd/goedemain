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
  findVisitorByUsername,
  verifyVisitorPassword,
} = require('./lib/auth');
const { listSiteRoutes } = require('./lib/site-routes');
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
  addButtonsBulk,
  patchButton,
  removeButton,
} = require('./lib/admin');
const { getVercelStatus, listVercelProjects } = require('./lib/vercel');
const { parseTargetUrl, fetchProxied } = require('./lib/browse-proxy');
const { configureExpressTrustProxy, isCoolify } = require('./lib/http-env');

const app = express();
configureExpressTrustProxy(app);
const isDev = process.env.NODE_ENV !== 'production';
const SERVER_BUILD = String(Date.now());

app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public'), {
  index: false,
  etag: false,
  setHeaders(res, filePath) {
    if (/\.(css|js)$/i.test(filePath)) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  },
}));

if (isDev) {
  app.get('/api/dev-version', (_req, res) => {
    res.json({ build: SERVER_BUILD });
  });
}

app.get('/api/health', (_req, res) => {
  const health = {
    ok: Boolean(process.env.SESSION_SECRET),
    mode: 'local',
    hasSessionSecret: Boolean(process.env.SESSION_SECRET),
    source: 'data/config.json',
    admin: process.env.ADMIN_VISITOR_ID || 'bjorn',
    coolify: isCoolify(),
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

app.get(['/bjornjacht', '/bjorn-jacht', '/Bjornjacht'], (_req, res) => {
  res.sendFile(bjornjachtPage);
});

app.get(['/bjornjacht/video', '/bjorn-jacht/video'], (req, res) => {
  const vlog = getVlog('bjornjacht');
  if (!vlog) {
    return res.status(404).send('Video niet gevonden. Zet Bjorn-Jacht.mp4 in de projectroot of vid/bjornjacht/.');
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
  const visitor = await getVisitorFromRequest(req);
  if (!visitor) {
    return res.redirect('/');
  }
  if (!isAdminVisitor(visitor)) {
    return res.redirect('/dashboard');
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
  res.cookie(getVlogCookieName(vlog.id), token, getVlogCookieOptions(req));
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
  const { username, password } = req.body;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Gebruikersnaam is verplicht' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Wachtwoord is verplicht' });
  }

  try {
    const config = await loadConfig();

    if (!config.visitors.length) {
      return res.status(503).json({ error: 'Geen bezoekers geconfigureerd' });
    }

    const loginVisitors = config.visitors.filter((v) => v.id !== 'gast');
    const visitor = findVisitorByUsername(loginVisitors, username);
    if (!visitor) {
      return res.status(401).json({ error: 'Onjuiste gebruikersnaam of wachtwoord' });
    }

    const ok = await verifyVisitorPassword(visitor, password);
    if (!ok) {
      return res.status(401).json({ error: 'Onjuiste gebruikersnaam of wachtwoord' });
    }

    const token = signToken(visitor.id);
    res.cookie('session', token, getCookieOptions(req));
    res.json({ name: visitor.name, id: visitor.id, isAdmin: isAdminVisitor(visitor) });
  } catch (err) {
    console.error('Login error:', err);
    const msg = err.message?.includes('SESSION_SECRET') ? err.message : 'Inloggen mislukt';
    res.status(500).json({ error: msg });
  }
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('session', { path: '/', secure: getCookieOptions(req).secure });
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const config = await loadConfig();
    const visitor = config.visitors.find((v) => v.id === req.visitor.id) || req.visitor;
    const admin = isAdminVisitor(visitor);
    res.json({
      id: visitor.id,
      name: visitor.name,
      mode: visitor.mode || 'custom',
      buttonCount: resolveButtons(visitor, config).length,
      isAdmin: admin,
      admin,
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

app.post('/api/login/guest', async (req, res) => {
  try {
    const config = await loadConfig();
    const guest = getGuestVisitor(config);

    if (!guest) {
      return res.status(404).json({ error: 'Gast is niet geconfigureerd' });
    }

    const token = signToken(guest.id);
    res.cookie('session', token, getCookieOptions(req));
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

app.get('/api/admin/site-routes', requireAdminAuth, (_req, res) => {
  res.json({ routes: listSiteRoutes() });
});

app.get('/api/admin/vercel/status', requireAdminAuth, (_req, res) => {
  res.json(getVercelStatus());
});

app.get('/api/admin/vercel/projects', requireAdminAuth, async (_req, res) => {
  try {
    const status = getVercelStatus();
    if (!status.configured) {
      return res.status(503).json({
        error: 'Vercel is niet geconfigureerd. Zet VERCEL_TOKEN in .env',
        ...status,
      });
    }
    const projects = await listVercelProjects();
    res.json({ projects, ...status });
  } catch (err) {
    console.error('Vercel projects error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Vercel-projecten laden mislukt' });
  }
});

app.post('/api/admin/visitors/:id/buttons/from-vercel', requireAdminAuth, async (req, res) => {
  try {
    const buttons = Array.isArray(req.body?.buttons) ? req.body.buttons : [];
    const result = await addButtonsBulk(req.params.id, buttons);
    if (!result) return res.status(404).json({ error: 'Bezoeker niet gevonden' });
    res.status(201).json(result);
  } catch (err) {
    console.error('Vercel import error:', err);
    res.status(422).json({ error: err.message || 'Knoppen importeren mislukt' });
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
