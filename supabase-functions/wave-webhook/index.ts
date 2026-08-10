// =====================================================================
// Edge Function : wave-webhook
// ---------------------------------------------------------------------
// Reçoit les notifications de paiement de Wave. Vérifie la signature
// (pour être sûr que ça vient bien de Wave, pas d'un imposteur), puis
// active l'abonnement de l'utilisateur concerné.
//
// DÉPLOIEMENT (dans le Dashboard Supabase) :
//   Edge Functions > Deploy a new function > nom : "wave-webhook"
//   > colle ce code > Deploy.
//   IMPORTANT : cette fonction doit être accessible SANS authentification
//   Supabase (c'est Wave qui l'appelle, pas un utilisateur connecté) —
//   dans les options de déploiement, décoche "Enforce JWT verification"
//   si cette case existe pour cette fonction.
//
// Secret à configurer AVANT de déployer (Edge Functions > Secrets) :
//   WAVE_WEBHOOK_SECRET = le "signing secret" du webhook, visible dans
//   ton Business Portal Wave au moment où tu crées/configures le
//   webhook (Développeurs > Webhooks).
//
// Une fois déployée, copie l'URL de cette fonction (visible dans le
// Dashboard Supabase, onglet Edge Functions) et renseigne-la comme URL
// de webhook dans ton Business Portal Wave.
// =====================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

function verifierSignatureWave(waveSignatureHeader, body, signingSecret) {
  // Format de l'en-tête : "t=1699999999,v1=abcdef123..."
  const parties = Object.fromEntries(
    waveSignatureHeader.split(",").map((p) => p.split("="))
  );
  const timestamp = parties["t"];
  const signatureRecue = parties["v1"];
  if (!timestamp || !signatureRecue) return false;

  const payload = timestamp + body;
  const cle = new TextEncoder().encode(signingSecret);
  const message = new TextEncoder().encode(payload);

  return crypto.subtle
    .importKey("raw", cle, { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    .then((cleImportee) => crypto.subtle.sign("HMAC", cleImportee, message))
    .then((signatureBuffer) => {
      const signatureCalculee = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return signatureCalculee === signatureRecue;
    });
}

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const waveSignatureHeader = req.headers.get("Wave-Signature") || "";
    const signingSecret = Deno.env.get("WAVE_WEBHOOK_SECRET");

    const signatureValide = await verifierSignatureWave(waveSignatureHeader, body, signingSecret);
    if (!signatureValide) {
      console.error("Signature Wave invalide — requête ignorée.");
      return new Response("Signature invalide", { status: 401 });
    }

    const evenement = JSON.parse(body);

    if (evenement.type === "checkout.session.completed" || evenement.event === "checkout.session.completed") {
      const session = evenement.data;
      const userId = session.client_reference;
      const sessionId = session.id;

      if (!userId) {
        console.error("client_reference manquant dans le webhook Wave.");
        return new Response("client_reference manquant", { status: 400 });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const admin = createClient(supabaseUrl, serviceRoleKey);

      const dateFin = new Date();
      dateFin.setDate(dateFin.getDate() + 30);

      const { error } = await admin.from("abonnements").insert({
        utilisateur_id: userId,
        statut: "actif",
        plan: "mensuel",
        date_fin: dateFin.toISOString(),
        reference_paiement: sessionId,
      });

      // Si la référence de paiement existe déjà (webhook renvoyé deux
      // fois par Wave, ce qui arrive), on ignore l'erreur de doublon —
      // l'abonnement a déjà été activé la première fois.
      if (error && !String(error.message || "").includes("duplicate")) {
        console.error("Erreur lors de l'activation de l'abonnement :", error);
        return new Response("Erreur serveur", { status: 500 });
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Erreur serveur", { status: 500 });
  }
});
