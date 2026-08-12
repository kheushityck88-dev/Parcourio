#!/usr/bin/env node
/* =====================================================================
   Générateur de pages SEO statiques — Parcourio
   ---------------------------------------------------------------------
   Génère de vraies pages HTML statiques (pas de JS côté serveur, pas de
   framework) pour améliorer l'indexation Google :
     /ecoles/<ville>.html   — une page par ville ayant au moins une école
     /metiers/<id>.html     — une page par profil/métier du test d'orientation
     /ecoles/index.html     — annuaire des pages villes (maillage interne)
     /metiers/index.html    — annuaire des pages métiers (maillage interne)
   Met aussi à jour sitemap.xml avec toutes les nouvelles URLs.

   À relancer après toute modification de ecoles.json ou
   orientation-data.js :
     node tools/generer-pages-seo.js

   Ce script ne modifie JAMAIS index.html, script.js, ou les fichiers
   de données sources — il ne fait que LIRE ces fichiers et ÉCRIRE dans
   /ecoles/ et /metiers/.
   ===================================================================== */

const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..');
const SITE_URL = 'https://www.parcourio.com';
const DATE_GENERATION = new Date().toISOString().slice(0, 10);

function slugifier(texte) {
  return String(texte)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function echapperHTML(texte) {
  return String(texte == null ? '' : texte)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- Chargement des données sources ---------- */

const ecoles = JSON.parse(fs.readFileSync(path.join(RACINE, 'assets/data/ecoles.json'), 'utf8'));

function chargerRegistreJS(fichier, nomVariable) {
  const src = fs.readFileSync(path.join(RACINE, fichier), 'utf8');
  const re = new RegExp('const ' + nomVariable + ' = (\\{[\\s\\S]*?\\n  \\};)');
  const m = src.match(re);
  if (!m) throw new Error('Registre ' + nomVariable + ' introuvable dans ' + fichier);
  // eslint-disable-next-line no-eval
  return eval('(' + m[1].slice(0, -1) + ')');
}

const PROFILS = chargerRegistreJS('assets/data/orientation-data.js', 'PROFILS');
const METIERS = chargerRegistreJS('assets/data/orientation-data.js', 'METIERS');

const DOMAINE_LABELS = { technologie: 'Technologie', creatif: 'Créatif & design', social: 'Social & santé', gestion: 'Gestion & commerce' };

/* ---------- Gabarit HTML commun (header/footer identiques au site) ---------- */

function gabarit({ titre, description, urlCanonique, contenu, breadcrumbJSON, breadcrumbHTML }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${echapperHTML(titre)}</title>
<meta name="description" content="${echapperHTML(description)}" />
<link rel="canonical" href="${urlCanonique}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${echapperHTML(titre)}" />
<meta property="og:description" content="${echapperHTML(description)}" />
<meta property="og:url" content="${urlCanonique}" />
<meta property="og:image" content="${SITE_URL}/assets/img/logo-full.png" />
<link rel="icon" href="../favicon.ico" />
<link rel="manifest" href="../manifest.json" />
<meta name="theme-color" content="#030B1E" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../style.css" />
<style>
  /* Ces pages n'embarquent pas script.js (volontairement, pour rester
     légères) : pas de bouton menu mobile fonctionnel possible, donc on
     garde le menu toujours visible en ligne plutôt que caché par défaut. */
  @media (max-width: 900px) {
    .header nav { position: static; transform: none; flex-direction: row; flex-wrap: wrap; gap: 4px 16px; padding: 10px 0 0; border: none; background: transparent; }
    .header nav a { margin: 0; }
  }
</style>
<script type="application/ld+json">${JSON.stringify(breadcrumbJSON)}</script>
</head>
<body>

<a class="skip-link" href="#main-content">Aller au contenu principal</a>

<header class="header">
  <a class="logo-lockup" href="../index.html" aria-label="Retour à l'accueil Parcourio">
    <span class="logo-badge"><img src="../assets/img/logo-icon.png" alt="Parcourio" class="logo-mark" width="242" height="295" /></span>
    <span class="logo-text">
      <span class="logo-name">PARCOURIO<span class="beta-badge">Bêta</span></span>
      <span class="logo-slogan">Trouvez la bonne école, construisez votre avenir</span>
    </span>
  </a>
  <nav>
    <a href="../index.html#concept">Concept</a>
    <a href="../index.html#test">Orientation</a>
    <a href="../index.html#ecoles">Écoles</a>
    <a href="../index.html#concours">Concours</a>
    <a href="../index.html#contact">Contact</a>
  </nav>
</header>

<main id="main-content">
<section class="section seo-page">
  <div class="waypoint-body seo-page-body">
${breadcrumbHTML}
${contenu}
  </div>
</section>
</main>

<footer class="footer">
  <span class="logo-badge footer-badge"><img src="../assets/img/logo-icon.png" alt="Parcourio" class="footer-mark" width="242" height="295" /></span>
  <p>© 2026 Parcourio — Plateforme d'orientation et de formation au Sénégal</p>
  <p class="footer-links"><a href="../mentions-legales.html">Mentions légales & confidentialité</a></p>
</footer>

</body>
</html>
`;
}

/* ---------- Pages villes ---------- */

const dossierEcoles = path.join(RACINE, 'ecoles');
fs.mkdirSync(dossierEcoles, { recursive: true });

const villesUniques = [...new Set(ecoles.map(e => e.ville).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
const pagesVilles = [];

villesUniques.forEach((ville) => {
  const ecolesVille = ecoles.filter(e => e.ville === ville);
  const slug = slugifier(ville);
  const region = (ecolesVille.find(e => e.region) || {}).region;

  const parDomaine = {};
  ecolesVille.forEach((e) => {
    const d = e.domaine || 'autre';
    (parDomaine[d] = parDomaine[d] || []).push(e);
  });

  const blocsDomaines = Object.keys(parDomaine).sort().map((domaine) => {
    const liste = parDomaine[domaine];
    const items = liste.map(e => `<li>${echapperHTML(e.nom)}${e.type ? ` <span class="note">(${e.type})</span>` : ''}</li>`).join('\n        ');
    return `      <h3>${DOMAINE_LABELS[domaine] || domaine}</h3>
      <ul class="seo-page-liste">
        ${items}
      </ul>`;
  }).join('\n\n');

  const contenu = `    <p class="eyebrow">Annuaire par ville</p>
    <h1>Écoles & formations à ${echapperHTML(ville)}</h1>
    <p class="section-intro">${ecolesVille.length} établissement${ecolesVille.length > 1 ? 's' : ''} recensé${ecolesVille.length > 1 ? 's' : ''} à ${echapperHTML(ville)}${region && region !== ville ? ` (région de ${echapperHTML(region)})` : ''} sur Parcourio, la plateforme d'orientation et de formation au Sénégal.</p>

${blocsDomaines}

    <p class="seo-page-cta"><a class="btn-primary" href="../index.html?ville=${encodeURIComponent(ville)}#ecoles">Voir toutes ces écoles avec filtres, avis et fiches détaillées →</a></p>
    <p class="seo-page-cta"><a href="../index.html#test">Pas encore fixé·e ? Fais le test d'orientation gratuit →</a></p>`;

  const urlCanonique = `${SITE_URL}/ecoles/${slug}.html`;
  const breadcrumbJSON = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Accueil", "item": `${SITE_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Écoles", "item": `${SITE_URL}/ecoles/index.html` },
      { "@type": "ListItem", "position": 3, "name": ville, "item": urlCanonique }
    ]
  };

  const html = gabarit({
    titre: `Écoles & formations à ${ville} — Parcourio`,
    description: `${ecolesVille.length} établissements d'enseignement supérieur et de formation à ${ville}, Sénégal : filières, niveaux d'admission, avis étudiants.`,
    urlCanonique,
    contenu,
    breadcrumbJSON,
    breadcrumbHTML: `    <nav class="seo-breadcrumb" aria-label="Fil d'Ariane">
      <a href="../index.html">← Accueil</a><span class="separateur">/</span><a href="index.html">Écoles par ville</a><span class="separateur">/</span><span>${echapperHTML(ville)}</span>
    </nav>`
  });

  fs.writeFileSync(path.join(dossierEcoles, `${slug}.html`), html, 'utf8');
  pagesVilles.push({ ville, slug, nb: ecolesVille.length });
});

// Index des pages villes
const listeVillesHTML = pagesVilles.map(p => `      <li><a href="${p.slug}.html">${echapperHTML(p.ville)}</a> <span class="note">(${p.nb} école${p.nb > 1 ? 's' : ''})</span></li>`).join('\n');
const contenuIndexEcoles = `    <p class="eyebrow">Annuaire par ville</p>
    <h1>Écoles & formations par ville au Sénégal</h1>
    <p class="section-intro">Parcourio recense des établissements dans ${villesUniques.length} villes du Sénégal. Choisis une ville pour voir les écoles qui s'y trouvent.</p>
    <ul class="seo-page-liste">
${listeVillesHTML}
    </ul>`;

fs.writeFileSync(path.join(dossierEcoles, 'index.html'), gabarit({
  titre: 'Écoles par ville au Sénégal — Parcourio',
  description: `Trouve les écoles et centres de formation par ville, dans les ${villesUniques.length} villes recensées par Parcourio au Sénégal.`,
  urlCanonique: `${SITE_URL}/ecoles/index.html`,
  contenu: contenuIndexEcoles,
  breadcrumbJSON: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Accueil", "item": `${SITE_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Écoles par ville", "item": `${SITE_URL}/ecoles/index.html` }
    ]
  },
  breadcrumbHTML: `    <nav class="seo-breadcrumb" aria-label="Fil d'Ariane">
      <a href="../index.html">← Accueil</a><span class="separateur">/</span><span>Écoles par ville</span>
    </nav>`
}), 'utf8');

/* ---------- Pages métiers/profils ---------- */

const dossierMetiers = path.join(RACINE, 'metiers');
fs.mkdirSync(dossierMetiers, { recursive: true });

const tousLesProfils = [
  ...Object.values(PROFILS).map(p => ({ ...p, parcours: 'apres_diplome' })),
  ...Object.values(METIERS).map(p => ({ ...p, parcours: 'apprendre_metier' }))
];

tousLesProfils.forEach((p) => {
  const slug = slugifier(p.id);
  const metiersListe = (p.metiers || []).map(m => `<li>${echapperHTML(m)}</li>`).join('\n        ');

  const contenu = `    <p class="eyebrow">${p.parcours === 'apres_diplome' ? 'Après un diplôme' : 'Apprendre un métier'}</p>
    <h1>${echapperHTML(p.nom)} : métiers, débouchés et écoles au Sénégal</h1>
    <p class="section-intro">${echapperHTML(p.description || '')}</p>

    ${p.metiers && p.metiers.length ? `<h2>Exemples de métiers</h2>
    <ul class="seo-page-liste">
        ${metiersListe}
    </ul>` : ''}

    ${p.marche ? `<h2>Marché de l'emploi au Sénégal</h2>
    <p>${echapperHTML(p.marche)}</p>` : ''}

    ${p.debouches ? `<h2>Débouchés & perspectives d'évolution</h2>
    <p>${echapperHTML(p.debouches)}</p>` : ''}

    <p class="seo-page-cta"><a class="btn-primary" href="../index.html#test">Fais le test d'orientation gratuit pour savoir si ce profil te correspond →</a></p>
    <p class="seo-page-cta"><a href="../index.html#ecoles">Voir les écoles qui forment à ce domaine →</a></p>`;

  const urlCanonique = `${SITE_URL}/metiers/${slug}.html`;

  const html = gabarit({
    titre: `${p.nom} : métiers, débouchés et écoles — Parcourio`,
    description: `${(p.description || '').slice(0, 140)}`,
    urlCanonique,
    contenu,
    breadcrumbJSON: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Accueil", "item": `${SITE_URL}/` },
        { "@type": "ListItem", "position": 2, "name": "Métiers", "item": `${SITE_URL}/metiers/index.html` },
        { "@type": "ListItem", "position": 3, "name": p.nom, "item": urlCanonique }
      ]
    },
    breadcrumbHTML: `    <nav class="seo-breadcrumb" aria-label="Fil d'Ariane">
      <a href="../index.html">← Accueil</a><span class="separateur">/</span><a href="index.html">Métiers</a><span class="separateur">/</span><span>${echapperHTML(p.nom)}</span>
    </nav>`
  });

  fs.writeFileSync(path.join(dossierMetiers, `${slug}.html`), html, 'utf8');
});

const listeMetiersHTML = tousLesProfils.map(p => `      <li><a href="${slugifier(p.id)}.html">${echapperHTML(p.nom)}</a></li>`).join('\n');
fs.writeFileSync(path.join(dossierMetiers, 'index.html'), gabarit({
  titre: 'Métiers & profils d\'orientation — Parcourio',
  description: `${tousLesProfils.length} profils et familles de métiers détaillés : débouchés, marché de l'emploi, écoles recommandées.`,
  urlCanonique: `${SITE_URL}/metiers/index.html`,
  contenu: `    <p class="eyebrow">Annuaire par métier</p>
    <h1>Métiers & profils d'orientation</h1>
    <p class="section-intro">Découvre les ${tousLesProfils.length} grandes familles de métiers couvertes par le test d'orientation Parcourio.</p>
    <ul class="seo-page-liste">
${listeMetiersHTML}
    </ul>`,
  breadcrumbJSON: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Accueil", "item": `${SITE_URL}/` },
      { "@type": "ListItem", "position": 2, "name": "Métiers", "item": `${SITE_URL}/metiers/index.html` }
    ]
  },
  breadcrumbHTML: `    <nav class="seo-breadcrumb" aria-label="Fil d'Ariane">
      <a href="../index.html">← Accueil</a><span class="separateur">/</span><span>Métiers</span>
    </nav>`
}), 'utf8');

/* ---------- Mise à jour du sitemap.xml ---------- */

const urlsExistantes = [
  { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' },
  { loc: `${SITE_URL}/#concept`, changefreq: 'monthly', priority: '0.6' },
  { loc: `${SITE_URL}/#test`, changefreq: 'monthly', priority: '0.9' },
  { loc: `${SITE_URL}/#ecoles`, changefreq: 'weekly', priority: '0.8' },
  { loc: `${SITE_URL}/#concours`, changefreq: 'monthly', priority: '0.7' },
  { loc: `${SITE_URL}/#contact`, changefreq: 'yearly', priority: '0.3' },
  { loc: `${SITE_URL}/mentions-legales.html`, changefreq: 'yearly', priority: '0.2' },
  { loc: `${SITE_URL}/ecoles/index.html`, changefreq: 'weekly', priority: '0.7' },
  { loc: `${SITE_URL}/metiers/index.html`, changefreq: 'monthly', priority: '0.7' }
];

pagesVilles.forEach(p => urlsExistantes.push({ loc: `${SITE_URL}/ecoles/${p.slug}.html`, changefreq: 'weekly', priority: '0.6' }));
tousLesProfils.forEach(p => urlsExistantes.push({ loc: `${SITE_URL}/metiers/${slugifier(p.id)}.html`, changefreq: 'monthly', priority: '0.6' }));

const sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsExistantes.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${DATE_GENERATION}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(RACINE, 'sitemap.xml'), sitemapXML, 'utf8');

console.log(`Généré : ${pagesVilles.length} pages villes, ${tousLesProfils.length} pages métiers, sitemap.xml (${urlsExistantes.length} URLs).`);
