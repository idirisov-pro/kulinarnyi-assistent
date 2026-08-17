const CACHE_NAME = 'culinary-assistant-v3-preview-5-public-beta-brand-3';
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=3.0-preview.5',
  './preview4.css?v=3.0-preview.5',
  './preview5.css?v=3.0-preview.5',
  './app.js?v=3.0-preview.5',
  './search-utils.js?v=3.0-preview.5',
  './manifest.webmanifest?v=3.0-preview.5-brand3',
  './data/ingredients.js?v=3.0-preview.5',
  './data/recipes.js?v=3.0-preview.5',
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
