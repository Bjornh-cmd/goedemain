const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: isProduction,
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

module.exports = {
  signToken,
  verifyToken,
  getCookieOptions,
  findVisitorByPassword,
};
