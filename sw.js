// ============================================================
// SERVICE WORKER — US Citizenship Study App
// Version: 1.0
// ============================================================
// Caches the app shell for offline use.
// Firebase requests always go to the network (they handle
// their own caching/offline sync internally).
// ============================================================

const CACHE_NAME = 'citizenship-app-v1';

// Files to cache on install
const SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json'
];

// ── Install: cache the app shell ──────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove old caches ──────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for Firebase, cache-first for shell ──
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Always use network for Firebase, googleapis, and audio/image assets from Storage
  if (
    url.includes('firebase') ||
    url.includes('googleapis') ||
    url.includes('firebaseapp') ||
    url.includes('firebasestorage') ||
    url.includes('identitytoolkit')
  ) {
    return; // Let the browser handle it normally
  }

  // Cache-first for everything else (the app shell)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache valid responses for future offline use
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // If offline and not cached, return the main app shell
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
