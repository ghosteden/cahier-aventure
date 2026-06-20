/* Service Worker — met l'appli en cache pour qu'elle fonctionne hors-ligne.
   Pense à incrémenter CACHE_VERSION quand tu modifies des fichiers. */
const CACHE_VERSION = "aventure-ce2-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./data/content-francais.js",
  "./data/content-maths.js",
  "./data/content-sciences.js",
  "./data/content-culture.js",
  "./js/program.js",
  "./js/store.js",
  "./js/sync.js",
  "./js/gamification.js",
  "./js/dictee.js",
  "./js/engine.js",
  "./js/ui.js",
  "./js/app.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Ne jamais mettre en cache les appels de synchronisation cloud.
  if (url.pathname.includes("/.netlify/functions/")) {
    e.respondWith(fetch(e.request).catch(() => new Response("{\"offline\":true}", { headers: { "Content-Type": "application/json" } })));
    return;
  }
  // Stratégie "cache d'abord" pour le reste (offline-first).
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      if (e.request.method === "GET" && res.ok && url.origin === location.origin) {
        caches.open(CACHE_VERSION).then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
