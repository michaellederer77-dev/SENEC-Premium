const CACHE = 'ladeprotokoll-v18';
const ASSETS = [
  './',
  './index.html',
  './t03.html',
  './tayron.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './car-t03.png',
  './car-tayron.png'
];

// Install: robust – ein fehlschlagendes Asset bricht die Installation nicht ab
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(
      ASSETS.map(url => cache.add(new Request(url, { cache: 'reload' })))
    );
    await self.skipWaiting();
  })());
});

// Activate: alte Caches entfernen, sofort Kontrolle übernehmen
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Fetch: Cache-first, Netz als Fallback, Ergebnis nachcachen
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response && response.status === 200 && response.type === 'basic') {
        const cache = await caches.open(CACHE);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch (err) {
      // Offline und nicht im Cache: Startseite als Fallback
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
      throw err;
    }
  })());
});
