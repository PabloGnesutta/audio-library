// Deliberately no caching -- the app is entirely behind auth, so caching
// API responses risks staleness/leaking data between accounts. This exists
// only to satisfy PWA installability criteria (a registered fetch handler).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => e.respondWith(fetch(e.request)));
