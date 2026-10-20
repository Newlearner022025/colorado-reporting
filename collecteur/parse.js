// Lecture des pages de l'espace Corporate de colorado.ma.
// Chaque fonction reçoit un Document (linkedom dans GitHub Actions, DOMParser dans un navigateur)
// et renvoie des données simples, prêtes à être écrites dans data/contenus.json.

export const BASE = "https://www.colorado.ma";

const MOIS = { janvier: 1, "février": 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7,
  "août": 8, aout: 8, septembre: 9, octobre: 10, novembre: 11, "décembre": 12, decembre: 12,
  // Espace Corporate en anglais : « 25 September 2026 »
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12 };

const txt = el => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
const abs = href => (!href ? null : href.startsWith("http") ? href : BASE + href);
const pad = n => String(n).padStart(2, "0");

// « 16/04/2024 », « 10 mars 2026 » ou « 10 March 2026 » -> « 2024-04-16 »
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

// Noms propres à remettre en forme après le passage en minuscules
const NOMS = ["Forum International de la Chimie", "Dar Bouazza", "Dar Bouaâza", "Aïn Sebaâ", "Ain Sebaa", "Casablanca",
  "Maroc", "Fès", "Kénitra", "Marrakech", "Agadir", "Oujda", "Chagar", "Ecolabel", "Covid"];
const ACRONYMES = /\b(colorado|dgi|iso|qse|hqe|ago|agm|pdg|rse|onssa|cndp)\b/gi;
// Noms propres des titres anglais (mots entiers)
const NOMS_EN = ["Casablanca", "Morocco", "Dar Bouazza", "Fes", "Paris", "Munich", "London", "Dubai", "Qatar", "Senegal",
  "Abidjan", "Alger", "Carthage", "Coface", "Ecolabel", "Covid", "Lalla Salma", "Casa Mémoire", "Saudi Build", "Batimat", "Sencon"];
const ACRONYMES_EN = /\b(ceo|oea|ksa|sbie)\b/gi;

// « RÉAMÉNAGEMENT DU SITE » -> « Réaménagement du site » (les titres du site sont parfois tout en majuscules)
export function titre(s, langue = "fr") {
  s = s.replace(/\s+/g, " ").trim();
  const lettres = s.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (lettres && lettres === lettres.toUpperCase()) {
    s = s.toLowerCase();
    s = s.charAt(0).toUpperCase() + s.slice(1);
    s = s.replace(ACRONYMES, w => w.toUpperCase()).replace(/\bm\. /g, "M. ");
    for (const nom of NOMS) s = s.replace(new RegExp(nom.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), nom);
    if (langue === "en") {
      s = s.replace(ACRONYMES_EN, w => w.toUpperCase());
      for (const nom of NOMS_EN) s = s.replace(new RegExp(`\\b${nom.toLowerCase()}\\b`, "g"), nom);
    }
  }
  return s;
}

// Libellés des catégories et types, en français et en anglais
const LIBELLES = {
  certifications: ["Certifications", "Certifications"],
  evenements: ["Événements", "Events"],
  gouvernance: ["Gouvernance", "Governance"],
  finance: ["Finance", "Finance"],
  entreprise: ["Entreprise", "Company"],
  semestrielle: ["Communication semestrielle", "Half-year results"],
  assemblee: ["Assemblée générale", "General meeting"],
  trimestriels: ["Indicateurs trimestriels", "Quarterly indicators"],
  annuels: ["Résultats annuels", "Annual results"],
  capital: ["Capital et gouvernance", "Capital and governance"],
  autres: ["Autres communiqués", "Other releases"],
  annuel: ["Annuel", "Annual"],
  semestriel: ["Semestriel", "Half-year"]
};
const libelle = (cle, langue) => LIBELLES[cle][langue === "en" ? 1 : 0];

export function categorieActualite(t, langue = "fr") {
  const en = langue === "en";
  if (/certifi|iso|hqe|qse/i.test(t) || (en && /ecolabel|ecoloabel|\boea\b|@@@/i.test(t))) return libelle("certifications", langue);
  if (/forum|salon|foire|participation|journée|journee/i.test(t) || (en && /exhibition|\bfair\b|\bexpo\b|\bshow\b|\bevent\b| @ /i.test(t))) return libelle("evenements", langue);
  if (/nomination|pdg|conseil d.administration|gouvernance/i.test(t) || (en && /appointment|\bceo\b|board|governance/i.test(t))) return libelle("gouvernance", langue);
  if (/communication financi|ago|résultats|resultats|communiqué|communique/i.test(t) || (en && /financial|results|press release|stock exchange|capital/i.test(t))) return libelle("finance", langue);
  return libelle("entreprise", langue);
}

export function typeCommunique(t, langue = "fr") {
  const en = langue === "en";
  if (/semestriel|30[\/-]06/i.test(t) || (en && /half-year|june\s*30/i.test(t))) return libelle("semestrielle", langue);
  if (/\bag[om]\b|assembl/i.test(t) || (en && /general meeting/i.test(t))) return libelle("assemblee", langue);
  if (/trimestriel|\bT[1-4]\b/i.test(t) || (en && /quarterly|\bQ[1-4]\b/i.test(t))) return libelle("trimestriels", langue);
  if (/annuel|résultats|resultats|31[\/-]12/i.test(t) || (en && /annual|results|dec\.?\s*31/i.test(t))) return libelle("annuels", langue);
  if (/capital|conseil d.administration/i.test(t) || (en && /board/i.test(t))) return libelle("capital", langue);
  return libelle("autres", langue);
}

// /corporate/fr/actualites et /corporate/en/news
export function lireActualites(doc, langue = "fr") {
  return [...doc.querySelectorAll(".article_listing li")].map(li => {
    const a = li.querySelector(".row_title a");
    if (!a) return null;
    const t = titre(txt(a), langue);
    return {
      date: parseDate(txt(li.querySelector(".date"))),
      categorie: categorieActualite(t, langue),
      titre: t,
      extrait: txt(li.querySelector(".text p")) || null,
      image: imageOriginale(li.querySelector(".img img")?.getAttribute("src")),
      lien: abs(a.getAttribute("href"))
    };
  }).filter(Boolean);
}

// /corporate/fr/communiques-financiers et /corporate/fr/rapports (même mise en page, aussi en anglais)
function lireListeFinance(doc, langue) {
  return [...doc.querySelectorAll(".finance_listing li")].map(li => {
    const a = li.querySelector(".row_title a");
    const pdf = li.querySelector("a.telechargement, a[href$='.pdf']");
    if (!a || !pdf) return null;
    return {
      date: parseDate(txt(li.querySelector(".date"))),
      titre: titre(txt(a), langue),
      pdf: abs(pdf.getAttribute("href")),
      apercu: imageOriginale(li.querySelector(".img img")?.getAttribute("src")),
      lien: abs(a.getAttribute("href"))
    };
  }).filter(Boolean);
}

// /corporate/fr/communiques-financiers et /corporate/en/financial-releases
export function lireCommuniques(doc, langue = "fr") {
  return lireListeFinance(doc, langue).map(c => ({ ...c, type: typeCommunique(c.titre, langue) }));
}

// /corporate/fr/etats-financiers et /corporate/en/financial-statements : rapports financiers annuels et semestriels
export function lireEtatsFinanciers(doc, langue = "fr") {
  return lireListeFinance(doc, langue).map(r => ({
    ...r,
    type: libelle(/semestri|\b1S\d{4}|half/i.test(r.titre) ? "semestriel" : "annuel", langue),
    annee: Number((r.titre.match(/(20\d\d)/) || [])[1]) || null
  }));
}

// /corporate/fr/rapports et /corporate/en/reports
export function lireRapports(doc, langue = "fr") {
  return lireListeFinance(doc, langue)
    .map(r => ({ ...r, annee: Number((r.titre.match(/(?:rapport annuel|annual report)\s+(\d{4})/i) || [])[1]) }))
    .filter(r => r.annee);
}

// Page d'accueil (fr ou en) : cours de l'action et « COLORADO en chiffres »
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
