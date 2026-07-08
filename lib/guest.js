const GUEST_ID = 'gast';

function getGuestVisitor(config) {
  return config.visitors.find((v) => v.id === GUEST_ID) || null;
}

function hasGuest(config) {
  return Boolean(getGuestVisitor(config));
}

module.exports = { GUEST_ID, getGuestVisitor, hasGuest };
