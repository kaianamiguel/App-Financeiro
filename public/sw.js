const CACHE_NAME = 'financas-v2'
const STATIC_ASSETS = ['/', '/login', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (event.request.url.includes('supabase')) return

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const url = new URL(event.request.url)
          if (url.pathname.startsWith('/icons') || url.pathname === '/manifest.webmanifest') {
            const clone = res.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
        }
        return res
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
  )
})
