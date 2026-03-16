const CACHE_NAME = 'al-noor-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ignore errors for individual assets
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Don't cache API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      }).catch(() => {
        // Return cached root for navigation requests (SPA fallback)
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Al-Noor', {
      body: data.body || 'Prayer time notification',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'prayer-time',
      requireInteraction: false,
      data: data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Message handler for prayer notifications from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'PRAYER_NOTIFICATION') {
    self.registration.showNotification('🕌 ' + event.data.prayerName, {
      body: event.data.message || 'It is time for prayer',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'prayer-' + event.data.prayerName,
      requireInteraction: true,
    });
  }
});
