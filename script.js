/* ---------- Menu mobile ---------- */
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.header nav');
navToggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
}));

/* ---------- Révélation des cartes au scroll ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      const siblings = Array.from(entry.target.parentElement.children);
      const index = siblings.indexOf(entry.target);
      setTimeout(() => entry.target.classList.add('visible'), index * 120);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

function observeCards(root = document) {
  root.querySelectorAll('.card:not(.visible)').forEach(card => revealObserver.observe(card));
}
observeCards();

/* ---------- Parcours d'orientation dynamique ----------
   Le contenu (assets/data/orientation-data.js) et le moteur de rendu/
   scoring (assets/js/orientation-engine.js) sont totalement séparés de
   ce fichier. Deux parcours possibles :
   - "apres_diplome" : diplôme (BAC/BTS/DUT/Licence/Master/Doctorat/
     Autre) puis objectif, chacun changeant le questionnaire généré par
     construireQuestionnaireApresDiplome().
   - "apprendre_metier" : questionnaire unique et compact, généré par
     construireQuestionnaireMetier(), qui recommande des métiers et des
     centres de formation professionnelle plutôt que des filières
     longues. */
const { PROFILS, METIERS, PARCOURS, DIPLOMES, OBJECTIFS_PAR_DIPLOME, BANQUE_PROJET_APRES,
        construireQuestionnaireApresDiplome, construireQuestionnaireMetier } = window.OrientationData;
const Moteur = window.OrientationEngine;

const parcoursPicker = document.getElementById('parcoursPicker');
const etapeDiplome = document.getElementById('etapeDiplome');
const etapeMetierIntro = document.getElementById('etapeMetierIntro');
const diplomeChipsEl = document.getElementById('diplomeChips');
const objectifDiplomeWrap = document.getElementById('objectifDiplomeWrap');
const objectifChipsEl = document.getElementById('objectifChips');
const formDynamique = document.getElementById('formDynamique');

let etatParcours = { parcours: null, diplome: null, objectif: null, questions: null };

/* --- Rendu des deux grandes cartes de parcours --- */
parcoursPicker.innerHTML = PARCOURS.map(p => `
  <button type="button" class="parcours-card" data-parcours="${p.id}">
    <span class="parcours-icon">${p.icone}</span>
    <h3>${p.titre}</h3>
    <p>${p.description}</p>
  </button>
`).join('');

function masquerToutesLesEtapes() {
  etapeDiplome.hidden = true;
  etapeMetierIntro.hidden = true;
  const barreProgression = formDynamique.previousElementSibling;
  if (barreProgression && barreProgression.classList.contains('quiz-progress')) {
    barreProgression.remove();
  }
  formDynamique.hidden = true;
  formDynamique.innerHTML = '';
  objectifDiplomeWrap.hidden = true;
  objectifChipsEl.innerHTML = '';
}

function revenirAuChoixParcours() {
  etatParcours = { parcours: null, diplome: null, objectif: null, questions: null };
  masquerToutesLesEtapes();
  parcoursPicker.hidden = false;
  document.querySelectorAll('.parcours-card').forEach(c => c.classList.remove('is-active'));
}

function construireEtLancerFormulaire() {
  let questions, boutonLabel, formId;
  if (etatParcours.parcours === 'apres_diplome') {
    questions = construireQuestionnaireApresDiplome(etatParcours.diplome, etatParcours.objectif);
    boutonLabel = 'Voir mon orientation';
    formId = 'apres_diplome';
  } else {
    questions = construireQuestionnaireMetier();
    boutonLabel = 'Voir mes recommandations';
    formId = 'apprendre_metier';
  }
  etatParcours.questions = questions;
  formDynamique.dataset.formId = formId;
  Moteur.rendreFormulaire(formDynamique, questions, { formId, boutonLabel, onRetour: revenirAuChoixParcours });
  formDynamique.hidden = false;
  const barreProgression = formDynamique.previousElementSibling;
  const cibleScroll = (barreProgression && barreProgression.classList.contains('quiz-progress'))
    ? barreProgression
    : formDynamique;
  cibleScroll.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function choisirParcours(parcoursId) {
  etatParcours = { parcours: parcoursId, diplome: null, objectif: null, questions: null };
  masquerToutesLesEtapes();
  parcoursPicker.hidden = true;
  document.querySelectorAll('.parcours-card').forEach(c => c.classList.toggle('is-active', c.dataset.parcours === parcoursId));

  if (parcoursId === 'apres_diplome') {
    diplomeChipsEl.innerHTML = DIPLOMES.map(d => `<button type="button" class="diplome-chip" data-diplome="${d.value}">${d.label}</button>`).join('');
    etapeDiplome.hidden = false;
    etapeDiplome.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    etapeMetierIntro.hidden = false;
    construireEtLancerFormulaire();
  }
}

parcoursPicker.addEventListener('click', (e) => {
  const carte = e.target.closest('.parcours-card');
  if (carte) choisirParcours(carte.dataset.parcours);
});

document.getElementById('retourParcours1').addEventListener('click', revenirAuChoixParcours);
document.getElementById('retourParcours2').addEventListener('click', revenirAuChoixParcours);

diplomeChipsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.diplome-chip');
  if (!chip) return;
  etatParcours.diplome = chip.dataset.diplome;
  etatParcours.objectif = null;
  document.querySelectorAll('.diplome-chip').forEach(c => c.classList.toggle('is-active', c === chip));

  const objectifs = OBJECTIFS_PAR_DIPLOME[etatParcours.diplome] || [];
  objectifChipsEl.innerHTML = objectifs.map(o => `<button type="button" class="objectif-chip" data-objectif="${o.value}">${o.label}</button>`).join('');
  objectifDiplomeWrap.hidden = false;
  objectifDiplomeWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

objectifChipsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.objectif-chip');
  if (!chip) return;
  etatParcours.objectif = chip.dataset.objectif;
  document.querySelectorAll('.objectif-chip').forEach(c => c.classList.toggle('is-active', c === chip));
  construireEtLancerFormulaire();
});

/* Boutons du hero : présélectionnent un parcours et font défiler jusqu'à
   la section, sans attendre un clic supplémentaire sur la carte. */
document.querySelectorAll('[data-preselect-parcours]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('test').scrollIntoView({ behavior: 'smooth', block: 'start' });
    choisirParcours(a.dataset.preselectParcours);
  });
});

/* ---------- Base d'écoles sénégalaises ----------
   Les écoles sont chargées depuis assets/data/ecoles.json (une école = une ligne).
   Pour ajouter une école : ouvrir ce fichier JSON et ajouter une entrée
   { "ville": "...", "domaine": "technologie|gestion|social|creatif", "nom": "..." }
   Aucune autre modification du code n'est nécessaire. */
const rawEcolesPromise = (window.ECOLES_DATA && window.ECOLES_DATA.length)
  // Chemin principal : les données sont déjà en mémoire grâce à
  // assets/data/ecoles-data.js (chargé en <script> classique dans index.html).
  // Ça fonctionne même en ouvrant le fichier en double-clic (file://), car il
  // n'y a plus de requête réseau/fetch impliquée.
  ? Promise.resolve(window.ECOLES_DATA)
  // Filet de sécurité : si jamais ecoles-data.js n'est pas chargé, on retente
  // via fetch (fonctionne seulement derrière un vrai serveur http/https).
  : fetch('assets/data/ecoles.json')
      .then(r => {
        if (!r.ok) throw new Error('Réponse HTTP ' + r.status);
        return r.json();
      })
      .catch(err => {
        console.error(
          "Impossible de charger la base d'écoles. Vérifie que assets/data/ecoles-data.js " +
          "est bien présent et chargé avant script.js dans index.html.",
          err
        );
        return [];
      });

/* --- Résultats du parcours "Je souhaite m'orienter après un diplôme" ---
   Réutilise le registre PROFILS (les 4 grands domaines x 2 filières)
   déjà connecté à assets/data/ecoles.json. Le domaine actuel choisi par
   les diplômés BTS/Licence/Master/Doctorat/Autre (question
   "domaine_filiere_actuelle") reçoit un bonus de score supplémentaire
   quand leur objectif est de rester ou se spécialiser dans ce domaine
   (voir BANQUE_PROJET_APRES), pour que "rester dans mon domaine" ait un
   vrai poids dans le résultat final. */
function afficherResultatsApresDiplome(ecoles) {
  const { reponses, contexte } = Moteur.collecterReponses(formDynamique, etatParcours.questions, formDynamique.dataset.formId);
  const { scores, contributions, pourcentages } = Moteur.calculerScores(etatParcours.questions, reponses, PROFILS);

  // Bonus "je veux rester/me spécialiser dans mon domaine actuel"
  const domaineActuel = reponses.domaine_filiere_actuelle;
  const objectifInfo = etatParcours.objectif ? BANQUE_PROJET_APRES[etatParcours.objectif] : null;
  if (domaineActuel && domaineActuel !== 'autre_domaine' && objectifInfo && objectifInfo.biaisMemeDomaine) {
    Object.values(PROFILS).filter(p => p.macro === domaineActuel).forEach(p => {
      pourcentages[p.id] = Math.max(0, Math.min(100, pourcentages[p.id] + objectifInfo.biaisMemeDomaine * 4));
    });
  }

  const classement = Moteur.classerProfils(pourcentages);
  const principal = classement[0];
  const secondaire = classement[1] && classement[1].pct >= 40 ? classement[1] : null;

  const profilPrincipal = PROFILS[principal.id];
  const profilSecondaire = secondaire ? PROFILS[secondaire.id] : null;

  const ville = contexte.ville || '';
  const explication = Moteur.genererExplication(principal.id, contributions, 4);

  // Le conseil est indexé par les anciennes clés Collège/Lycée/Bac/Études
  // supérieures : un diplôme autre que "bac" correspond toujours à
  // "Études supérieures" (déjà au-delà du bac).
  const niveauConseil = etatParcours.diplome === 'bac' ? 'Bac' : 'Études supérieures';
  let conseil = profilPrincipal.conseil[niveauConseil] || profilPrincipal.conseil['Bac'];

  const objectifLabel = objectifInfo ? objectifInfo.label : '';
  if (objectifLabel) conseil += ` Objectif choisi : "${objectifLabel.toLowerCase()}".`;
  if (contexte.filiere_actuelle) conseil += ` Filière actuelle : ${contexte.filiere_actuelle}.`;

  let parcoursTexte = profilPrincipal.description;
  if (profilSecondaire) {
    parcoursTexte += ` Tu montres aussi une vraie affinité pour le profil ${profilSecondaire.nom} : garde cette double casquette en tête au moment de choisir tes options ou une spécialisation complémentaire.`;
  }

  const { ecoles: ecolesRecommandees, fallbackUtilise } = Moteur.selectionnerEcoles(ecoles, profilPrincipal, contexte, 4);

  const diplomeLabel = (DIPLOMES.find(d => d.value === etatParcours.diplome) || {}).label || '';
  const enteteExtra = diplomeLabel ? `<p><strong>Diplôme actuel :</strong> ${diplomeLabel}</p>` : '';

  afficherCarteResultat({
    parcoursClasse: `result-${profilPrincipal.macro}`,
    icone: profilPrincipal.icone,
    couleur: profilPrincipal.couleur,
    titre: profilPrincipal.nom,
    correspondance: `${principal.pct}% aligné avec ce profil${profilSecondaire ? `, ${secondaire.pct}% avec ${profilSecondaire.nom}` : ''}`,
    enteteExtra,
    ville,
    description: parcoursTexte,
    conseil,
    metiers: profilPrincipal.metiers,
    explication,
    ecolesRecommandees,
    fallbackUtilise,
    titreEcoles: `Écoles recommandées${ville ? ` à ${ville}` : ''}`,
    radar: { registre: PROFILS, pourcentages, couleur: profilPrincipal.couleur }
  });
}

/* --- Résultats du parcours "Je souhaite apprendre un métier" ---
   Même mécanique de scoring générique (Moteur.calculerScores accepte
   n'importe quel registre de profils), mais avec le registre METIERS et
   la sélection d'écoles orientée insertion rapide/accessibilité. */
function afficherResultatsMetier(ecoles) {
  const questions = etatParcours.questions;
  const { reponses, contexte } = Moteur.collecterReponses(formDynamique, questions, formDynamique.dataset.formId);
  const { contributions, pourcentages } = Moteur.calculerScores(questions, reponses, METIERS);
  const classement = Moteur.classerProfils(pourcentages);

  const principal = classement[0];
  const metierPrincipal = METIERS[principal.id];
  const ville = contexte.ville || '';
  const explication = Moteur.genererExplication(principal.id, contributions, 4);

  let conseil = metierPrincipal.conseil;
  const objectifLabels = {
    emploi_rapide: "trouver un emploi salarié rapidement",
    independant: "créer ta propre activité",
    certification: "obtenir une certification reconnue"
  };
  if (contexte.objectif_pro_metier && objectifLabels[contexte.objectif_pro_metier]) {
    conseil += ` Ton objectif — ${objectifLabels[contexte.objectif_pro_metier]} — est tout à fait accessible avec ce métier au Sénégal.`;
  }
  if (contexte.experience_metier) {
    conseil += ` Expérience mentionnée : ${contexte.experience_metier}.`;
  }

  const { ecoles: ecolesRecommandees, fallbackUtilise } = Moteur.selectionnerEcolesMetier(ecoles, metierPrincipal, contexte, 4);

  afficherCarteResultat({
    parcoursClasse: `result-${metierPrincipal.macro}`,
    icone: metierPrincipal.icone,
    couleur: metierPrincipal.couleur,
    titre: metierPrincipal.nom,
    correspondance: `${principal.pct}% aligné avec ce métier`,
    enteteExtra: '',
    ville,
    description: metierPrincipal.description,
    conseil,
    metiers: metierPrincipal.metiers,
    explication,
    ecolesRecommandees,
    fallbackUtilise,
    titreEcoles: `Centres de formation recommandés${ville ? ` à ${ville}` : ''}`,
    radar: null
  });
}

/* --- Rendu commun de la carte de résultat (partagé par les deux parcours) --- */
function afficherCarteResultat(d) {
  let ecolesHTML;
  if (d.ecolesRecommandees.length > 0) {
    ecolesHTML = '<div class="ecoles-reco-liste">' + d.ecolesRecommandees.map(e => `
      <div class="ecole-reco-item" data-id="${e.id || ''}">
        <div class="ecole-reco-entete">
          <span class="ecole-reco-nom">${e.nom}${e.ville ? ` <span class="note">(${e.ville})</span>` : ''}</span>
          <span class="ecole-reco-score">${e.compatibilite}% compatible</span>
        </div>
        <div class="ecole-reco-barre"><div class="ecole-reco-barre-remplie" style="width:${e.compatibilite}%"></div></div>
        ${e.raisonsCompatibilite && e.raisonsCompatibilite.length ? `<ul class="ecole-reco-raisons">${e.raisonsCompatibilite.map(r => `<li>✓ ${r}</li>`).join('')}</ul>` : ''}
        ${e.reconnuEtat === true ? `<span class="reconnu-badge" title="Établissement reconnu par l'État du Sénégal">✔️ Reconnu par l'État</span>` : ''}
        ${e.id ? `<button type="button" class="ecole-reco-lien">Voir les filières et infos complètes →</button>` : ''}
      </div>
    `).join('') + '</div>';
    if (d.fallbackUtilise) {
      ecolesHTML = `<p class="note">Aucun établissement encore référencé près de ${d.ville || 'ta ville'} pour ce profil : voici des options nationales de référence.</p>` + ecolesHTML;
    }
  } else {
    ecolesHTML = '<p class="note">Base en cours d\'enrichissement — reviens bientôt pour ce profil.</p>';
  }

  const metiersHTML = d.metiers && d.metiers.length
    ? `<h4 class="ecole-modal-subtitle">Exemples de métiers</h4><p>${d.metiers.join(' · ')}</p>`
    : '';
  const explicationHTML = d.explication.length
    ? `<h4 class="ecole-modal-subtitle">Pourquoi cette recommandation ?</h4><ul>${d.explication.map(e => `<li>${e}</li>`).join('')}</ul>`
    : '';

  const resultSection = document.querySelector('.result-section') || document.createElement('section');
  resultSection.className = `section result-section waypoint destination ${d.parcoursClasse}`;
  resultSection.innerHTML = `
    <div class="waypoint-marker">
      <span class="waypoint-num">★</span>
      <span class="waypoint-line short"></span>
    </div>
    <div class="waypoint-body">
      <p class="eyebrow">Arrivée</p>
      <h2>Ton orientation personnalisée</h2>
      <div class="cards">
        <div class="card result-profile-card" style="--profile-color:${d.couleur}; border-color:${d.couleur}66;">
          <span class="result-profile-icon">${d.icone}</span>
          <h3>${d.titre}</h3>
          <p><strong>Correspondance :</strong> ${d.correspondance}</p>
          ${d.enteteExtra}
          ${d.ville ? `<p><strong>Ville :</strong> ${d.ville}</p>` : ''}
          <p>${d.description}</p>
          <p><strong>Pourquoi c'est la bonne décision :</strong> ${d.conseil}</p>
          ${metiersHTML}
          ${explicationHTML}
        </div>
        <div class="card">
          <h3>${d.titreEcoles}</h3>
          ${ecolesHTML}
        </div>
      </div>
      ${d.radar ? '<canvas id="profilRadar"></canvas>' : ''}
      <div class="result-actions">
        <button type="button" class="btn-secondary" id="refaireLeTest">↺ Refaire le test</button>
      </div>
    </div>
  `;

  if (!document.body.contains(resultSection)) {
    document.body.insertBefore(resultSection, document.querySelector('.footer'));
  }

  resultSection.querySelectorAll('.ecole-reco-item').forEach(item => {
    const ecole = d.ecolesRecommandees.find(r => r.id === item.dataset.id);
    if (!ecole) return;
    const lien = item.querySelector('.ecole-reco-lien');
    if (lien) lien.addEventListener('click', () => ouvrirModaleEcole(ecole));
  });

  const boutonRefaire = resultSection.querySelector('#refaireLeTest');
  if (boutonRefaire) {
    boutonRefaire.addEventListener('click', () => {
      resultSection.remove();
      if (window._parcourioChart) {
        window._parcourioChart.destroy();
        window._parcourioChart = null;
      }
      revenirAuChoixParcours();
      document.getElementById('test').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  const cards = resultSection.querySelectorAll('.card');
  cards.forEach(card => card.classList.remove('visible'));
  observeCards(resultSection);

  resultSection.scrollIntoView({ behavior: 'smooth' });

  if (d.radar && window.Chart) {
    const macros = ["technologie", "creatif", "social", "gestion"];
    const macroScores = {};
    macros.forEach(m => {
      const profilsDuMacro = Object.values(d.radar.registre).filter(p => p.macro === m).map(p => d.radar.pourcentages[p.id]);
      macroScores[m] = profilsDuMacro.length ? Math.round(profilsDuMacro.reduce((a, b) => a + b, 0) / profilsDuMacro.length) : 0;
    });
    const ctx = document.getElementById('profilRadar').getContext('2d');
    if (window._parcourioChart) window._parcourioChart.destroy();
    window._parcourioChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ["Technologie", "Créatif", "Social", "Gestion"],
        datasets: [{
          label: "Ton profil",
          data: macros.map(m => macroScores[m]),
          backgroundColor: d.radar.couleur + '40',
          borderColor: d.radar.couleur,
          pointBackgroundColor: '#FDD400',
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          r: {
            min: 0, max: 100,
            ticks: { stepSize: 25, color: '#8a93b3', backdropColor: 'transparent' },
            grid: { color: 'rgba(255,255,255,0.08)' },
            angleLines: { color: 'rgba(255,255,255,0.08)' },
            pointLabels: { color: '#eef1f8' }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }
}

formDynamique.addEventListener('submit', async function (e) {
  e.preventDefault();
  const submitBtn = formDynamique.querySelector('button[type="submit"]');
  const texteOriginal = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Chargement…";
  const ecoles = await rawEcolesPromise;
  submitBtn.disabled = false;
  submitBtn.textContent = texteOriginal;

  if (etatParcours.parcours === 'apres_diplome') {
    afficherResultatsApresDiplome(ecoles);
  } else {
    afficherResultatsMetier(ecoles);
  }
});

/* ---------- Annuaire des écoles (filtrable) ----------
   Chaque école du JSON peut porter des champs enrichis optionnels :
   region, adresse, description, siteOfficiel, telephone, email, reseaux,
   secteurs (tags de filière fine), diplomes, niveauAccepte, admission.
   Tous ces champs sont facultatifs : une école sans ces infos s'affiche
   quand même, simplement avec une fiche plus courte. */
const domaineLabels = {
  technologie: "Technologie",
  creatif: "Créatif",
  social: "Social",
  gestion: "Gestion"
};

const typeLabels = {
  public: "Publique",
  "privé": "Privée"
};

function normaliser(texte) {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/* ---------- Favoris (localStorage) ----------
   Liste des identifiants d'écoles mises en favori par la personne,
   conservée d'une visite à l'autre sur cet appareil. */
const FAVORIS_KEY = 'parcourio_favoris_ecoles';
const HISTORIQUE_KEY = 'parcourio_historique_recherche';
const HISTORIQUE_MAX = 6;

function lireFavoris() {
  try {
    const brut = localStorage.getItem(FAVORIS_KEY);
    const liste = brut ? JSON.parse(brut) : [];
    return Array.isArray(liste) ? liste : [];
  } catch (err) {
    console.warn('Favoris illisibles, réinitialisation.', err);
    return [];
  }
}

function ecrireFavoris(liste) {
  try {
    localStorage.setItem(FAVORIS_KEY, JSON.stringify(liste));
  } catch (err) {
    console.warn("Impossible d'enregistrer les favoris (stockage local indisponible).", err);
  }
}

function estFavori(id) {
  return lireFavoris().includes(id);
}

function basculerFavori(id) {
  const liste = lireFavoris();
  const index = liste.indexOf(id);
  if (index === -1) {
    liste.push(id);
  } else {
    liste.splice(index, 1);
  }
  ecrireFavoris(liste);
  return liste.includes(id);
}

/* ---------- Historique de recherche (localStorage) ---------- */
function lireHistorique() {
  try {
    const brut = localStorage.getItem(HISTORIQUE_KEY);
    const liste = brut ? JSON.parse(brut) : [];
    return Array.isArray(liste) ? liste : [];
  } catch (err) {
    return [];
  }
}

function ajouterHistorique(terme) {
  const propre = terme.trim();
  if (!propre) return;
  let liste = lireHistorique().filter(t => normaliser(t) !== normaliser(propre));
  liste.unshift(propre);
  liste = liste.slice(0, HISTORIQUE_MAX);
  try {
    localStorage.setItem(HISTORIQUE_KEY, JSON.stringify(liste));
  } catch (err) {
    console.warn("Impossible d'enregistrer l'historique de recherche.", err);
  }
}

function effacerHistorique() {
  try {
    localStorage.removeItem(HISTORIQUE_KEY);
  } catch (err) { /* pas grave */ }
}

function fermerModaleEcole() {
  const modale = document.getElementById('ecoleModal');
  if (!modale) return;
  modale.classList.remove('is-open');
  document.body.classList.remove('modal-open');
}

function ouvrirModaleEcole(e) {
  const modale = document.getElementById('ecoleModal');
  const contenu = document.getElementById('ecoleModalContent');
  if (!modale || !contenu) return;

  const lignesInfo = [];
  if (e.adresse) lignesInfo.push(`<p class="ecole-modal-line">📍 ${e.adresse}</p>`);
  if (!e.adresse && e.ville) lignesInfo.push(`<p class="ecole-modal-line">📍 ${e.ville}${e.region && e.region !== e.ville ? ` — région de ${e.region}` : ''}</p>`);
  if (e.telephone) lignesInfo.push(`<p class="ecole-modal-line">📞 ${e.telephone}</p>`);
  if (e.email) lignesInfo.push(`<p class="ecole-modal-line">✉️ ${e.email}</p>`);

  const reseaux = e.reseaux && typeof e.reseaux === 'object' ? Object.entries(e.reseaux).filter(([, v]) => v) : [];
  const reseauxHTML = reseaux.length
    ? `<p class="ecole-modal-line">🔗 ${reseaux.map(([nom, url]) => `<a href="${url}" target="_blank" rel="noopener">${nom}</a>`).join(' · ')}</p>`
    : '';

  const tags = (liste) => (liste && liste.length)
    ? `<div class="ecole-modal-tags">${liste.map(t => `<span class="ecole-modal-tag">${t}</span>`).join('')}</div>`
    : '';

  contenu.innerHTML = `
    <div class="ecole-badges">
      <span class="domaine-badge ${e.domaine}">${domaineLabels[e.domaine] || e.domaine}</span>
      ${e.type ? `<span class="type-badge ${e.type === 'public' ? 'is-public' : 'is-prive'}">${e.type === 'public' ? '🏛️' : '🏫'} ${typeLabels[e.type] || e.type}</span>` : ''}
      ${e.reconnuEtat === true ? `<span class="reconnu-badge" title="Établissement reconnu par l'État du Sénégal">✔️ Reconnu par l'État</span>` : ''}
    </div>
    <h3>${e.nom}${e.sigle ? ` <span class="ecole-modal-sigle">(${e.sigle})</span>` : ''}</h3>
    ${e.description ? `<p class="ecole-modal-desc">${e.description}</p>` : '<p class="ecole-modal-desc ecole-modal-desc-empty">Pas encore de description détaillée pour cet établissement — écris-nous si tu peux nous aider à la compléter.</p>'}
    ${lignesInfo.join('')}
    ${reseauxHTML}
    ${e.secteurs && e.secteurs.length ? `<h4 class="ecole-modal-subtitle">Filières / secteurs</h4>${tags(e.secteurs)}` : ''}
    ${e.diplomes && e.diplomes.length ? `<h4 class="ecole-modal-subtitle">Diplômes délivrés</h4>${tags(e.diplomes)}` : ''}
    ${e.niveauAccepte && e.niveauAccepte.length ? `<h4 class="ecole-modal-subtitle">Niveau d'admission</h4>${tags(e.niveauAccepte)}` : ''}
    ${e.admission ? `<h4 class="ecole-modal-subtitle">Conditions d'admission</h4><p class="ecole-modal-desc">${e.admission}</p>` : ''}
    <div class="ecole-modal-actions">
      <button type="button" class="ecole-modal-favori${e.id && estFavori(e.id) ? ' is-favori' : ''}" id="ecoleModalFavoriBtn" data-id="${e.id || ''}" aria-pressed="${e.id && estFavori(e.id) ? 'true' : 'false'}">
        <span class="ecole-modal-favori-icon">${e.id && estFavori(e.id) ? '★' : '☆'}</span> ${e.id && estFavori(e.id) ? 'Dans mes favoris' : 'Ajouter aux favoris'}
      </button>
      ${e.siteOfficiel ? `<a class="btn-primary" href="${e.siteOfficiel}" target="_blank" rel="noopener">Visiter le site officiel</a>` : '<span class="ecole-modal-nosite">Site officiel non référencé pour le moment</span>'}
    </div>
  `;

  const favoriBtn = document.getElementById('ecoleModalFavoriBtn');
  if (favoriBtn && e.id) {
    favoriBtn.addEventListener('click', () => {
      const actif = basculerFavori(e.id);
      favoriBtn.classList.toggle('is-favori', actif);
      favoriBtn.setAttribute('aria-pressed', String(actif));
      favoriBtn.querySelector('.ecole-modal-favori-icon').textContent = actif ? '★' : '☆';
      favoriBtn.lastChild.textContent = actif ? ' Dans mes favoris' : ' Ajouter aux favoris';
      const carte = document.querySelector(`.ecole-card[data-id="${CSS.escape(e.id)}"]`);
      if (carte) {
        const btnCarte = carte.querySelector('.ecole-card-favori');
        if (btnCarte) {
          btnCarte.classList.toggle('is-favori', actif);
          btnCarte.setAttribute('aria-pressed', String(actif));
          btnCarte.textContent = actif ? '★' : '☆';
        }
      }
      if (typeof mettreAJourCompteurFavoris === 'function') mettreAJourCompteurFavoris();
      if (typeof etatDirectoire !== 'undefined' && etatDirectoire.favorisSeuls) {
        rendreEcolesDirectoire();
      }
    });
  }
  modale.classList.add('is-open');
  document.body.classList.add('modal-open');
}

/* ---------- Comparateur d'écoles (en mémoire, limité à 3) ---------- */
const COMPARE_MAX = 3;
let compareSelection = [];
let ecolesIndex = {}; // id -> école, rempli une fois la base chargée

function mettreAJourBarreComparateur() {
  const barre = document.getElementById('comparateurBar');
  const compteEl = document.getElementById('comparateurCount');
  const voirBtn = document.getElementById('comparateurVoirBtn');
  if (!barre || !compteEl || !voirBtn) return;
  const n = compareSelection.length;
  compteEl.textContent = String(n);
  barre.hidden = n === 0;
  voirBtn.disabled = n < 2;
}

function basculerComparaison(id, carte) {
  const index = compareSelection.indexOf(id);
  if (index !== -1) {
    compareSelection.splice(index, 1);
  } else {
    if (compareSelection.length >= COMPARE_MAX) {
      alert(`Tu peux comparer ${COMPARE_MAX} écoles à la fois. Retire-en une avant d'en ajouter une nouvelle.`);
      return;
    }
    compareSelection.push(id);
  }
  const actif = compareSelection.includes(id);
  document.querySelectorAll(`.ecole-card-compare[data-compare-id="${CSS.escape(id)}"]`).forEach(btn => {
    btn.classList.toggle('is-selected', actif);
    btn.setAttribute('aria-pressed', String(actif));
  });
  mettreAJourBarreComparateur();
}

function celluleListe(valeurs) {
  if (!valeurs || valeurs.length === 0) return '<span class="note">Non précisé</span>';
  return valeurs.join(', ');
}

function rendreComparateur() {
  const contenu = document.getElementById('comparateurModalContent');
  if (!contenu) return;
  const items = compareSelection.map(id => ecolesIndex[id]).filter(Boolean);
  if (items.length === 0) {
    contenu.innerHTML = '<h3>Comparateur d\'écoles</h3><p class="comparateur-empty">Sélectionne au moins deux écoles (bouton ⚖ sur chaque fiche) pour les comparer côte à côte.</p>';
    return;
  }
  const lignes = [
    { label: 'Ville / Région', rendu: e => `${e.ville || '—'}${e.region && e.region !== e.ville ? ` · ${e.region}` : ''}` },
    { label: 'Statut', rendu: e => e.type === 'public' ? '🏛️ Public' : (e.type === 'privé' ? '🏫 Privé' : '—') },
    { label: 'Domaine', rendu: e => domaineLabels[e.domaine] || e.domaine || '—' },
    { label: 'Niveaux acceptés', rendu: e => celluleListe(e.niveauAccepte) },
    { label: 'Diplômes', rendu: e => celluleListe(e.diplomes) },
    { label: 'Secteurs / filières', rendu: e => celluleListe(e.secteurs) },
    { label: 'Admission', rendu: e => e.admission || '<span class="note">Non précisé</span>' },
    { label: 'Site officiel', rendu: e => e.siteOfficiel ? `<a href="${e.siteOfficiel}" target="_blank" rel="noopener">Visiter →</a>` : '<span class="note">Non référencé</span>' },
  ];

  contenu.innerHTML = `
    <h3>Comparateur d'écoles</h3>
    <p class="note">${items.length} école${items.length > 1 ? 's' : ''} comparée${items.length > 1 ? 's' : ''}.</p>
    <div class="comparateur-table-wrap">
      <table class="comparateur-table">
        <thead>
          <tr>
            <th>Critère</th>
            ${items.map(e => `<td class="comparateur-ecole-nom">${e.nom}<button type="button" class="comparateur-retirer" data-retirer-id="${e.id}">Retirer</button></td>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${lignes.map(l => `
            <tr>
              <th>${l.label}</th>
              ${items.map(e => `<td>${l.rendu(e)}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  contenu.querySelectorAll('.comparateur-retirer').forEach(btn => {
    btn.addEventListener('click', () => {
      basculerComparaison(btn.dataset.retirerId, null);
      rendreComparateur();
      if (rendreEcolesDirectoire) rendreEcolesDirectoire();
      if (compareSelection.length === 0) fermerComparateur();
    });
  });
}

function ouvrirComparateur() {
  rendreComparateur();
  const modale = document.getElementById('comparateurModal');
  if (modale) modale.classList.add('is-open');
  document.body.classList.add('modal-open');
}

function fermerComparateur() {
  const modale = document.getElementById('comparateurModal');
  if (modale) modale.classList.remove('is-open');
  document.body.classList.remove('modal-open');
}

document.addEventListener('DOMContentLoaded', () => {
  const voirBtn = document.getElementById('comparateurVoirBtn');
  const viderBtn = document.getElementById('comparateurViderBtn');
  const closeBtn = document.getElementById('comparateurModalClose');
  const backdrop = document.querySelector('#comparateurModal .comparateur-modal-backdrop');
  if (voirBtn) voirBtn.addEventListener('click', ouvrirComparateur);
  if (viderBtn) viderBtn.addEventListener('click', () => {
    compareSelection.slice().forEach(id => basculerComparaison(id, null));
    if (rendreEcolesDirectoire) rendreEcolesDirectoire();
  });
  if (closeBtn) closeBtn.addEventListener('click', fermerComparateur);
  if (backdrop) backdrop.addEventListener('click', fermerComparateur);
});

let etatDirectoire = null;
let rendreEcolesDirectoire = null;

function mettreAJourCompteurFavoris() {
  const compteEl = document.getElementById('favorisCount');
  const toggle = document.getElementById('favorisToggle');
  if (!compteEl || !toggle) return;
  const n = lireFavoris().length;
  compteEl.textContent = String(n);
  compteEl.hidden = n === 0;
}

function rendreHistoriqueRecherche() {
  const conteneur = document.getElementById('derniereRecherches');
  const chipsEl = document.getElementById('derniereRecherchesChips');
  if (!conteneur || !chipsEl) return;
  const historique = lireHistorique();
  if (historique.length === 0) {
    conteneur.hidden = true;
    chipsEl.innerHTML = '';
    return;
  }
  conteneur.hidden = false;
  chipsEl.innerHTML = historique
    .map(terme => `<button type="button" class="recherche-chip" data-terme="${terme.replace(/"/g, '&quot;')}">${terme}</button>`)
    .join('');
  chipsEl.querySelectorAll('.recherche-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const searchInput = document.getElementById('ecoleSearch');
      if (!searchInput || !etatDirectoire || !rendreEcolesDirectoire) return;
      searchInput.value = btn.dataset.terme;
      etatDirectoire.recherche = btn.dataset.terme;
      rendreEcolesDirectoire();
    });
  });
}

rawEcolesPromise.then(liste => {
  const grid = document.getElementById('ecoleDirectoryGrid');
  const countEl = document.getElementById('ecoleCount');
  const searchInput = document.getElementById('ecoleSearch');
  const villeSelect = document.getElementById('ecoleVilleFilter');
  const regionSelect = document.getElementById('ecoleRegionFilter');
  const chips = document.querySelectorAll('.domaine-chip');
  const typeChips = document.querySelectorAll('.type-chip');
  const niveauChips = document.querySelectorAll('.niveau-chip');
  const favorisToggle = document.getElementById('favorisToggle');
  const masquerBtn = document.getElementById('ecolesMasquerBtn');

  if (!grid || !countEl || !searchInput || !villeSelect) return;

  const ecoles = liste.filter(e => e.ville && e.domaine && e.nom);
  ecoles.forEach(e => { if (e.id) ecolesIndex[e.id] = e; });

  /* Chiffres du hero et de la phrase d'intro de la section Écoles :
     recalculés à partir du nombre réel d'entrées dans ecoles.json, pour ne
     jamais afficher un total figé (ex. "206") qui deviendrait faux dès
     qu'on ajoute ou retire une école du fichier. */
  const nbEcoles = ecoles.length;
  const nbRegions = new Set(ecoles.map(e => e.region).filter(Boolean)).size;
  const heroStatEcoles = document.getElementById('heroStatEcoles');
  const heroStatRegions = document.getElementById('heroStatRegions');
  if (heroStatEcoles) heroStatEcoles.textContent = nbEcoles;
  if (heroStatRegions) heroStatRegions.textContent = nbRegions;
  const introCount = document.getElementById('ecolesSectionIntroCount');
  const introRegions = document.getElementById('ecolesSectionIntroRegions');
  if (introCount) introCount.textContent = nbEcoles;
  if (introRegions) introRegions.textContent = nbRegions;

  const villes = [...new Set(ecoles.map(e => e.ville))].sort((a, b) => a.localeCompare(b, 'fr'));
  villes.forEach(ville => {
    const option = document.createElement('option');
    option.value = ville;
    option.textContent = ville;
    villeSelect.appendChild(option);
  });

  if (regionSelect) {
    const regions = [...new Set(ecoles.map(e => e.region).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
    regions.forEach(region => {
      const option = document.createElement('option');
      option.value = region;
      option.textContent = region;
      regionSelect.appendChild(option);
    });
  }

  const etat = { recherche: '', ville: '', region: '', domaine: '', type: '', niveau: '', favorisSeuls: false, aAfficheTout: false };
  etatDirectoire = etat;

  function filtresActifs() {
    return !!(etat.recherche || etat.ville || etat.region || etat.domaine || etat.type || etat.niveau || etat.favorisSeuls);
  }

  function reinitialiserEtMasquer() {
    etat.recherche = '';
    etat.ville = '';
    etat.region = '';
    etat.domaine = '';
    etat.type = '';
    etat.niveau = '';
    etat.favorisSeuls = false;
    etat.aAfficheTout = false;

    searchInput.value = '';
    villeSelect.value = '';
    if (regionSelect) regionSelect.value = '';
    chips.forEach(c => c.classList.toggle('is-active', c.dataset.domaine === ''));
    typeChips.forEach(c => c.classList.toggle('is-active', c.dataset.type === ''));
    niveauChips.forEach(c => c.classList.toggle('is-active', c.dataset.niveau === ''));
    if (favorisToggle) {
      favorisToggle.setAttribute('aria-pressed', 'false');
      favorisToggle.querySelector('.favoris-toggle-icon').textContent = '☆';
    }

    rendreEcoles();
    document.getElementById('ecoles').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (masquerBtn) {
    masquerBtn.addEventListener('click', reinitialiserEtMasquer);
  }

  function rendreEcoles() {
    // Tant qu'aucun filtre/recherche n'est actif et que la personne n'a pas
    // explicitement demandé à tout voir, on évite d'étaler la base entière
    // (encombrant) : on affiche une invitation à filtrer, avec un bouton
    // pour tout afficher quand même si elle le souhaite.
    if (!filtresActifs() && !etat.aAfficheTout) {
      if (masquerBtn) masquerBtn.hidden = true;
      countEl.textContent = `${ecoles.length} école${ecoles.length > 1 ? 's' : ''} au total`;
      grid.innerHTML = `
        <div class="directory-empty directory-invite">
          <p>Utilise la recherche ou les filtres ci-dessus pour trouver rapidement une école.</p>
          <button type="button" class="btn-secondary" id="voirToutesLesEcoles">Voir les ${ecoles.length} écoles de la base</button>
        </div>
      `;
      const voirToutBtn = document.getElementById('voirToutesLesEcoles');
      if (voirToutBtn) {
        voirToutBtn.addEventListener('click', () => {
          etat.aAfficheTout = true;
          rendreEcoles();
        });
      }
      return;
    }

    if (masquerBtn) masquerBtn.hidden = false;

    const rechercheNorm = normaliser(etat.recherche);
    const favoris = lireFavoris();
    const resultats = ecoles.filter(e => {
      if (etat.favorisSeuls && !favoris.includes(e.id)) return false;
      if (etat.ville && e.ville !== etat.ville) return false;
      if (etat.region && e.region !== etat.region) return false;
      if (etat.domaine && e.domaine !== etat.domaine) return false;
      if (etat.type && e.type !== etat.type) return false;
      if (etat.niveau && !(e.niveauAccepte || []).includes(etat.niveau)) return false;
      if (rechercheNorm) {
        const cible = normaliser([e.nom, e.sigle || '', ...(e.secteurs || [])].join(' '));
        if (!cible.includes(rechercheNorm)) return false;
      }
      return true;
    });

    countEl.textContent = resultats.length > 0
      ? `${resultats.length} école${resultats.length > 1 ? 's' : ''} trouvée${resultats.length > 1 ? 's' : ''}`
      : 'Chargement des écoles…';

    if (resultats.length === 0) {
      grid.innerHTML = etat.favorisSeuls
        ? '<p class="directory-empty">Tu n\'as pas encore d\'école en favoris. Clique sur l\'étoile ☆ d\'une fiche pour l\'ajouter ici.</p>'
        : '<p class="directory-empty">Aucune école ne correspond à ta recherche. Essaie une autre ville, une autre région, un autre domaine, un autre statut, ou efface le texte recherché.</p>';
      countEl.textContent = '0 école trouvée pour ces filtres';
      return;
    }

    grid.innerHTML = resultats
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
      .map(e => `
        <div class="card ecole-card visible" data-id="${e.id || ''}" tabindex="0" role="button" aria-label="Voir la fiche de ${e.nom}">
          <button type="button" class="ecole-card-favori${e.id && favoris.includes(e.id) ? ' is-favori' : ''}" data-fav-id="${e.id || ''}" aria-pressed="${e.id && favoris.includes(e.id) ? 'true' : 'false'}" aria-label="${e.id && favoris.includes(e.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${e.id && favoris.includes(e.id) ? '★' : '☆'}</button>
          <button type="button" class="ecole-card-compare${e.id && compareSelection.includes(e.id) ? ' is-selected' : ''}" data-compare-id="${e.id || ''}" aria-pressed="${e.id && compareSelection.includes(e.id) ? 'true' : 'false'}" aria-label="Ajouter au comparateur">⚖</button>
          <div class="ecole-badges">
            <span class="domaine-badge ${e.domaine}">${domaineLabels[e.domaine] || e.domaine}</span>
            ${e.type ? `<span class="type-badge ${e.type === 'public' ? 'is-public' : 'is-prive'}">${e.type === 'public' ? '🏛️' : '🏫'} ${typeLabels[e.type] || e.type}</span>` : ''}
            ${e.reconnuEtat === true ? `<span class="reconnu-badge" title="Établissement reconnu par l'État du Sénégal">✔️ État</span>` : ''}
          </div>
          <h3>${e.nom}</h3>
          <span class="ecole-ville">${e.ville}${e.region && e.region !== e.ville ? ` · ${e.region}` : ''}</span>
          ${e.description ? `<p class="ecole-card-excerpt">${e.description.slice(0, 110)}${e.description.length > 110 ? '…' : ''}</p>` : ''}
          <span class="ecole-card-more">Voir la fiche →</span>
        </div>
      `).join('');

    grid.querySelectorAll('.ecole-card').forEach(carte => {
      const ecole = resultats.find(r => r.id === carte.dataset.id);
      if (!ecole) return;
      const ouvrir = () => ouvrirModaleEcole(ecole);
      carte.addEventListener('click', ouvrir);
      carte.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter' || evt.key === ' ') { evt.preventDefault(); ouvrir(); }
      });
      const favBtn = carte.querySelector('.ecole-card-favori');
      if (favBtn) {
        favBtn.addEventListener('click', (evt) => {
          evt.stopPropagation();
          const actif = basculerFavori(favBtn.dataset.favId);
          favBtn.classList.toggle('is-favori', actif);
          favBtn.setAttribute('aria-pressed', String(actif));
          favBtn.setAttribute('aria-label', actif ? 'Retirer des favoris' : 'Ajouter aux favoris');
          favBtn.textContent = actif ? '★' : '☆';
          mettreAJourCompteurFavoris();
          if (etat.favorisSeuls) rendreEcoles();
        });
        favBtn.addEventListener('keydown', (evt) => evt.stopPropagation());
      }
      const compareBtn = carte.querySelector('.ecole-card-compare');
      if (compareBtn) {
        compareBtn.addEventListener('click', (evt) => {
          evt.stopPropagation();
          basculerComparaison(compareBtn.dataset.compareId, compareBtn);
        });
        compareBtn.addEventListener('keydown', (evt) => evt.stopPropagation());
      }
    });
  }
  rendreEcolesDirectoire = rendreEcoles;

  let rechercheDebounce;
  searchInput.addEventListener('input', () => {
    etat.recherche = searchInput.value;
    rendreEcoles();
    clearTimeout(rechercheDebounce);
    rechercheDebounce = setTimeout(() => {
      if (searchInput.value.trim().length >= 2) {
        ajouterHistorique(searchInput.value);
        rendreHistoriqueRecherche();
      }
    }, 900);
  });

  villeSelect.addEventListener('change', () => {
    etat.ville = villeSelect.value;
    rendreEcoles();
  });

  if (regionSelect) {
    regionSelect.addEventListener('change', () => {
      etat.region = regionSelect.value;
      rendreEcoles();
    });
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      etat.domaine = chip.dataset.domaine;
      rendreEcoles();
    });
  });

  typeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      typeChips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      etat.type = chip.dataset.type;
      rendreEcoles();
    });
  });

  niveauChips.forEach(chip => {
    chip.addEventListener('click', () => {
      niveauChips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      etat.niveau = chip.dataset.niveau;
      rendreEcoles();
    });
  });

  if (favorisToggle) {
    favorisToggle.addEventListener('click', () => {
      etat.favorisSeuls = !etat.favorisSeuls;
      favorisToggle.setAttribute('aria-pressed', String(etat.favorisSeuls));
      favorisToggle.querySelector('.favoris-toggle-icon').textContent = etat.favorisSeuls ? '★' : '☆';
      rendreEcoles();
    });
  }

  mettreAJourCompteurFavoris();
  rendreHistoriqueRecherche();

  const clearHistBtn = document.getElementById('derniereRecherchesClear');
  if (clearHistBtn) {
    clearHistBtn.addEventListener('click', () => {
      effacerHistorique();
      rendreHistoriqueRecherche();
    });
  }

  rendreEcoles();
});

/* ---------- Fermeture de la fiche détaillée d'école ---------- */
const ecoleModal = document.getElementById('ecoleModal');
if (ecoleModal) {
  ecoleModal.addEventListener('click', (e) => {
    if (e.target === ecoleModal || e.target.classList.contains('ecole-modal-backdrop')) {
      fermerModaleEcole();
    }
  });
  const closeBtn = document.getElementById('ecoleModalClose');
  if (closeBtn) closeBtn.addEventListener('click', fermerModaleEcole);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fermerModaleEcole();
  });
}

/* ---------- Formulaire de contact ---------- */
const contactForm = document.getElementById('contactForm');
const contactStatus = document.getElementById('contactStatus');

function echapperTexte(texte) {
  const div = document.createElement('div');
  div.textContent = texte;
  return div.innerHTML;
}

if (contactForm) {
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (contactForm.action.includes('VOTRE_ID_FORMSPREE')) {
      contactStatus.innerHTML = "Le formulaire n'est pas encore configuré (il manque l'identifiant Formspree). Écris-nous directement à contact0parcourio@gmail.com en attendant.";
      contactStatus.classList.remove('is-success');
      contactStatus.classList.add('is-error');
      return;
    }

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const texteOriginal = submitBtn.textContent;
    const prenomBrut = (contactForm.querySelector('[name="nom"]').value || '').trim().split(' ')[0];
    submitBtn.disabled = true;
    submitBtn.textContent = "Envoi…";
    contactStatus.innerHTML = '';
    contactStatus.classList.remove('is-success', 'is-error');

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        contactForm.reset();
        const salutation = prenomBrut ? `Merci ${echapperTexte(prenomBrut)}, c'est envoyé !` : "C'est envoyé, merci !";
        contactStatus.innerHTML = `
          <span class="form-status-icon">✓</span>
          <span class="form-status-text">
            <strong>${salutation}</strong>
            Ton message est bien arrivé jusqu'à nous. On le lit personnellement et on te répond par email, en général sous 24 à 48h.
          </span>
        `;
        contactStatus.classList.add('is-success');
      } else {
        throw new Error('Réponse HTTP ' + response.status);
      }
    } catch (err) {
      console.error('Erreur envoi formulaire de contact', err);
      contactStatus.innerHTML = `
        <span class="form-status-icon">!</span>
        <span class="form-status-text">
          <strong>Ton message n'est pas parti.</strong>
          Vérifie ta connexion et réessaie — ou écris-nous directement à <a href="mailto:contact0parcourio@gmail.com">contact0parcourio@gmail.com</a>, on te lira quand même.
        </span>
      `;
      contactStatus.classList.add('is-error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = texteOriginal;
    }
  });
}
