// =====================================================================
// Edge Function : valider-paiement-avance
// ---------------------------------------------------------------------
// Réservée aux administrateurs (allowlist ADMIN_EMAILS — même secret
// que admin-stats et moderer-avis, pas besoin d'en recréer un).
// Gère le cycle de vie des déclarations de paiement Wave du test
// avancé (table test_avance_achats) :
//
//   action "lister"  -> renvoie les paiements en attente de vérif,
//                        avec l'email de l'utilisateur concerné.
//   action "valider" -> passe une ligne à statut = "valide" (débloque
//                        la tentative de test avancé pour l'utilisateur).
//   action "rejeter" -> passe une ligne à statut = "rejete" (paiement
//                        introuvable / montant incorrect / etc.).
//
// Body JSON attendu : { action: "lister" } ou
//                      { action: "valider" | "rejeter", paiementId, notes? }
//
// DÉPLOIEMENT (dans le Dashboard Supabase) :
//   Edge Functions > Deploy a new function > nom :
//   "valider-paiement-avance" > colle ce code > Deploy.
//   Aucun nouveau secret : réutilise ADMIN_EMAILS déjà configuré pour
//   moderer-avis / admin-stats.
//
// C'est volontairement le SEUL endroit du code qui peut faire passer
// une ligne test_avance_achats au statut "valide" — la policy RLS sur
// la table interdit ça depuis le navigateur (voir schema-test-avance.sql).
// Quand l'API Wave sera branchée, un futur webhook pourra appeler la
// même logique de validation (ou insérer directement avec
// moyen_verification = 'wave_api') sans que cette fonction ni la table
// n'aient besoin de changer de forme.
// =====================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const adminEmailsRaw = Deno.env.get("ADMIN_EMAILS") || "";
    const adminEmails = adminEmailsRaw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Connecte-toi pour accéder à cette page." }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const callerEmail = (userData.user.email || "").toLowerCase();
    if (!adminEmails.length || !adminEmails.includes(callerEmail)) {
      return new Response(JSON.stringify({ error: "Accès refusé." }), {
        status: 403,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action;

    // ------------------------------------------------------------
    // lister : paiements "en_attente", du plus ancien au plus récent
    // (traiter les plus anciens en premier), avec l'email du payeur.
    // ------------------------------------------------------------
    if (action === "lister") {
      const { data: paiements, error: errPaiements } = await admin
        .from("test_avance_achats")
        .select("id, utilisateur_id, montant_fcfa, numero_wave_utilisateur, reference_wave, created_at")
        .eq("statut", "en_attente")
        .order("created_at", { ascending: true })
        .limit(200);
      if (errPaiements) throw errPaiements;

      const idsUtilisateurs = [...new Set((paiements || []).map((p) => p.utilisateur_id))];
      let emailsParId = {};
      if (idsUtilisateurs.length) {
        const { data: comptes, error: errComptes } = await admin
          .from("utilisateurs")
          .select("id, email, prenom, nom, telephone")
          .in("id", idsUtilisateurs);
        if (errComptes) throw errComptes;
        emailsParId = Object.fromEntries((comptes || []).map((c) => [c.id, c]));
      }

      const resultat = (paiements || []).map((p) => ({
        id: p.id,
        montantFcfa: p.montant_fcfa,
        numeroWaveUtilisateur: p.numero_wave_utilisateur,
        referenceWave: p.reference_wave,
        creeLe: p.created_at,
        utilisateur: emailsParId[p.utilisateur_id] || null,
      }));

      return new Response(JSON.stringify({ paiements: resultat }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // ------------------------------------------------------------
    // valider / rejeter : nécessite paiementId
    // ------------------------------------------------------------
    if (action === "valider" || action === "rejeter") {
      const paiementId = body.paiementId;
      if (!paiementId) {
        return new Response(JSON.stringify({ error: "paiementId manquant." }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      const nouveauStatut = action === "valider" ? "valide" : "rejete";
      const { data: miseAJour, error: errMaj } = await admin
        .from("test_avance_achats")
        .update({
          statut: nouveauStatut,
          notes_admin: body.notes || null,
          valide_par: userData.user.id,
          valide_le: new Date().toISOString(),
        })
        .eq("id", paiementId)
        .eq("statut", "en_attente") // évite de re-traiter un paiement déjà tranché
        .select()
        .single();

      if (errMaj) throw errMaj;
      if (!miseAJour) {
        return new Response(JSON.stringify({ error: "Ce paiement a déjà été traité ou est introuvable." }), {
          status: 409,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, paiement: miseAJour }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Action inconnue." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Erreur serveur." }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
