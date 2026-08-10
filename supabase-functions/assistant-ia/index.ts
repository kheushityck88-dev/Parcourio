// =====================================================================
// Edge Function : assistant-ia
// ---------------------------------------------------------------------
// Assistant conversationnel qui répond aux questions d'orientation en
// s'appuyant sur le profil/résultat de test de la personne (si fourni
// par le client). Utilise l'API Groq (modèles Llama open-source,
// gratuits jusqu'à un quota quotidien généreux — voir docs.groq.com).
//
// DÉPLOIEMENT (dans le Dashboard Supabase) :
//   Edge Functions > Deploy a new function > nom : "assistant-ia"
//   > colle ce code > Deploy.
//   Puis Edge Functions > Secrets > ajoute GROQ_API_KEY (récupérée sur
//   console.groq.com — gratuit, sans carte bancaire).
//
// FILET DE SECOURS (optionnel mais recommandé) : ajoute aussi
// GEMINI_API_KEY (récupérée gratuitement sur aistudio.google.com,
// section "Get API key" — gratuit, sans carte bancaire non plus).
// Si Groq est saturé (quota gratuit dépassé) ou tombe en panne, la
// fonction bascule automatiquement sur Gemini pour cette requête, sans
// que la personne ne voie d'erreur. Sans ce secret, une saturation
// Groq renvoie simplement un message d'erreur poli.
//
// Accès réservé aux personnes connectées (compte gratuit suffit, pas
// besoin d'abonnement) : ça évite qu'un robot anonyme épuise le quota
// gratuit partagé par tout le monde.
// =====================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODELE_GROQ = "llama-3.1-8b-instant";       // rapide, pour le compte gratuit
const MODELE_GROQ_AVANCE = "llama-3.3-70b-versatile"; // plus capable, réservé au test avancé
const MAX_MESSAGES_HISTORIQUE = 8;   // on ne garde que les derniers échanges
const MAX_MESSAGES_HISTORIQUE_AVANCE = 16; // conversations plus longues pour les abonnés
const MAX_CARACTERES_MESSAGE = 800;  // évite les messages abusivement longs
const MAX_TOKENS_STANDARD = 400;
const MAX_TOKENS_AVANCE = 800; // réponses plus détaillées pour les abonnés

const PROMPT_SYSTEME = `Tu es l'assistant d'orientation de Parcourio, une plateforme qui aide les jeunes du Sénégal à choisir une formation adaptée à leur profil, leur niveau et leur ville.

Règles impératives :
- Tu réponds uniquement en français, avec un ton chaleureux, direct et concret, adapté à un public de lycéens/étudiants sénégalais.
- Tu ne parles QUE d'orientation scolaire, de métiers, de formations, d'écoles et de sujets directement liés — pour toute autre demande, tu recentres poliment la conversation vers l'orientation.
- Si le contexte ci-dessous contient le résultat d'un test que la personne a déjà passé, appuie-toi dessus pour personnaliser tes réponses (nomme son profil, ses métiers, ses débouchés).
- Ne invente JAMAIS de nom d'école précis, de frais de scolarité, ou de chiffre que tu ne connais pas avec certitude : reste sur des conseils généraux et renvoie vers l'annuaire du site pour les détails vérifiés.
- Reste concis : 3-5 phrases par réponse, sauf si la question demande vraiment plus de détail.
- Si la personne n'a pas encore fait le test d'orientation, encourage-la à le faire pour des conseils plus précis.
- Si la personne n'est pas abonnée au test avancé et pose une question qui demande une analyse vraiment poussée (plan d'étude détaillé, comparaison fine entre plusieurs écoles), tu peux mentionner brièvement que le test avancé donne des réponses plus approfondies, sans insister lourdement.`;

const PROMPT_SYSTEME_AVANCE = PROMPT_SYSTEME + `

Tu t'adresses ici à une personne abonnée au TEST AVANCÉ. Tu peux développer davantage (jusqu'à 8-10 phrases si utile), proposer des plans d'action concrets en plusieurs étapes, et croiser plusieurs informations de son profil pour des conseils plus personnalisés qu'avec un compte gratuit.`;

// Modèle de repli gratuit chez Google AI Studio, utilisé UNIQUEMENT si
// Groq est indisponible ou saturé (quota gratuit dépassé). Le nom du
// modèle Flash gratuit change de temps en temps chez Google : si cet
// appel échoue avec une erreur "model not found", va vérifier le nom
// exact du modèle Flash gratuit actuel sur aistudio.google.com.
const MODELE_GEMINI_SECOURS = "gemini-2.5-flash";

async function appellerGemini(messages, promptSysteme, maxTokens, geminiApiKey) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const reponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELE_GEMINI_SECOURS}:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: promptSysteme }] },
        generationConfig: { temperature: 0.6, maxOutputTokens: maxTokens },
      }),
    }
  );

  if (!reponse.ok) {
    const detail = await reponse.text();
    throw new Error(`Gemini a répondu ${reponse.status} : ${detail}`);
  }

  const donnees = await reponse.json();
  const texte = donnees.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texte) throw new Error("Réponse Gemini vide ou mal formée.");
  return texte;
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
    const groqApiKey = Deno.env.get("GROQ_API_KEY");

    if (!groqApiKey) {
      return new Response(JSON.stringify({ error: "Assistant IA non configuré (clé Groq manquante côté serveur)." }), {
        status: 503,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: userData, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Connecte-toi pour utiliser l'assistant." }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Vérification de l'abonnement CÔTÉ SERVEUR — on ne fait jamais
    // confiance à un éventuel indicateur envoyé par le navigateur, sinon
    // n'importe qui pourrait se déclarer "abonné" en modifiant la requête.
    let accesAvance = false;
    try {
      const { data: abonnements } = await admin
        .from("abonnements")
        .select("statut, date_fin")
        .eq("utilisateur_id", userData.user.id)
        .eq("statut", "actif");
      const maintenant = new Date();
      accesAvance = !!(abonnements || []).some((a) => !a.date_fin || new Date(a.date_fin) > maintenant);
    } catch (e) {
      console.error("Vérification abonnement (assistant-ia) :", e);
    }

    const body = await req.json();
    const messagesRecus = Array.isArray(body.messages) ? body.messages : [];
    const contexteResultat = body.contexte || null;

    if (!messagesRecus.length) {
      return new Response(JSON.stringify({ error: "Message vide." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // On ne garde que les derniers échanges, et on tronque les messages
    // trop longs — protège le quota gratuit partagé et limite les abus.
    // Les personnes abonnées gardent un historique plus long : leurs
    // conversations peuvent être plus approfondies.
    const maxHistorique = accesAvance ? MAX_MESSAGES_HISTORIQUE_AVANCE : MAX_MESSAGES_HISTORIQUE;
    const historiqueLimite = messagesRecus
      .slice(-maxHistorique)
      .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
      .map((m) => ({ role: m.role, content: String(m.content).slice(0, MAX_CARACTERES_MESSAGE) }));

    if (!historiqueLimite.length) {
      return new Response(JSON.stringify({ error: "Message invalide." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    let promptSysteme = accesAvance ? PROMPT_SYSTEME_AVANCE : PROMPT_SYSTEME;
    if (contexteResultat && typeof contexteResultat === "object") {
      promptSysteme += `\n\nContexte : cette personne a déjà passé le test et obtenu le profil "${String(contexteResultat.titre || "").slice(0, 100)}" (${String(contexteResultat.correspondance || "").slice(0, 150)}). Métiers associés : ${String((contexteResultat.metiers || []).join(", ")).slice(0, 300)}.`;
      if (accesAvance) {
        if (contexteResultat.debouches) promptSysteme += `\nDébouchés & perspectives d'évolution : ${String(contexteResultat.debouches).slice(0, 500)}.`;
        if (contexteResultat.marche) promptSysteme += `\nMarché de l'emploi au Sénégal pour ce profil : ${String(contexteResultat.marche).slice(0, 500)}.`;
        if (contexteResultat.ville) promptSysteme += `\nVille renseignée par la personne : ${String(contexteResultat.ville).slice(0, 60)}.`;
        if (Array.isArray(contexteResultat.ecoles) && contexteResultat.ecoles.length) {
          promptSysteme += `\nÉcoles déjà recommandées par le test avancé : ${contexteResultat.ecoles.map((e) => String(e).slice(0, 80)).join(", ").slice(0, 400)}.`;
        }
      }
    }
    if (accesAvance) {
      promptSysteme += `\n\nCette personne a le TEST AVANCÉ (abonnement actif) : tu peux aller plus loin qu'avec un compte gratuit — propose des pistes concrètes et personnalisées (ex. comment se différencier pour telle école, quelles compétences développer en priorité, comment se préparer à un concours mentionné), toujours ancrées dans son profil réel. Tu restes honnête : si tu ne sais pas, tu le dis, plutôt que d'inventer un détail précis (frais, date de concours...).`;
    }

    const modele = accesAvance ? MODELE_GROQ_AVANCE : MODELE_GROQ;
    const maxTokensReponse = accesAvance ? MAX_TOKENS_AVANCE : MAX_TOKENS_STANDARD;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY"); // optionnel — filet de secours

    let reponseTexte = null;
    let fournisseurUtilise = "groq";

    try {
      const reponseGroq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: modele,
          messages: [{ role: "system", content: promptSysteme }, ...historiqueLimite],
          temperature: 0.6,
          max_tokens: maxTokensReponse,
        }),
      });

      if (!reponseGroq.ok) {
        const texteErreur = await reponseGroq.text();
        throw new Error(`Groq a répondu ${reponseGroq.status} : ${texteErreur}`);
      }

      const donnees = await reponseGroq.json();
      reponseTexte = donnees.choices?.[0]?.message?.content || null;
      if (!reponseTexte) throw new Error("Réponse Groq vide.");
    } catch (erreurGroq) {
      console.error("Erreur Groq (bascule vers Gemini si possible) :", erreurGroq);

      if (!geminiApiKey) {
        // Pas de filet de secours configuré : on renvoie une erreur propre.
        return new Response(JSON.stringify({ error: "L'assistant est momentanément indisponible, réessaie dans un instant." }), {
          status: 502,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }

      try {
        reponseTexte = await appellerGemini(historiqueLimite, promptSysteme, maxTokensReponse, geminiApiKey);
        fournisseurUtilise = "gemini";
      } catch (erreurGemini) {
        console.error("Erreur Gemini (filet de secours épuisé aussi) :", erreurGemini);
        return new Response(JSON.stringify({ error: "L'assistant est momentanément indisponible, réessaie dans un instant." }), {
          status: 502,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ reponse: reponseTexte, accesAvance, fournisseur: fournisseurUtilise }), {
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
