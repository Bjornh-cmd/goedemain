const SITE_ROUTES = [
  { label: 'Login', path: '/', description: 'Inlogpagina' },
  { label: 'Dashboard', path: '/dashboard', description: 'Knoppen-dashboard' },
  { label: 'Admin', path: '/admin', description: 'Admin-panel' },
  { label: 'Video', path: '/video', description: 'Windows video-bureaublad' },
  { label: 'Vid', path: '/vid', description: 'Alias van /video' },
  { label: 'Videos', path: '/videos', description: 'Alias van /video' },
  { label: 'Bjornjacht', path: '/bjornjacht', description: 'Fullscreen Bjorn-Jacht video' },
  { label: 'FinoviApps', path: '/finoviapps', description: 'App privacy policies' },
  { label: 'Offline Apps', path: '/finoviapps/offlineapps', description: 'Offline apps privacy' },
  { label: 'Offline Games', path: '/finoviapps/offlinegames', description: 'Offline games privacy' },
  { label: 'PDF Reader & Maker', path: '/finoviapps/pdf-reader-maker', description: 'PDF Reader & Maker privacybeleid' },
];

function listSiteRoutes() {
  return SITE_ROUTES.map((route) => ({
    ...route,
    url: route.path,
  }));
}

module.exports = { SITE_ROUTES, listSiteRoutes };
