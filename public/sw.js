// Minimal service worker: exists for PWA installability only.
// Deliberately no caching — the app is local-first already and stale
// caches would be worse than none. Everything passes through.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
