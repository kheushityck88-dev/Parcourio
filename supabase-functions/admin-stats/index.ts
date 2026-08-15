// Edge Function: admin-stats
// Admin-only (email allowlist in ADMIN_EMAILS secret, same pattern as
// moderer-avis). Returns aggregated, real statistics for the admin
// dashboard: no invented numbers, everything comes from actual tables
// (utilisateurs, resultats_tests, abonnements, evenements).
//
// DEPLOY: Edge Functions > Deploy a new function > name "admin-stats"
// > paste this code > Deploy. Reuses the same ADMIN_EMAILS secret
// already set up for moderer-avis -- no new secret needed.

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function joursEnArriere(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function jourISO(date) {
  return new Date(date).toISOString().slice(0, 10); // "AAAA-MM-JJ"
}

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
      return new Response(JSON.stringify({ error: "Please sign in to access the dashboard." }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const callerEmail = (userData.user.email || "").toLowerCase();
    if (!adminEmails.length || !adminEmails.includes(callerEmail)) {
      return new Response(JSON.stringify({ error: "Access denied." }), {
        status: 403,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // --- 1. Utilisateurs : total, nouveaux (7j / 30j), évolution 30j ---
    const { count: totalUtilisateurs, error: errTotalUsers } = await admin
      .from("utilisateurs")
      .select("*", { count: "exact", head: true });
    if (errTotalUsers) throw errTotalUsers;

    const { data: utilisateurs30j, error: errUsers30 } = await admin
      .from("utilisateurs")
      .select("created_at")
      .gte("created_at", joursEnArriere(30));
    if (errUsers30) throw errUsers30;

    const nouveaux7j = (utilisateurs30j || []).filter((u) => u.created_at >= joursEnArriere(7)).length;
    const nouveaux30j = (utilisateurs30j || []).length;

    // Évolution jour par jour sur les 30 derniers jours (pour un graphique).
    const parJourUtilisateurs = {};
    for (const u of utilisateurs30j || []) {
      const j = jourISO(u.created_at);
      parJourUtilisateurs[j] = (parJourUtilisateurs[j] || 0) + 1;
    }
    const evolutionUtilisateurs = [];
    for (let i = 29; i >= 0; i--) {
      const j = jourISO(joursEnArriere(i));
      evolutionUtilisateurs.push({ jour: j, nouveaux: parJourUtilisateurs[j] || 0 });
    }

    // --- 2. Tests : commencés (evenements) vs terminés (resultats_tests) ---
    const { count: testsCommences7j, error: errTC7 } = await admin
      .from("evenements")
      .select("*", { count: "exact", head: true })
      .eq("type", "test_commence")
      .gte("created_at", joursEnArriere(7));
    if (errTC7) throw errTC7;

    const { count: testsCommencesTotal, error: errTCTotal } = await admin
      .from("evenements")
      .select("*", { count: "exact", head: true })
      .eq("type", "test_commence");
    if (errTCTotal) throw errTCTotal;

    const { count: testsTermines7j, error: errTT7 } = await admin
      .from("evenements")
      .select("*", { count: "exact", head: true })
      .eq("type", "test_termine")
      .gte("created_at", joursEnArriere(7));
    if (errTT7) throw errTT7;

    const { count: testsTerminesTotal, error: errTTTotal } = await admin
      .from("evenements")
      .select("*", { count: "exact", head: true })
      .eq("type", "test_termine");
    if (errTTTotal) throw errTTTotal;

    const tauxCompletion = testsCommencesTotal > 0
      ? Math.round((testsTerminesTotal / testsCommencesTotal) * 100)
      : null; // null = pas assez de données, pas "0%" trompeur

    // --- 3. Écoles et formations les plus consultées (30 derniers jours) ---
    const { data: consultationsEcoles, error: errCE } = await admin
      .from("evenements")
      .select("donnees")
      .eq("type", "consultation_ecole")
      .gte("created_at", joursEnArriere(30))
      .limit(5000);
    if (errCE) throw errCE;

    const compteEcoles = {};
    for (const ev of consultationsEcoles || []) {
      const nom = ev.donnees && ev.donnees.nom ? ev.donnees.nom : null;
      if (!nom) continue;
      compteEcoles[nom] = (compteEcoles[nom] || 0) + 1;
    }
    const topEcoles = Object.entries(compteEcoles)
      .map(([nom, n]) => ({ nom, consultations: n }))
      .sort((a, b) => b.consultations - a.consultations)
      .slice(0, 8);

    const { data: consultationsFormations, error: errCF } = await admin
      .from("evenements")
      .select("donnees")
      .eq("type", "consultation_formation")
      .gte("created_at", joursEnArriere(30))
      .limit(5000);
    if (errCF) throw errCF;

    const compteFormations = {};
    for (const ev of consultationsFormations || []) {
      const nom = ev.donnees && ev.donnees.nom ? ev.donnees.nom : null;
      if (!nom) continue;
      compteFormations[nom] = (compteFormations[nom] || 0) + 1;
    }
    const topFormations = Object.entries(compteFormations)
      .map(([nom, n]) => ({ nom, consultations: n }))
      .sort((a, b) => b.consultations - a.consultations)
      .slice(0, 8);

    // --- 4. Clics vers écoles (30j) ---
    const { count: clicsEcole30j, error: errClics } = await admin
      .from("evenements")
      .select("*", { count: "exact", head: true })
      .eq("type", "clic_ecole")
      .gte("created_at", joursEnArriere(30));
    if (errClics) throw errClics;

    // --- 4bis. Visites de la page d'accueil (7j / total) ---
    const { count: visites7j, error: errVis7 } = await admin
      .from("evenements")
      .select("*", { count: "exact", head: true })
      .eq("type", "visite_page")
      .gte("created_at", joursEnArriere(7));
    if (errVis7) throw errVis7;

    const { count: visitesTotal, error: errVisTotal } = await admin
      .from("evenements")
      .select("*", { count: "exact", head: true })
      .eq("type", "visite_page");
    if (errVisTotal) throw errVisTotal;

    // --- 5. Activité récente (20 derniers événements + inscriptions) ---
    const { data: evenementsRecents, error: errRecents } = await admin
      .from("evenements")
      .select("type, donnees, created_at")
      .neq("type", "visite_page")
      .order("created_at", { ascending: false })
      .limit(15);
    if (errRecents) throw errRecents;

    const { data: inscriptionsRecentes, error: errInscriptions } = await admin
      .from("utilisateurs")
      .select("prenom, email, created_at")
      .order("created_at", { ascending: false })
      .limit(10);
    if (errInscriptions) throw errInscriptions;

    const activite = [
      ...(evenementsRecents || []).map((e) => ({
        type: e.type,
        donnees: e.donnees,
        creeLe: e.created_at,
      })),
      ...(inscriptionsRecentes || []).map((u) => ({
        type: "inscription",
        donnees: { prenom: u.prenom, email: u.email },
        creeLe: u.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.creeLe).getTime() - new Date(a.creeLe).getTime())
      .slice(0, 20);

    // --- 6. Revenus / Premium : uniquement ce qui est réellement suivi ---
    // Il n'y a pas de montant enregistré par abonnement (voir
    // schema-comptes.sql) -- seule l'existence d'un abonnement actif
    // l'est. On ne calcule donc AUCUN chiffre de revenu tant que le
    // paiement Wave n'est pas branché : mieux vaut "aucune donnée" qu'un
    // faux 0 FCFA qui laisserait croire que c'est mesuré.
    const { count: abonnementsActifs, error: errAbos } = await admin
      .from("abonnements")
      .select("*", { count: "exact", head: true })
      .eq("statut", "actif");
    if (errAbos) throw errAbos;

    const paiementWaveActif = !!Deno.env.get("WAVE_API_KEY");

    return new Response(
      JSON.stringify({
        utilisateurs: {
          total: totalUtilisateurs || 0,
          nouveaux7j,
          nouveaux30j,
          evolution30j: evolutionUtilisateurs,
        },
        tests: {
          commences7j: testsCommences7j || 0,
          commencesTotal: testsCommencesTotal || 0,
          termines7j: testsTermines7j || 0,
          terminesTotal: testsTerminesTotal || 0,
          tauxCompletion, // peut être null si aucune donnée
        },
        visites: {
          visites7j: visites7j || 0,
          visitesTotal: visitesTotal || 0,
        },
        contenus: {
          topEcoles,
          topFormations,
          clicsEcole30j: clicsEcole30j || 0,
        },
        activiteRecente: activite,
        premium: {
          abonnementsActifs: abonnementsActifs || 0,
          paiementActif: paiementWaveActif,
          // revenuTotal volontairement absent : non mesuré actuellement.
        },
      }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Server error." }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
