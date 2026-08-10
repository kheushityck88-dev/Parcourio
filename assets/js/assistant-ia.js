/* =====================================================================
   ASSISTANT IA — Parcourio
   ---------------------------------------------------------------------
   Widget de chat flottant qui appelle la Supabase Edge Function
   "assistant-ia" (elle-même branchée sur l'API gratuite de Groq).
   Réutilise la session déjà ouverte par auth.js — n'appelle jamais de
   clé d'API IA depuis le navigateur.
   ===================================================================== */

(function () {
  "use strict";

  const boutonOuvrir = document.getElementById('assistantOuvrirBtn');
  const panneau = document.getElementById('assistantPanneau');
  const boutonFermer = document.getElementById('assistantFermerBtn');
  const zoneMessages = document.getElementById('assistantMessages');
  const form = document.getElementById('assistantForm');
  const input = document.getElementById('assistantInput');
  if (!boutonOuvrir || !panneau || !form || !input || !zoneMessages) return;

  let historique = [];
  let dejaOuvert = false;
  let modeAvanceSignale = false;

  function ajouterMessage(role, texte) {
    const bulle = document.createElement('div');
    bulle.className = 'assistant-bulle assistant-bulle-' + (role === 'user' ? 'moi' : 'assistant');
    bulle.textContent = texte;
    zoneMessages.appendChild(bulle);
    zoneMessages.scrollTop = zoneMessages.scrollHeight;
  }

  function ajouterMessageAttente() {
    const bulle = document.createElement('div');
    bulle.className = 'assistant-bulle assistant-bulle-assistant assistant-bulle-attente';
    bulle.id = 'assistantAttente';
    bulle.textContent = '…';
    zoneMessages.appendChild(bulle);
    zoneMessages.scrollTop = zoneMessages.scrollHeight;
  }

  function retirerMessageAttente() {
    const bulle = document.getElementById('assistantAttente');
    if (bulle) bulle.remove();
  }

  function ouvrirPanneau() {
    panneau.classList.add('is-open');
    boutonOuvrir.setAttribute('aria-expanded', 'true');
    if (!dejaOuvert) {
      dejaOuvert = true;
      const session = window.ParcourioAuth ? window.ParcourioAuth.getSession() : null;
      if (!session) {
        ajouterMessage('assistant', "Connecte-toi (gratuitement) pour discuter avec moi de ton orientation — ça m'évite d'être noyé par des robots et me permet de vraiment m'appuyer sur ton résultat de test !");
        input.disabled = true;
        form.querySelector('button[type="submit"]').disabled = true;
      } else {
        ajouterMessage('assistant', "Salut ! Je suis l'assistant Parcourio. Pose-moi une question sur ton orientation — ton profil, tes métiers possibles, tes options d'écoles…");
      }
    }
    input.focus();
  }

  function fermerPanneau() {
    panneau.classList.remove('is-open');
    boutonOuvrir.setAttribute('aria-expanded', 'false');
  }

  boutonOuvrir.addEventListener('click', () => {
    if (panneau.classList.contains('is-open')) fermerPanneau();
    else ouvrirPanneau();
  });
  if (boutonFermer) boutonFermer.addEventListener('click', fermerPanneau);

  form.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const texte = input.value.trim();
    if (!texte) return;

    const session = window.ParcourioAuth ? window.ParcourioAuth.getSession() : null;
    if (!session) {
      if (window.ParcourioAuth) window.ParcourioAuth.ouvrirModale({ messageContexte: "Connecte-toi pour discuter avec l'assistant." });
      return;
    }

    ajouterMessage('user', texte);
    historique.push({ role: 'user', content: texte });
    input.value = '';
    input.disabled = true;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    ajouterMessageAttente();

    try {
      const contexte = window.__dernierResultatTest
        ? {
            titre: window.__dernierResultatTest.titre,
            correspondance: window.__dernierResultatTest.correspondance,
            metiers: window.__dernierResultatTest.metiers,
            debouches: window.__dernierResultatTest.debouches,
            marche: window.__dernierResultatTest.marche,
            ville: window.__dernierResultatTest.ville,
            ecoles: (window.__dernierResultatTest.ecolesRecommandees || []).slice(0, 6).map((e) => e.nom).filter(Boolean)
          }
        : null;

      const { data, error } = await window.ParcourioAuth.client.functions.invoke('assistant-ia', {
        body: { messages: historique, contexte }
      });

      retirerMessageAttente();

      if (error || !data || data.error) {
        ajouterMessage('assistant', (data && data.error) || "L'assistant est momentanément indisponible, réessaie dans un instant.");
      } else {
        ajouterMessage('assistant', data.reponse);
        historique.push({ role: 'assistant', content: data.reponse });
        if (data.accesAvance && !modeAvanceSignale) {
          modeAvanceSignale = true;
          const entete = document.querySelector('.assistant-panneau-entete span');
          if (entete) entete.textContent = 'Assistant d\'orientation — Mode avancé ✨';
        }
      }
    } catch (e) {
      retirerMessageAttente();
      console.error("Assistant IA :", e);
      ajouterMessage('assistant', "Une erreur est survenue, réessaie dans un instant.");
    } finally {
      input.disabled = false;
      submitBtn.disabled = false;
      input.focus();
    }
  });
})();
