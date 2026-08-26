const CACHE_NAME = 'culinary-assistant-v3-1-beta-1-trust-release-brand-3';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=3.1-beta.1',
  './preview4.css?v=3.1-beta.1',
  './preview5.css?v=3.1-beta.1',
  './preview6.css?v=3.1-beta.1',
  './app.js?v=3.1-beta.1',
  './release-3.1.js?v=3.1-beta.1',
  './search-utils.js?v=3.1-beta.1',
  './manifest.webmanifest?v=3.1-beta.1-brand3',
  './data/ingredients.js?v=3.1-beta.1',
  './data/recipes.js?v=3.1-beta.1',
  './icons/icon.svg?v=brand3',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type !== 'opaque') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') return caches.match('./index.html');
    throw new Error('Ресурс недоступен офлайн');
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  event.respondWith(networkFirst(event.request));
});
