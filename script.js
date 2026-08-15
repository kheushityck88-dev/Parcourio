/* ---------- Interrupteur abonnement / test avancé ----------
   Wave n'est pas encore configuré (clés API pas encore ajoutées dans
   Supabase) : tant que ABONNEMENT_ACTIF est à false, tout ce qui
   concerne le test avancé reste invisible (upsell "🔒 débloquer",
   bouton rapport PDF, essai gratuit, modale d'abonnement) — sans
   supprimer le code, pour pouvoir tout réactiver d'un coup plus tard
   en repassant simplement cette valeur à true. */
const ABONNEMENT_ACTIF = false;

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

/* ---------- Section active dans la navigation ---------- */
const navLinks = Array.from(document.querySelectorAll('#mainNav a[href^="#"]'));
const navSections = navLinks
  .map(a => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
    }
  });
}, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

navSections.forEach(section => navObserver.observe(section));

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
const { PROFILS, METIERS, PARCOURS, DIPLOMES, OBJECTIFS_PAR_DIPLOME,
        construireQuestionnaireApresDiplome, construireQuestionnaireMetier } = window.OrientationData;
const Moteur = window.OrientationEngine;

const parcoursPicker = document.getElementById('parcoursPicker');
const etapeDiplome = document.getElementById('etapeDiplome');
const etapeMetierIntro = document.getElementById('etapeMetierIntro');
const diplomeChipsEl = document.getElementById('diplomeChips');
const diplomeStepBlock = document.getElementById('diplomeStepBlock');
const objectifDiplomeWrap = document.getElementById('objectifDiplomeWrap');
const objectifChipsEl = document.getElementById('objectifChips');
const formDynamique = document.getElementById('formDynamique');
const parcoursResume = document.getElementById('parcoursResume');
const parcoursResumeText = document.getElementById('parcoursResumeText');

let etatParcours = { parcours: null, diplome: null, objectif: null, questions: null };

/* --- Rendu des deux grandes cartes de parcours --- */
parcoursPicker.innerHTML = PARCOURS.map(p => `
  <button type="button" class="parcours-card" data-parcours="${p.id}">
    <span class="parcours-icon">${Icons.svg(p.icone)}</span>
    <h3>${p.titre}</h3>
    <p>${p.description}</p>
  </button>
`).join('');

function masquerFormulaireEtProgression() {
  const barreProgression = formDynamique.previousElementSibling;
  if (barreProgression && barreProgression.classList.contains('quiz-progress')) {
    barreProgression.remove();
  }
  formDynamique.hidden = true;
  formDynamique.innerHTML = '';
}

function masquerToutesLesEtapes() {
  etapeDiplome.hidden = true;
  etapeMetierIntro.hidden = true;
  masquerFormulaireEtProgression();
  objectifDiplomeWrap.hidden = true;
  objectifChipsEl.innerHTML = '';
  parcoursResume.hidden = true;
  diplomeStepBlock.hidden = false;
  document.getElementById('retourParcours1').hidden = false;
}

function revenirAuChoixParcours() {
  etatParcours = { parcours: null, diplome: null, objectif: null, questions: null };
  masquerToutesLesEtapes();
  parcoursPicker.hidden = false;
  document.querySelectorAll('.parcours-card').forEach(c => c.classList.remove('is-active'));
}

/* Une fois le diplôme + l'objectif choisis et le quiz lancé, les deux
   grosses rangées de chips ne servent plus qu'à occuper de la place :
   on les replie en un résumé d'une ligne avec un lien "Modifier". */
function afficherResumeChoixDiplome() {
  const diplomeLabel = (DIPLOMES.find(d => d.value === etatParcours.diplome) || {}).label || '';
  const objectifs = OBJECTIFS_PAR_DIPLOME[etatParcours.diplome] || [];
  const objectifLabel = (objectifs.find(o => o.value === etatParcours.objectif) || {}).label || '';
  parcoursResumeText.textContent = [diplomeLabel, objectifLabel].filter(Boolean).join(' · ');
  parcoursResume.hidden = false;
  diplomeStepBlock.hidden = true;
  objectifDiplomeWrap.hidden = true;
  /* La barre de progression du quiz a déjà son propre bouton
     "Changer de parcours" : pas besoin de le montrer deux fois. */
  document.getElementById('retourParcours1').hidden = true;
}

function modifierChoixDiplome() {
  masquerFormulaireEtProgression();
  parcoursResume.hidden = true;
  diplomeStepBlock.hidden = false;
  if (etatParcours.diplome) objectifDiplomeWrap.hidden = false;
  document.getElementById('retourParcours1').hidden = false;
  diplomeStepBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

document.getElementById('modifierChoixDiplome').addEventListener('click', modifierChoixDiplome);

function construireEtLancerFormulaire() {
  let questions, boutonLabel, formId;
  if (etatParcours.parcours === 'apres_diplome') {
    questions = construireQuestionnaireApresDiplome(etatParcours.diplome, etatParcours.objectif);
    boutonLabel = 'Voir mon orientation';
    formId = 'apres_diplome';
    afficherResumeChoixDiplome();
  } else {
    questions = construireQuestionnaireMetier();
    boutonLabel = 'Voir mes recommandations';
    formId = 'apprendre_metier';
  }
  etatParcours.questions = questions;
  formDynamique.dataset.formId = formId;
  if (window.ParcourioAnalytics) {
    window.ParcourioAnalytics.track('test_commence', { parcours: formId });
  }
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
    etapeDiplome.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  objectifDiplomeWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
   Les écoles sont chargées de façon asynchrone depuis
   assets/data/ecoles.json via fetch(), pour ne plus bloquer le
   rendu initial avec un <script> classique de 260 Ko. Le reste du
   site (menu, formulaires, etc.) reste utilisable pendant que la
   base d'écoles finit de charger en arrière-plan.
   Pour ajouter une école : ouvrir ce fichier JSON et ajouter une entrée
   { "ville": "...", "domaine": "technologie|gestion|social|creatif", "nom": "..." }
   Aucune autre modification du code n'est nécessaire.
   Remarque : fetch() ne fonctionne pas en ouvrant index.html en
   double-clic (protocole file://) — il faut un vrai serveur (Vercel,
   ou "npx serve" / "python -m http.server" en local). window.ECOLES_DATA
   reste disponible comme filet de sécurité si jamais assets/data/ecoles-data.js
   est réintroduit dans la page. */
const rawEcolesPromise = (window.ECOLES_DATA && window.ECOLES_DATA.length)
  ? Promise.resolve(window.ECOLES_DATA)
  : fetch('assets/data/ecoles.json')
      .then(r => {
        if (!r.ok) throw new Error('Réponse HTTP ' + r.status);
        return r.json();
      })
      .catch(err => {
        console.error(
          "Impossible de charger la base d'écoles depuis assets/data/ecoles.json. " +
          "Vérifie que le site tourne bien sur un vrai serveur http(s) (fetch() ne " +
          "fonctionne pas en ouvrant le fichier en double-clic, protocole file://).",
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
async function afficherResultatsApresDiplome(ecoles) {
  const { reponses, contexte } = Moteur.collecterReponses(formDynamique, etatParcours.questions, formDynamique.dataset.formId);
  const { scores, contributions, pourcentages } = Moteur.calculerScores(etatParcours.questions, reponses, PROFILS);

  // Bonus "je veux rester/me spécialiser dans mon domaine actuel"
  const domaineActuel = reponses.domaine_filiere_actuelle;
  const objectifsDuDiplome = OBJECTIFS_PAR_DIPLOME[etatParcours.diplome] || [];
  const objectifInfo = etatParcours.objectif
    ? (objectifsDuDiplome.find(o => o.value === etatParcours.objectif) || null)
    : null;
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

  const accesAvance = ABONNEMENT_ACTIF && window.ParcourioAuth ? await window.ParcourioAuth.verifierAccesAvance() : false;
  const limiteTotale = accesAvance ? 20 : (ABONNEMENT_ACTIF ? 12 : 4);
  const limiteVisible = accesAvance ? 20 : 4;
  const { ecoles: ecolesRecommandees, fallbackUtilise } = Moteur.selectionnerEcoles(ecoles, profilPrincipal, contexte, limiteTotale);

  const diplomeLabel = (DIPLOMES.find(d => d.value === etatParcours.diplome) || {}).label || '';
  const enteteExtra = diplomeLabel ? `<p><strong>Diplôme actuel :</strong> ${diplomeLabel}</p>` : '';

  if (window.ParcourioAnalytics) {
    window.ParcourioAnalytics.track('test_termine', { parcours: 'apres_diplome', profilId: profilPrincipal.id, titre: profilPrincipal.nom });
  }

  if (window.ParcourioAuth) {
    window.ParcourioAuth.enregistrerResultat({
      parcours: 'apres_diplome',
      typeTest: accesAvance ? 'avance' : 'rapide',
      reponses,
      resultat: {
        profilId: profilPrincipal.id,
        titre: profilPrincipal.nom,
        pourcentage: principal.pct,
        ville,
        diplome: etatParcours.diplome,
        objectif: etatParcours.objectif
      }
    });
  }

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
    debouches: profilPrincipal.debouches,
    marche: profilPrincipal.marche,
    explication,
    ecolesRecommandees,
    fallbackUtilise,
    accesAvance,
    limiteVisible,
    titreEcoles: `Écoles recommandées${ville ? ` à ${ville}` : ''}`,
    radar: { registre: PROFILS, pourcentages, couleur: profilPrincipal.couleur }
  });
}

/* --- Résultats du parcours "Je souhaite apprendre un métier" ---
   Même mécanique de scoring générique (Moteur.calculerScores accepte
   n'importe quel registre de profils), mais avec le registre METIERS et
   la sélection d'écoles orientée insertion rapide/accessibilité. */
async function afficherResultatsMetier(ecoles) {
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

  const accesAvance = ABONNEMENT_ACTIF && window.ParcourioAuth ? await window.ParcourioAuth.verifierAccesAvance() : false;
  const limiteTotale = accesAvance ? 20 : (ABONNEMENT_ACTIF ? 12 : 4);
  const limiteVisible = accesAvance ? 20 : 4;
  const { ecoles: ecolesRecommandees, fallbackUtilise } = Moteur.selectionnerEcolesMetier(ecoles, metierPrincipal, contexte, limiteTotale);

  if (window.ParcourioAnalytics) {
    window.ParcourioAnalytics.track('test_termine', { parcours: 'apprendre_metier', profilId: metierPrincipal.id, titre: metierPrincipal.nom });
  }

  if (window.ParcourioAuth) {
    window.ParcourioAuth.enregistrerResultat({
      parcours: 'apprendre_metier',
      typeTest: accesAvance ? 'avance' : 'rapide',
      reponses,
      resultat: {
        profilId: metierPrincipal.id,
        titre: metierPrincipal.nom,
        pourcentage: principal.pct,
        ville,
        niveauActuel: contexte.niveau_actuel_metier
      }
    });
  }

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
    debouches: metierPrincipal.debouches,
    marche: metierPrincipal.marche,
    explication,
    ecolesRecommandees,
    fallbackUtilise,
    accesAvance,
    limiteVisible,
    titreEcoles: `Centres de formation recommandés${ville ? ` à ${ville}` : ''}`,
    radar: null
  });
}

/* --- Rendu commun de la carte de résultat (partagé par les deux parcours) --- */
function afficherCarteResultat(d) {
  window.__dernierResultatTest = d;
  let ecolesHTML;
  const limiteVisible = d.limiteVisible || d.ecolesRecommandees.length;
  const ecolesVisibles = d.ecolesRecommandees.slice(0, limiteVisible);
  const nbVerrouillees = Math.max(0, d.ecolesRecommandees.length - limiteVisible);

  if (ecolesVisibles.length > 0) {
    ecolesHTML = '<div class="ecoles-reco-liste">' + ecolesVisibles.map(e => `
      <div class="ecole-reco-item" data-id="${e.id || ''}">
        <div class="ecole-reco-entete">
          <span class="ecole-reco-nom">${e.nom}${e.ville ? ` <span class="note">(${e.ville})</span>` : ''}</span>
          <span class="ecole-reco-score">${e.compatibilite}% compatible</span>
        </div>
        <div class="ecole-reco-barre"><div class="ecole-reco-barre-remplie" style="width:${e.compatibilite}%"></div></div>
        ${e.raisonsCompatibilite && e.raisonsCompatibilite.length ? `<ul class="ecole-reco-raisons">${e.raisonsCompatibilite.map(r => `<li>${Icons.svg('check', { class: 'icon-inline' })} ${r}</li>`).join('')}</ul>` : ''}
        ${e.id ? `<button type="button" class="ecole-reco-lien">Voir les filières et infos complètes ${Icons.svg('arrow-right', { class: 'icon-inline' })}</button>` : ''}
      </div>
    `).join('') + '</div>';
    if (d.fallbackUtilise) {
      ecolesHTML = `<p class="note">Aucun établissement encore référencé près de ${d.ville || 'ta ville'} pour ce profil : voici des options nationales de référence.</p>` + ecolesHTML;
    }
    if (nbVerrouillees > 0) {
      ecolesHTML += `
        <div class="ecoles-verrouillees">
          <p class="ecoles-verrouillees-texte">🔒 ${nbVerrouillees} autre${nbVerrouillees > 1 ? 's' : ''} établissement${nbVerrouillees > 1 ? 's' : ''} recommandé${nbVerrouillees > 1 ? 's' : ''}, disponible${nbVerrouillees > 1 ? 's' : ''} avec le <strong>test avancé</strong>.</p>
          <button type="button" class="btn-secondary" id="debloquerAvanceBtn">Débloquer le test avancé</button>
        </div>`;
    }
  } else {
    ecolesHTML = '<p class="note">Base en cours d\'enrichissement — reviens bientôt pour ce profil.</p>';
  }

  const metiersHTML = d.metiers && d.metiers.length
    ? `<h4 class="ecole-modal-subtitle">Exemples de métiers</h4><p>${d.metiers.join(' · ')}</p>`
    : '';
  const debouchesHTML = d.debouches
    ? `<h4 class="ecole-modal-subtitle">Débouchés & perspectives d'évolution</h4><p>${d.debouches}</p>`
    : '';
  const marcheHTML = d.marche
    ? `<h4 class="ecole-modal-subtitle">Marché de l'emploi au Sénégal</h4><p>${d.marche}</p><p class="note">Repère national : taux de chômage estimé à 16,9%, salaire moyen du secteur formel entre 200 000 et 300 000 FCFA/mois, très variable selon le secteur (source : ANSD, via Africarrieres/Senego, 2026).</p>`
    : '';
  const explicationHTML = d.explication.length
    ? `<h4 class="ecole-modal-subtitle">Pourquoi cette recommandation ?</h4><ul>${d.explication.map(e => `<li>${e}</li>`).join('')}</ul>`
    : '';

  const resultSection = document.querySelector('.result-section') || document.createElement('section');
  resultSection.className = `section result-section waypoint destination ${d.parcoursClasse}`;
  resultSection.innerHTML = `
    <div class="waypoint-marker">
      <span class="waypoint-num">${Icons.svg('check')}</span>
      <span class="waypoint-line short"></span>
    </div>
    <div class="waypoint-body">
      <p class="eyebrow">Arrivée</p>
      <h2>Ton orientation personnalisée</h2>
      <div class="cards">
        <div class="card result-profile-card" style="--profile-color:${d.couleur}; border-color:${d.couleur}66;">
          <span class="result-profile-icon">${Icons.svg(d.icone)}</span>
          <h3>${d.titre}</h3>
          <p><strong>Correspondance :</strong> ${d.correspondance}</p>
          ${d.enteteExtra}
          ${d.ville ? `<p><strong>Ville :</strong> ${d.ville}</p>` : ''}
          <p>${d.description}</p>
          <p><strong>Pourquoi c'est la bonne décision :</strong> ${d.conseil}</p>
          ${metiersHTML}
          ${marcheHTML}
          ${debouchesHTML}
          ${explicationHTML}
        </div>
        <div class="card">
          <h3>${d.titreEcoles}</h3>
          ${ecolesHTML}
        </div>
      </div>
      ${d.radar ? '<canvas id="profilRadar"></canvas>' : ''}
      <div class="result-actions">
        <button type="button" class="btn-secondary" id="partagerResultat">${Icons.svg('share-2', { class: 'icon-inline' })} Partager mon résultat</button>
        <button type="button" class="btn-secondary" id="refaireLeTest">${Icons.svg('rotate-ccw', { class: 'icon-inline' })} Refaire le test</button>
        ${ABONNEMENT_ACTIF ? (d.accesAvance
          ? `<button type="button" class="btn-secondary" id="telechargerRapportBtn">${Icons.svg('file-text', { class: 'icon-inline' })} Télécharger mon rapport (PDF)</button>`
          : `<button type="button" class="btn-secondary" id="rapportPremiumBtn">🔒 Rapport PDF (test avancé)</button>`) : ''}
      </div>
      <p class="result-share-status" id="partagerStatus" role="status" aria-live="polite"></p>
      <p class="result-share-status" id="rapportStatus" role="status" aria-live="polite"></p>
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

  const boutonPartager = resultSection.querySelector('#partagerResultat');
  const partagerStatus = resultSection.querySelector('#partagerStatus');
  if (boutonPartager) {
    boutonPartager.addEventListener('click', async () => {
      const texte = `Mon orientation sur Parcourio : ${d.titre} (${d.correspondance}). Découvre la tienne, c'est gratuit :`;
      const url = 'https://www.parcourio.com/';
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Mon orientation Parcourio', text: texte, url });
        } catch (err) {
          /* Partage annulé par la personne : rien à faire */
        }
        return;
      }
      try {
        await navigator.clipboard.writeText(`${texte} ${url}`);
        if (partagerStatus) {
          partagerStatus.textContent = 'Lien copié — tu peux le coller où tu veux !';
          setTimeout(() => { partagerStatus.textContent = ''; }, 4000);
        }
      } catch (err) {
        if (partagerStatus) partagerStatus.textContent = url;
      }
    });
  }

  const boutonDebloquer = resultSection.querySelector('#debloquerAvanceBtn');
  if (boutonDebloquer && window.ParcourioAuth) {
    boutonDebloquer.addEventListener('click', async () => {
      const session = window.ParcourioAuth.getSession();
      if (!session) {
        window.ParcourioAuth.ouvrirModale({ messageContexte: "Crée un compte gratuit pour débloquer le test avancé." });
      } else {
        window.ParcourioAuth.ouvrirModaleAbonnement();
      }
    });
  }

  const boutonRapportPremium = resultSection.querySelector('#rapportPremiumBtn');
  if (boutonRapportPremium && window.ParcourioAuth) {
    boutonRapportPremium.addEventListener('click', () => {
      const session = window.ParcourioAuth.getSession();
      if (!session) {
        window.ParcourioAuth.ouvrirModale({ messageContexte: "Crée un compte gratuit pour débloquer ton rapport PDF." });
      } else {
        window.ParcourioAuth.ouvrirModaleAbonnement();
      }
    });
  }

  const boutonTelechargerRapport = resultSection.querySelector('#telechargerRapportBtn');
  if (boutonTelechargerRapport) {
    boutonTelechargerRapport.addEventListener('click', () => genererRapportPDF(d));
  }

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
    await afficherResultatsApresDiplome(ecoles);
  } else {
    await afficherResultatsMetier(ecoles);
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

const implantationLabels = {
  siege: "Siège",
  campus: "Campus"
};

/* Ces deux tables décrivent le budget de scolarité et le mode
   d'apprentissage. Les champs "budget" (une valeur) et
   "modeApprentissage" (une liste) sont optionnels sur chaque école :
   tant qu'ils ne sont pas renseignés dans ecoles.json, aucun badge ne
   s'affiche et le filtre correspondant ne fait rien pour cette école
   (voir /assets/data/ecoles.json pour ajouter ces informations, une
   fois vérifiées, école par école). */
const BUDGET_LABELS = {
  moins_300k: "Moins de 300 000 FCFA / an",
  "300k_600k": "300 000 – 600 000 FCFA / an",
  "600k_1m": "600 000 – 1 000 000 FCFA / an",
  plus_1m: "Plus de 1 000 000 FCFA / an"
};

const MODE_LABELS = {
  presentiel: "Présentiel",
  distanciel: "Distanciel",
  alternance: "Alternance"
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

  if (window.ParcourioAnalytics) {
    window.ParcourioAnalytics.track('consultation_ecole', { ecoleId: e.id || null, nom: e.nom || null, ville: e.ville || null });
  }

  const lignesInfo = [];
  if (e.adresse) lignesInfo.push(`<p class="ecole-modal-line">${Icons.svg('map-pin', { class: 'icon-inline' })} ${e.adresse}</p>`);
  if (!e.adresse && e.ville) lignesInfo.push(`<p class="ecole-modal-line">${Icons.svg('map-pin', { class: 'icon-inline' })} ${e.ville}${e.region && e.region !== e.ville ? ` — région de ${e.region}` : ''}</p>`);
  if (e.telephone) lignesInfo.push(`<p class="ecole-modal-line">${Icons.svg('phone', { class: 'icon-inline' })} ${e.telephone}</p>`);
  if (e.email) lignesInfo.push(`<p class="ecole-modal-line">${Icons.svg('mail', { class: 'icon-inline' })} ${e.email}</p>`);

  const reseaux = e.reseaux && typeof e.reseaux === 'object' ? Object.entries(e.reseaux).filter(([, v]) => v) : [];
  const reseauxHTML = reseaux.length
    ? `<p class="ecole-modal-line">${Icons.svg('link', { class: 'icon-inline' })} ${reseaux.map(([nom, url]) => `<a href="${url}" target="_blank" rel="noopener">${nom}</a>`).join(' · ')}</p>`
    : '';

  const tags = (liste) => (liste && liste.length)
    ? `<div class="ecole-modal-tags">${liste.map(t => `<span class="ecole-modal-tag">${t}</span>`).join('')}</div>`
    : '';

  /* Établissements ayant plusieurs implantations : on retrouve les fiches
     sœurs (même groupeId) pour permettre de basculer d'un campus à l'autre
     sans confusion sur laquelle on consulte. */
  const autresImplantations = e.groupeId
    ? Object.values(ecolesIndex)
        .filter(autre => autre.groupeId === e.groupeId && autre.id !== e.id)
        .sort((a, b) => (a.implantation === 'siege' ? -1 : 1) - (b.implantation === 'siege' ? -1 : 1))
    : [];

  const implantationHTML = autresImplantations.length
    ? `<div class="ecole-modal-implantations">
        <h4 class="ecole-modal-subtitle">Autres implantations de ${e.groupeNom || 'cet établissement'}</h4>
        <div class="ecole-modal-implantations-list">
          ${autresImplantations.map(autre => `
            <button type="button" class="ecole-modal-implantation-btn" data-implantation-id="${autre.id}">
              ${Icons.svg(autre.implantation === 'siege' ? 'landmark' : 'map-pin', { class: 'icon-inline' })}
              <span>${autre.ville}</span>
              <span class="ecole-modal-implantation-tag">${implantationLabels[autre.implantation] || ''}</span>
            </button>
          `).join('')}
        </div>
      </div>`
    : '';

  contenu.dataset.ecoleId = e.id || '';
  contenu.innerHTML = `
    <div class="ecole-badges">
      <span class="domaine-badge ${e.domaine}">${domaineLabels[e.domaine] || e.domaine}</span>
      ${e.type ? `<span class="type-badge ${e.type === 'public' ? 'is-public' : 'is-prive'}">${Icons.svg(e.type === 'public' ? 'landmark' : 'school', { class: 'icon-inline' })} ${typeLabels[e.type] || e.type}</span>` : ''}
      ${e.implantation ? `<span class="implantation-badge is-${e.implantation}">${Icons.svg(e.implantation === 'siege' ? 'landmark' : 'map-pin', { class: 'icon-inline' })} ${implantationLabels[e.implantation]}</span>` : ''}
    </div>
    <h3>${e.nom}${e.sigle ? ` <span class="ecole-modal-sigle">(${e.sigle})</span>` : ''}</h3>
    ${e.groupeNom ? `<p class="ecole-modal-groupe-note">${implantationLabels[e.implantation] || ''} de ${e.groupeNom} — les informations ci-dessous concernent uniquement l'implantation de ${e.ville}.</p>` : ''}
    ${e.description ? `<p class="ecole-modal-desc">${e.description}</p>` : '<p class="ecole-modal-desc ecole-modal-desc-empty">Pas encore de description détaillée pour cet établissement — écris-nous si tu peux nous aider à la compléter.</p>'}
    ${lignesInfo.join('')}
    ${reseauxHTML}
    ${implantationHTML}
    ${e.secteurs && e.secteurs.length ? `<h4 class="ecole-modal-subtitle">Filières / secteurs</h4>${tags(e.secteurs)}` : ''}
    ${e.diplomes && e.diplomes.length ? `<h4 class="ecole-modal-subtitle">Diplômes délivrés</h4>${tags(e.diplomes)}` : ''}
    ${e.niveauAccepte && e.niveauAccepte.length ? `<h4 class="ecole-modal-subtitle">Niveau d'admission</h4>${tags(e.niveauAccepte)}` : ''}
    ${e.reconnuEtat === true ? `<p class="ecole-modal-badge-reconnu">${Icons.svg('check', { class: 'icon-inline' })} Établissement reconnu par l'État</p>` : ''}
    ${e.budget ? `<h4 class="ecole-modal-subtitle">Budget de scolarité estimé</h4><p class="ecole-modal-desc">${BUDGET_LABELS[e.budget] || e.budget}</p>` : ''}
    ${e.modeApprentissage && e.modeApprentissage.length ? `<h4 class="ecole-modal-subtitle">Mode d'apprentissage</h4>${tags(e.modeApprentissage.map(m => MODE_LABELS[m] || m))}` : ''}
    ${e.admission ? `<h4 class="ecole-modal-subtitle">Conditions d'admission</h4><p class="ecole-modal-desc">${e.admission}</p>` : ''}
    <h4 class="ecole-modal-subtitle">Avis étudiants</h4>
    <div id="avisSection" class="avis-section"><p class="note">Chargement des avis…</p></div>
    <div class="ecole-modal-actions">
      <button type="button" class="ecole-modal-favori${e.id && estFavori(e.id) ? ' is-favori' : ''}" id="ecoleModalFavoriBtn" data-id="${e.id || ''}" aria-pressed="${e.id && estFavori(e.id) ? 'true' : 'false'}">
        <span class="ecole-modal-favori-icon">${Icons.svg('star', { filled: e.id && estFavori(e.id) })}</span> ${e.id && estFavori(e.id) ? 'Dans mes favoris' : 'Ajouter aux favoris'}
      </button>
      ${e.siteOfficiel ? `<a class="btn-primary" id="ecoleModalSiteBtn" href="${e.siteOfficiel}" target="_blank" rel="noopener">Visiter le site officiel</a>` : '<span class="ecole-modal-nosite">Site officiel non référencé pour le moment</span>'}
    </div>
  `;

  contenu.querySelectorAll('.ecole-modal-implantation-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const autre = ecolesIndex[btn.dataset.implantationId];
      if (autre) ouvrirModaleEcole(autre);
    });
  });

  const siteBtn = document.getElementById('ecoleModalSiteBtn');
  if (siteBtn && window.ParcourioAnalytics) {
    siteBtn.addEventListener('click', () => {
      window.ParcourioAnalytics.track('clic_ecole', { ecoleId: e.id || null, nom: e.nom || null, url: e.siteOfficiel || null });
    });
  }

  const favoriBtn = document.getElementById('ecoleModalFavoriBtn');
  if (favoriBtn && e.id) {
    favoriBtn.addEventListener('click', () => {
      const actif = basculerFavori(e.id);
      favoriBtn.classList.toggle('is-favori', actif);
      favoriBtn.setAttribute('aria-pressed', String(actif));
      favoriBtn.querySelector('.ecole-modal-favori-icon').innerHTML = Icons.svg('star', { filled: actif });
      favoriBtn.lastChild.textContent = actif ? ' Dans mes favoris' : ' Ajouter aux favoris';
      const carte = document.querySelector(`.ecole-card[data-id="${CSS.escape(e.id)}"]`);
      if (carte) {
        const btnCarte = carte.querySelector('.ecole-card-favori');
        if (btnCarte) {
          btnCarte.classList.toggle('is-favori', actif);
          btnCarte.setAttribute('aria-pressed', String(actif));
          btnCarte.innerHTML = Icons.svg('star', { filled: actif });
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
  if (typeof chargerAvisEcole === 'function' && e.id) chargerAvisEcole(e.id);
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
    contenu.innerHTML = `<h3>Comparateur d'écoles</h3><p class="comparateur-empty">Sélectionne au moins deux écoles (bouton ${Icons.svg('scale', { class: 'icon-inline' })} sur chaque fiche) pour les comparer côte à côte.</p>`;
    return;
  }
  const lignes = [
    { label: 'Ville / Région', rendu: e => `${e.ville || '—'}${e.region && e.region !== e.ville ? ` · ${e.region}` : ''}` },
    { label: 'Statut', rendu: e => e.type === 'public' ? `${Icons.svg('landmark', { class: 'icon-inline' })} Public` : (e.type === 'privé' ? `${Icons.svg('school', { class: 'icon-inline' })} Privé` : '—') },
    { label: "Reconnu par l'État", rendu: e => e.reconnuEtat === true ? `${Icons.svg('check', { class: 'icon-inline' })} Oui` : '<span class="note">Non confirmé</span>' },
    { label: 'Domaine', rendu: e => domaineLabels[e.domaine] || e.domaine || '—' },
    { label: 'Niveaux acceptés', rendu: e => celluleListe(e.niveauAccepte) },
    { label: 'Budget de scolarité', rendu: e => e.budget ? (BUDGET_LABELS[e.budget] || e.budget) : '<span class="note">Non précisé</span>' },
    { label: "Mode d'apprentissage", rendu: e => e.modeApprentissage && e.modeApprentissage.length ? celluleListe(e.modeApprentissage.map(m => MODE_LABELS[m] || m)) : '<span class="note">Non précisé</span>' },
    { label: 'Diplômes', rendu: e => celluleListe(e.diplomes) },
    { label: 'Secteurs / filières', rendu: e => celluleListe(e.secteurs) },
    { label: 'Admission', rendu: e => e.admission || '<span class="note">Non précisé</span>' },
    { label: 'Site officiel', rendu: e => e.siteOfficiel ? `<a href="${e.siteOfficiel}" target="_blank" rel="noopener">Visiter ${Icons.svg('arrow-right', { class: 'icon-inline' })}</a>` : '<span class="note">Non référencé</span>' },
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
  const implantationChips = document.querySelectorAll('.implantation-chip');
  const implantationFilterGroup = document.getElementById('implantationFilterGroup');
  const budgetChips = document.querySelectorAll('.budget-chip');
  const modeChips = document.querySelectorAll('.mode-chip');
  const favorisToggle = document.getElementById('favorisToggle');
  const toggleBtn = document.getElementById('ecolesToggleBtn');

  if (!grid || !countEl || !searchInput || !villeSelect) return;

  const ecoles = liste.filter(e => e.ville && e.domaine && e.nom);
  ecoles.forEach(e => { if (e.id) ecolesIndex[e.id] = e; });

  /* Si la base est vide alors qu'on est ouvert en double-clic (protocole
     file://), ce n'est pas "0 école" mais un vrai problème de
     chargement local : on l'explique clairement au lieu de laisser
     croire à un bug du filtre. (Le fallback plus haut dans le fichier
     couvre déjà la plupart des cas file:// — ce message ne sert que de
     filet de sécurité si, pour une raison ou une autre, il n'a pas pu
     s'appliquer.) */
  if (ecoles.length === 0 && location.protocol === 'file:') {
    countEl.textContent = "Base d'écoles non chargée";
    if (toggleBtn) toggleBtn.style.display = 'none';
    grid.innerHTML = `<p class="directory-empty-local">
      La liste des écoles ne peut pas se charger en ouvrant ce fichier directement (double-clic, protocole <code>file://</code>).
      Lance un petit serveur local pour tester, par exemple <code>npx serve</code> ou <code>python -m http.server</code> dans le dossier du site, puis ouvre l'adresse affichée dans le terminal.
    </p>`;
    return;
  }

  /* Le filtre Siège / Campus n'apparaît que si le jeu de données contient
     effectivement des établissements multi-implantations : inutile de
     montrer ce filtre tant qu'aucune école n'a de groupeId renseigné. */
  if (implantationFilterGroup && ecoles.some(e => e.implantation)) {
    implantationFilterGroup.hidden = false;
  }

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

  const etat = { recherche: '', ville: '', region: '', domaine: '', type: '', niveau: '', implantation: '', budget: '', mode: '', favorisSeuls: false, aAfficheTout: false };
  etatDirectoire = etat;

  function filtresActifs() {
    return !!(etat.recherche || etat.ville || etat.region || etat.domaine || etat.type || etat.niveau || etat.implantation || etat.budget || etat.mode || etat.favorisSeuls);
  }

  function reinitialiserEtMasquer() {
    etat.recherche = '';
    etat.ville = '';
    etat.region = '';
    etat.domaine = '';
    etat.type = '';
    etat.niveau = '';
    etat.implantation = '';
    etat.budget = '';
    etat.mode = '';
    etat.favorisSeuls = false;
    etat.aAfficheTout = false;

    searchInput.value = '';
    villeSelect.value = '';
    if (regionSelect) regionSelect.value = '';
    chips.forEach(c => c.classList.toggle('is-active', c.dataset.domaine === ''));
    typeChips.forEach(c => c.classList.toggle('is-active', c.dataset.type === ''));
    niveauChips.forEach(c => c.classList.toggle('is-active', c.dataset.niveau === ''));
    implantationChips.forEach(c => c.classList.toggle('is-active', c.dataset.implantation === ''));
    budgetChips.forEach(c => c.classList.toggle('is-active', c.dataset.budget === ''));
    modeChips.forEach(c => c.classList.toggle('is-active', c.dataset.mode === ''));
    if (favorisToggle) {
      favorisToggle.setAttribute('aria-pressed', 'false');
      favorisToggle.querySelector('.favoris-toggle-icon').innerHTML = Icons.svg('star');
    }

    rendreEcoles();
    document.getElementById('ecoles').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* Un seul bouton qui bascule entre « Voir les X écoles de la base » et
     « Masquer les écoles », plutôt que deux boutons séparés qui se
     remplaçaient visuellement l'un l'autre à des endroits différents. */
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (filtresActifs() || etat.aAfficheTout) {
        reinitialiserEtMasquer();
      } else {
        etat.aAfficheTout = true;
        rendreEcoles();
      }
    });
  }

  function rendreEcoles() {
    // Tant qu'aucun filtre/recherche n'est actif et que la personne n'a pas
    // explicitement demandé à tout voir, on évite d'étaler la base entière
    // (encombrant) : on affiche une invitation à filtrer, avec un bouton
    // pour tout afficher quand même si elle le souhaite.
    if (!filtresActifs() && !etat.aAfficheTout) {
      if (toggleBtn) {
        toggleBtn.textContent = `Voir les ${ecoles.length} écoles de la base`;
        toggleBtn.classList.remove('is-masquer');
      }
      countEl.textContent = `${ecoles.length} école${ecoles.length > 1 ? 's' : ''} au total`;
      grid.innerHTML = `
        <div class="directory-empty directory-invite">
          <p>Utilise la recherche ou les filtres ci-dessus, ou clique sur le bouton pour voir toute la base.</p>
        </div>
      `;
      return;
    }

    if (toggleBtn) {
      toggleBtn.textContent = 'Masquer les écoles';
      toggleBtn.classList.add('is-masquer');
    }

    const rechercheNorm = normaliser(etat.recherche);
    const favoris = lireFavoris();
    const resultats = ecoles.filter(e => {
      if (etat.favorisSeuls && !favoris.includes(e.id)) return false;
      if (etat.ville && e.ville !== etat.ville) return false;
      if (etat.region && e.region !== etat.region) return false;
      if (etat.domaine && e.domaine !== etat.domaine) return false;
      if (etat.type && e.type !== etat.type) return false;
      if (etat.niveau && !(e.niveauAccepte || []).includes(etat.niveau)) return false;
      if (etat.implantation && e.implantation !== etat.implantation) return false;
      if (etat.budget && e.budget !== etat.budget) return false;
      if (etat.mode && !(e.modeApprentissage || []).includes(etat.mode)) return false;
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
        ? `<p class="directory-empty">Tu n'as pas encore d'école en favoris. Clique sur l'étoile ${Icons.svg('star', { class: 'icon-inline' })} d'une fiche pour l'ajouter ici.</p>`
        : '<p class="directory-empty">Aucune école ne correspond à ta recherche. Essaie une autre ville, une autre région, un autre domaine, un autre statut, ou efface le texte recherché.</p>';
      countEl.textContent = '0 école trouvée pour ces filtres';
      return;
    }

    grid.innerHTML = resultats
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
      .map(e => `
        <div class="card ecole-card visible" data-id="${e.id || ''}" data-domaine="${e.domaine || ''}" tabindex="0" role="button" aria-label="Voir la fiche de ${e.nom}">
          <button type="button" class="ecole-card-favori${e.id && favoris.includes(e.id) ? ' is-favori' : ''}" data-fav-id="${e.id || ''}" aria-pressed="${e.id && favoris.includes(e.id) ? 'true' : 'false'}" aria-label="${e.id && favoris.includes(e.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${Icons.svg('star', { filled: e.id && favoris.includes(e.id) })}</button>
          <button type="button" class="ecole-card-compare${e.id && compareSelection.includes(e.id) ? ' is-selected' : ''}" data-compare-id="${e.id || ''}" aria-pressed="${e.id && compareSelection.includes(e.id) ? 'true' : 'false'}" aria-label="Ajouter au comparateur">${Icons.svg('scale')}</button>
          <div class="ecole-badges">
            <span class="domaine-badge ${e.domaine}">${domaineLabels[e.domaine] || e.domaine}</span>
            ${e.type ? `<span class="type-badge ${e.type === 'public' ? 'is-public' : 'is-prive'}">${Icons.svg(e.type === 'public' ? 'landmark' : 'school', { class: 'icon-inline' })} ${typeLabels[e.type] || e.type}</span>` : ''}
            ${e.implantation ? `<span class="implantation-badge is-${e.implantation}">${Icons.svg(e.implantation === 'siege' ? 'landmark' : 'map-pin', { class: 'icon-inline' })} ${implantationLabels[e.implantation]}</span>` : ''}
          </div>
          <h3>${e.nom}</h3>
          <span class="ecole-ville">${e.ville}${e.region && e.region !== e.ville ? ` · ${e.region}` : ''}</span>
          ${e.groupeNom ? `<span class="ecole-groupe-note">${implantationLabels[e.implantation] || ''} de ${e.groupeNom}</span>` : ''}
          <hr class="card-stub-line" aria-hidden="true" />
          ${e.description ? `<p class="ecole-card-excerpt">${e.description.slice(0, 110)}${e.description.length > 110 ? '…' : ''}</p>` : ''}
          <span class="ecole-card-more">Voir la fiche ${Icons.svg('arrow-right', { class: 'icon-inline' })}</span>
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
          favBtn.innerHTML = Icons.svg('star', { filled: actif });
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

  budgetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      budgetChips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      etat.budget = chip.dataset.budget;
      rendreEcoles();
    });
  });

  modeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      modeChips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      etat.mode = chip.dataset.mode;
      rendreEcoles();
    });
  });

  if (favorisToggle) {
    favorisToggle.addEventListener('click', () => {
      etat.favorisSeuls = !etat.favorisSeuls;
      favorisToggle.setAttribute('aria-pressed', String(etat.favorisSeuls));
      favorisToggle.querySelector('.favoris-toggle-icon').innerHTML = Icons.svg('star', { filled: etat.favorisSeuls });
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

  // Pré-remplissage depuis l'URL (ex. ?ville=Kaolack&domaine=social),
  // utilisé par les pages SEO générées (/ecoles/<ville>.html,
  // /metiers/<id>.html) pour renvoyer directement vers l'annuaire déjà
  // filtré plutôt que sur une liste complète non pertinente.
  const paramsURL = new URLSearchParams(window.location.search);
  const villeParam = paramsURL.get('ville');
  const domaineParam = paramsURL.get('domaine');
  if (villeParam && villes.includes(villeParam)) {
    etat.ville = villeParam;
    villeSelect.value = villeParam;
  }
  if (domaineParam) {
    const chipCorrespondant = Array.from(chips).find(c => c.dataset.domaine === domaineParam);
    if (chipCorrespondant) {
      etat.domaine = domaineParam;
      chips.forEach(c => c.classList.toggle('is-active', c === chipCorrespondant));
    }
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
          <span class="form-status-icon">${Icons.svg('check')}</span>
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

/* ---------- Bouton retour en haut ---------- */
const backToTopBtn = document.getElementById('backToTop');
if (backToTopBtn) {
  const toggleBackToTop = () => {
    backToTopBtn.classList.toggle('is-visible', window.scrollY > 500);
  };
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ---------- Enregistrement du service worker (PWA) ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Échec de l\'enregistrement du service worker', err);
    });
  });
}

/* ---------- Rubrique Concours ---------- */
(function () {
  const grid = document.getElementById('concoursGrid');
  if (!grid || !window.CONCOURS_DATA) return;

  grid.innerHTML = window.CONCOURS_DATA.map(c => `
    <article class="concours-card">
      <h3>${c.nom}</h3>
      <p class="concours-organisme">${c.organisme}</p>
      <p class="concours-desc">${c.description}</p>
      <dl class="concours-details">
        <dt>Niveau requis</dt><dd>${c.niveauRequis}</dd>
        <dt>Âge</dt><dd>${c.age}</dd>
        <dt>Épreuves</dt><dd><ul>${c.epreuves.map(e => `<li>${e}</li>`).join('')}</ul></dd>
        <dt>Pièces à fournir</dt><dd><ul>${c.pieces.map(p => `<li>${p}</li>`).join('')}</ul></dd>
        <dt>Dates</dt><dd>${c.datesIndicatives}</dd>
      </dl>
      <div class="concours-footer">
        <a class="btn-secondary" href="${c.lienOfficiel}" target="_blank" rel="noopener">Site officiel ${Icons.svg('arrow-right', { class: 'icon-inline' })}</a>
        <p class="concours-source">Source : <a href="${c.lienSource}" target="_blank" rel="noopener">${c.source}</a></p>
      </div>
    </article>
  `).join('');
})();

/* ---------- Mon historique de tests ---------- */
(function () {
  const btn = document.getElementById('authHistoriqueBtn');
  const modale = document.getElementById('historiqueModal');
  const closeBtn = document.getElementById('historiqueModalClose');
  const backdrop = modale ? modale.querySelector('.ecole-modal-backdrop') : null;
  const liste = document.getElementById('historiqueListe');
  if (!btn || !modale || !liste) return;

  const PARCOURS_LABELS = { apres_diplome: "Après un diplôme", apprendre_metier: "Apprendre un métier" };
  const TYPE_LABELS = { rapide: "Test standard", avance: "Test avancé" };

  function formaterDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return iso;
    }
  }

  async function ouvrirHistorique() {
    modale.classList.add('is-open');
    modale.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    liste.innerHTML = '<p class="note">Chargement de ton historique…</p>';

    if (!window.ParcourioAuth || !window.ParcourioAuth.getSession()) {
      liste.innerHTML = '<p class="note">Connecte-toi pour voir ton historique de tests.</p>';
      return;
    }

    const resultats = await window.ParcourioAuth.recupererHistorique(20);
    if (!resultats.length) {
      liste.innerHTML = '<p class="note">Aucun test enregistré pour l\'instant — reviens ici après avoir passé le test d\'orientation.</p>';
      return;
    }

    liste.innerHTML = '<div class="historique-liste">' + resultats.map(r => {
      const res = r.resultat || {};
      return `
        <div class="historique-item">
          <div class="historique-item-entete">
            <span class="historique-item-titre">${res.titre || 'Résultat'}</span>
            <span class="historique-item-pct">${res.pourcentage != null ? res.pourcentage + '%' : ''}</span>
          </div>
          <p class="historique-item-meta">${PARCOURS_LABELS[r.parcours] || r.parcours} · ${TYPE_LABELS[r.type_test] || r.type_test} · ${formaterDate(r.created_at)}${res.ville ? ` · ${res.ville}` : ''}</p>
        </div>`;
    }).join('') + '</div>';
  }

  function fermerHistorique() {
    modale.classList.remove('is-open');
    modale.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  btn.addEventListener('click', () => {
    const dropdown = document.getElementById('authAccountDropdown');
    if (dropdown) dropdown.hidden = true;
    ouvrirHistorique();
  });
  if (closeBtn) closeBtn.addEventListener('click', fermerHistorique);
  if (backdrop) backdrop.addEventListener('click', fermerHistorique);
})();

/* ---------- Avis étudiants (fiche école) ---------- */
function etoiles(note) {
  const pleines = Math.round(note);
  let html = '<span class="avis-etoiles" aria-hidden="true">';
  for (let i = 1; i <= 5; i++) {
    html += Icons.svg('star', { filled: i <= pleines, class: 'icon-inline' });
  }
  return html + '</span>';
}

function formaterDateAvis(iso) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return '';
  }
}

async function chargerAvisEcole(ecoleId) {
  const section = document.getElementById('avisSection');
  if (!section || !window.ParcourioAvis) return;

  const { avis, moyenne, total } = await window.ParcourioAvis.getAvisEcole(ecoleId);
  // La fiche a pu changer (ou se fermer) pendant le chargement réseau :
  // on n'écrit que si on est toujours sur la même école.
  const contenuActuel = document.getElementById('ecoleModalContent');
  if (!contenuActuel || contenuActuel.dataset.ecoleId !== ecoleId) return;

  const resumeHTML = total
    ? `<div class="avis-resume">${etoiles(moyenne)}<span class="avis-resume-chiffre">${moyenne.toFixed(1)}/5</span><span class="note">(${total} avis)</span></div>`
    : `<p class="note">Aucun avis publié pour l'instant — sois le·la premier·ère à en laisser un.</p>`;

  const listeHTML = avis.length
    ? `<div class="avis-liste">${avis.map(a => `
        <div class="avis-item" data-avis-id="${a.id}">
          <div class="avis-item-entete">${etoiles(a.note)}<span class="note">${formaterDateAvis(a.created_at)}</span></div>
          ${a.commentaire ? `<p class="avis-item-texte">${echapperTexte(a.commentaire)}</p>` : ''}
          <button type="button" class="avis-signaler-btn" data-avis-id="${a.id}">Signaler</button>
        </div>
      `).join('')}</div>`
    : '';

  const session = window.ParcourioAuth ? window.ParcourioAuth.getSession() : null;
  let formHTML;
  if (!session) {
    formHTML = `<p class="note">Connecte-toi pour laisser ton propre avis sur cette école.</p>`;
  } else {
    const monAvis = await window.ParcourioAvis.monAvisPour(ecoleId);
    const statutNote = monAvis
      ? (monAvis.statut === 'approuve'
          ? "Ton avis est publié. Tu peux le modifier à tout moment."
          : "Ton avis est enregistré et en attente de vérification.")
      : "Ton avis est vérifié avant publication et n'apparaît pas immédiatement.";
    const options = [5, 4, 3, 2, 1].map(n => {
      const labels = { 5: 'Excellent', 4: 'Bien', 3: 'Correct', 2: 'Décevant', 1: 'Mauvais' };
      const selected = monAvis && Number(monAvis.note) === n ? ' selected' : '';
      return `<option value="${n}"${selected}>${n} — ${labels[n]}</option>`;
    }).join('');
    formHTML = `
      <form class="avis-form" id="avisForm">
        <label class="auth-form-label" for="avisNote">Ta note</label>
        <select class="auth-form-input" id="avisNote" name="note" required>
          <option value="">Sélectionner…</option>
          ${options}
        </select>
        <label class="auth-form-label" for="avisTexte">Ton commentaire (optionnel)</label>
        <textarea class="auth-form-input avis-textarea" id="avisTexte" name="texte" rows="3" maxlength="600" placeholder="Ton expérience dans cette école…">${monAvis && monAvis.commentaire ? echapperTexte(monAvis.commentaire) : ''}</textarea>
        <button type="submit" class="btn-secondary avis-form-submit">${monAvis ? 'Mettre à jour mon avis' : 'Publier mon avis'}</button>
        <p class="note avis-form-note">${statutNote}</p>
        <p class="auth-modal-erreur" id="avisFormErreur" hidden></p>
      </form>`;
  }

  section.innerHTML = resumeHTML + listeHTML + formHTML;

  section.querySelectorAll('.avis-signaler-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!window.ParcourioAuth || !window.ParcourioAuth.getSession()) {
        if (window.ParcourioAuth) window.ParcourioAuth.ouvrirModale({ messageContexte: "Connecte-toi pour signaler un avis." });
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Signalé';
      await window.ParcourioAvis.signalerAvis(btn.dataset.avisId, 'Signalé depuis la fiche école');
      if (window.ParcourioAuth.notifier) window.ParcourioAuth.notifier('Merci, cet avis a été signalé pour vérification.');
    });
  });

  const form = document.getElementById('avisForm');
  if (form) {
    form.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      const noteInput = form.querySelector('#avisNote');
      const texteInput = form.querySelector('#avisTexte');
      const erreurEl = form.querySelector('#avisFormErreur');
      const submitBtn = form.querySelector('.avis-form-submit');
      const texteOriginalBtn = submitBtn.textContent;
      erreurEl.hidden = true;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Envoi…';
      const resultat = await window.ParcourioAvis.laisserAvis(ecoleId, noteInput.value, texteInput.value);
      if (resultat.erreur) {
        erreurEl.textContent = resultat.erreur;
        erreurEl.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = texteOriginalBtn;
        return;
      }
      if (window.ParcourioAuth && window.ParcourioAuth.notifier) {
        window.ParcourioAuth.notifier('Merci ! Ton avis a été enregistré et sera publié après vérification.');
      }
      form.innerHTML = '<p class="note">Merci, ton avis a bien été enregistré et sera publié après vérification.</p>';
    });
  }
}

/* ---------- Rapport Premium (export PDF) ---------- */
function genererRapportPDF(d) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("Le générateur de PDF n'a pas pu se charger. Vérifie ta connexion et réessaie.");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marge = 48;
  const largeurPage = doc.internal.pageSize.getWidth();
  const largeurUtile = largeurPage - marge * 2;
  let y = 56;

  function sautDePageSiBesoin(hauteurNecessaire) {
    const hauteurPage = doc.internal.pageSize.getHeight();
    if (y + hauteurNecessaire > hauteurPage - marge) {
      doc.addPage();
      y = 56;
    }
  }

  function titreSection(texte) {
    sautDePageSiBesoin(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(3, 11, 30);
    doc.text(texte, marge, y);
    y += 8;
    doc.setDrawColor(253, 212, 0);
    doc.setLineWidth(1.5);
    doc.line(marge, y, marge + 40, y);
    y += 18;
  }

  function paragraphe(texte, options) {
    options = options || {};
    doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
    doc.setFontSize(options.size || 10.5);
    doc.setTextColor(40, 40, 50);
    const lignes = doc.splitTextToSize(texte, largeurUtile);
    sautDePageSiBesoin(lignes.length * 14 + 6);
    doc.text(lignes, marge, y);
    y += lignes.length * 14 + (options.espaceApres != null ? options.espaceApres : 12);
  }

  // En-tête
  doc.setFillColor(3, 11, 30);
  doc.rect(0, 0, largeurPage, 90, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(253, 212, 0);
  doc.text('PARCOURIO', marge, 42);
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.text("Rapport d'orientation — Test avancé", marge, 62);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), marge, 78);
  y = 122;

  // Profil
  titreSection(d.titre || 'Ton profil');
  paragraphe(d.correspondance || '', { bold: true, size: 11 });
  if (d.ville) paragraphe(`Ville renseignée : ${d.ville}`, { size: 9.5, espaceApres: 10 });
  if (d.description) paragraphe(d.description);
  if (d.conseil) paragraphe(`Pourquoi c'est la bonne décision : ${d.conseil}`);

  if (d.metiers && d.metiers.length) {
    titreSection('Exemples de métiers');
    paragraphe(d.metiers.join(' · '));
  }

  if (d.marche) {
    titreSection("Marché de l'emploi au Sénégal");
    paragraphe(d.marche);
  }

  if (d.debouches) {
    titreSection("Débouchés & perspectives d'évolution");
    paragraphe(d.debouches);
  }

  if (d.ecolesRecommandees && d.ecolesRecommandees.length) {
    titreSection(d.titreEcoles || 'Établissements recommandés');
    d.ecolesRecommandees.forEach((e) => {
      sautDePageSiBesoin(20);
      paragraphe(`${e.nom}${e.ville ? ` (${e.ville})` : ''} — ${e.compatibilite}% compatible`, { bold: true, espaceApres: 4 });
      if (e.raisonsCompatibilite && e.raisonsCompatibilite.length) {
        e.raisonsCompatibilite.forEach((r) => {
          // Les raisons peuvent contenir des balises d'icône SVG dans l'affichage web : on ne garde que le texte pour le PDF.
          const texteSeul = String(r).replace(/<[^>]*>/g, '').trim();
          if (texteSeul) paragraphe(`•  ${texteSeul}`, { size: 9.5, espaceApres: 2 });
        });
      }
      y += 6;
    });
  }

  // Pied de page sur chaque page
  const nbPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= nbPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 150);
    doc.text('Généré par Parcourio — parcourio.com — ce rapport est indicatif et ne remplace pas un conseil personnalisé.', marge, doc.internal.pageSize.getHeight() - 24);
    doc.text(String(i) + ' / ' + nbPages, largeurPage - marge - 24, doc.internal.pageSize.getHeight() - 24);
  }

  const nomFichier = 'parcourio-rapport-' + (d.titre || 'orientation').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '.pdf';
  doc.save(nomFichier);
}
