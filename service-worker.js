// Service worker for The Stack — Library Tracker.
//
// Caches the app shell (HTML, manifest, icons) so the tracker still opens
// with no signal. It does NOT cache Airtable, Google Calendar, or Open
// Library requests — those always need a live connection, and the app
// already handles that failure gracefully with its own error messages.
//
// Bump CACHE_NAME whenever you deploy a new version so old shells don't
// linger — the activate handler below clears any previous cache automatically.

const CACHE_NAME = 'library-tracker-shell-v16';

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-16.png',
  './icon-32.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch((e) => console.error('Shell caching failed:', e))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests (the app shell itself). Let everything
  // else — Airtable, the Worker proxy, Google Calendar, Open Library covers —
  // go straight to the network, untouched.
  if(url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
