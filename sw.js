const CACHE = "kofferly-shell-v21";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./v030.css",
  "./manifest.webmanifest",
  "./VERSION",
  "./icons/icon.svg",
  "./icons/icon-maskable.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./js/push-navigation.js",
  "./js/app.js",
  "./js/v030.js",
  "./js/backup.js",
  "./js/packing-tools.js",
  "./js/travel-profile.js",
  "./js/db.js",
  "./js/defaults.js",
  "./js/packing.js",
  "./js/images.js",
  "./js/weather.js",
  "./js/reminders.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();

    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await Promise.all(clients.map(client => client.navigate(client.url).catch(() => null)));
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const fresh = await fetch(request, { cache: "no-store" });
      if (fresh.ok) {
        const cache = await caches.open(CACHE);
        cache.put(request, fresh.clone());
      }
      return fresh;
    } catch (_) {
      const cached = await caches.match(request);
      if (cached) return cached;
      return caches.match("./index.html");
    }
  })());
});
