// Service worker : permet d'ouvrir l'appli sans connexion.
// - Les pages et images de l'appli sont gardées sur le téléphone dès la première visite.
// - Les contenus (data/contenus.json) sont toujours pris en ligne quand c'est possible, sinon la dernière version gardée.
// - Les photos de colorado.ma sont gardées au fur et à mesure qu'elles s'affichent.
// Changer VERSION à chaque mise à jour des pages pour que les téléphones prennent la nouvelle version.
const VERSION = "v9";
const APPLI = `appli-${VERSION}`;
const PHOTOS = "photos-colorado";

const FICHIERS = [
  "./", "index.html", "01-demarrage.html", "02-accueil.html", "03-actualites.html", "04-rapports.html",
  "05-communiques.html", "06-contact.html", "donnees.js", "manifest.webmanifest", "data/contenus.json",
  "images/icone-192.png", "images/icone-512.png", "images/icone-apple-180.png",
  "images/mosaique-fauteuil.jpg", "images/mosaique-carrosserie.jpg", "images/mosaique-canape.jpg", "images/mosaique-vannes.jpg",
  "images/ra-presse.jpg", "images/ra-financier.jpg", "images/ra-adresses.jpg", "images/ra-chiffres.jpg",
  "images/couv-2016.jpg", "images/couv-2017.jpg", "images/couv-2018.jpg", "images/couv-2019.jpg", "images/couv-2020.jpg",
  "images/couv-2021.jpg", "images/couv-2022.jpg", "images/couv-2024.jpg", "images/couv-2025.jpg"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(APPLI).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(cles => Promise.all(cles.filter(k => k.startsWith("appli-") && k !== APPLI).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Les PDF sont lourds : on les laisse au navigateur, en ligne uniquement
  if (url.pathname.endsWith(".pdf")) return;

  // Contenus collectés : réseau d'abord, copie gardée en secours
  if (url.origin === location.origin && url.pathname.endsWith("/data/contenus.json")) {
    e.respondWith(fetch(req).then(r => {
      const copie = r.clone();
      caches.open(APPLI).then(c => c.put("data/contenus.json", copie));
      return r;
    }).catch(() => caches.match("data/contenus.json")));
    return;
  }

  // Pages et fichiers de l'appli : copie locale d'abord (ignore les ?source=appli et autres paramètres)
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req).then(rep => {
      if (rep.ok) { const copie = rep.clone(); caches.open(APPLI).then(c => c.put(req, copie)); }
      return rep;
    })));
    return;
  }

  // Photos et logo de colorado.ma : copie locale si elle existe, mise à jour en arrière-plan
  if (url.hostname.endsWith("colorado.ma") && req.destination === "image") {
    e.respondWith(caches.open(PHOTOS).then(async c => {
      const garde = await c.match(req);
      const reseau = fetch(req).then(rep => { c.put(req, rep.clone()); return rep; }).catch(() => garde);
      return garde || reseau;
    }));
  }
});
