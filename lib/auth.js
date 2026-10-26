const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { resolveCookieSecure } = require('./http-env');

const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET ontbreekt in .env');
  }
  return secret;
}

function signToken(visitorId) {
  return jwt.sign({ visitorId }, getSessionSecret(), { expiresIn: '24h' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, getSessionSecret());
  } catch {
    return null;
  }
}

function getCookieOptions(req) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: resolveCookieSecure(req),
    maxAge: TOKEN_MAX_AGE_MS,
    path: '/',
  };
}

async function findVisitorByPassword(visitors, password) {
  for (const visitor of visitors) {
    const match = await bcrypt.compare(password, visitor.passwordHash);
    if (match) {
      return visitor;
    }
  }
  return null;
}

function findVisitorByUsername(visitors, username) {
  if (!username || typeof username !== 'string') return null;
  const key = username.trim().toLowerCase();
  return visitors.find((v) => v.id.toLowerCase() === key || v.name.toLowerCase() === key) || null;
}

async function verifyVisitorPassword(visitor, password) {
  if (!visitor || !password || typeof password !== 'string') return false;
  return bcrypt.compare(password, visitor.passwordHash);
}

module.exports = {
  signToken,
  verifyToken,
  getCookieOptions,
  findVisitorByPassword,
  findVisitorByUsername,
  verifyVisitorPassword,
};
