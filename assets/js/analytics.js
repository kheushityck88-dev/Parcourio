/* =====================================================================
   Parcourio — Analytics (assets/js/analytics.js)
   ---------------------------------------------------------------------
   Enregistre des événements d'usage réel (test commencé, école
   consultée, clic vers une école, page métier/ville vue) dans la table
   Supabase `evenements`, pour alimenter le dashboard admin avec de
   vraies données plutôt que des chiffres inventés.

   Volontairement SANS dépendance au SDK @supabase/supabase-js : passe
   par un simple fetch() vers l'API REST (PostgREST) de Supabase. Ça
   permet de l'inclure même sur les pages SEO statiques (metiers/*.html,
   ecoles/*.html) sans alourdir leur chargement avec toute la librairie.

   Échoue toujours en silence : un souci réseau ou un bloqueur de pub ne
   doit jamais empêcher la personne d'utiliser le site normalement.
   ===================================================================== */
(function (global) {
  "use strict";

  const SUPABASE_URL = "https://ggzhczswvyseqkbrosow.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_32syTUkJs0S_Xx4UvFcjLQ_hYhZAjQV";

  // Récupère l'utilisateur connecté depuis le stockage local que Supabase
  // Auth utilise déjà (posé par auth.js sur les pages qui le chargent).
  // Sur les pages sans auth.js (metiers/*.html, ecoles/*.html), ça reste
  // simplement "anonyme" — c'est très bien, on veut quand même compter
  // ces vues.
  function idUtilisateurConnecte() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const cle = localStorage.key(i);
        if (cle && cle.indexOf("-auth-token") !== -1) {
          const val = JSON.parse(localStorage.getItem(cle));
          if (val && val.user && val.user.id) return val.user.id;
        }
      }
    } catch (e) { /* pas grave, on reste anonyme */ }
    return null;
  }

  function track(type, donnees) {
    try {
      const corps = {
        type: type,
        utilisateur_id: idUtilisateurConnecte(),
        donnees: donnees || {},
      };

      fetch(SUPABASE_URL + "/rest/v1/evenements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: "Bearer " + SUPABASE_ANON_KEY,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(corps),
        // keepalive : la requête part même si la personne change de page
        // juste après (ex. clic vers le site officiel d'une école).
        keepalive: true,
      }).catch(function () { /* silencieux, jamais bloquant */ });
    } catch (e) { /* silencieux */ }
  }

  global.ParcourioAnalytics = { track: track };
})(window);
