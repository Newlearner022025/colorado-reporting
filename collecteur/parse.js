// Lecture des pages de l'espace Corporate de colorado.ma.
// Chaque fonction reçoit un Document (linkedom dans GitHub Actions, DOMParser dans un navigateur)
// et renvoie des données simples, prêtes à être écrites dans data/contenus.json.

export const BASE = "https://www.colorado.ma";

const MOIS = { janvier: 1, "février": 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7,
  "août": 8, aout: 8, septembre: 9, octobre: 10, novembre: 11, "décembre": 12, decembre: 12 };

const txt = el => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
const abs = href => (!href ? null : href.startsWith("http") ? href : BASE + href);
const pad = n => String(n).padStart(2, "0");

// « 16/04/2024 » ou « 10 mars 2026 » -> « 2024-04-16 »
export function parseDate(s) {
  s = (s || "").trim().toLowerCase();
  let m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  m = s.match(/(\d{1,2})\s+([a-zéûè]+)\s+(\d{4})/);
  if (m && MOIS[m[2]]) return `${m[3]}-${pad(MOIS[m[2]])}-${pad(m[1])}`;
  return null;
}

// Les vignettes du site passent par /styles/<format>/public/ : on remonte à l'image d'origine, plus nette.
export function imageOriginale(src) {
  if (!src) return null;
  return abs(src).replace(/\/styles\/[^/]+\/public\//, "/").replace(/\?itok=.*$/, "");
}

// « RÉAMÉNAGEMENT DU SITE » -> « Réaménagement du site » (les titres du site sont parfois tout en majuscules)
export function titre(s) {
  s = s.replace(/\s+/g, " ").trim();
  const lettres = s.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (lettres && lettres === lettres.toUpperCase()) {
    s = s.toLowerCase();
    s = s.charAt(0).toUpperCase() + s.slice(1);
    s = s.replace(/\b(colorado|dgi|iso|qse|hqe|ago|pdg|rse)\b/gi, w => w.toUpperCase());
  }
  return s;
}

export function categorieActualite(t) {
  if (/certifi|iso|hqe|qse/i.test(t)) return "Certifications";
  if (/forum|salon|foire|participation|journée|journee/i.test(t)) return "Événements";
  if (/nomination|pdg|conseil d.administration|gouvernance/i.test(t)) return "Gouvernance";
  if (/communication financi|ago|résultats|resultats|communiqué|communique/i.test(t)) return "Finance";
  return "Entreprise";
}

export function typeCommunique(t) {
  if (/semestriel/i.test(t)) return "Semestriel";
  if (/ago|assembl/i.test(t)) return "Assemblée générale";
  if (/trimestriel|\bT[1-4]\b/i.test(t)) return "Indicateurs trimestriels";
  if (/annuel|résultats|resultats/i.test(t)) return "Résultats annuels";
  return "Autre";
}

// /corporate/fr/actualites
export function lireActualites(doc) {
  return [...doc.querySelectorAll(".article_listing li")].map(li => {
    const a = li.querySelector(".row_title a");
    if (!a) return null;
    const t = titre(txt(a));
    return {
      date: parseDate(txt(li.querySelector(".date"))),
      categorie: categorieActualite(t),
      titre: t,
      extrait: txt(li.querySelector(".text p")) || null,
      image: imageOriginale(li.querySelector(".img img")?.getAttribute("src")),
      lien: abs(a.getAttribute("href"))
    };
  }).filter(Boolean);
}

// /corporate/fr/communiques-financiers et /corporate/fr/rapports (même mise en page)
function lireListeFinance(doc) {
  return [...doc.querySelectorAll(".finance_listing li")].map(li => {
    const a = li.querySelector(".row_title a");
    const pdf = li.querySelector("a.telechargement, a[href$='.pdf']");
    if (!a || !pdf) return null;
    return {
      date: parseDate(txt(li.querySelector(".date"))),
      titre: titre(txt(a)),
      pdf: abs(pdf.getAttribute("href")),
      apercu: imageOriginale(li.querySelector(".img img")?.getAttribute("src")),
      lien: abs(a.getAttribute("href"))
    };
  }).filter(Boolean);
}

export function lireCommuniques(doc) {
  return lireListeFinance(doc).map(c => ({ ...c, type: typeCommunique(c.titre) }));
}

export function lireRapports(doc) {
  return lireListeFinance(doc)
    .map(r => ({ ...r, annee: Number((r.titre.match(/rapport annuel\s+(\d{4})/i) || [])[1]) }))
    .filter(r => r.annee);
}

// Page d'accueil : cours de l'action et « COLORADO en chiffres »
export function lireAccueil(doc) {
  const prix = txt(doc.querySelector(".cours_actoins .prix"));
  const m = prix.match(/Cours\s*\(MAD\)\s*([\d.,]+)\s*\/\s*Variation\s*([-+]?[\d.,]+)\s*%/i);
  const action = m ? { cours: Number(m[1].replace(",", ".")), variation: Number(m[2].replace(",", ".")) } : null;

  const chiffres = [...doc.querySelectorAll(".block_colorado_chiffres li")].map(li => {
    const c = li.querySelector(".chiffre");
    const unite = txt(c?.querySelector(".span_chiffre"));
    const valeur = txt(c).replace(unite, "").trim();
    return valeur ? { valeur, unite: unite || null, libelle: txt(li.querySelector(".text")) } : null;
  }).filter(Boolean);

  return { action, chiffres };
}
