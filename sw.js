const CACHE = "kofferly-shell-v28";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./v030.css",
  "./android-ui.css",
  "./manifest.webmanifest",
  "./VERSION",
  "./icons/icon.svg",
  "./icons/icon-maskable.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./js/android-ui.js",
  "./js/native-behavior.js",
  "./js/push-navigation.js",
  "./js/app.js",
  "./js/v030.js",
  "./js/backup.js",
  "./js/app-reload.js",
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
  event.waitUntil(precacheFreshShell());
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
  event.respondWith(networkFirst(request));
});

async function precacheFreshShell() {
  const cache = await caches.open(CACHE);
  await Promise.all(ASSETS.map(async path => {
    const request = new Request(path, { cache: "no-store" });
    const response = await fetch(request);
    if (!response.ok) throw new Error(`App-Datei konnte nicht geladen werden: ${path}`);
    await cache.put(new Request(path), response);
  }));
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(request, { cache: "no-store" });
    if (fresh.ok) await cache.put(request, fresh.clone());
    return fresh;
  } catch (_) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") return cache.match("./index.html");
    throw new Error("Offline und Ressource nicht im Cache.");
  }
}
