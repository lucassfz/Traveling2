// Service worker do Traveling: modo offline sem prender ninguém numa versão
// antiga. Estratégia "rede primeiro": tudo vem da internet como sempre; a cópia
// guardada só é usada quando não há conexão. Guarda o que a pessoa já abriu
// (páginas, scripts, dados, three.js e mapa da CDN), nunca as chamadas ao
// backend de preços (preço velho não pode parecer atual).
const CACHE = 'traveling-v1';
const CDN = ['https://cdn.jsdelivr.net/', 'https://fonts.googleapis.com/', 'https://fonts.gstatic.com/', 'https://flagcdn.com/'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(['./', './index.html', './manifest.webmanifest'])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith('traveling-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !CDN.some(prefix => request.url.startsWith(prefix))) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok && (response.type === 'basic' || response.type === 'cors')) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(request, { ignoreSearch: request.mode === 'navigate' });
    if (cached) return cached;
    if (request.mode === 'navigate') return (await caches.match('./')) ?? Response.error();
    return Response.error();
  }));
});
