// =====================================================================
// Edge Function : activer-essai
// ---------------------------------------------------------------------
// Active un essai gratuit de 7 jours pour l'utilisateur connecté, une
// seule fois par compte (vérifié via utilisateurs.essai_utilise).
//
// DÉPLOIEMENT (dans le Dashboard Supabase) :
//   Edge Functions > Deploy a new function > nom : "activer-essai"
//   > colle ce code > Deploy.
// Aucun secret à configurer pour cette fonction : SUPABASE_URL et
// SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement par Supabase.
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

    // Client "admin" (clé service_role) : peut tout faire, y compris
    // contourner les policies RLS — utilisé uniquement côté serveur.
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // On vérifie le token de l'utilisateur pour savoir QUI fait la
    // demande, sans lui faire confiance sur son propre id.
    const { data: userData, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Non authentifié." }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { data: profil, error: profilError } = await admin
      .from("utilisateurs")
      .select("essai_utilise")
      .eq("id", userId)
      .single();

    if (profilError) throw profilError;

    if (profil.essai_utilise) {
      return new Response(JSON.stringify({ error: "Essai déjà utilisé sur ce compte." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const dateFin = new Date();
    dateFin.setDate(dateFin.getDate() + 7);

    const { error: insertError } = await admin.from("abonnements").insert({
      utilisateur_id: userId,
      statut: "actif",
      plan: "essai_gratuit",
      date_fin: dateFin.toISOString(),
    });
    if (insertError) throw insertError;

    const { error: updateError } = await admin
      .from("utilisateurs")
      .update({ essai_utilise: true })
      .eq("id", userId);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, date_fin: dateFin.toISOString() }), {
      status: 200,
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
