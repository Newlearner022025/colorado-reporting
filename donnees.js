// Chargement des contenus collectés sur colorado.ma (data/contenus.json, mis à jour par GitHub Actions).
// Chaque page garde ses contenus de départ : si le fichier ne charge pas, elle les affiche tels quels.
(function () {
  const CLE = "colorado-reporting:contenus";

  async function charger() {
    try {
      const r = await fetch("data/contenus.json", { cache: "no-cache" });
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      try { localStorage.setItem(CLE, JSON.stringify(d)); } catch {}
      return d;
    } catch {
      // Hors connexion : dernière version gardée sur l'appareil
      try { return JSON.parse(localStorage.getItem(CLE)); } catch { return null; }
    }
  }

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const date = (s, o = { day: "numeric", month: "long", year: "numeric" }) => (s ? new Date(s + "T12:00:00").toLocaleDateString("fr-FR", o) : "");
  const nombre = (n, dec = 2) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const taille = mo => (mo ? `${String(mo).replace(".", ",")} Mo` : "");

  window.Donnees = { charger, esc, date, nombre, taille };

  // Mode hors connexion (service worker) : actif seulement sur un site en https ou en local
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  // Installation sur l'écran d'accueil. Android/Chrome : on garde la proposition du navigateur pour un bouton.
  // iPhone : pas de proposition automatique, on affiche la marche à suivre (Partager > Sur l'écran d'accueil).
  const installee = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  let proposition = null;
  const ecouteurs = [];
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); proposition = e; ecouteurs.forEach(f => f()); });
  window.Installation = {
    installee,
    iphone: /iphone|ipad|ipod/i.test(navigator.userAgent),
    possible: () => !!proposition,
    quandPossible: f => (proposition ? f() : ecouteurs.push(f)),
    lancer: async () => { if (!proposition) return false; proposition.prompt(); const r = await proposition.userChoice; proposition = null; return r.outcome === "accepted"; }
  };
})();
