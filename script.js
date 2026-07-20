/* =====================================================================
   ORIENTATION ENGINE — Parcourio
   ---------------------------------------------------------------------
   Moteur générique, indépendant du contenu des questions (voir
   assets/data/orientation-data.js). Il sait :
   1. Générer le HTML d'un questionnaire à partir d'une liste de
      questions typées (single / multi / scale / rank / select / text).
   2. Collecter les réponses saisies dans le formulaire.
   3. Calculer un score par profil de filière, normalisé en pourcentage,
      avec le détail des réponses qui ont le plus pesé (pour expliquer
      "pourquoi" une recommandation est faite).
   4. Sélectionner et classer les écoles les plus pertinentes.

   Ajouter un nouveau type de question, un nouveau profil ou une
   nouvelle règle de recommandation ne nécessite pas de réécrire ce
   fichier : il suffit d'enrichir orientation-data.js. Ce fichier ne
   contient aucune donnée métier (aucun texte de question, aucun score
   codé en dur).
   ===================================================================== */

(function (global) {
  "use strict";

  const RANK_WEIGHTS = [3, 2, 1, 1, 1]; // poids du 1er, 2e, 3e choix, etc.

  /* ---------------------------------------------------------------
     RENDU DU FORMULAIRE
     --------------------------------------------------------------- */

  function idPourMeta(formId, questionId) {
    return `${formId}_${questionId}`;
  }

  function echapper(texte) {
    const div = document.createElement("div");
    div.textContent = texte == null ? "" : String(texte);
    return div.innerHTML;
  }

  function rendreOptionSimple(question, opt, type) {
    const champType = type === "multi" ? "checkbox" : "radio";
    const nomChamp = type === "multi" ? `${question.id}[]` : question.id;
    const classeExtra = type === "multi" ? " quiz-option--checkbox" : "";
    const requis = (type === "single" && question.required) ? " required" : "";
    return `<label class="quiz-option${classeExtra}">
      <input type="${champType}" name="${nomChamp}" value="${echapper(opt.value)}"${requis} />
      ${echapper(opt.label)}
    </label>`;
  }

  function rendreEchelle(question) {
    const ech = question.echelle;
    const points = ech.positions.map(pos => `
      <label class="quiz-scale-point">
        <input type="radio" name="${question.id}" value="${echapper(pos.value)}" ${question.required ? "required" : ""} />
        <span></span>
      </label>
    `).join("");
    return `
      <div class="quiz-scale">
        <span class="quiz-scale-pole">${echapper(ech.poleGauche)}</span>
        <div class="quiz-scale-track">${points}</div>
        <span class="quiz-scale-pole">${echapper(ech.poleDroite)}</span>
      </div>
    `;
  }

  function rendreRank(question) {
    const nb = question.max || 3;
    const optionsHTML = question.options.map(o => `<option value="${echapper(o.value)}">${echapper(o.label)}</option>`).join("");
    let html = '<div class="quiz-rank">';
    for (let i = 1; i <= nb; i++) {
      html += `
        <label class="quiz-rank-row">
          <span class="quiz-rank-num">${i}${i === 1 ? "er" : "e"} choix</span>
          <select name="rank_${i}_${question.id}" class="quiz-rank-select" data-rank-group="${question.id}" ${i === 1 && question.required ? "required" : ""}>
            <option value="">Choisir…</option>
            ${optionsHTML}
          </select>
        </label>
      `;
    }
    html += "</div>";
    return html;
  }

  function rendreQuestionNotee(question) {
    let corpsHTML = "";
    if (question.type === "single") {
      corpsHTML = `<div class="quiz-options">${question.options.map(o => rendreOptionSimple(question, o, "single")).join("")}</div>`;
    } else if (question.type === "multi") {
      corpsHTML = `<div class="quiz-options">${question.options.map(o => rendreOptionSimple(question, o, "multi")).join("")}</div>`;
    } else if (question.type === "scale") {
      corpsHTML = rendreEchelle(question);
    } else if (question.type === "rank") {
      corpsHTML = rendreRank(question);
    }
    const aideHTML = question.aide ? `<p class="quiz-aide">${echapper(question.aide)}</p>` : "";
    const compteurHTML = (question.type === "multi" && question.max) ? `<span class="quiz-compteur" data-compteur-pour="${question.id}">0 / ${question.max} sélectionnés</span>` : "";
    return `
      <div class="quiz-q" data-question-id="${question.id}">
        <span class="q-label">${echapper(question.label)}</span>
        ${aideHTML}
        ${corpsHTML}
        ${compteurHTML}
      </div>
    `;
  }

  function rendreQuestionMeta(question, formId) {
    const id = idPourMeta(formId, question.id);
    const dependAttr = question.dependsOn ? ` data-depends-on="${idPourMeta(formId, question.dependsOn.id)}" data-depends-value="${echapper(question.dependsOn.value)}"` : "";
    const styleInit = question.dependsOn ? ' style="display:none"' : "";
    let champHTML = "";
    if (question.type === "select") {
      const opts = question.options.map(o => `<option value="${echapper(o.value)}">${echapper(o.label)}</option>`).join("");
      champHTML = `<select id="${id}" name="${question.id}" ${question.required ? "required" : ""}><option value="">Choisir…</option>${opts}</select>`;
    } else if (question.type === "text") {
      champHTML = `<input id="${id}" name="${question.id}" type="text" placeholder="${echapper(question.placeholder || "")}" ${question.required ? "required" : ""} />`;
    }
    return `<label class="meta-field" id="${id}_wrap"${dependAttr}${styleInit}>${echapper(question.label)}${champHTML}</label>`;
  }

  /* Regroupe les questions par catégorie, en conservant l'ordre
     d'apparition de chaque catégorie. */
  function grouperParCategorie(questions) {
    const ordre = [];
    const groupes = {};
    questions.forEach(q => {
      const cat = q.categorie || "Questions";
      if (!groupes[cat]) { groupes[cat] = []; ordre.push(cat); }
      groupes[cat].push(q);
    });
    return ordre.map(cat => ({ categorie: cat, questions: groupes[cat] }));
  }

  /* Compte le nombre de questions "répondues" parmi la liste fournie,
     avec la même logique (souple) que collecterReponses : une question
     est considérée répondue dès qu'elle a au moins une valeur saisie. */
  function compterReponses(formEl, questions, formId) {
    let repondues = 0;
    questions.forEach(q => {
      if (q.meta) {
        const el = document.getElementById(idPourMeta(formId, q.id));
        if (el && el.value) repondues++;
        return;
      }
      if (q.type === "single" || q.type === "scale") {
        if (formEl.querySelector(`input[name="${q.id}"]:checked`)) repondues++;
      } else if (q.type === "multi") {
        if (formEl.querySelector(`input[name="${q.id}[]"]:checked`)) repondues++;
      } else if (q.type === "rank") {
        if (formEl.querySelector(`select[name="rank_1_${q.id}"]`)?.value) repondues++;
      }
    });
    return repondues;
  }

  /* Construit la barre de progression collante (compteur + bouton retour)
     et retourne un objet avec une méthode maj() à appeler à chaque
     changement de réponse. */
  function rendreProgression(formEl, questions, formId, onRetour) {
    const total = questions.length;
    const barre = document.createElement("div");
    barre.className = "quiz-progress";
    barre.innerHTML = `
      <button type="button" class="quiz-progress-retour">← Changer de parcours</button>
      <div class="quiz-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="0">
        <div class="quiz-progress-fill"></div>
      </div>
      <span class="quiz-progress-label">0 / ${total} répondues</span>
    `;
    const ancienneBarre = formEl.previousElementSibling;
    if (ancienneBarre && ancienneBarre.classList.contains("quiz-progress")) {
      ancienneBarre.remove();
    }
    formEl.parentNode.insertBefore(barre, formEl);

    const track = barre.querySelector(".quiz-progress-track");
    const fill = barre.querySelector(".quiz-progress-fill");
    const label = barre.querySelector(".quiz-progress-label");
    const retourBtn = barre.querySelector(".quiz-progress-retour");
    if (typeof onRetour === "function") retourBtn.addEventListener("click", onRetour);

    const maj = () => {
      const repondues = compterReponses(formEl, questions, formId);
      const pct = total ? Math.round((repondues / total) * 100) : 0;
      fill.style.width = `${pct}%`;
      track.setAttribute("aria-valuenow", String(repondues));
      label.textContent = `${repondues} / ${total} répondues`;
    };
    formEl.addEventListener("input", maj);
    formEl.addEventListener("change", maj);
    maj();
  }

  /* Construit le HTML complet du questionnaire dans formEl et branche
     les interactions (dépendances, compteurs, exclusivité du rank). */
  function rendreFormulaire(formEl, questions, opts) {
    const formId = opts.formId;
    const boutonLabel = opts.boutonLabel || "Voir mon orientation";
    const groupes = grouperParCategorie(questions);

    let html = "";
    groupes.forEach(groupe => {
      html += `<h3 class="quiz-categorie">${echapper(groupe.categorie)}</h3>`;
      groupe.questions.forEach(q => {
        html += q.meta ? rendreQuestionMeta(q, formId) : rendreQuestionNotee(q);
      });
    });
    html += `<button type="submit">${echapper(boutonLabel)}</button>`;
    formEl.innerHTML = html;
    rendreProgression(formEl, questions, formId, opts.onRetour);

    /* Dépendances d'affichage (ex : n'afficher "objectif" que si
       niveau === "Études supérieures") */
    formEl.querySelectorAll("[data-depends-on]").forEach(wrap => {
      const sourceId = wrap.dataset.dependsOn;
      const valeurAttendue = wrap.dataset.dependsValue;
      const source = document.getElementById(sourceId);
      if (!source) return;
      const majAffichage = () => {
        const visible = source.value === valeurAttendue;
        wrap.style.display = visible ? "flex" : "none";
        const champ = wrap.querySelector("select, input");
        if (champ) champ.disabled = !visible;
      };
      source.addEventListener("change", majAffichage);
      majAffichage();
    });

    /* Compteur + verrouillage des cases à cocher au-delà du maximum */
    questions.filter(q => q.type === "multi" && q.max).forEach(q => {
      const cases = Array.from(formEl.querySelectorAll(`input[name="${q.id}[]"]`));
      const compteurEl = formEl.querySelector(`[data-compteur-pour="${q.id}"]`);
      const majEtat = () => {
        const coches = cases.filter(c => c.checked);
        if (compteurEl) compteurEl.textContent = `${coches.length} / ${q.max} sélectionnés`;
        const limiteAtteinte = coches.length >= q.max;
        cases.forEach(c => { if (!c.checked) c.disabled = limiteAtteinte; });
      };
      cases.forEach(c => c.addEventListener("change", majEtat));
      majEtat();
    });

    /* Un même choix ne peut pas être sélectionné à deux rangs
       différents dans une question de type "rank" */
    questions.filter(q => q.type === "rank").forEach(q => {
      const selects = Array.from(formEl.querySelectorAll(`select[data-rank-group="${q.id}"]`));
      const majOptions = () => {
        const valeursChoisies = selects.map(s => s.value).filter(Boolean);
        selects.forEach(s => {
          Array.from(s.options).forEach(o => {
            if (!o.value) return;
            o.disabled = valeursChoisies.includes(o.value) && s.value !== o.value;
          });
        });
      };
      selects.forEach(s => s.addEventListener("change", majOptions));
    });
  }

  /* ---------------------------------------------------------------
     COLLECTE DES RÉPONSES
     --------------------------------------------------------------- */

  function collecterReponses(formEl, questions, formId) {
    const reponses = {};
    const contexte = {};
    questions.forEach(q => {
      if (q.meta) {
        const el = document.getElementById(idPourMeta(formId, q.id));
        contexte[q.id] = el ? el.value : "";
        return;
      }
      if (q.type === "single" || q.type === "scale") {
        const coche = formEl.querySelector(`input[name="${q.id}"]:checked`);
        reponses[q.id] = coche ? coche.value : null;
      } else if (q.type === "multi") {
        reponses[q.id] = Array.from(formEl.querySelectorAll(`input[name="${q.id}[]"]:checked`)).map(c => c.value);
      } else if (q.type === "rank") {
        const nb = q.max || 3;
        const valeurs = [];
        for (let i = 1; i <= nb; i++) {
          const sel = formEl.querySelector(`select[name="rank_${i}_${q.id}"]`);
          if (sel && sel.value) valeurs.push(sel.value);
        }
        reponses[q.id] = valeurs;
      }
    });
    return { reponses, contexte };
  }

  /* ---------------------------------------------------------------
     CALCUL DES SCORES
     --------------------------------------------------------------- */

  function idsProfils(registre) {
    return Object.keys(registre || global.OrientationData.PROFILS);
  }

  function trouverOption(question, valeur) {
    return question.options.find(o => o.value === valeur);
  }

  function calculerScores(questions, reponses, registre) {
    const profils = idsProfils(registre);
    const scores = {};
    const maxPossible = {};
    const contributions = {}; // profilId -> [{ label, poids }]
    profils.forEach(p => { scores[p] = 0; maxPossible[p] = 0; contributions[p] = []; });

    questions.forEach(q => {
      if (q.meta) return;
      const poids = (q.poids !== undefined) ? q.poids : 1;

      if (q.type === "single") {
        // Plafond théorique : meilleure option possible pour chaque profil
        if (poids > 0) {
          profils.forEach(p => {
            const meilleur = Math.max(0, ...q.options.map(o => (o.scores[p] || 0) * poids));
            maxPossible[p] += meilleur;
          });
        }
        const valeur = reponses[q.id];
        const opt = valeur ? trouverOption(q, valeur) : null;
        if (opt) {
          profils.forEach(p => {
            const contrib = (opt.scores[p] || 0) * poids;
            scores[p] += contrib;
            if (contrib > 0) contributions[p].push({ label: `${q.label} → ${opt.label}`, poids: contrib });
          });
        }
      }

      else if (q.type === "multi") {
        if (poids > 0) {
          profils.forEach(p => {
            // Plafond : les "max" meilleures options pour ce profil
            const valeursTriees = q.options.map(o => (o.scores[p] || 0) * poids).sort((a, b) => b - a);
            const limite = q.max || valeursTriees.length;
            const meilleur = valeursTriees.slice(0, limite).reduce((s, v) => s + Math.max(v, 0), 0);
            maxPossible[p] += meilleur;
          });
        }
        const valeurs = reponses[q.id] || [];
        valeurs.forEach(v => {
          const opt = trouverOption(q, v);
          if (!opt) return;
          profils.forEach(p => {
            const contrib = (opt.scores[p] || 0) * poids;
            scores[p] += contrib;
            if (contrib > 0) contributions[p].push({ label: `${q.label} → ${opt.label}`, poids: contrib });
          });
        });
      }

      else if (q.type === "scale") {
        const positions = q.echelle.positions;
        if (poids > 0) {
          profils.forEach(p => {
            const meilleur = Math.max(0, ...positions.map(pos => (pos.scores[p] || 0) * poids));
            maxPossible[p] += meilleur;
          });
        }
        const valeur = reponses[q.id];
        const pos = valeur ? positions.find(p2 => p2.value === valeur) : null;
        if (pos) {
          profils.forEach(p => {
            const contrib = (pos.scores[p] || 0) * poids;
            scores[p] += contrib;
            if (contrib > 0) contributions[p].push({ label: `${q.label}`, poids: contrib });
          });
        }
      }

      else if (q.type === "rank") {
        // Plafond : meilleure combinaison possible (poids décroissants)
        profils.forEach(p => {
          const valeursTriees = q.options.map(o => (o.scores[p] || 0)).sort((a, b) => b - a);
          let meilleur = 0;
          valeursTriees.slice(0, q.max || 3).forEach((v, idx) => { meilleur += Math.max(v, 0) * (RANK_WEIGHTS[idx] || 1); });
          maxPossible[p] += meilleur;
        });
        const valeurs = reponses[q.id] || [];
        valeurs.forEach((v, idx) => {
          const opt = trouverOption(q, v);
          if (!opt) return;
          const poidsRang = RANK_WEIGHTS[idx] || 1;
          profils.forEach(p => {
            const contrib = (opt.scores[p] || 0) * poidsRang;
            scores[p] += contrib;
            if (contrib > 0) contributions[p].push({ label: `${q.label} → ${opt.label} (choix n°${idx + 1})`, poids: contrib });
          });
        });
      }
    });

    const pourcentages = {};
    profils.forEach(p => {
      const plafond = maxPossible[p] || 1;
      pourcentages[p] = Math.max(0, Math.min(100, Math.round((scores[p] / plafond) * 100)));
    });

    return { scores, maxPossible, contributions, pourcentages };
  }

  function classerProfils(pourcentages) {
    return Object.entries(pourcentages)
      .sort((a, b) => b[1] - a[1])
      .map(([id, pct]) => ({ id, pct }));
  }

  function genererExplication(profilId, contributions, limite) {
    const liste = (contributions[profilId] || [])
      .slice()
      .sort((a, b) => b.poids - a.poids)
      .map(c => c.label);
    const vues = new Set();
    const uniques = [];
    liste.forEach(l => { if (!vues.has(l) && uniques.length < (limite || 4)) { vues.add(l); uniques.push(l); } });
    return uniques;
  }

  /* ---------------------------------------------------------------
     SÉLECTION DES ÉCOLES
     --------------------------------------------------------------- */

  function normaliserTexte(texte) {
    return (texte || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /* Renvoie jusqu'à "limite" écoles pertinentes pour un profil donné,
     en priorisant : la ville, puis la région, puis le pays entier ;
     et en valorisant les correspondances de secteur et de statut
     public/privé sans jamais exclure totalement les autres résultats
     (la base reste volontairement petite, mieux vaut montrer une
     alternative que rien du tout). */
  /* Renvoie jusqu'à "limite" écoles pertinentes pour un profil donné,
     avec pour chacune un score de compatibilité en pourcentage et la
     liste des raisons qui l'expliquent (pour l'affichage "94% compatible
     ✓ raison1 ✓ raison2"). Priorise : la ville, puis la région, puis le
     pays entier ; valorise aussi les correspondances de secteur, de
     statut public/privé et de niveau d'études visé, sans jamais exclure
     totalement les autres résultats (la base reste volontairement
     petite, mieux vaut montrer une alternative que rien du tout). */
  const NIVEAU_VISE_VERS_CANON = {
    bts_dut: "BTS",
    licence: "Licence",
    master: "Master",
    doctorat: "Master",
    pro_courte: null
  };

  function selectionnerEcoles(ecolesBrutes, profil, contexte, limite) {
    limite = limite || 4;
    const ville = contexte.ville || "";
    const region = contexte.region || "";
    const typePref = contexte.type_etablissement || "indifferent";
    const niveauViseCanon = NIVEAU_VISE_VERS_CANON[contexte.niveau_etudes_vise] || null;
    const motsClefs = (profil.motsClefsSecteurs || []).map(normaliserTexte);

    const candidatsDuDomaine = ecolesBrutes.filter(e => e.ville && e.domaine === profil.macro);

    const BASE = 55;
    const PTS_VILLE = 20;
    const PTS_REGION = 12;
    const PTS_TYPE = 8;
    const PTS_SECTEUR = 6;
    const PTS_SECTEUR_MAX = 12;
    const PTS_NIVEAU = 10;
    const PLAFOND = BASE + PTS_VILLE + PTS_TYPE + PTS_SECTEUR_MAX + PTS_NIVEAU;

    function evaluer(e) {
      let s = BASE;
      let bonusLocalisation = 0;
      const raisons = [`Domaine ${profil.nom.toLowerCase()} correspondant à ton profil`];

      if (ville && e.ville === ville) {
        bonusLocalisation = PTS_VILLE;
        raisons.push(`Située à ${ville}, ta ville`);
      } else if (region && e.region === region) {
        bonusLocalisation = PTS_REGION;
        raisons.push(`Dans ta région (${region})`);
      }
      s += bonusLocalisation;

      if (typePref !== "indifferent" && e.type === (typePref === "public" ? "public" : "privé")) {
        s += PTS_TYPE;
        raisons.push(`Statut ${e.type} comme souhaité`);
      }

      if (motsClefs.length && e.secteurs && e.secteurs.length) {
        const secteursNorm = e.secteurs.map(normaliserTexte);
        const secteursMatches = e.secteurs.filter((sec, idx) => motsClefs.includes(secteursNorm[idx]));
        if (secteursMatches.length) {
          s += Math.min(secteursMatches.length * PTS_SECTEUR, PTS_SECTEUR_MAX);
          raisons.push(`Propose une formation en ${secteursMatches.slice(0, 2).join(' / ')}`);
        }
      }

      if (niveauViseCanon && e.niveauAccepte && e.niveauAccepte.includes(niveauViseCanon)) {
        s += PTS_NIVEAU;
        raisons.push(`Accessible au niveau ${niveauViseCanon} que tu vises`);
      }

      const pct = Math.max(1, Math.min(98, Math.round((s / PLAFOND) * 100)));
      return { e, s, pct, raisons, bonusLocalisation };
    }

    let resultats = candidatsDuDomaine.map(evaluer).sort((a, b) => b.s - a.s);

    let localise = resultats.filter(r => r.bonusLocalisation > 0); // ville ou région correspond
    let fallbackUtilise = false;
    if (localise.length === 0) {
      // Aucune école connue à proximité pour ce profil : on montre les
      // meilleures options nationales, en priorité à Dakar.
      fallbackUtilise = true;
      localise = resultats.length ? resultats : [];
    }

    // Filet de sécurité absolu : même si la base venait à ne plus
    // contenir AUCUNE école dans ce domaine précis (cas extrême, pas
    // rencontré aujourd'hui avec 200 écoles réparties sur les 4
    // domaines), on ne renvoie jamais une liste vide. On élargit la
    // recherche à toute la base, en gardant un score minimal honnête.
    if (localise.length === 0) {
      fallbackUtilise = true;
      localise = ecolesBrutes
        .filter(e => e.ville)
        .map(e => ({
          e,
          s: 0,
          pct: 15,
          raisons: ["Base en cours d'enrichissement pour ce domaine : voici une école de référence en attendant"],
          bonusLocalisation: 0
        }));
    }

    return {
      ecoles: localise.slice(0, limite).map(r => ({ ...r.e, compatibilite: r.pct, raisonsCompatibilite: r.raisons })),
      fallbackUtilise
    };
  }

  /* Variante de selectionnerEcoles pour le parcours "Je souhaite
     apprendre un métier" : au lieu de valoriser le niveau d'études visé
     (Master, Doctorat…), on valorise l'accessibilité immédiate — un
     niveau BFEM accepté, ou un nom d'établissement typiquement associé
     à la formation professionnelle (CFP, CFPT, Don Bosco…) — puisque
     l'objectif ici est une insertion rapide, pas un parcours long. */
  function selectionnerEcolesMetier(ecolesBrutes, metier, contexte, limite) {
    limite = limite || 4;
    const ville = contexte.ville || "";
    const typePref = contexte.type_etablissement || "indifferent";
    const motsClefsSecteurs = (metier.motsClefsSecteurs || []).map(normaliserTexte);
    const motsClefsNom = (metier.motsClefsNom || []).map(normaliserTexte);

    const candidats = ecolesBrutes.filter(e => e.ville && e.domaine === metier.macro);

    const BASE = 50;
    const PTS_VILLE = 18;
    const PTS_REGION = 10;
    const PTS_TYPE = 6;
    const PTS_SECTEUR = 8;
    const PTS_SECTEUR_MAX = 16;
    const PTS_ACCESSIBLE = 14;
    const PTS_NOM = 10;
    const PLAFOND = BASE + PTS_VILLE + PTS_TYPE + PTS_SECTEUR_MAX + PTS_ACCESSIBLE + PTS_NOM;

    function evaluer(e) {
      let s = BASE;
      let bonusLocalisation = 0;
      const raisons = [`Formation en ${metier.nom.toLowerCase()}`];

      if (ville && e.ville === ville) {
        bonusLocalisation = PTS_VILLE;
        raisons.push(`Située à ${ville}, ta ville`);
      } else if (contexte.region && e.region === contexte.region) {
        bonusLocalisation = PTS_REGION;
        raisons.push(`Dans ta région (${contexte.region})`);
      }
      s += bonusLocalisation;

      if (typePref !== "indifferent" && e.type === (typePref === "public" ? "public" : "privé")) {
        s += PTS_TYPE;
        raisons.push(`Statut ${e.type} comme souhaité`);
      }

      if (motsClefsSecteurs.length && e.secteurs && e.secteurs.length) {
        const secteursNorm = e.secteurs.map(normaliserTexte);
        const secteursMatches = e.secteurs.filter((sec, idx) => motsClefsSecteurs.includes(secteursNorm[idx]));
        if (secteursMatches.length) {
          s += Math.min(secteursMatches.length * PTS_SECTEUR, PTS_SECTEUR_MAX);
          raisons.push(`Propose une formation en ${secteursMatches.slice(0, 2).join(' / ')}`);
        }
      }

      if (e.niveauAccepte && e.niveauAccepte.includes("BFEM")) {
        s += PTS_ACCESSIBLE;
        raisons.push("Accessible dès le BFEM, sans attendre le BAC");
      }

      const cibleNom = normaliserTexte(`${e.nom || ""} ${e.sigle || ""}`);
      if (motsClefsNom.some(mot => cibleNom.includes(mot))) {
        s += PTS_NOM;
        raisons.push("Centre reconnu pour la formation professionnelle");
      }

      const pct = Math.max(1, Math.min(98, Math.round((s / PLAFOND) * 100)));
      return { e, s, pct, raisons, bonusLocalisation };
    }

    let resultats = candidats.map(evaluer).sort((a, b) => b.s - a.s);

    let localise = resultats.filter(r => r.bonusLocalisation > 0);
    let fallbackUtilise = false;
    if (localise.length === 0) {
      fallbackUtilise = true;
      localise = resultats.length ? resultats : [];
    }

    if (localise.length === 0) {
      fallbackUtilise = true;
      localise = ecolesBrutes
        .filter(e => e.ville)
        .map(e => ({
          e, s: 0, pct: 15,
          raisons: ["Base en cours d'enrichissement pour ce métier : voici une école de référence en attendant"],
          bonusLocalisation: 0
        }));
    }

    return {
      ecoles: localise.slice(0, limite).map(r => ({ ...r.e, compatibilite: r.pct, raisonsCompatibilite: r.raisons })),
      fallbackUtilise
    };
  }

  /* ---------------------------------------------------------------
     EXPORT
     --------------------------------------------------------------- */
  global.OrientationEngine = {
    rendreFormulaire,
    collecterReponses,
    calculerScores,
    classerProfils,
    genererExplication,
    selectionnerEcoles,
    selectionnerEcolesMetier
  };
})(window);
