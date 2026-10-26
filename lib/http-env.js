/**
 * Runtime HTTP settings for Docker, Coolify, and reverse proxies.
 */

function isCoolify() {
  return Boolean(process.env.COOLIFY_CONTAINER_NAME || process.env.COOLIFY_RESOURCE_UUID);
}

function shouldTrustProxy() {
  const flag = process.env.TRUST_PROXY;
  if (flag === '1' || flag === 'true') return true;
  if (flag === '0' || flag === 'false') return false;
  return isCoolify();
}

function configureExpressTrustProxy(app) {
  if (shouldTrustProxy()) {
    app.set('trust proxy', 1);
  }
}

function getListenHost() {
  return process.env.HOST || '0.0.0.0';
}

function isSecureRequest(req) {
  if (!req) return false;
  if (req.secure) return true;
  const proto = req.get('x-forwarded-proto');
  return typeof proto === 'string' && proto.split(',')[0].trim() === 'https';
}

function resolveCookieSecure(req) {
  const explicit = process.env.COOKIE_SECURE;
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;
  if (process.env.VERCEL === '1') return true;
  if (shouldTrustProxy() && isSecureRequest(req)) return true;
  return false;
}

module.exports = {
  configureExpressTrustProxy,
  getListenHost,
  isCoolify,
  isSecureRequest,
  resolveCookieSecure,
  shouldTrustProxy,
};
