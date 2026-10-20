// Collecteur de contenus : lit l'espace Corporate de colorado.ma (en français et en anglais) et écrit data/contenus.json.
// Lancé automatiquement par GitHub Actions (.github/workflows/collecte.yml).
// Les rubriques anglaises sont écrites avec le suffixe « _en » (actualites_en, communiques_en…) ;
// si l'une d'elles manque, l'appli affiche la version française à la place.
import { parseHTML } from "linkedom";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { BASE, lireAccueil, lireActualites, lireCommuniques, lireEtatsFinanciers, lireRapports } from "./parse.js";

const SORTIE = new URL("../data/contenus.json", import.meta.url);
const PAGES_MAX = 20; // garde-fou : le site compte aujourd'hui 4 à 8 pages par rubrique

// Adresses des rubriques dans chaque langue
const CHEMINS = {
  fr: { accueil: "/corporate/fr", actualites: "/corporate/fr/actualites", communiques: "/corporate/fr/communiques-financiers",
    etatsFinanciers: "/corporate/fr/etats-financiers", rapports: "/corporate/fr/rapports" },
  en: { accueil: "/corporate/en", actualites: "/corporate/en/news", communiques: "/corporate/en/financial-releases",
    etatsFinanciers: "/corporate/en/financial-statements", rapports: "/corporate/en/reports" }
};

async function page(chemin) {
  const r = await fetch(BASE + chemin, { headers: { "User-Agent": "ColoradoReporting/1.0 (+application mobile Reporting)" } });
  if (!r.ok) throw new Error(`${chemin} : HTTP ${r.status}`);
  return parseHTML(await r.text()).document;
}

// Taille d'un PDF en Mo (sans le télécharger), ou null si le site ne la donne pas.
// Gardée en mémoire : beaucoup de PDF sont les mêmes en français et en anglais.
const tailles = new Map();
async function tailleMo(url) {
  if (tailles.has(url)) return tailles.get(url);
  let mo = null;
  try {
    const r = await fetch(url, { method: "HEAD" });
    const n = Number(r.headers.get("content-length"));
    mo = n ? Math.round(n / 104857.6) / 10 : null;
  } catch { /* taille inconnue */ }
  tailles.set(url, mo);
  return mo;
}

const unique = liste => [...new Map(liste.map(x => [x.lien || x.pdf, x])).values()];
const parDate = (a, b) => (b.date || "").localeCompare(a.date || "");

// Lit toutes les pages d'une rubrique (?page=1, ?page=2…) jusqu'à une page vide ou sans nouveauté
async function toutesLesPages(chemin, lire) {
  const vus = new Set(), tout = [];
  for (let p = 0; p < PAGES_MAX; p++) {
    const items = lire(await page(chemin + (p ? `?page=${p}` : "")));
    const nouveaux = items.filter(x => !vus.has(x.lien || x.pdf));
    if (!nouveaux.length) break;
    nouveaux.forEach(x => { vus.add(x.lien || x.pdf); tout.push(x); });
  }
  return tout;
}

async function main() {
  let ancien = {};
  try { ancien = JSON.parse(await readFile(SORTIE, "utf8")); } catch { /* premier passage */ }

  const resultats = {};
  const erreurs = [];
  // Chaque rubrique est lue séparément : si une page du site est en panne, on garde la version précédente.
  async function rubrique(nom, lire) {
    try {
      const v = await lire();
      const vide = Array.isArray(v) ? v.length === 0 : !v;
      if (vide) throw new Error("aucun élément trouvé");
      resultats[nom] = v;
    } catch (e) {
      erreurs.push(`${nom} : ${e.message}`);
      if (ancien[nom] !== undefined) resultats[nom] = ancien[nom];
    }
  }

  for (const langue of ["fr", "en"]) {
    const c = CHEMINS[langue];
    const s = langue === "fr" ? "" : "_en"; // suffixe des rubriques anglaises
    const lire = f => doc => f(doc, langue);

    const accueil = await page(c.accueil).then(lire(lireAccueil)).catch(e => { erreurs.push(`accueil${s} : ${e.message}`); return {}; });
    // Le cours de l'action est le même dans les deux langues : on le prend en français, ou en anglais à défaut
    if (langue === "fr") await rubrique("action", async () => accueil.action);
    else if (!resultats.action && accueil.action) resultats.action = accueil.action;
    await rubrique("chiffres" + s, async () => accueil.chiffres);

    await rubrique("actualites" + s, async () =>
      unique(await toutesLesPages(c.actualites, lire(lireActualites))).sort(parDate));

    await rubrique("communiques" + s, async () => {
      const liste = unique(await toutesLesPages(c.communiques, lire(lireCommuniques))).sort(parDate);
      for (const x of liste) x.taille = await tailleMo(x.pdf);
      return liste;
    });

    await rubrique("etatsFinanciers" + s, async () => {
      const liste = unique(await toutesLesPages(c.etatsFinanciers, lire(lireEtatsFinanciers))).sort(parDate);
      for (const r of liste) r.taille = await tailleMo(r.pdf);
      return liste;
    });

    await rubrique("rapports" + s, async () => {
      const liste = unique(lireRapports(await page(c.rapports), langue)).sort((a, b) => b.annee - a.annee);
      for (const r of liste) r.taille = await tailleMo(r.pdf);
      return liste;
    });
  }

  // Rubriques sans version anglaise : l'appli affichera la version française
  const sansAnglais = ["chiffres", "actualites", "communiques", "etatsFinanciers", "rapports"].filter(n => !resultats[n + "_en"]);
  if (sansAnglais.length) erreurs.push(`pas de version anglaise (français affiché à la place) : ${sansAnglais.join(", ")}`);

  // On ne réécrit le fichier (et donc on ne crée un commit) que si le contenu a changé
  const { maj: _, erreurs: __, ...ancienContenu } = ancien;
  if (JSON.stringify(ancienContenu) === JSON.stringify(resultats)) {
    console.log("Aucun changement sur le site.");
  } else {
    await mkdir(new URL("../data/", import.meta.url), { recursive: true });
    await writeFile(SORTIE, JSON.stringify({ maj: new Date().toISOString(), ...resultats, erreurs }, null, 2) + "\n");
    console.log("data/contenus.json mis à jour.");
  }

  for (const s of ["", "_en"]) {
    console.log(`${s ? "Anglais " : "Français"} : action ${resultats.action?.cours ?? "?"} MAD | actualités : ${resultats["actualites" + s]?.length ?? 0} | communiqués : ${resultats["communiques" + s]?.length ?? 0} | rapports : ${resultats["rapports" + s]?.length ?? 0} | rapports financiers : ${resultats["etatsFinanciers" + s]?.length ?? 0}`);
  }
  if (erreurs.length) {
    console.warn("Problèmes rencontrés :\n- " + erreurs.join("\n- "));
    // Si rien n'a pu être lu du tout, on signale l'échec dans GitHub Actions
    if (!Object.keys(resultats).length) process.exit(1);
  }
}

main();
