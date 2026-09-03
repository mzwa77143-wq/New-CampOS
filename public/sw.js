// CampOS Service Worker for Offline Gym Floor Operation
const CACHE_NAME = 'campos-offline-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/fighter',
  '/analyzer',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Safe catch for dynamic routes
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. Only handle GET requests and valid HTTP/HTTPS URLs (ignore POST, PUT, DELETE, and chrome-extension://)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // 2. Never cache or intercept API routes or Qdrant/Gemini calls
  if (event.request.url.includes('/api/')) {
    return;
  }

  // 3. Navigation fallback to cache if offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/') || caches.match('/fighter');
      })
    );
    return;
  }

  // 4. Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networked = fetch(event.request)
        .then((response) => {
          // Cache only valid successful basic GET responses
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);
      return cached || networked;
    })
  );
});
