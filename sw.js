/* Service worker Parcourio — mise en cache légère pour le rendre
   installable (PWA) et utilisable hors-ligne pour les pages déjà
   visitées. Stratégie volontairement simple :
   - "app shell" (HTML/CSS/JS/icônes) : cache d'abord, réseau en secours
     et en mise à jour silencieuse pour la prochaine visite.
   - assets/data/ecoles.json : réseau d'abord (données qui peuvent changer),
     cache en secours si hors-ligne.
   Incrémenter CACHE_VERSION à chaque mise à jour importante du site pour
   forcer le rafraîchissement du cache chez les visiteurs. */
const CACHE_VERSION = "parcourio-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/mentions-legales.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/assets/js/icons.js",
  "/assets/js/orientation-engine.js",
  "/assets/data/orientation-data.js",
  "/assets/img/logo-icon.png",
  "/assets/img/favicon-192.png",
  "/assets/img/favicon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((noms) => Promise.all(
        noms.filter((nom) => nom !== CACHE_VERSION).map((nom) => caches.delete(nom))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // laisse passer les CDN externes (fonts, chart.js…)

  // Données des écoles : toujours essayer le réseau en premier pour rester
  // à jour, on ne retombe sur le cache qu'en cas d'échec (hors-ligne).
  if (url.pathname.endsWith("/assets/data/ecoles.json")) {
    event.respondWith(
      fetch(request)
        .then((reponse) => {
          const copie = reponse.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copie));
          return reponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Reste de l'app shell : cache d'abord (rapide, marche hors-ligne),
  // mise à jour silencieuse du cache en arrière-plan.
  event.respondWith(
    caches.match(request).then((reponseCache) => {
      const fetchPromise = fetch(request)
        .then((reponseReseau) => {
          const copie = reponseReseau.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copie));
          return reponseReseau;
        })
        .catch(() => reponseCache);
      return reponseCache || fetchPromise;
    })
  );
});
