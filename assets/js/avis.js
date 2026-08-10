/* =====================================================================
   AVIS — Parcourio
   ---------------------------------------------------------------------
   Gère les avis étudiants (note + commentaire) sur les écoles :
   lecture des avis approuvés, dépôt d'un avis, signalement d'un avis.
   Réutilise la connexion Supabase déjà initialisée par auth.js
   (window.ParcourioAuth.client) plutôt que d'en ouvrir une deuxième.
   Expose window.ParcourioAvis :
     - getAvisEcole(ecoleId)              -> { avis, moyenne, total }
     - monAvisPour(ecoleId)               -> l'avis déjà posté par la
                                              personne connectée pour
                                              cette école, ou null
     - laisserAvis(ecoleId, note, texte)  -> crée/modifie son avis
     - signalerAvis(avisId, motif)        -> signale un avis existant
   Toutes les fonctions renvoient un résultat "sûr" (tableau vide,
   null, etc.) en cas d'erreur ou d'absence de session : ce module ne
   doit jamais faire planter l'affichage d'une fiche école.
   ===================================================================== */

(function (global) {
  "use strict";

  function getClient() {
    return global.ParcourioAuth ? global.ParcourioAuth.client : null;
  }

  function getSession() {
    return global.ParcourioAuth ? global.ParcourioAuth.getSession() : null;
  }

  async function getAvisEcole(ecoleId) {
    const client = getClient();
    if (!client || !ecoleId) return { avis: [], moyenne: null, total: 0 };
    try {
      const { data, error } = await client
        .from("avis")
        .select("id, note, commentaire, created_at, utilisateur_id")
        .eq("ecole_id", ecoleId)
        .eq("statut", "approuve")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const liste = data || [];
      const total = liste.length;
      const moyenne = total ? liste.reduce((s, a) => s + a.note, 0) / total : null;
      return { avis: liste, moyenne, total };
    } catch (e) {
      console.error("Chargement des avis :", e);
      return { avis: [], moyenne: null, total: 0 };
    }
  }

  async function monAvisPour(ecoleId) {
    const client = getClient();
    const session = getSession();
    if (!client || !session || !session.user || !ecoleId) return null;
    try {
      const { data, error } = await client
        .from("avis")
        .select("id, note, commentaire, statut")
        .eq("ecole_id", ecoleId)
        .eq("utilisateur_id", session.user.id)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    } catch (e) {
      console.error("Récupération de mon avis :", e);
      return null;
    }
  }

  async function laisserAvis(ecoleId, note, commentaire) {
    const client = getClient();
    const session = getSession();
    if (!client) return { erreur: "Service indisponible." };
    if (!session || !session.user) return { erreur: "Connecte-toi pour laisser un avis." };
    const noteNum = Number(note);
    if (!noteNum || noteNum < 1 || noteNum > 5) return { erreur: "Choisis une note entre 1 et 5." };
    try {
      const { data, error } = await client
        .from("avis")
        .upsert(
          {
            ecole_id: ecoleId,
            utilisateur_id: session.user.id,
            note: noteNum,
            commentaire: (commentaire || "").trim() || null,
            statut: "en_attente"
          },
          { onConflict: "ecole_id,utilisateur_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return { avis: data };
    } catch (e) {
      console.error("Envoi de l'avis :", e);
      return { erreur: "Impossible d'enregistrer ton avis pour l'instant." };
    }
  }

  async function signalerAvis(avisId, motif) {
    const client = getClient();
    const session = getSession();
    if (!client) return { erreur: "Service indisponible." };
    if (!session || !session.user) return { erreur: "Connecte-toi pour signaler un avis." };
    try {
      const { error } = await client
        .from("signalements_avis")
        .insert({
          avis_id: avisId,
          utilisateur_id: session.user.id,
          motif: (motif || "").trim() || null
        });
      if (error) throw error;
      return { ok: true };
    } catch (e) {
      // Un doublon (déjà signalé) n'est pas une vraie erreur pour la personne
      if (e && e.code === "23505") return { ok: true, dejaSignale: true };
      console.error("Signalement :", e);
      return { erreur: "Impossible d'enregistrer le signalement." };
    }
  }

  global.ParcourioAvis = {
    getAvisEcole,
    monAvisPour,
    laisserAvis,
    signalerAvis
  };
})(window);
