const CACHE_VERSION = "nochalant-shell-v4";
const STATIC_CACHE = "nochalant-static-v4";
const PUBLIC_APP_ROUTES = ["/drafts", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await Promise.allSettled(PUBLIC_APP_ROUTES.map(async (path) => {
      const response = await fetch(path, { credentials: "same-origin" });
      if (response.ok && response.type === "basic") await cache.put(path, response);
    }));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("nochalant-") && ![CACHE_VERSION, STATIC_CACHE].includes(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Authenticated API, media uploads and user-specific responses are never cached.
  if (url.pathname.startsWith("/api/")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch { return Response.error(); }
    })());
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      try {
        const response = await fetch(request);
        if (response.ok && PUBLIC_APP_ROUTES.includes(url.pathname)) {
          await cache.put(url.pathname, response.clone());
        }
        return response;
      } catch {
        const cachedPage = await cache.match(url.pathname);
        if (cachedPage) return cachedPage;
        const offline = await cache.match("/offline");
        return offline || Response.error();
      }
    })());
  }
});
