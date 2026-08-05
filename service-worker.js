const CACHE_NAME = 'killer-in-the-keep-v2.1.0';
const APP_SHELL = [
  './killer-in-the-keep.html',
  './assets/css/app.css','./assets/css/cards.css','./assets/css/map.css','./assets/css/dice.css',
  './assets/js/app.js','./assets/js/api.js','./assets/js/store.js','./assets/js/input.js','./assets/js/map.js',
  './assets/js/cards.js','./assets/js/combat.js','./assets/js/dice-roller.js','./assets/js/rules.js','./assets/js/ui.js','./assets/js/multiplayer.js','./assets/js/backend-hub.js',
  './assets/json/config.json','./assets/json/campaign.json','./assets/json/characters.json','./assets/json/decks.json','./assets/json/maps.json','./assets/json/controls.json','./assets/json/runtime.json','./assets/json/manifest.webmanifest',
  './assets/images/branding/killer-in-the-keep-banner.webp','./assets/icons/app-icon-192.png','./assets/icons/app-icon-512.png','./assets/icons/app-icon-maskable-512.png','./assets/icons/apple-touch-icon.png','./assets/icons/favicon-96.png','./assets/icons/favicon-48.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.hostname.includes('script.google.com') || url.hostname.includes('googleusercontent.com')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy=response.clone(); caches.open(CACHE_NAME).then(cache=>cache.put('./killer-in-the-keep.html',copy)); return response;
    }).catch(() => caches.match('./killer-in-the-keep.html')));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response && response.ok && url.origin === self.location.origin) {
      const copy=response.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));
    }
    return response;
  })));
});
