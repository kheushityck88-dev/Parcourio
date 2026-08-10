// =====================================================================
// Edge Function : creer-paiement-wave
// ---------------------------------------------------------------------
// Crée une session de paiement Wave Business pour l'abonnement mensuel
// (1990 FCFA), et renvoie l'URL de paiement (wave_launch_url) vers
// laquelle rediriger l'utilisateur.
//
// DÉPLOIEMENT (dans le Dashboard Supabase) :
//   Edge Functions > Deploy a new function > nom : "creer-paiement-wave"
//   > colle ce code > Deploy.
// Secret à configurer AVANT de déployer (Edge Functions > Secrets) :
//   WAVE_API_KEY = ta clé API Wave Business (Bearer wave_sn_prod_...),
//   trouvable dans ton Business Portal Wave > Développeurs / API.
//
// Remplace aussi SITE_URL ci-dessous par l'URL réelle de ton site.
// =====================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://www.parcourio.com";
const MONTANT_FCFA = "1990";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const waveApiKey = Deno.env.get("WAVE_API_KEY");

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Non authentifié." }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const waveResponse = await fetch("https://api.wave.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${waveApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: MONTANT_FCFA,
        currency: "XOF",
        client_reference: userId,
        success_url: `${SITE_URL}/?abonnement=succes`,
        error_url: `${SITE_URL}/?abonnement=erreur`,
      }),
    });

    const waveData = await waveResponse.json();

    if (!waveResponse.ok) {
      console.error("Erreur Wave :", waveData);
      return new Response(JSON.stringify({ error: "Erreur lors de la création du paiement." }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ wave_launch_url: waveData.wave_launch_url }), {
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