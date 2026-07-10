const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.mkv', '.ogv', '.m4v']);
const VID_DIR = path.join(__dirname, '..', 'vid');
const BJORN_JACHT_ID = 'bjornjacht';
const BJORN_JACHT_FILE = path.join(__dirname, '..', 'Bjorn-Jacht.mp4');

function getBjornJachtVlog() {
  if (!fs.existsSync(BJORN_JACHT_FILE)) return null;
  return {
    id: BJORN_JACHT_ID,
    title: 'Bjorn Jacht',
    videoPath: BJORN_JACHT_FILE,
    code: '',
    mimeType: getMimeType(BJORN_JACHT_FILE),
    noPassword: true,
  };
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET ontbreekt in .env');
  }
  return secret;
}

function isVideoFile(filename) {
  return VIDEO_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

function readCodeFromFile(codePath) {
  return fs.readFileSync(codePath, 'utf8').trim();
}

function scanDirectory(dirPath, id) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const videos = [];
  const codeFiles = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const fullPath = path.join(dirPath, entry.name);
    if (isVideoFile(entry.name)) {
      videos.push(fullPath);
    } else if (entry.name.toLowerCase().endsWith('.txt')) {
      codeFiles.push(fullPath);
    }
  }

  if (!videos.length || !codeFiles.length) return null;

  videos.sort();
  codeFiles.sort((a, b) => {
    const aIsCode = path.basename(a).toLowerCase() === 'code.txt';
    const bIsCode = path.basename(b).toLowerCase() === 'code.txt';
    if (aIsCode && !bIsCode) return -1;
    if (!aIsCode && bIsCode) return 1;
    return a.localeCompare(b);
  });

  const videoPath = videos[0];
  const codePath = codeFiles[0];

  return {
    id,
    title: id.replace(/[-_]/g, ' '),
    videoPath,
    code: readCodeFromFile(codePath),
    mimeType: getMimeType(videoPath),
  };
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska',
    '.ogv': 'video/ogg',
    '.m4v': 'video/x-m4v',
  };
  return map[ext] || 'application/octet-stream';
}

function listVlogs() {
  const vlogs = [];
  const bjornJacht = getBjornJachtVlog();
  if (bjornJacht) vlogs.push(bjornJacht);

  if (!fs.existsSync(VID_DIR)) {
    fs.mkdirSync(VID_DIR, { recursive: true });
    return vlogs.sort((a, b) => a.title.localeCompare(b.title, 'nl'));
  }

  const entries = fs.readdirSync(VID_DIR, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(VID_DIR, entry.name);

    if (entry.isDirectory()) {
      const vlog = scanDirectory(fullPath, entry.name);
      if (vlog) vlogs.push(vlog);
      continue;
    }

    if (!entry.isFile() || !isVideoFile(entry.name)) continue;

    const baseName = path.basename(entry.name, path.extname(entry.name));
    const codePath = path.join(VID_DIR, `${baseName}.txt`);
    if (!fs.existsSync(codePath)) continue;

    vlogs.push({
      id: baseName,
      title: baseName.replace(/[-_]/g, ' '),
      videoPath: fullPath,
      code: readCodeFromFile(codePath),
      mimeType: getMimeType(fullPath),
    });
  }

  return vlogs.sort((a, b) => a.title.localeCompare(b.title, 'nl'));
}

function getVlog(id) {
  if (id === BJORN_JACHT_ID) return getBjornJachtVlog();
  return listVlogs().find((v) => v.id === id) || null;
}

function verifyCode(vlog, input) {
  if (!vlog) return false;
  if (vlog.noPassword) return true;
  if (typeof input !== 'string') return false;
  return input.trim() === vlog.code;
}

function signVlogToken(vlogId) {
  return jwt.sign({ vlogId, type: 'vlog' }, getSessionSecret(), { expiresIn: '7d' });
}

function verifyVlogToken(token, vlogId) {
  if (!token) return false;
  try {
    const payload = jwt.verify(token, getSessionSecret());
    return payload?.type === 'vlog' && payload.vlogId === vlogId;
  } catch {
    return false;
  }
}

function getVlogCookieName(vlogId) {
  return `vlog_${vlogId}`;
}

function getVlogCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function getVlogPlayback(vlog) {
  return { type: 'file' };
}

async function streamVideo(vlog, req, res) {
  const stat = fs.statSync(vlog.videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': vlog.mimeType,
    });

    fs.createReadStream(vlog.videoPath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Length': fileSize,
    'Content-Type': vlog.mimeType,
    'Accept-Ranges': 'bytes',
  });

  fs.createReadStream(vlog.videoPath).pipe(res);
}

module.exports = {
  listVlogs,
  getVlog,
  verifyCode,
  signVlogToken,
  verifyVlogToken,
  getVlogCookieName,
  getVlogCookieOptions,
  getVlogPlayback,
  streamVideo,
};
