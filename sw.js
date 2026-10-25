// Hors connexion : sert le cache tout de suite, puis le met à jour en arrière-plan.
// Changer VERSION à chaque publication force le téléchargement des nouveaux fichiers.
const VERSION = "bd-v4";
const FILES = ["./", "index.html", "recettes.json", "manifest.webmanifest", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png"];

// les photos sont lues dans recettes.json pour être disponibles hors connexion dès l'installation
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(FILES);
    const recs = await (await c.match("recettes.json")).json();
    await c.addAll(recs.map(r => r.photo).filter(Boolean));
  }).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const network = fetch(e.request).then(res => {
      if (res.ok || res.type === "opaque") cache.put(e.request, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  }));
});
