const STATIC_CACHE = "travel-explorer-static-v1";
const DATA_CACHE = "travel-explorer-data-v1";
const TILE_CACHE = "travel-explorer-tiles-v1";
const ALL_CACHES = [STATIC_CACHE, DATA_CACHE, TILE_CACHE];

const STATIC_PATTERNS = [/^\/icons\//, /^\/photos\//, /^\/_next\/static\//];
const DATA_PATTERNS = [
  /^\/api\/pois$/,
  /^\/api\/regions$/,
  /^\/api\/countries$/,
  /^\/api\/areas$/,
  /^\/api\/exploration-modes$/,
  /^\/api\/categories$/
];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !ALL_CACHES.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cross-origin: map tiles, styles, glyphs, sprites, and any externally-hosted
  // photo URLs. These are effectively immutable content, so cache-first keeps the
  // map and previously-seen photos available offline.
  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(TILE_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  const isStatic = STATIC_PATTERNS.some((pattern) => pattern.test(url.pathname));

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  const isData = DATA_PATTERNS.some((pattern) => pattern.test(url.pathname));

  if (isData) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.mode === "navigate") {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
