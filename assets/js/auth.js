/* =====================================================================
   AUTH — Parcourio
   ---------------------------------------------------------------------
   Gère : connexion au projet Supabase, inscription, connexion,
   déconnexion, état de session, et affichage de la modale de compte.

   Ce fichier ne connaît rien du test avancé ni de l'abonnement — il
   expose juste `window.ParcourioAuth` avec les fonctions dont les
   autres scripts (script.js) ont besoin :
     - ParcourioAuth.getSession()          -> session en cours (ou null)
     - ParcourioAuth.ouvrirModale(ctx)     -> ouvre la modale connexion/inscription
     - ParcourioAuth.surChangement(cb)     -> écouter les changements de session
     - ParcourioAuth.enregistrerResultat() -> sauvegarde un résultat de test (no-op si non connecté)
     - ParcourioAuth.recupererHistorique() -> résultats précédents de la personne connectée
   ===================================================================== */

(function (global) {
  "use strict";

  // ------------------------------------------------------------------
  // 1. Config — à remplacer par les valeurs de TON projet Supabase
  //    (Dashboard > Project Settings > API)
  // ------------------------------------------------------------------
  const SUPABASE_URL = "https://ggzhczswvyseqkbrosow.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_32syTUkJs0S_Xx4UvFcjLQ_hYhZAjQV";

  if (!global.supabase) {
    console.error("Parcourio Auth : le SDK Supabase n'est pas chargé. Vérifie que le script @supabase/supabase-js est bien inclus avant auth.js dans index.html.");
    return;
  }

  const client = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let sessionCourante = null;
  const abonnesChangement = [];

  function notifierChangement() {
    abonnesChangement.forEach((cb) => {
      try { cb(sessionCourante); } catch (e) { console.error(e); }
    });
  }

  client.auth.getSession().then(({ data }) => {
    sessionCourante = data.session;
    notifierChangement();
    mettreAJourUIHeader();
  });

  client.auth.onAuthStateChange((_event, session) => {
    sessionCourante = session;
    notifierChangement();
    mettreAJourUIHeader();
  });

  // ------------------------------------------------------------------
  // 2. Éléments DOM (créés dans index.html, voir plus bas)
  // ------------------------------------------------------------------
  let elModal, elBackdrop, elForm, elTitre, elSousTitre, elErreur,
      elEmail, elMdp, elPrenomWrap, elPrenom, elNomWrap, elNom,
      elTelephoneWrap, elTelephone, elRegionWrap, elRegion,
      elBoutonSubmit, elBasculerVersInscription,
      elBasculerVersConnexion, elBoutonHeader, elFermer,
      elAuthAccount, elAuthAccountTrigger, elAuthAccountDropdown,
      elAuthAvatar, elAuthAccountEmail, elAuthDropdownEmail,
      elAuthSignOutBtn, elAuthToast, elAuthWelcome, elAuthCompleterBtn,
      elProfilModal, elProfilBackdrop, elProfilForm, elProfilPrenom,
      elProfilNom, elProfilTelephone, elProfilRegion, elProfilErreur,
      elProfilSubmit, elProfilPlusTard,
      elAbonnementModal, elAbonnementBackdrop, elAbonnementClose,
      elAbonnementErreur, elAbonnementNote, elAbonnementChargement,
      elAbonnementEtatOffre, elAbonnementEtatAttente, elAbonnementEtatActif,
      elPaiementForm, elPaiementNumero, elPaiementReference, elPaiementSubmitBtn;

  let modeActuel = "connexion"; // ou "inscription"
  let contexteMessage = "";
  let etaitConnecteAvant = false; // pour ne déclencher le toast qu'au vrai moment de connexion

  function initDOM() {
    elModal = document.getElementById("authModal");
    elBackdrop = elModal.querySelector(".ecole-modal-backdrop");
    elFermer = document.getElementById("authModalClose");
    elForm = document.getElementById("authForm");
    elTitre = document.getElementById("authModalTitre");
    elSousTitre = document.getElementById("authModalSousTitre");
    elErreur = document.getElementById("authModalErreur");
    elEmail = document.getElementById("authEmail");
    elMdp = document.getElementById("authMotDePasse");
    elPrenomWrap = document.getElementById("authPrenomWrap");
    elPrenom = document.getElementById("authPrenom");
    elNomWrap = document.getElementById("authNomWrap");
    elNom = document.getElementById("authNom");
    elTelephoneWrap = document.getElementById("authTelephoneWrap");
    elTelephone = document.getElementById("authTelephone");
    elRegionWrap = document.getElementById("authRegionWrap");
    elRegion = document.getElementById("authRegion");
    elBoutonSubmit = document.getElementById("authSubmit");
    elBasculerVersInscription = document.getElementById("authVersInscription");
    elBasculerVersConnexion = document.getElementById("authVersConnexion");
    elBoutonHeader = document.getElementById("authHeaderBtn");
    elAuthAccount = document.getElementById("authAccount");
    elAuthAccountTrigger = document.getElementById("authAccountTrigger");
    elAuthAccountDropdown = document.getElementById("authAccountDropdown");
    elAuthAvatar = document.getElementById("authAvatar");
    elAuthAccountEmail = document.getElementById("authAccountEmail");
    elAuthDropdownEmail = document.getElementById("authDropdownEmail");
    elAuthSignOutBtn = document.getElementById("authSignOutBtn");
    elAuthToast = document.getElementById("authToast");
    elAuthWelcome = document.getElementById("authWelcome");
    elAuthCompleterBtn = document.getElementById("authCompleterBtn");

    elProfilModal = document.getElementById("profilModal");
    elProfilBackdrop = elProfilModal.querySelector(".ecole-modal-backdrop");
    elProfilForm = document.getElementById("profilForm");
    elProfilPrenom = document.getElementById("profilPrenom");
    elProfilNom = document.getElementById("profilNom");
    elProfilTelephone = document.getElementById("profilTelephone");
    elProfilRegion = document.getElementById("profilRegion");
    elProfilErreur = document.getElementById("profilModalErreur");
    elProfilSubmit = document.getElementById("profilSubmit");
    elProfilPlusTard = document.getElementById("profilPlusTard");

    elProfilBackdrop.addEventListener("click", fermerModaleProfil);
    elProfilPlusTard.addEventListener("click", (e) => { e.preventDefault(); fermerModaleProfil(); });
    elProfilForm.addEventListener("submit", surSoumissionProfil);

    elAbonnementModal = document.getElementById("abonnementModal");
    elAbonnementBackdrop = elAbonnementModal.querySelector(".ecole-modal-backdrop");
    elAbonnementClose = document.getElementById("abonnementModalClose");
    elAbonnementErreur = document.getElementById("abonnementModalErreur");
    elAbonnementNote = document.getElementById("abonnementModalNote");
    elAbonnementChargement = document.getElementById("abonnementChargement");
    elAbonnementEtatOffre = document.getElementById("abonnementEtatOffre");
    elAbonnementEtatAttente = document.getElementById("abonnementEtatAttente");
    elAbonnementEtatActif = document.getElementById("abonnementEtatActif");
    elPaiementForm = document.getElementById("paiementForm");
    elPaiementNumero = document.getElementById("paiementNumero");
    elPaiementReference = document.getElementById("paiementReference");
    elPaiementSubmitBtn = document.getElementById("paiementSubmitBtn");

    elAbonnementBackdrop.addEventListener("click", fermerModaleAbonnement);
    elAbonnementClose.addEventListener("click", fermerModaleAbonnement);
    elPaiementForm.addEventListener("submit", surSoumissionPaiement);

    elFermer.addEventListener("click", fermerModale);
    elBackdrop.addEventListener("click", fermerModale);
    elBasculerVersInscription.addEventListener("click", (e) => { e.preventDefault(); basculerMode("inscription"); });
    elBasculerVersConnexion.addEventListener("click", (e) => { e.preventDefault(); basculerMode("connexion"); });
    elForm.addEventListener("submit", surSoumission);
    elBoutonHeader.addEventListener("click", () => ouvrirModale({}));
    elAuthAccountTrigger.addEventListener("click", basculerDropdown);
    elAuthSignOutBtn.addEventListener("click", deconnecter);
    if (elAuthCompleterBtn) {
      elAuthCompleterBtn.addEventListener("click", () => {
        fermerDropdown();
        ouvrirModaleProfil();
      });
    }
    document.addEventListener("click", (e) => {
      if (elAuthAccount && !elAuthAccount.contains(e.target)) fermerDropdown();
    });

    // Important : si la session a déjà été résolue (client.auth.getSession()
    // ou onAuthStateChange) AVANT que ce DOM existe, on resynchronise ici,
    // sinon l'UI resterait bloquée sur l'état "déconnecté" par erreur.
    mettreAJourUIHeader();

    const params = new URLSearchParams(window.location.search);
    if (params.get("abonnement") === "succes") {
      afficherToast("Paiement reçu — ton abonnement est actif ✓");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("abonnement") === "erreur") {
      afficherToast("Paiement annulé ou échoué.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }

  function basculerDropdown() {
    const estOuvert = !elAuthAccountDropdown.hidden;
    elAuthAccountDropdown.hidden = estOuvert;
    elAuthAccountTrigger.setAttribute("aria-expanded", String(!estOuvert));
  }

  function fermerDropdown() {
    if (!elAuthAccountDropdown) return;
    elAuthAccountDropdown.hidden = true;
    elAuthAccountTrigger.setAttribute("aria-expanded", "false");
  }

  function afficherToast(message) {
    if (!elAuthToast) return;
    elAuthToast.textContent = message;
    elAuthToast.hidden = false;
    elAuthToast.classList.add("is-visible");
    setTimeout(() => {
      elAuthToast.classList.remove("is-visible");
      setTimeout(() => { elAuthToast.hidden = true; }, 300);
    }, 3200);
  }

  function mettreAJourUIHeader() {
    if (!elBoutonHeader) return;

    if (sessionCourante) {
      const email = (sessionCourante.user && sessionCourante.user.email) || "";
      const meta = (sessionCourante.user && sessionCourante.user.user_metadata) || {};
      const prenom = meta.prenom || "";
      const nom = meta.nom || "";
      const nomComplet = [prenom, nom].filter(Boolean).join(" ");
      const nomAffiche = nomComplet || email;

      elBoutonHeader.hidden = true;
      elAuthAccount.hidden = false;
      elAuthAvatar.textContent = (prenom || email).charAt(0).toUpperCase() || "?";
      elAuthAccountEmail.textContent = prenom || email;
      elAuthDropdownEmail.textContent = nomComplet ? `${nomComplet} · ${email}` : email;
      if (elAuthCompleterBtn) elAuthCompleterBtn.hidden = !!(prenom && nom);

      if (elAuthWelcome) {
        elAuthWelcome.textContent = `👋 Bonjour, ${nomAffiche}`;
        elAuthWelcome.hidden = false;
      }

      if (!etaitConnecteAvant) {
        afficherToast(`Connecté avec succès ✓ ${prenom ? '— Bienvenue ' + prenom : ''}`);
      }
      etaitConnecteAvant = true;
    } else {
      elBoutonHeader.hidden = false;
      elAuthAccount.hidden = true;
      fermerDropdown();

      if (elAuthWelcome) {
        elAuthWelcome.hidden = true;
      }

      if (etaitConnecteAvant) {
        afficherToast("Déconnecté");
      }
      etaitConnecteAvant = false;
    }
  }

  function basculerMode(mode) {
    modeActuel = mode;
    elErreur.hidden = true;
    if (mode === "inscription") {
      elTitre.textContent = "Créer un compte gratuit";
      elBoutonSubmit.textContent = "Créer mon compte";
      elPrenomWrap.hidden = false;
      elPrenom.required = true;
      elNomWrap.hidden = false;
      elTelephoneWrap.hidden = false;
      elRegionWrap.hidden = false;
    } else {
      elTitre.textContent = "Se connecter";
      elBoutonSubmit.textContent = "Se connecter";
      elPrenomWrap.hidden = true;
      elPrenom.required = false;
      elNomWrap.hidden = true;
      elTelephoneWrap.hidden = true;
      elRegionWrap.hidden = true;
    }
    document.getElementById("authBasculeInscription").hidden = mode === "inscription";
    document.getElementById("authBasculeConnexion").hidden = mode === "connexion";
  }

  function ouvrirModaleProfil() {
    elProfilErreur.hidden = true;
    elProfilForm.reset();
    const meta = (sessionCourante && sessionCourante.user && sessionCourante.user.user_metadata) || {};
    elProfilPrenom.value = meta.prenom || "";
    elProfilNom.value = meta.nom || "";
    elProfilTelephone.value = meta.telephone || "";
    elProfilRegion.value = meta.region || "";
    elProfilModal.classList.add("is-open");
    elProfilModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    elProfilPrenom.focus();
  }

  function fermerModaleProfil() {
    elProfilModal.classList.remove("is-open");
    elProfilModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  async function surSoumissionProfil(e) {
    e.preventDefault();
    const prenom = elProfilPrenom.value.trim();
    const nom = elProfilNom.value.trim();
    const telephone = elProfilTelephone.value.trim();
    const region = elProfilRegion.value;
    elProfilSubmit.disabled = true;
    elProfilErreur.hidden = true;

    try {
      const { data, error } = await client.auth.updateUser({ data: { prenom, nom, telephone, region } });
      if (error) throw error;

      if (sessionCourante && sessionCourante.user) {
        await client.from("utilisateurs").update({ prenom, nom, telephone, region }).eq("id", sessionCourante.user.id);
      }

      sessionCourante = data.session || sessionCourante;
      fermerModaleProfil();
      mettreAJourUIHeader();
      afficherToast(`Merci, ${prenom} !`);
    } catch (err) {
      elProfilErreur.textContent = "Une erreur est survenue. Réessaie dans un instant.";
      elProfilErreur.hidden = false;
    } finally {
      elProfilSubmit.disabled = false;
    }
  }

  function verifierProfilComplet(session) {
    if (!session || !elProfilModal) return;
    const meta = session.user.user_metadata || {};
    if (!meta.prenom || !meta.telephone || !meta.region) {
      ouvrirModaleProfil();
    }
  }
  // Numéro Wave marchand de Parcourio, où les utilisateurs envoient
  // leurs 500 FCFA avant de déclarer leur paiement ci-dessous. Le
  // remplacer ici suffit à le mettre à jour partout (une seule source).
  const NUMERO_WAVE_PARCOURIO = "78 256 89 99";

  function afficherEtatAbonnement(etat, note) {
    elAbonnementChargement.hidden = true;
    elAbonnementEtatOffre.hidden = etat !== "offre";
    elAbonnementEtatAttente.hidden = etat !== "attente";
    elAbonnementEtatActif.hidden = etat !== "actif";
    if (note) {
      elAbonnementNote.textContent = note;
      elAbonnementNote.hidden = false;
    } else {
      elAbonnementNote.hidden = true;
    }
  }

  /* Regarde la déclaration de paiement la plus récente de la personne
     connectée et en déduit l'état à afficher dans la modale :
       - "offre"   : peut déclarer un paiement (aucune déclaration, ou
                     la précédente a été rejetée / déjà utilisée) ;
       - "attente" : une déclaration est en cours de vérification ;
       - "actif"   : un paiement validé et pas encore utilisé — le
                     test avancé est débloqué dès maintenant. */
  async function rafraichirEtatAbonnement() {
    elAbonnementErreur.hidden = true;
    elAbonnementChargement.hidden = false;
    elAbonnementEtatOffre.hidden = true;
    elAbonnementEtatAttente.hidden = true;
    elAbonnementEtatActif.hidden = true;
    elAbonnementNote.hidden = true;

    if (!sessionCourante || !sessionCourante.user) {
      afficherEtatAbonnement("offre");
      return;
    }

    try {
      const { data, error } = await client
        .from("test_avance_achats")
        .select("statut, tentative_utilisee")
        .eq("utilisateur_id", sessionCourante.user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;

      const derniere = data && data[0];
      if (!derniere) {
        afficherEtatAbonnement("offre");
      } else if (derniere.statut === "en_attente") {
        afficherEtatAbonnement("attente");
      } else if (derniere.statut === "valide" && !derniere.tentative_utilisee) {
        afficherEtatAbonnement("actif");
      } else if (derniere.statut === "valide" && derniere.tentative_utilisee) {
        afficherEtatAbonnement("offre", "Tu as déjà utilisé ta tentative précédente — tu peux en acheter une nouvelle ci-dessous.");
      } else if (derniere.statut === "rejete") {
        afficherEtatAbonnement("offre", "Ton paiement précédent n'a pas pu être vérifié. Vérifie le numéro Wave et réessaie, ou contacte-nous si le souci persiste.");
      } else {
        afficherEtatAbonnement("offre");
      }
    } catch (e) {
      console.error("Vérification du paiement du test avancé :", e);
      elAbonnementChargement.hidden = true;
      elAbonnementErreur.textContent = "Impossible de vérifier ton accès pour l'instant. Réessaie dans un instant.";
      elAbonnementErreur.hidden = false;
    }
  }

  function ouvrirModaleAbonnement() {
    elAbonnementErreur.hidden = true;
    document.getElementById("abonnementNumeroWave").textContent = NUMERO_WAVE_PARCOURIO;
    elPaiementForm.reset();
    elAbonnementModal.classList.add("is-open");
    elAbonnementModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    rafraichirEtatAbonnement();
  }

  function fermerModaleAbonnement() {
    elAbonnementModal.classList.remove("is-open");
    elAbonnementModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  /* Enregistre la déclaration de paiement de la personne connectée
     (statut "en_attente" par défaut côté base de données — voir
     schema-test-avance.sql). Un admin la valide ensuite manuellement
     depuis admin-paiements.html après vérification dans le Business
     Portal Wave. */
  async function surSoumissionPaiement(e) {
    e.preventDefault();
    if (!sessionCourante || !sessionCourante.user) return;

    elAbonnementErreur.hidden = true;
    elPaiementSubmitBtn.disabled = true;
    const texteOriginal = elPaiementSubmitBtn.textContent;
    elPaiementSubmitBtn.textContent = "Envoi…";

    try {
      const { error } = await client.from("test_avance_achats").insert({
        utilisateur_id: sessionCourante.user.id,
        numero_wave_utilisateur: elPaiementNumero.value.trim(),
        reference_wave: elPaiementReference.value.trim() || null,
      });
      if (error) {
        // Contrainte "un seul paiement en_attente à la fois" — la personne
        // a déjà une déclaration en cours, on lui montre simplement cet état.
        if (String(error.message || "").toLowerCase().includes("duplicate") || error.code === "23505") {
          await rafraichirEtatAbonnement();
          return;
        }
        throw error;
      }
      await rafraichirEtatAbonnement();
    } catch (err) {
      elAbonnementErreur.textContent = err.message || "Une erreur est survenue. Réessaie dans un instant.";
      elAbonnementErreur.hidden = false;
    } finally {
      elPaiementSubmitBtn.disabled = false;
      elPaiementSubmitBtn.textContent = texteOriginal;
    }
  }

  function ouvrirModale(opts = {}) {
    if (!elModal) initDOM();
    contexteMessage = opts.messageContexte || "";
    elSousTitre.textContent = contexteMessage || "Accède au test avancé et sauvegarde tes résultats.";
    elErreur.hidden = true;
    elForm.reset();
    basculerMode(opts.mode || "connexion");
    elModal.classList.add("is-open");
    elModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    elEmail.focus();
  }

  function fermerModale() {
    elModal.classList.remove("is-open");
    elModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function afficherErreur(message) {
    elErreur.textContent = message;
    elErreur.hidden = false;
  }

  async function surSoumission(e) {
    e.preventDefault();
    const email = elEmail.value.trim();
    const motDePasse = elMdp.value;
    elBoutonSubmit.disabled = true;
    elErreur.hidden = true;

    try {
      if (modeActuel === "inscription") {
        const prenom = elPrenom.value.trim();
        const nom = elNom.value.trim();
        const telephone = elTelephone.value.trim();
        const region = elRegion.value;
        const { error } = await client.auth.signUp({
          email,
          password: motDePasse,
          options: { data: { prenom, nom, telephone, region } },
        });
        if (error) throw error;
        elSousTitre.textContent = "Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.";
        basculerMode("connexion");
      } else {
        const { data, error } = await client.auth.signInWithPassword({ email, password: motDePasse });
        if (error) throw error;
        fermerModale();
        verifierProfilComplet(data.session);
      }
    } catch (err) {
      afficherErreur(traduireErreur(err));
    } finally {
      elBoutonSubmit.disabled = false;
    }
  }

  function traduireErreur(err) {
    const msg = (err && err.message) || "";
    if (msg.includes("Invalid login credentials")) return "Email ou mot de passe incorrect.";
    if (msg.includes("already registered")) return "Un compte existe déjà avec cet email — connecte-toi plutôt.";
    if (msg.includes("Password should be")) return "Le mot de passe doit faire au moins 6 caractères.";
    return "Une erreur est survenue. Réessaie dans un instant.";
  }

  async function deconnecter() {
    await client.auth.signOut();
  }

  function getSession() {
    return sessionCourante;
  }

  function surChangement(cb) {
    abonnesChangement.push(cb);
  }

  /* Vrai si la personne connectée a un paiement de test avancé validé
     et pas encore utilisé pour une tentative (voir schema-test-avance.sql
     — le passage à "utilisé" est géré par un trigger côté base de
     données dès qu'un résultat de type "avance" est enregistré, donc
     cette vérification reste fiable même après coup). */
  async function verifierAccesAvance() {
    if (!sessionCourante || !sessionCourante.user) return false;
    try {
      const { data, error } = await client
        .from("test_avance_achats")
        .select("statut, tentative_utilisee")
        .eq("utilisateur_id", sessionCourante.user.id)
        .eq("statut", "valide")
        .eq("tentative_utilisee", false);
      if (error || !data) return false;
      return data.length > 0;
    } catch (e) {
      console.error("Vérification accès test avancé :", e);
      return false;
    }
  }

  /* Enregistre un résultat de test dans l'historique de la personne
     connectée. Ne fait rien (silencieusement) si personne n'est
     connectée : l'historique est un avantage de compte, jamais un
     blocage pour passer le test anonymement. */
  async function enregistrerResultat({ parcours, typeTest, reponses, resultat }) {
    if (!sessionCourante || !sessionCourante.user) return null;
    try {
      const { data, error } = await client
        .from("resultats_tests")
        .insert({
          utilisateur_id: sessionCourante.user.id,
          parcours,
          type_test: typeTest || "rapide",
          reponses: reponses || null,
          resultat: resultat || null
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error("Enregistrement du résultat :", e);
      return null;
    }
  }

  /* Récupère les résultats précédents de la personne connectée, du
     plus récent au plus ancien. Retourne un tableau vide si personne
     n'est connectée ou en cas d'erreur — jamais d'exception qui
     casserait l'affichage de "Mon historique". */
  async function recupererHistorique(limite) {
    if (!sessionCourante || !sessionCourante.user) return [];
    try {
      const { data, error } = await client
        .from("resultats_tests")
        .select("id, parcours, type_test, resultat, created_at")
        .eq("utilisateur_id", sessionCourante.user.id)
        .order("created_at", { ascending: false })
        .limit(limite || 20);
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Récupération de l'historique :", e);
      return [];
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDOM);
  } else {
    initDOM();
  }

  global.ParcourioAuth = {
    client,
    getSession,
    ouvrirModale,
    fermerModale,
    surChangement,
    verifierAccesAvance,
    notifier: afficherToast,
    ouvrirModaleAbonnement,
    enregistrerResultat,
    recupererHistorique,
  };

})(window);
