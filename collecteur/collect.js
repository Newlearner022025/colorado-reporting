// Collecteur de contenus : lit l'espace Corporate de colorado.ma et écrit data/contenus.json.
// Lancé automatiquement par GitHub Actions (.github/workflows/collecte.yml).
import { parseHTML } from "linkedom";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { BASE, lireAccueil, lireActualites, lireCommuniques, lireRapports } from "./parse.js";

const SORTIE = new URL("../data/contenus.json", import.meta.url);
const PAGES_ACTUALITES = 2; // 10 actualités par page sur le site

async function page(chemin) {
  const r = await fetch(BASE + chemin, { headers: { "User-Agent": "ColoradoReporting/1.0 (+application mobile Reporting)" } });
  if (!r.ok) throw new Error(`${chemin} : HTTP ${r.status}`);
  return parseHTML(await r.text()).document;
}

// Taille d'un PDF en Mo (sans le télécharger), ou null si le site ne la donne pas
async function tailleMo(url) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    const n = Number(r.headers.get("content-length"));
    return n ? Math.round(n / 104857.6) / 10 : null;
  } catch { return null; }
}

const unique = liste => [...new Map(liste.map(x => [x.lien || x.pdf, x])).values()];
const parDate = (a, b) => (b.date || "").localeCompare(a.date || "");

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

  const accueil = await page("/corporate/fr").then(lireAccueil).catch(e => { erreurs.push(`accueil : ${e.message}`); return {}; });
  await rubrique("action", async () => accueil.action);
  await rubrique("chiffres", async () => accueil.chiffres);

  await rubrique("actualites", async () => {
    const lots = [];
    for (let p = 0; p < PAGES_ACTUALITES; p++) lots.push(...lireActualites(await page(`/corporate/fr/actualites${p ? `?page=${p}` : ""}`)));
    return unique(lots).sort(parDate);
  });

  await rubrique("communiques", async () => {
    const liste = unique(lireCommuniques(await page("/corporate/fr/communiques-financiers"))).sort(parDate);
    for (const c of liste) c.taille = await tailleMo(c.pdf);
    return liste;
  });

  await rubrique("rapports", async () => {
    const liste = unique(lireRapports(await page("/corporate/fr/rapports"))).sort((a, b) => b.annee - a.annee);
    for (const r of liste) r.taille = await tailleMo(r.pdf);
    return liste;
  });

  // On ne réécrit le fichier (et donc on ne crée un commit) que si le contenu a changé
  const { maj: _, erreurs: __, ...ancienContenu } = ancien;
  if (JSON.stringify(ancienContenu) === JSON.stringify(resultats)) {
    console.log("Aucun changement sur le site.");
  } else {
    await mkdir(new URL("../data/", import.meta.url), { recursive: true });
    await writeFile(SORTIE, JSON.stringify({ maj: new Date().toISOString(), ...resultats, erreurs }, null, 2) + "\n");
    console.log("data/contenus.json mis à jour.");
  }

  console.log(`Action : ${resultats.action?.cours ?? "?"} MAD | actualités : ${resultats.actualites?.length ?? 0} | communiqués : ${resultats.communiques?.length ?? 0} | rapports : ${resultats.rapports?.length ?? 0}`);
  if (erreurs.length) {
    console.warn("Problèmes rencontrés :\n- " + erreurs.join("\n- "));
    // Si rien n'a pu être lu du tout, on signale l'échec dans GitHub Actions
    if (!Object.keys(resultats).length) process.exit(1);
  }
}

main();
