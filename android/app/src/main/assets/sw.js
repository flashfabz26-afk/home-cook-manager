// Rasoi Mitra Service Worker for offline support and mobile install
const CACHE_NAME = 'rasoi-mitra-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './cook-manager.html',
  './manifest.json',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  // Always let Firebase, Google APIs, and real-time streams go directly to network
  if (url.includes('firebasedatabase.app') || url.includes('firebaseio.com') || url.includes('googleapis.com')) {
    return;
  }

  // Network first, falling back to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache local same-origin assets
        if (event.request.method === 'GET' && response.status === 200 && url.startsWith(self.location.origin)) {
          const respClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, respClone).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
