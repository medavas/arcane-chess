const CACHE_NAME = 'static-assets-v2';
const MAX_CACHE_SIZE = 200 * 1024 * 1024; // 200MB

// ✅ Install event: Pre-cache critical assets only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/src/main.js',
        '/src/styles.css',
      ]);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// ✅ Fetch event: Cache assets dynamically from /assets/
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ✅ Only handle http/https requests (ignore chrome-extension://, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request).then((networkResponse) => {
            // ✅ Only cache complete responses (status 200-299, not 206 partial content)
            if (
              networkResponse.ok &&
              networkResponse.status >= 200 &&
              networkResponse.status < 300 &&
              networkResponse.status !== 206
            ) {
              cache.put(event.request, networkResponse.clone());

              // ✅ Check cache size and remove old items if too big
              cache.keys().then((keys) => {
                let totalSize = 0;
                Promise.all(
                  keys.map((request) =>
                    cache.match(request).then((response) => {
                      if (response) {
                        return response.blob().then((blob) => {
                          totalSize += blob.size;
                          if (totalSize > MAX_CACHE_SIZE) {
                            cache.delete(request);
                          }
                        });
                      }
                    })
                  )
                );
              });
            }

            return networkResponse;
          });
        });
      })
    );
  }
});

// ✅ Activate event: Delete old caches when a new SW version is installed
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim(); // Take control of open pages immediately
});
