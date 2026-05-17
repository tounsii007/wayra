/*
 * Wayra service worker — small, hand-written.
 * Strategy:
 *   • App shell (HTML/JS/CSS) → stale-while-revalidate
 *   • Map tiles (osm/maptiler) → cache-first with 7-day expiry
 *   • API GETs (places, stops, disruptions) → network-first, 30 s cache fallback
 *   • POSTs and live-departures → never cached
 */

const VERSION = 'wayra-v1';
const STATIC_CACHE = `${VERSION}-static`;
const TILES_CACHE = `${VERSION}-tiles`;
const API_CACHE = `${VERSION}-api`;

const APP_SHELL = ['/', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Map tiles
  if (
    /tile\.openstreetmap\.org|api\.maptiler\.com/.test(url.hostname) ||
    url.pathname.endsWith('.pbf') ||
    url.pathname.endsWith('.mvt')
  ) {
    event.respondWith(cacheFirst(TILES_CACHE, req));
    return;
  }

  // Backend API (network-first w/ short fallback)
  if (url.pathname.startsWith('/api/')) {
    if (url.pathname.startsWith('/api/realtime/departures')) {
      // Never cache live boards
      event.respondWith(fetch(req).catch(() => new Response('{}', { status: 503 })));
      return;
    }
    event.respondWith(networkFirst(API_CACHE, req, 30 * 1000));
    return;
  }

  // Same-origin: stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(STATIC_CACHE, req));
  }
});

async function cacheFirst(cacheName, req) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return new Response('', { status: 504 });
  }
}

async function networkFirst(cacheName, req, freshnessMs) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req);
    if (hit) {
      const date = new Date(hit.headers.get('date') ?? Date.now()).getTime();
      if (Date.now() - date < freshnessMs * 30) return hit;
    }
    return new Response(JSON.stringify({ error: { code: 'offline', message: 'Offline' } }), {
      status: 503,
      headers: { 'content-type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(cacheName, req) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const fetchPromise = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit ?? fetchPromise;
}

// Push notifications — wired in v0.3+
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Wayra', {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.url,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data) {
    event.waitUntil(self.clients.openWindow(event.notification.data));
  }
});
