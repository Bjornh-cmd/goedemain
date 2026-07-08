function isLocalMode() {
  return true;
}

function isVercel() {
  return process.env.VERCEL === '1';
}

module.exports = { isLocalMode, isVercel };
