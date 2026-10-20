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

  // Langue choisie sur l'écran de démarrage (ou avec le sélecteur FR | EN de l'en-tête)
  const CLE_LANGUE = "colorado-reporting:langue";
  let langue = "fr"; try { langue = localStorage.getItem(CLE_LANGUE) === "en" ? "en" : "fr"; } catch {}
  const locale = langue === "en" ? "en-GB" : "fr-FR";

  // Contenus collectés : version anglaise (« actualites_en »…) si elle existe, sinon la version française
  const champ = (d, nom) => (langue === "en" && d?.[nom + "_en"]?.length ? d[nom + "_en"] : d?.[nom]);

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const date = (s, o = { day: "numeric", month: "long", year: "numeric" }) => (s ? new Date(s + "T12:00:00").toLocaleDateString(locale, o) : "");
  const nombre = (n, dec = 2) => Number(n).toLocaleString(locale, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const taille = mo => (!mo ? "" : langue === "en" ? `${mo} MB` : `${String(mo).replace(".", ",")} Mo`);

  // Textes fixes de l'appli : texte français -> texte anglais
  const EN = {
    // Commun à toutes les pages
    "Espace Corporate": "Corporate Space",
    "Revenir à l'écran de démarrage": "Back to the start screen",
    "Accueil": "Home", "Actualités": "News", "Rapports": "Reports", "Communiqués": "Releases", "Contact": "Contact",
    "Tout voir": "See all", "Télécharger": "Download", "Consulter": "View", "Tous": "All", "Toutes": "All",
    "Choisir la langue": "Choose language",
    // Catégories des actualités et types de communiqués (contenus français affichés en anglais)
    "Entreprise": "Company", "Événements": "Events", "Gouvernance": "Governance", "Finance": "Finance", "Certifications": "Certifications",
    "Communication semestrielle": "Half-year results", "Assemblée générale": "General meeting", "Indicateurs trimestriels": "Quarterly indicators",
    "Résultats annuels": "Annual results", "Capital et gouvernance": "Capital and governance", "Autres communiqués": "Other releases",
    "Annuel": "Annual", "Semestriel": "Half-year",
    // 01 – Démarrage
    "Maquette 1 – Démarrage": "Colorado Reporting",
    "Colorado – Soyez inspirés": "Colorado – Be inspired",
    "Application mobile Reporting": "Reporting mobile app",
    "Retrouvez toute l'actualité institutionnelle de COLORADO : communication financière, rapports annuels et actualités de la société, au même endroit.":
      "All of COLORADO's corporate news in one place: financial communication, annual reports and company news.",
    "Société cotée à la Bourse de Casablanca": "Listed on the Casablanca Stock Exchange",
    // 02 – Accueil
    "Maquette 2 – Accueil": "Colorado Reporting – Home",
    "Bonjour": "Welcome",
    "Rechercher une actualité": "Search news",
    "Installer l'appli Colorado": "Install the Colorado app",
    "Accès direct depuis l'écran d'accueil, même sans connexion.": "Direct access from your home screen, even offline.",
    "Touchez Partager, puis « Sur l'écran d'accueil ».": "Tap Share, then “Add to Home Screen”.",
    "Installer": "Install", "Fermer": "Close",
    "Action COLORADO": "COLORADO share", "Bourse de Casablanca": "Casablanca Stock Exchange",
    "Cours repris de l'espace Corporate de colorado.ma": "Share price from the colorado.ma Corporate Space",
    "Mis à jour le": "Updated on",
    "Toute l'actualité de la société": "All the company news",
    "Rapports annuels": "Annual reports", "De 2016 à 2025": "From 2016 to 2025",
    "Communiqués financiers": "Financial releases", "Résultats et publications": "Results and publications",
    "Écrire à Colorado": "Write to Colorado",
    "Colorado en chiffres": "Colorado in figures", "Exercice": "Financial year", "Exercice 2025": "Financial year 2025",
    "Chiffre d'affaires": "Revenue", "Résultat net": "Net income", "Collaborateurs": "Employees",
    "Revendeurs agréés": "Authorised resellers", "Showrooms et agences": "Showrooms and branches", "Partenaires export": "Export partners",
    "Communication financière": "Financial communication",
    "En vidéo": "Video", "COLORADO : Soyez inspirés": "COLORADO: Be inspired",
    "Une question ?": "Any questions?",
    "Votre demande sera traitée par l'un de nos collaborateurs": "Your request will be handled by one of our team members",
    "Nous contacter": "Contact us",
    // 03 – Actualités
    "Maquette 3 – Actualités": "Colorado Reporting – News",
    "Aucune actualité ne correspond à votre recherche.": "No news matches your search.",
    "Voir plus d'actualités": "Show more news", "À la une": "Featured",
    // 04 – Rapports
    "Maquette 4 – Rapports annuels": "Colorado Reporting – Reports",
    "Rapports annuels et rapports financiers de chaque exercice": "Annual reports and financial reports for each financial year",
    "Rapports financiers": "Financial reports", "Éditions précédentes": "Previous editions",
    "Voir les rapports plus anciens": "Show older reports",
    "Documents publiés sur l'espace Corporate de colorado.ma (rubrique États financiers).":
      "Documents published on the colorado.ma Corporate Space (Financial Statements section).",
    "Couverture du rapport annuel": "Cover of the annual report", "Dernière édition": "Latest edition", "Rapport annuel": "Annual report",
    "Rapports financiers annuels": "Annual financial reports", "Rapports financiers semestriels": "Half-year financial reports",
    "1er sem.": "H1", "Annuels": "Annual", "Semestriels": "Half-year", "Aperçu :": "Preview:",
    // 05 – Communiqués
    "Maquette 5 – Communiqués financiers": "Colorado Reporting – Financial releases",
    "Résultats, indicateurs et assemblées générales": "Results, indicators and general meetings",
    "Voir les communiqués plus anciens": "Show older releases",
    "Dernière publication": "Latest publication", "Publié le": "Published on",
    // 06 – Contact
    "Maquette 6 – Contact": "Colorado Reporting – Contact",
    "Votre message sera orienté vers le service correspondant à votre demande et traité par l'un de nos collaborateurs.":
      "Your message will be routed to the relevant department and handled by one of our team members.",
    "Appeler": "Call", "Écrire": "Write", "Site web": "Website", "Envoyer un message": "Send a message",
    "Civilité": "Title", "M.": "Mr", "Mme": "Mrs", "Mlle": "Ms", "Nom": "Last name", "Prénom": "First name",
    "Société": "Company", "E-mail": "Email", "Téléphone": "Phone", "Objet": "Subject", "Sélectionner": "Select",
    "Demande d'information": "Information request", "Demande de devis": "Quote request", "Autres": "Other",
    "Votre message": "Your message", "Envoyer": "Send",
    "Conformément à la loi 09-08, vous disposez d'un droit d'accès, de rectification et d'opposition au traitement de vos données personnelles. Ce traitement a fait l'objet d'une déclaration auprès de la CNDP sous le N° D-W-247/2014.":
      "In accordance with Law 09-08, you have the right to access, rectify and object to the processing of your personal data. This processing has been declared to the CNDP under No. D-W-247/2014.",
    "Message envoyé": "Message sent",
    "Merci pour l'intérêt que vous portez à Colorado. Votre demande a été transmise au service concerné.":
      "Thank you for your interest in Colorado. Your request has been forwarded to the relevant department.",
    "Merci de remplir les champs obligatoires.": "Please fill in the required fields.",
    "L'adresse e-mail ne semble pas valide.": "The email address does not seem to be valid.",
    "Nos adresses": "Our addresses", "Siège": "Head office", "Administration": "Administration", "Itinéraire": "Directions",
    "Autre ligne : +212 522 29 01 73": "Other line: +212 522 29 01 73", "Fax : +212 522 35 41 54": "Fax: +212 522 35 41 54",
    "Agences et showrooms": "Branches and showrooms", "Agences et showrooms au Maroc": "Branches and showrooms in Morocco",
    "Usines et plateformes logistiques": "Factories and logistics platforms", "Showrooms à l'international": "International showrooms",
    "Fax :": "Fax:", "Agence et showroom": "Branch and showroom", "Agence": "Branch", "Usine": "Factory",
    "Plateforme logistique": "Logistics platform",
    "Côte d'Ivoire": "Ivory Coast", "Sénégal": "Senegal", "Cameroun": "Cameroon", "Tchad": "Chad", "Mauritanie": "Mauritania", "Algérie": "Algeria"
  };
  const T = s => (langue === "en" && EN[s] !== undefined ? EN[s] : s);

  // Traduit les éléments marqués data-t : leurs textes (sans toucher aux icônes) et leurs attributs title, alt, placeholder, aria-label
  function traduire(racine = document) {
    if (langue !== "en") return;
    racine.querySelectorAll("[data-t]").forEach(el => {
      el.childNodes.forEach(n => {
        const k = n.nodeType === 3 && n.nodeValue.trim();
        if (k && EN[k] !== undefined) n.nodeValue = n.nodeValue.replace(k, EN[k]);
      });
      for (const a of ["title", "alt", "placeholder", "aria-label"]) {
        const v = el.getAttribute(a);
        if (v && EN[v] !== undefined) el.setAttribute(a, EN[v]);
      }
    });
  }
  document.documentElement.lang = langue;
  traduire();

  // Petit sélecteur FR | EN dans l'en-tête des pages : la page se recharge dans l'autre langue
  const entete = document.querySelector("header");
  if (entete) {
    const style = document.createElement("style");
    style.textContent = `.langue { display: flex; align-items: center; gap: 2px; font-size: 12px; color: var(--line); }
      .langue button { border: none; background: none; padding: 6px 3px; font: inherit; font-size: 12px; letter-spacing: .5px; color: var(--muted); cursor: pointer; }
      .langue button.on { color: var(--red); font-weight: 600; }`;
    document.head.appendChild(style);
    const sel = document.createElement("div");
    sel.className = "langue";
    sel.setAttribute("role", "group");
    sel.setAttribute("aria-label", T("Choisir la langue"));
    sel.innerHTML = ["fr", "en"].map(l => `<button type="button" lang="${l}" class="${l === langue ? "on" : ""}" aria-pressed="${l === langue}">${l.toUpperCase()}</button>`).join("<span>|</span>");
    sel.onclick = e => {
      const b = e.target.closest("button");
      if (!b || b.lang === langue) return;
      try { localStorage.setItem(CLE_LANGUE, b.lang); } catch {}
      location.reload();
    };
    entete.insertBefore(sel, entete.querySelector(".ic"));
  }

  window.Donnees = { charger, esc, date, nombre, taille, langue, locale, champ, T, traduire };

  // Mode hors connexion (service worker) : actif seulement sur un site en https ou en local
  // (enregistré tout de suite : attendre la fin du chargement des photos de colorado.ma peut prendre longtemps)
  if ("serviceWorker" in navigator) {
    const avaitVersion = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register("sw.js").catch(() => {});
    // Une nouvelle version vient de s'installer : on recharge une fois pour l'afficher tout de suite
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (avaitVersion && !sessionStorage.getItem("colorado-reporting:recharge")) {
        sessionStorage.setItem("colorado-reporting:recharge", "1");
        location.reload();
      }
    });
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
