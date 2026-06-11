const CACHE_NAME = 'english-journal-v1';

const ASSETS_TO_CACHE = [
  '/english-journal/',
  '/english-journal/index.html',
  'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap',
  'https://fonts.gstatic.com/s/lorasans/v1/font.woff2',
];

// Install — cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/english-journal/',
        '/english-journal/index.html',
      ]).catch(() => {
        // Silently fail for external resources
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache, fall back to network, cache new responses
self.addEventListener('fetch', event => {
  // Skip non-GET and Supabase API calls (always need live data)
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('supabase.co')) return;
  if (event.request.url.includes('dictionaryapi')) return;
  if (event.request.url.includes('merriam-webster')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback — return cached index.html for navigation
          if (event.request.mode === 'navigate') {
            return caches.match('/english-journal/index.html');
          }
        });
    })
  );
});
