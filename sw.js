const CACHE_NAME = 'pos-mobile-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/app.js',
  '/js/api.js',
  '/js/views/login.js',
  '/js/views/mesas.js',
  '/js/views/order.js',
  '/js/views/bill.js',
  '/manifest.json',
  '/img/icon-192.png',
  '/img/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // Network only for API calls — no caching of authenticated data
    event.respondWith(fetch(event.request).catch(() => {
      return new Response(JSON.stringify({ message: 'Sin conexión' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }));
  } else {
    // Cache first, then network for static assets
    event.respondWith(
      caches.match(event.request).then(r => r || fetch(event.request))
    );
  }
});
