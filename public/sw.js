// KMR Remind Service Worker
// Version 1.0.0

const CACHE_NAME = 'kmr-remind-shell-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-512-maskable.svg',
  '/icons/badge-72.svg'
];

// Install: Cache essential shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches and claim clients
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
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network first with cache fallback for navigation and static assets
self.addEventListener('fetch', (event) => {
  // Ignore non-GET or cross-origin requests like Supabase API
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // If navigation request fails, return cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});

// Push: Receive push notification from Web Push server
self.addEventListener('push', (event) => {
  let data = {
    title: 'Reminder Due — KMR Remind',
    body: 'You have a scheduled reminder waiting.',
    icon: '/icons/icon-192.svg',
    badge: '/icons/badge-72.svg',
    tag: 'kmr-remind-default',
    data: {
      url: '/'
    }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.svg',
    badge: data.badge || '/icons/badge-72.svg',
    tag: data.tag || (data.data && data.data.occurrence_id ? `remind-${data.data.occurrence_id}` : 'kmr-remind'),
    data: data.data || {},
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    actions: [
      {
        action: 'complete',
        title: '✓ Complete'
      },
      {
        action: 'snooze',
        title: '⏰ Snooze 10m'
      },
      {
        action: 'dismiss',
        title: '✕ Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions).then(() => {
      // Also broadcast to any active tabs so UI updates live
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'PUSH_NOTIFICATION_RECEIVED',
            payload: data
          });
        });
      });
    })
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const notificationData = notification.data || {};
  const occurrenceId = notificationData.occurrence_id;
  const reminderId = notificationData.reminder_id;
  const targetUrl = notificationData.url || '/';

  notification.close();

  // If user clicked an action button (complete, snooze, dismiss)
  if (action && occurrenceId) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // If an app window is open, send message to process the action with user auth
        for (const client of clientList) {
          if ('focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_ACTION',
              action,
              occurrenceId,
              reminderId
            });
            return client.focus();
          }
        }
        // If no app window is open, open a new window with query params to handle the action
        if (self.clients.openWindow) {
          const actionUrl = `${targetUrl}?action=${action}&occurrenceId=${occurrenceId}`;
          return self.clients.openWindow(actionUrl);
        }
      })
    );
    return;
  }

  // Default click: Open or focus application window
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Notification close (user swiped away or dismissed)
self.addEventListener('notificationclose', (event) => {
  const notification = event.notification;
  const data = notification.data || {};
  // Broadcast dismissal event if needed
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'NOTIFICATION_CLOSED',
        data
      });
    });
  });
});

