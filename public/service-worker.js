// Alaikstore service worker — handles Web Push only (no offline caching,
// keeps this intentionally minimal/safe: it won't intercept fetch() or break
// anything if something about the SW goes wrong, since there's no fetch handler).

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Fired when a push message arrives from our send-push-notification /
// payment-callback / provider-webhook Edge Functions (via web-push + VAPID).
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'Alaikstore', body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'Alaikstore'
  const options = {
    body: data.body || '',
    icon: data.icon || '/logo-192.png',
    badge: '/logo-64.png',
    data: { url: data.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Focuses an already-open Alaikstore tab if there is one, otherwise opens a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
    })
  )
})
