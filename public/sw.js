const CACHE_VERSION = "nochalant-shell-v3";
const SHELL_URLS = ["/", "/offline"];
const STATIC_CACHE = "nochalant-static-v3";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => ![CACHE_VERSION, STATIC_CACHE].includes(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Never cache authenticated API responses, uploads, or user-specific data.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) {
    if (url.pathname.startsWith("/_next/static/")) {
      event.respondWith((async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch { return Response.error(); }
      })());
    }
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        return response;
      } catch {
        const cache = await caches.open(CACHE_VERSION);
        return (await cache.match("/offline")) || (await cache.match("/")) || Response.error();
      }
    })());
  }
});
