/* =====================================================================
   ORIENTATION DATA — Parcourio
   ---------------------------------------------------------------------
   Ce fichier contient TOUTES les données du système de recommandation :
   - les 8 profils de filières (regroupés dans les 4 domaines historiques
     technologie / creatif / social / gestion pour rester compatible avec
     assets/data/ecoles.json, qui n'utilise que ces 4 valeurs)
   - les banques de réponses réutilisables (partagées entre le test rapide
     et le test avancé, pour éviter toute duplication)
   - la définition des questions du Test rapide et du Test avancé

   POUR AJOUTER UNE QUESTION : ajouter un objet dans QUESTIONS_RAPIDE ou
   QUESTIONS_AVANCEES, avec un id unique, une "categorie" (pour le
   regroupement visuel) et des "options" portant chacune un objet
   "scores" (clé = id de profil, valeur = poids). Aucune autre partie du
   code n'a besoin d'être modifiée : le moteur (orientation-engine.js)
   lit ces définitions dynamiquement.

   POUR AJOUTER UN PROFIL : ajouter une entrée dans PROFILS, avec un
   "macro" parmi technologie / creatif / social / gestion, puis
   distribuer quelques points vers ce nouveau profil dans les banques
   de réponses concernées.
   ===================================================================== */

(function (global) {
  "use strict";

  /* ---------------------------------------------------------------
     1. LES 8 PROFILS DE FILIÈRES
     --------------------------------------------------------------- */
  const PROFILS = {
    info_num: {
      id: "info_num",
      macro: "technologie",
      nom: "Informatique & Numérique",
      icone: "laptop",
      couleur: "#175EFF",
      description: "Tu raisonnes de façon logique et tu aimes comprendre comment fonctionnent les outils numériques. Les filières informatiques (développement, réseaux, data, intelligence artificielle) te permettront de construire des solutions concrètes et très recherchées sur le marché de l'emploi.",
      metiers: ["Développeur·se logiciel / web", "Data analyst ou data scientist", "Administrateur systèmes & réseaux", "Ingénieur·e en intelligence artificielle", "Cybersécurité"],
      filieresTypes: ["Licence / Master Informatique", "Génie logiciel", "Data science", "Réseaux & télécoms", "Cybersécurité"],
      motsClefsSecteurs: ["Informatique", "Informatique de gestion", "Data science", "Intelligence artificielle", "Télécommunications", "Réseaux et télécommunications", "Cybersécurité", "Big data", "Informatique décisionnelle"],
      conseil: {
        "Collège": "Commence par explorer la logique et le code à travers des mini-jeux ou des initiations gratuites (Scratch, sites d'apprentissage). Le but est de tester si le raisonnement logique te plaît vraiment.",
        "Lycée": "Approfondis la programmation, suis un club tech ou participe à un hackathon si l'occasion se présente. Renforce en parallèle tes bases en mathématiques, qui restent le socle de l'informatique.",
        "Bac": "Vise une filière informatique reconnue (école d'ingénieurs, université, BTS informatique). Commence à construire un petit portfolio de projets, même simples.",
        "Études supérieures": "Spécialise-toi (data, IA, cybersécurité, développement mobile) et multiplie les projets concrets ou stages pour te démarquer sur un marché très demandé."
      }
    },
    ingenierie: {
      id: "ingenierie",
      macro: "technologie",
      nom: "Ingénierie & Sciences appliquées",
      icone: "settings",
      couleur: "#3B82F6",
      description: "Tu aimes comprendre comment les choses sont construites et résoudre des problèmes concrets sur le terrain ou en atelier. Les filières d'ingénierie (génie civil, mécanique, électrique, industriel) mènent à des métiers très demandés dans les infrastructures et l'industrie au Sénégal.",
      metiers: ["Ingénieur·e génie civil / BTP", "Technicien·ne ou ingénieur·e en génie électrique", "Ingénieur·e génie mécanique", "Responsable QHSE", "Ingénieur·e agronome ou environnement"],
      filieresTypes: ["Génie civil", "Génie électrique / mécanique", "Génie industriel", "QHSE", "Agronomie / Environnement"],
      motsClefsSecteurs: ["Génie civil", "Génie mécanique", "Génie électrique", "Froid industriel", "QHSE", "Agriculture", "Environnement", "Architecture", "Urbanisme", "Bâtiment et travaux publics", "Navigation maritime", "Mécanique navale"],
      conseil: {
        "Collège": "Observe comment sont construits les bâtiments, machines ou installations autour de toi. Les matières scientifiques (maths, physique, technologie) sont ta base à consolider.",
        "Lycée": "Renforce fortement les maths et la physique, et si possible pratique un peu de bricolage, de robotique ou de dessin technique.",
        "Bac": "Vise une classe préparatoire ou une école d'ingénieurs (ESP, écoles polytechniques, BTS industriels). Les stages en entreprise seront décisifs.",
        "Études supérieures": "Spécialise-toi dans un secteur porteur au Sénégal (BTP, énergie, agro-industrie) et cherche des projets terrain ou des stages techniques."
      }
    },
    creation_design: {
      id: "creation_design",
      macro: "creatif",
      nom: "Création & Design",
      icone: "palette",
      couleur: "#FDD400",
      description: "Tu exprimes tes idées par l'image, la forme ou l'esthétique. Les filières de design, mode, arts visuels ou audiovisuel te permettent de transformer ta sensibilité créative en un métier et un style reconnaissable.",
      metiers: ["Designer graphique / UI-UX", "Styliste / créateur·rice de mode", "Photographe / vidéaste", "Illustrateur·rice / artiste plasticien·ne", "Décorateur·rice / architecte d'intérieur"],
      filieresTypes: ["Design graphique", "Mode & stylisme", "Arts plastiques", "Audiovisuel / Photographie", "Architecture d'intérieur"],
      motsClefsSecteurs: ["Design", "Mode", "Photographie", "Arts plastiques", "Marketing du luxe", "mode", "stylisme", "modélisme", "couture", "audiovisuel", "graphisme", "arts", "cinéma", "Design UX/UI", "Design graphique", "Infographie", "Webdesign"],
      conseil: {
        "Collège": "Multiplie les expériences créatives (dessin, montage vidéo simple, bricolage artistique) pour découvrir le medium qui te correspond le mieux.",
        "Lycée": "Commence un portfolio, même modeste, et cherche des concours ou ateliers créatifs pour te confronter à d'autres regards.",
        "Bac": "Choisis une école de design ou d'arts appliqués reconnue et prépare un dossier/portfolio solide pour les admissions.",
        "Études supérieures": "Affirme un style personnel reconnaissable et multiplie les collaborations ou stages pour construire un réseau professionnel."
      }
    },
    communication_medias: {
      id: "communication_medias",
      macro: "creatif",
      nom: "Communication & Médias",
      icone: "megaphone",
      couleur: "#F59E0B",
      description: "Tu aimes t'exprimer, convaincre et raconter des histoires. Les filières de communication, journalisme, marketing digital ou langues appliquées mènent à des métiers où le relationnel et les mots sont les outils principaux.",
      metiers: ["Chargé·e de communication / community manager", "Journaliste / rédacteur·rice", "Chargé·e de marketing digital", "Interprète / traducteur·rice", "Chargé·e de relations publiques"],
      filieresTypes: ["Communication", "Marketing digital", "Journalisme", "Langues appliquées / Interprétariat"],
      motsClefsSecteurs: ["Communication", "Langues", "Interprétariat", "Marketing", "Journalisme", "Marketing-communication", "Marketing digital", "Publicité", "Production multimédia", "culture"],
      conseil: {
        "Collège": "Entraîne-toi à écrire et à t'exprimer à l'oral (exposés, débats, réseaux sociaux de façon encadrée). Note ce qui capte l'attention des autres.",
        "Lycée": "Renforce les langues et l'écriture, essaie un blog, une radio scolaire ou un club de débat.",
        "Bac": "Choisis une filière communication, marketing ou langues appliquées et cherche des stages dans des médias ou agences.",
        "Études supérieures": "Spécialise-toi (communication digitale, journalisme, traduction) et construis un book de réalisations concrètes."
      }
    },
    sante_social: {
      id: "sante_social",
      macro: "social",
      nom: "Santé & Soin",
      icone: "stethoscope",
      couleur: "#2DD9B9",
      description: "Tu es attiré·e par le soin et l'accompagnement des personnes. Les filières de santé (médecine, soins infirmiers, pharmacie) demandent de la rigueur et de l'empathie, pour un impact direct sur la vie des gens.",
      metiers: ["Médecin généraliste ou spécialiste", "Infirmier·ère", "Pharmacien·ne", "Sage-femme", "Technicien·ne de laboratoire médical"],
      filieresTypes: ["Médecine", "Soins infirmiers", "Pharmacie", "Chirurgie dentaire", "Biologie médicale"],
      motsClefsSecteurs: ["Médecine", "Infirmier", "Pharmacie", "Chirurgie dentaire", "Odontologie", "Biologie médicale", "Délégué médical", "Sage-femme", "Santé", "Sciences infirmières", "Santé publique", "Médecine vétérinaire", "Santé animale", "Productions animales"],
      conseil: {
        "Collège": "Renforce les sciences (SVT, physique-chimie) qui sont indispensables pour les filières de santé, et observe les métiers médicaux autour de toi.",
        "Lycée": "Vise une série scientifique solide, et si possible fais du bénévolat ou une immersion dans un centre de santé.",
        "Bac": "Prépare-toi à un concours d'entrée exigeant (médecine, pharmacie, soins infirmiers) : ce sont des filières sélectives qui demandent du travail régulier.",
        "Études supérieures": "Spécialise-toi selon tes affinités (urgences, pédiatrie, biologie...) et multiplie les stages hospitaliers."
      }
    },
    education_humaines: {
      id: "education_humaines",
      macro: "social",
      nom: "Éducation & Sciences humaines",
      icone: "book-open",
      couleur: "#22C1A6",
      description: "Tu aimes comprendre les sociétés, transmettre un savoir ou accompagner le développement des autres. Les filières d'éducation, sciences sociales, psychologie ou développement communautaire te permettent d'avoir un impact durable et humain.",
      metiers: ["Enseignant·e", "Éducateur·rice spécialisé·e", "Psychologue", "Travailleur·se social·e", "Chargé·e de projet ONG / développement communautaire"],
      filieresTypes: ["Sciences de l'éducation", "Psychologie", "Travail social", "Lettres & sciences humaines"],
      motsClefsSecteurs: ["Lettres", "Environnement", "Formation des enseignants", "Sciences sociales", "Sciences politiques", "Relations internationales", "Géopolitique", "Développement durable", "Études arabo-islamiques"],
      conseil: {
        "Collège": "Explore les matières littéraires et humaines, et essaie d'aider ou d'expliquer des choses à d'autres élèves : c'est un bon indicateur.",
        "Lycée": "Fais du bénévolat, du soutien scolaire ou une activité associative pour confirmer ton goût pour l'accompagnement humain.",
        "Bac": "Choisis une filière en sciences humaines, éducation ou travail social, et cherche des stages de terrain rapidement.",
        "Études supérieures": "Spécialise-toi vers le public qui te tient à cœur (enfance, insertion, communauté) et développe un vrai réseau associatif ou institutionnel."
      }
    },
    commerce_gestion: {
      id: "commerce_gestion",
      macro: "gestion",
      nom: "Commerce & Gestion",
      icone: "bar-chart-3",
      couleur: "#A78BFA",
      description: "Tu aimes organiser, négocier et faire avancer des projets concrets. Les filières de gestion, commerce, marketing ou finance mènent à des métiers d'entreprise variés, du commerce à l'entrepreneuriat.",
      metiers: ["Chargé·e de marketing / commercial·e", "Comptable / auditeur·rice", "Chef·fe de projet / entrepreneur·e", "Gestionnaire en hôtellerie", "Chargé·e de clientèle bancaire"],
      filieresTypes: ["Gestion / Management", "Marketing", "Comptabilité & finance", "Commerce international", "Hôtellerie"],
      motsClefsSecteurs: ["Gestion", "Marketing", "Commerce", "Commerce international", "Gestion commerciale", "Gestion des entreprises", "Comptabilité", "Finance", "Banque", "Assurance", "Audit", "Gestion hôtelière", "Hôtellerie", "Hôtellerie de luxe", "Ingénierie technico-commerciale", "Management", "Tourisme", "Hôtellerie-tourisme", "Restauration", "Transport-logistique", "Entrepreneuriat", "Microfinance", "Économie", "gestion", "management"],
      conseil: {
        "Collège": "Amuse-toi à organiser de petits projets (événement de classe, vente, budget de poche) pour tester ton goût pour la gestion.",
        "Lycée": "Renforce les maths appliquées et l'économie, et lance-toi dans un mini-projet entrepreneurial si l'occasion se présente.",
        "Bac": "Choisis une filière gestion, commerce ou finance, en école de commerce ou à l'université, selon ton budget et tes objectifs.",
        "Études supérieures": "Spécialise-toi (marketing, finance, entrepreneuriat) et cherche des stages en entreprise pour construire ton réseau professionnel."
      }
    },
    droit_admin: {
      id: "droit_admin",
      macro: "gestion",
      nom: "Droit & Administration",
      icone: "scale",
      couleur: "#8B5CF6",
      description: "Tu aimes la rigueur, l'argumentation et les règles qui organisent la société. Les filières de droit, administration publique ou ressources humaines mènent à des métiers d'analyse, de gestion des règles et de service public.",
      metiers: ["Juriste / avocat·e", "Magistrat·e", "Cadre de l'administration publique", "Responsable ressources humaines", "Huissier / notaire"],
      filieresTypes: ["Droit", "Droit des affaires", "Administration publique", "Ressources humaines"],
      motsClefsSecteurs: ["Droit", "Droit des affaires", "Administration publique", "Administration des entreprises", "Fonction publique", "Ressources humaines", "Sécurité", "Sciences criminelles", "Fiscalité"],
      conseil: {
        "Collège": "Développe ta capacité à argumenter et à comprendre des règles (débats, actualité, instruction civique).",
        "Lycée": "Renforce les matières littéraires et l'histoire-géographie, essaie un club de débat ou un modèle de Nations Unies si possible.",
        "Bac": "Choisis une filière droit ou sciences politiques à l'université ou en école spécialisée, en gardant en tête les concours de la fonction publique.",
        "Études supérieures": "Spécialise-toi (droit des affaires, droit public, RH) et prépare activement les concours ou stages en cabinet/administration."
      }
    }
  };

  /* Style visuel par macro-domaine, repris tel quel de l'ancienne version
     pour ne pas casser la mise en page (radar chart, couleurs, etc.) */
  const MACRO_STYLE = {
    technologie: { icone: "laptop", couleur: "#175EFF", label: "Technologie" },
    creatif: { icone: "palette", couleur: "#FDD400", label: "Créatif" },
    social: { icone: "handshake", couleur: "#2DD9B9", label: "Social" },
    gestion: { icone: "bar-chart-3", couleur: "#A78BFA", label: "Gestion" }
  };

  /* ---------------------------------------------------------------
     1bis. LES 9 FAMILLES DE MÉTIERS
     Registre parallèle à PROFILS, utilisé uniquement par le parcours
     "Je souhaite apprendre un métier". Même forme que PROFILS (macro,
     motsClefsSecteurs…) pour pouvoir réutiliser le même moteur de
     scoring, mais orienté insertion rapide plutôt que filières longues :
     "niveauCible" et "motsClefsNom" servent à faire remonter en
     priorité les centres de formation professionnelle (CFP, CFPT,
     Don Bosco…) plutôt que les grandes écoles ou universités.
     --------------------------------------------------------------- */
  const METIERS = {
    batiment_industrie: {
      id: "batiment_industrie", macro: "technologie",
      nom: "Bâtiment, Électricité & Industrie",
      icone: "brick-wall", couleur: "#3B82F6",
      description: "Tu aimes travailler de tes mains, construire, réparer ou installer. Les métiers du bâtiment et de l'industrie recrutent fortement au Sénégal et permettent une insertion rapide, avec de vraies possibilités d'évolution vers le statut de technicien ou de chef d'équipe.",
      metiers: ["Électricien·ne", "Maçon·ne / Chef·fe de chantier", "Soudeur·se", "Technicien·ne froid-climatisation", "Mécanicien·ne auto"],
      motsClefsSecteurs: ["Électricité", "Génie civil", "Froid-climatisation", "Plomberie", "Mécanique auto", "Bâtiment et travaux publics", "Génie mécanique", "Machinisme agricole"],
      motsClefsNom: ["cfp", "cfpt", "don bosco", "centre de formation professionnelle", "lycée technique"],
      conseil: "Vise un centre de formation professionnelle (CFP, CFPT) ou un centre Don Bosco reconnu. Une formation qualifiante de quelques mois à deux ans suffit souvent à démarrer, avec un CAP ou un BEP à la clé — la pratique et les stages comptent plus que le diplôme théorique."
    },
    numerique_pratique: {
      id: "numerique_pratique", macro: "technologie",
      nom: "Numérique & Métiers du digital",
      icone: "laptop", couleur: "#175EFF",
      description: "Tu es à l'aise avec un ordinateur ou un smartphone et tu apprends vite les outils numériques. Les métiers techniques du digital (maintenance, réseaux, community management) sont très demandés et accessibles sans long parcours universitaire.",
      metiers: ["Technicien·ne maintenance informatique", "Développeur·se web junior", "Community manager", "Opérateur·rice de saisie", "Technicien·ne réseaux"],
      motsClefsSecteurs: ["Informatique", "Réseaux et télécommunications", "Développement web", "Marketing digital", "Informatique de gestion"],
      motsClefsNom: ["simplon", "sonatel academy", "informatique"],
      conseil: "Cherche une école du code gratuite ou peu coûteuse (Simplon, Sonatel Academy) ou un institut proposant des certifications courtes en maintenance ou en réseaux. Construis vite un petit book de réalisations concrètes : c'est souvent plus décisif qu'un diplôme dans ce secteur."
    },
    hotellerie_restauration: {
      id: "hotellerie_restauration", macro: "gestion",
      nom: "Hôtellerie, Restauration & Tourisme",
      icone: "utensils", couleur: "#A78BFA",
      description: "Tu aimes accueillir, cuisiner ou organiser un service. L'hôtellerie-restauration-tourisme est un secteur historique et en croissance au Sénégal, avec des formations reconnues et une forte demande, y compris à l'international.",
      metiers: ["Cuisinier·ère", "Serveur·se / Réceptionniste", "Guide touristique", "Pâtissier·ère", "Barman / Barmaid"],
      motsClefsSecteurs: ["Hôtellerie", "Restauration", "Tourisme", "Gastronomie", "Hôtellerie-tourisme", "Gestion hôtelière"],
      motsClefsNom: ["enfht", "vatel", "marmitons", "hotel"],
      conseil: "L'ENFHT (École Nationale de Formation Hôtelière et Touristique) est la référence historique et accessible dès le BFEM. Les instituts privés (Vatel, Les Marmitons) offrent des formations plus courtes et professionnalisantes si tu veux aller vite."
    },
    mode_artisanat: {
      id: "mode_artisanat", macro: "creatif",
      nom: "Mode, Couture & Artisanat d'art",
      icone: "shirt", couleur: "#FDD400",
      description: "Tu as le sens du geste, du détail et de l'esthétique. La mode, la couture et l'artisanat d'art sont des filières où le savoir-faire prime, avec une vraie possibilité de créer ta propre activité par la suite.",
      metiers: ["Couturier·ère / Styliste", "Modéliste", "Coiffeur·se / Esthéticien·ne", "Artisan·e d'art", "Bijoutier·ère"],
      motsClefsSecteurs: ["mode", "stylisme", "modélisme", "couture", "Design", "Infographie"],
      motsClefsNom: ["iccm", "emdn", "couture", "mode"],
      conseil: "L'ICCM (Institut de Coupe, Couture et de Mode) est accessible dès le BFEM et reste la référence publique. Complète par des stages chez un·e professionnel·le reconnu·e : dans ce secteur, un book de réalisations vaut souvent plus qu'un diplôme."
    },
    audiovisuel_creation: {
      id: "audiovisuel_creation", macro: "creatif",
      nom: "Audiovisuel, Image & Création numérique",
      icone: "clapperboard", couleur: "#F59E0B",
      description: "Tu aimes filmer, monter, photographier ou créer du contenu pour les réseaux sociaux. Le secteur audiovisuel sénégalais est en pleine croissance et de plus en plus de formations gratuites ou courtes permettent d'y entrer sans diplôme préalable.",
      metiers: ["Monteur·se vidéo", "Photographe", "Opérateur·rice prise de son", "Infographiste", "Créateur·rice de contenu"],
      motsClefsSecteurs: ["audiovisuel", "Design UX/UI", "Webdesign", "Photographie", "cinéma", "Production multimédia", "Infographie"],
      motsClefsNom: ["kourtrajmé", "yennenga", "cifap", "hollywood university", "sup'imax"],
      conseil: "Les écoles de cinéma gratuites (Kourtrajmé, Centre Yennenga) sont ouvertes sans condition de diplôme, sur motivation et projet. Sinon, des instituts comme SUP'IMAX ou Hollywood University proposent des formations professionnalisantes plus courtes."
    },
    sante_aide_personne: {
      id: "sante_aide_personne", macro: "social",
      nom: "Santé, Social & Aide à la personne",
      icone: "stethoscope", couleur: "#2DD9B9",
      description: "Tu aimes prendre soin des autres et tu as le sens du contact. Les métiers d'aide à la personne et de santé de premier niveau sont fortement recherchés, avec des formations plus courtes que médecine ou pharmacie.",
      metiers: ["Aide-soignant·e", "Auxiliaire de puériculture", "Assistant·e dentaire", "Agent·e de santé communautaire", "Aide à domicile"],
      motsClefsSecteurs: ["Infirmier", "Santé", "Sciences infirmières", "Biologie médicale"],
      motsClefsNom: ["élite santé", "esup santé", "ised"],
      conseil: "Les instituts privés de santé (Institut Élite Santé, ESUP Santé…) proposent des licences professionnelles en soins infirmiers accessibles après le BAC ; certains centres proposent aussi des formations d'auxiliaire plus courtes, accessibles dès le BFEM."
    },
    commerce_vente_gestion: {
      id: "commerce_vente_gestion", macro: "gestion",
      nom: "Commerce, Vente & Gestion pratique",
      icone: "shopping-cart", couleur: "#A78BFA",
      description: "Tu aimes vendre, conseiller ou organiser. Les métiers du commerce et de la gestion pratique s'apprennent vite et ouvrent la voie à l'entrepreneuriat, très valorisé au Sénégal.",
      metiers: ["Vendeur·se / Commercial·e", "Caissier·ère / Agent·e de comptoir", "Secrétaire / Assistant·e administratif", "Agent·e de saisie comptable", "Auto-entrepreneur·se"],
      motsClefsSecteurs: ["Commerce", "Gestion commerciale", "Comptabilité", "Gestion des entreprises", "Marketing"],
      motsClefsNom: ["cfpt", "estg", "g2cfor"],
      conseil: "Une formation courte en gestion commerciale ou en comptabilité (souvent en licence professionnelle accessible après le BAC) suffit pour démarrer. Si ton objectif est de créer ta propre activité, cherche en priorité les modules d'entrepreneuriat."
    },
    agriculture_environnement: {
      id: "agriculture_environnement", macro: "technologie",
      nom: "Agriculture, Élevage & Environnement",
      icone: "sprout", couleur: "#22C1A6",
      description: "Tu aimes le plein air, la nature ou le travail de la terre. L'agriculture, l'élevage et les métiers verts sont stratégiques pour le Sénégal et bénéficient d'un vrai soutien de l'État et des bailleurs.",
      metiers: ["Technicien·ne agricole", "Éleveur·se / Agent·e d'élevage", "Agent·e forestier", "Technicien·ne agroalimentaire", "Éco-guide"],
      motsClefsSecteurs: ["Agriculture", "Environnement", "Productions animales", "Gestion forestière"],
      motsClefsNom: ["isfar", "eismv", "csfp", "bounkiling"],
      conseil: "Des centres publics comme l'ISFAR ou les centres sectoriels de formation professionnelle (CSFP, souvent en régions) proposent des formations pratiques en alternance, avec un accompagnement à l'insertion ou à la création d'activité agricole."
    },
    transport_securite: {
      id: "transport_securite", macro: "technologie",
      nom: "Transport, Logistique & Sécurité",
      icone: "truck", couleur: "#8B5CF6",
      description: "Tu aimes bouger, organiser des flux ou veiller à la sécurité des autres. Les métiers du transport, de la logistique et de la sécurité recrutent en continu, avec des formations courtes et un accès à l'emploi rapide.",
      metiers: ["Chauffeur·se professionnel·le", "Agent·e logistique", "Agent·e de sécurité", "Marin / Agent·e maritime", "Magasinier·ère"],
      motsClefsSecteurs: ["Transport-logistique", "Navigation maritime", "Sécurité", "Mécanique navale"],
      motsClefsNom: ["enfm", "transport"],
      conseil: "L'ENFM (École Nationale de Formation Maritime) forme aux métiers de la mer sur concours ; pour la logistique et le transport terrestre, privilégie les formations courtes et les certifications reconnues par les entreprises du secteur."
    }
  };

  /* ---------------------------------------------------------------
     2. BANQUES DE RÉPONSES PARTAGÉES
     Chaque option porte un objet "scores" : { profilId: poids }.
     Ces banques sont réutilisées telles quelles dans le test rapide
     (souvent en version "single", un seul choix) et dans le test
     avancé (souvent en version "multi", plusieurs choix pondérés).
     --------------------------------------------------------------- */

  /* Séries du Baccalauréat sénégalais (Office du Baccalauréat / CNOSP).
     Un lycéen ou bachelier sénégalais se définit d'abord par sa série
     (S2, L2, G, T1…) bien avant de penser en termes de "matières
     préférées" à l'occidentale : cette question colle donc à la façon
     dont on se présente réellement au Sénégal, et affine nettement la
     recommandation par rapport aux seules matières. */
  const BANQUE_SERIE_BAC = [
    { value: "s1", label: "S1 — Sciences exactes (maths, physique-chimie)", scores: { info_num: 3, ingenierie: 3 } },
    { value: "s2", label: "S2 — Sciences expérimentales (SVT, physique-chimie)", scores: { sante_social: 3, ingenierie: 1 } },
    { value: "s3", label: "S3 — Sciences et techniques / agronomie", scores: { ingenierie: 2, sante_social: 1 } },
    { value: "l1_l1a", label: "L1 / L1a — Lettres, langues et civilisations", scores: { communication_medias: 2, education_humaines: 2 } },
    { value: "l2", label: "L2 — Sciences sociales et humaines", scores: { education_humaines: 2, droit_admin: 2, communication_medias: 1 } },
    { value: "g", label: "G — Gestion (comptabilité, action commerciale, administratif)", scores: { commerce_gestion: 3 } },
    { value: "t1_t2", label: "T1 / T2 — Techniques industrielles (mécanique, électrotechnique)", scores: { ingenierie: 3 } },
    { value: "autre_serie", label: "Une autre série / une filière en arabe", scores: { education_humaines: 1 } },
    { value: "pas_encore", label: "Je ne suis pas encore en série (collège) ou je ne sais pas encore", scores: {} }
  ];

  /* ---------------------------------------------------------------
     0. LES DEUX GRANDS PARCOURS
     "apres_diplome" (déjà un diplôme, quel qu'il soit) et
     "apprendre_metier" (pas de diplôme, ou envie d'un parcours concret,
     court, qualifiant). Le parcours choisi détermine entièrement quel
     questionnaire est construit — voir construireQuestionnaireApresDiplome
     et construireQuestionnaireMetier plus bas.
     --------------------------------------------------------------- */
  const PARCOURS = [
    {
      id: "apres_diplome",
      titre: "Je souhaite m'orienter après un diplôme",
      icone: "graduation-cap",
      description: "Tu as déjà un BAC, un BTS, un DUT, une Licence, un Master, un Doctorat ou un autre diplôme reconnu, et tu veux poursuivre, te spécialiser, changer de filière ou te réorienter."
    },
    {
      id: "apprendre_metier",
      titre: "Je souhaite apprendre un métier",
      icone: "wrench",
      description: "Tu n'as pas encore de diplôme, ou tu ne veux pas d'un parcours universitaire classique : tu cherches une formation qualifiante, une certification et une insertion rapide sur le marché du travail."
    }
  ];

  /* Diplômes déjà obtenus, pour le parcours "après un diplôme". Chaque
     diplôme détermine un jeu de questions différent (voir plus bas) :
     un bachelier n'a pas de filière à décrire, un titulaire de BTS/
     Licence/Master en a une, et l'objectif "après" change à chaque
     niveau (Licence après BTS, Master après Licence, emploi ou
     doctorat après Master…). */
  const DIPLOMES = [
    { value: "bac", label: "BAC", placeholderFiliere: "Ex : Série S2, L2, G…" },
    { value: "bts", label: "BTS", placeholderFiliere: "Ex : BTS Comptabilité et Gestion, BTS Électrotechnique…" },
    { value: "dut", label: "DUT", placeholderFiliere: "Ex : DUT Informatique, DUT Génie civil…" },
    { value: "licence", label: "Licence", placeholderFiliere: "Ex : Licence 3 Sciences Économiques et de Gestion…" },
    { value: "master", label: "Master", placeholderFiliere: "Ex : Master 1 Droit des affaires, Master Informatique…" },
    { value: "doctorat", label: "Doctorat", placeholderFiliere: "Ex : Doctorat en Biologie, Doctorat en Sciences de gestion…" },
    { value: "autre", label: "Autre diplôme reconnu", placeholderFiliere: "Ex : Diplôme d'infirmier d'État, Brevet de technicien…" }
  ];

  /* Options d'objectif après un diplôme donné : les libellés changent
     volontairement d'un niveau à l'autre pour rester crédibles (un
     bachelier "poursuit ses études", un titulaire de Master "prépare un
     doctorat ou entre sur le marché du travail" — pas la même chose). */
  const OBJECTIFS_PAR_DIPLOME = {
    bac: [
      { value: "poursuivre", label: "Choisir ma première orientation après le BAC" },
      { value: "competences", label: "Découvrir quelles filières me correspondent" }
    ],
    bts: [
      { value: "niveau_superieur", label: "Poursuivre vers une Licence / Licence professionnelle" },
      { value: "specialisation", label: "Me spécialiser dans mon domaine de BTS" },
      { value: "changer_filiere", label: "Changer complètement de filière" },
      { value: "insertion", label: "Entrer directement sur le marché du travail" }
    ],
    dut: [
      { value: "niveau_superieur", label: "Poursuivre vers une Licence / Licence professionnelle" },
      { value: "specialisation", label: "Me spécialiser dans mon domaine de DUT" },
      { value: "changer_filiere", label: "Changer complètement de filière" },
      { value: "insertion", label: "Entrer directement sur le marché du travail" }
    ],
    licence: [
      { value: "niveau_superieur", label: "Poursuivre vers un Master" },
      { value: "specialisation", label: "Me spécialiser dans mon domaine de Licence" },
      { value: "changer_filiere", label: "Me réorienter vers un autre domaine" },
      { value: "insertion", label: "Entrer directement sur le marché du travail" }
    ],
    master: [
      { value: "niveau_superieur", label: "Poursuivre vers un Doctorat" },
      { value: "specialisation", label: "Me spécialiser encore davantage (Master 2, MBA…)" },
      { value: "changer_filiere", label: "Me réorienter vers un autre domaine professionnel" },
      { value: "insertion", label: "Entrer sur le marché du travail avec ce Master" }
    ],
    doctorat: [
      { value: "carriere_academique", label: "Poursuivre une carrière académique / la recherche" },
      { value: "insertion", label: "Valoriser mon doctorat en entreprise ou en expertise" },
      { value: "specialisation", label: "Me spécialiser davantage (post-doctorat)" }
    ],
    autre: [
      { value: "niveau_superieur", label: "Poursuivre des études sur un niveau supérieur" },
      { value: "specialisation", label: "Me spécialiser dans mon domaine actuel" },
      { value: "changer_filiere", label: "Changer complètement de filière (réorientation)" },
      { value: "competences", label: "Développer de nouvelles compétences, sans changer de métier" }
    ]
  };

  /* Le "niveau d'études visé" proposé après le test change selon le
     diplôme déjà en poche : on ne propose pas "Master" à quelqu'un qui
     vient d'obtenir un Master, ni "BTS" à un titulaire de Doctorat. */
  const NIVEAU_VISE_PAR_DIPLOME = {
    bac: [
      { value: "bts_dut", label: "BTS / DTS" },
      { value: "licence", label: "Licence / Bachelor" },
      { value: "pro_courte", label: "Formation professionnelle courte" }
    ],
    bts: [
      { value: "licence", label: "Licence / Licence professionnelle" },
      { value: "master", label: "Master" },
      { value: "pro_courte", label: "Formation professionnelle courte / certification" }
    ],
    dut: [
      { value: "licence", label: "Licence / Licence professionnelle" },
      { value: "master", label: "Master" },
      { value: "pro_courte", label: "Formation professionnelle courte / certification" }
    ],
    licence: [
      { value: "master", label: "Master" },
      { value: "pro_courte", label: "Formation professionnelle courte / certification" }
    ],
    master: [
      { value: "doctorat", label: "Doctorat" },
      { value: "pro_courte", label: "Formation professionnelle courte / MBA / certification" }
    ],
    doctorat: [
      { value: "doctorat", label: "Post-doctorat / expertise de recherche" },
      { value: "pro_courte", label: "Certification professionnelle complémentaire" }
    ],
    autre: [
      { value: "bts_dut", label: "BTS / DTS" },
      { value: "licence", label: "Licence / Bachelor" },
      { value: "master", label: "Master" },
      { value: "pro_courte", label: "Formation professionnelle courte" }
    ]
  };

  /* Question scorée qui remplace "matière préférée" / "série du bac"
     pour tous les diplômés BTS, DUT, Licence, Master, Doctorat et
     "autre" : ces personnes ont déjà une filière, la question la plus
     utile n'est donc pas "qu'est-ce qui te plaît en théorie ?" mais
     "dans quel grand domaine es-tu déjà, et veux-tu y rester ?". */
  const BANQUE_DOMAINE_ACTUEL = [
    { value: "technologie", label: "Technologie / Informatique / Ingénierie", scores: { info_num: 2, ingenierie: 2 } },
    { value: "creatif", label: "Créatif / Design / Communication", scores: { creation_design: 2, communication_medias: 2 } },
    { value: "social", label: "Santé / Social / Éducation", scores: { sante_social: 2, education_humaines: 2 } },
    { value: "gestion", label: "Gestion / Commerce / Droit", scores: { commerce_gestion: 2, droit_admin: 2 } },
    { value: "autre_domaine", label: "Autre / je ne sais pas trop le classer", scores: {} }
  ];

  /* Options de "projet après [diplôme]", avec un poids fort : elles
     confirment ou nuancent fortement le domaine choisi juste avant
     (rester dans le même domaine renforce son score ; se réorienter
     laisse la suite du questionnaire — secteurs, compétences,
     objectifs — décider). */
  const BANQUE_PROJET_APRES = {
    niveau_superieur: { label: "Continuer et me spécialiser dans mon domaine actuel", biaisMemeDomaine: 3 },
    specialisation: { label: "Me spécialiser encore davantage dans mon domaine actuel", biaisMemeDomaine: 3 },
    insertion: { label: "Trouver un emploi rapidement dans mon domaine actuel", biaisMemeDomaine: 2 },
    changer_filiere: { label: "Changer complètement de filière", biaisMemeDomaine: 0 },
    competences: { label: "Développer de nouvelles compétences sans changer de domaine", biaisMemeDomaine: 2 },
    carriere_academique: { label: "Poursuivre dans la recherche / l'enseignement supérieur", biaisMemeDomaine: 3 }
  };


  const BANQUE_MATIERES = [
    { value: "maths_info", label: "Mathématiques / Informatique", scores: { info_num: 3, ingenierie: 2 } },
    { value: "physique_techno", label: "Physique / Technologie", scores: { ingenierie: 3, info_num: 1 } },
    { value: "svt", label: "SVT / Biologie", scores: { sante_social: 3, ingenierie: 1 } },
    { value: "arts", label: "Arts plastiques / Musique", scores: { creation_design: 3 } },
    { value: "francais_lettres", label: "Français / Littérature", scores: { communication_medias: 2, education_humaines: 2 } },
    { value: "langues", label: "Langues vivantes", scores: { communication_medias: 3 } },
    { value: "histoire_geo", label: "Histoire-Géographie / Éducation civique", scores: { droit_admin: 2, education_humaines: 2 } },
    { value: "eco_gestion", label: "Économie / Gestion", scores: { commerce_gestion: 3 } },
    { value: "philo", label: "Philosophie", scores: { education_humaines: 2, droit_admin: 2, communication_medias: 1 } },
    { value: "eps", label: "Sport / EPS", scores: { sante_social: 1, commerce_gestion: 1 } }
  ];

  const BANQUE_COMPETENCES = [
    { value: "logique", label: "Résoudre des problèmes logiques ou mathématiques", scores: { info_num: 3, ingenierie: 2 } },
    { value: "manuel", label: "Bricoler, réparer, construire de mes mains", scores: { ingenierie: 3 } },
    { value: "artistique", label: "Dessiner, créer, avoir le sens esthétique", scores: { creation_design: 3 } },
    { value: "expression", label: "M'exprimer à l'écrit ou à l'oral", scores: { communication_medias: 3 } },
    { value: "ecoute", label: "Écouter et comprendre les émotions des autres", scores: { sante_social: 2, education_humaines: 2 } },
    { value: "soin", label: "Prendre soin, rassurer, aider concrètement", scores: { sante_social: 3 } },
    { value: "organisation", label: "Organiser, planifier, gérer un budget", scores: { commerce_gestion: 3 } },
    { value: "negociation", label: "Négocier, convaincre, vendre une idée", scores: { commerce_gestion: 2, droit_admin: 1 } },
    { value: "analyse", label: "Analyser des règles, des textes, des situations complexes", scores: { droit_admin: 3 } },
    { value: "leadership", label: "Motiver et diriger un groupe", scores: { commerce_gestion: 2, droit_admin: 1 } }
  ];

  const BANQUE_TYPE_TRAVAIL = [
    { value: "bureau", label: "Dans un bureau, avec ordinateur et outils de gestion", scores: { commerce_gestion: 2, droit_admin: 2, info_num: 1 } },
    { value: "terrain", label: "Sur le terrain, au contact direct des gens ou de l'environnement", scores: { sante_social: 2, education_humaines: 2, ingenierie: 1 } },
    { value: "laboratoire", label: "En laboratoire ou en environnement scientifique", scores: { sante_social: 2, ingenierie: 2, info_num: 1 } },
    { value: "teletravail", label: "En télétravail ou à distance, en autonomie", scores: { info_num: 3, communication_medias: 2 } },
    { value: "atelier", label: "En atelier, sur un chantier ou en production", scores: { ingenierie: 3, creation_design: 1 } }
  ];

  const BANQUE_OBJECTIFS_CARRIERE = [
    { value: "stable", label: "Avoir un emploi stable et sécurisant (fonction publique, grande entreprise…)", scores: { droit_admin: 2, sante_social: 2, commerce_gestion: 1 } },
    { value: "entreprendre", label: "Créer ou diriger ma propre entreprise", scores: { commerce_gestion: 3, info_num: 1, creation_design: 1 } },
    { value: "expertise", label: "Devenir un·e expert·e technique reconnu·e", scores: { info_num: 2, ingenierie: 2 } },
    { value: "impact_social", label: "Avoir un impact social ou humain concret", scores: { sante_social: 2, education_humaines: 2 } },
    { value: "creation", label: "Créer une œuvre, une marque ou un univers artistique", scores: { creation_design: 3, communication_medias: 1 } },
    { value: "responsabilite", label: "Occuper un poste à responsabilité, gérer des équipes", scores: { commerce_gestion: 2, droit_admin: 2 } }
  ];

  const BANQUE_SECTEURS = [
    { value: "tech", label: "Technologie / Numérique", scores: { info_num: 3 } },
    { value: "industrie", label: "Industrie / BTP / Énergie", scores: { ingenierie: 3 } },
    { value: "sante", label: "Santé", scores: { sante_social: 3 } },
    { value: "education", label: "Éducation / Social", scores: { education_humaines: 3 } },
    { value: "art_culture", label: "Art / Culture / Design", scores: { creation_design: 3 } },
    { value: "medias", label: "Médias / Communication", scores: { communication_medias: 3 } },
    { value: "business", label: "Commerce / Business / Finance", scores: { commerce_gestion: 3 } },
    { value: "droit_public", label: "Droit / Administration / Fonction publique", scores: { droit_admin: 3 } },
    { value: "agri_env", label: "Agriculture / Environnement", scores: { ingenierie: 2, education_humaines: 1 } }
  ];

  const BANQUE_VALEURS = [
    { value: "creativite", label: "Créativité", scores: { creation_design: 2, communication_medias: 1 } },
    { value: "stabilite", label: "Stabilité", scores: { droit_admin: 2, sante_social: 1, commerce_gestion: 1 } },
    { value: "innovation", label: "Innovation", scores: { info_num: 2, ingenierie: 1, commerce_gestion: 1 } },
    { value: "aide_autres", label: "Aide aux autres", scores: { sante_social: 2, education_humaines: 2 } },
    { value: "leadership_valeur", label: "Leadership", scores: { commerce_gestion: 2, droit_admin: 1 } },
    { value: "independance", label: "Indépendance / liberté", scores: { creation_design: 1, info_num: 1, commerce_gestion: 1 } }
  ];

  const BANQUE_QUALITES = [
    { value: "rigueur", label: "Rigueur", scores: { info_num: 1, ingenierie: 1, droit_admin: 2, sante_social: 1 } },
    { value: "empathie", label: "Empathie", scores: { sante_social: 2, education_humaines: 2 } },
    { value: "creativite_qual", label: "Créativité", scores: { creation_design: 2, communication_medias: 1 } },
    { value: "leadership_qual", label: "Leadership", scores: { commerce_gestion: 2, droit_admin: 1 } },
    { value: "curiosite", label: "Curiosité", scores: { info_num: 1, ingenierie: 1, communication_medias: 1 } },
    { value: "patience", label: "Patience", scores: { sante_social: 1, education_humaines: 2 } },
    { value: "sens_pratique", label: "Sens pratique", scores: { ingenierie: 2, commerce_gestion: 1 } },
    { value: "esprit_analyse", label: "Esprit d'analyse", scores: { info_num: 1, droit_admin: 2 } },
    { value: "sociabilite", label: "Sociabilité", scores: { communication_medias: 2, commerce_gestion: 1 } },
    { value: "discipline", label: "Discipline", scores: { sante_social: 1, droit_admin: 1, ingenierie: 1 } }
  ];

  const BANQUE_INTERETS = [
    { value: "technologie_int", label: "Technologie, jeux vidéo, gadgets", scores: { info_num: 2 } },
    { value: "sciences_int", label: "Sciences, expériences, nature", scores: { ingenierie: 1, sante_social: 1 } },
    { value: "sante_int", label: "Santé, bien-être, médecine", scores: { sante_social: 2 } },
    { value: "art_int", label: "Dessin, mode, photographie, musique", scores: { creation_design: 2 } },
    { value: "sport_int", label: "Sport et compétition", scores: { sante_social: 1, commerce_gestion: 1 } },
    { value: "voyages_langues_int", label: "Voyages et langues étrangères", scores: { communication_medias: 2 } },
    { value: "societe_int", label: "Actualité, politique, société", scores: { droit_admin: 2, education_humaines: 1 } },
    { value: "business_int", label: "Business, argent, entrepreneuriat", scores: { commerce_gestion: 2 } },
    { value: "manuel_int", label: "Mécanique, bricolage, construction", scores: { ingenierie: 2 } },
    { value: "enseignement_int", label: "Enseignement, transmission de savoir", scores: { education_humaines: 2 } },
    { value: "aide_int", label: "Bénévolat, aide communautaire", scores: { sante_social: 1, education_humaines: 2 } },
    { value: "medias_int", label: "Réseaux sociaux, médias, création de contenu", scores: { communication_medias: 2 } }
  ];

  const BANQUE_RESOLUTION = [
    { value: "logique_methodique", label: "De façon logique et méthodique, étape par étape", scores: { info_num: 2, ingenierie: 2, droit_admin: 1 } },
    { value: "creative_intuitive", label: "De façon créative et intuitive, en testant des idées", scores: { creation_design: 2, communication_medias: 1 } },
    { value: "collaborative", label: "En échangeant avec d'autres pour trouver un consensus", scores: { sante_social: 1, education_humaines: 1, commerce_gestion: 1 } },
    { value: "pragmatique", label: "En testant directement sur le terrain, par la pratique", scores: { ingenierie: 2, sante_social: 1 } }
  ];

  /* Échelles (curseurs / échelles de préférence) : 5 positions, chacune
     avec son propre vecteur de scores. Rendu comme une ligne de 5 choix
     entre deux pôles. */
  const ECHELLE_MODE_TRAVAIL = {
    poleGauche: "Toujours seul·e",
    poleDroite: "Toujours en équipe",
    positions: [
      { value: "1", scores: { info_num: 2, creation_design: 1 } },
      { value: "2", scores: { info_num: 1, ingenierie: 1 } },
      { value: "3", scores: {} },
      { value: "4", scores: { commerce_gestion: 1, education_humaines: 1 } },
      { value: "5", scores: { commerce_gestion: 2, sante_social: 1, droit_admin: 1 } }
    ]
  };

  const ECHELLE_STABILITE_INNOVATION = {
    poleGauche: "Stabilité et règles claires",
    poleDroite: "Innovation et prise de risque",
    positions: [
      { value: "1", scores: { droit_admin: 2, sante_social: 1 } },
      { value: "2", scores: { droit_admin: 1, commerce_gestion: 1 } },
      { value: "3", scores: {} },
      { value: "4", scores: { commerce_gestion: 1, ingenierie: 1 } },
      { value: "5", scores: { info_num: 2, creation_design: 1 } }
    ]
  };

  const NIVEAU_INFORMATIQUE = [
    { value: "debutant", label: "Débutant·e", scores: {} },
    { value: "notions", label: "Quelques notions", scores: { info_num: 1 } },
    { value: "intermediaire", label: "Intermédiaire (je me débrouille)", scores: { info_num: 2, commerce_gestion: 1 } },
    { value: "avance", label: "Avancé (je code / j'analyse des données)", scores: { info_num: 3, ingenierie: 1 } },
    { value: "expert", label: "Expert·e", scores: { info_num: 4, ingenierie: 1 } }
  ];

  const NIVEAU_LANGUES = [
    { value: "faible", label: "Faible", scores: {} },
    { value: "correct", label: "Correct", scores: { communication_medias: 1 } },
    { value: "bon", label: "Bon niveau", scores: { communication_medias: 2, droit_admin: 1 } },
    { value: "bilingue", label: "Bilingue / courant", scores: { communication_medias: 3 } }
  ];

  const VILLES_SENEGAL = ["Dakar", "Pikine", "Guédiawaye", "Rufisque", "Thiès", "Mbour", "Somone", "Kaolack", "Saint-Louis", "Ziguinchor", "Bambey", "Diamniadio", "Mbacké", "Richard-Toll", "Bignona", "Matam", "Tambacounda", "Louga", "Fatick", "Kolda", "Kaffrine", "Kédougou", "Sédhiou"];
  const REGIONS_SENEGAL = ["Dakar", "Thiès", "Diourbel", "Fatick", "Kaolack", "Kaffrine", "Kédougou", "Kolda", "Louga", "Matam", "Saint-Louis", "Sédhiou", "Tambacounda", "Ziguinchor"];

  /* ---------------------------------------------------------------
     3. BANQUES DU PARCOURS "APPRENDRE UN MÉTIER"
     Neuf familles de métiers (voir METIERS ci-dessus). La question
     "secteur_metier_interet" est le signal principal (poids fort, choix
     direct) ; "competence_pratique" et "interets_pratiques" affinent.
     --------------------------------------------------------------- */
  const BANQUE_SECTEUR_METIER = [
    { value: "batiment_industrie", label: "Bâtiment, électricité, mécanique, industrie", scores: { batiment_industrie: 5 } },
    { value: "numerique_pratique", label: "Informatique, réseaux, numérique", scores: { numerique_pratique: 5 } },
    { value: "hotellerie_restauration", label: "Cuisine, restauration, hôtellerie, tourisme", scores: { hotellerie_restauration: 5 } },
    { value: "mode_artisanat", label: "Couture, mode, coiffure, artisanat", scores: { mode_artisanat: 5 } },
    { value: "audiovisuel_creation", label: "Vidéo, photo, création de contenu", scores: { audiovisuel_creation: 5 } },
    { value: "sante_aide_personne", label: "Aide-soignant·e, aide à la personne, santé", scores: { sante_aide_personne: 5 } },
    { value: "commerce_vente_gestion", label: "Vente, commerce, comptabilité, secrétariat", scores: { commerce_vente_gestion: 5 } },
    { value: "agriculture_environnement", label: "Agriculture, élevage, environnement", scores: { agriculture_environnement: 5 } },
    { value: "transport_securite", label: "Transport, logistique, sécurité", scores: { transport_securite: 5 } },
    { value: "pas_sur_metier", label: "Je ne sais pas encore, aide-moi à trouver", scores: {} }
  ];

  const BANQUE_COMPETENCE_PRATIQUE = [
    { value: "manuel_metier", label: "Travailler de mes mains, réparer, construire", scores: { batiment_industrie: 3, agriculture_environnement: 1 } },
    { value: "numerique_metier", label: "Utiliser un ordinateur ou un smartphone facilement", scores: { numerique_pratique: 3 } },
    { value: "cuisine_metier", label: "Cuisiner, servir, accueillir", scores: { hotellerie_restauration: 3 } },
    { value: "coudre_metier", label: "Coudre, créer, embellir", scores: { mode_artisanat: 3 } },
    { value: "filmer_metier", label: "Filmer, monter, créer du contenu", scores: { audiovisuel_creation: 3 } },
    { value: "soin_metier", label: "M'occuper des autres, du corps, de la santé", scores: { sante_aide_personne: 3 } },
    { value: "vendre_metier", label: "Vendre, conseiller, négocier", scores: { commerce_vente_gestion: 3 } },
    { value: "terre_metier", label: "Travailler la terre, m'occuper d'animaux", scores: { agriculture_environnement: 3 } },
    { value: "conduire_metier", label: "Conduire, transporter, veiller à la sécurité", scores: { transport_securite: 3 } }
  ];

  const BANQUE_INTERET_PRATIQUE = [
    { value: "bricolage_int", label: "Bricolage / réparation", scores: { batiment_industrie: 2 } },
    { value: "numerique_int", label: "Numérique / réseaux sociaux", scores: { numerique_pratique: 2, audiovisuel_creation: 1 } },
    { value: "cuisine_int", label: "Cuisine / pâtisserie", scores: { hotellerie_restauration: 2 } },
    { value: "mode_int", label: "Mode / beauté / couture", scores: { mode_artisanat: 2 } },
    { value: "image_int", label: "Image / vidéo / photo", scores: { audiovisuel_creation: 2 } },
    { value: "aide_int_metier", label: "Aide aux autres / santé", scores: { sante_aide_personne: 2 } },
    { value: "vente_int", label: "Vente / négociation / business", scores: { commerce_vente_gestion: 2 } },
    { value: "nature_int", label: "Nature / agriculture / animaux", scores: { agriculture_environnement: 2 } },
    { value: "transport_int", label: "Transport / conduite / sécurité", scores: { transport_securite: 2 } }
  ];

  function idsMetiers() {
    return Object.keys(METIERS);
  }

  /* Construit le questionnaire du parcours "Je souhaite apprendre un
     métier" : compact (3 questions scorées + quelques questions de
     contexte), pensé pour une inscription rapide, sans jamais demander
     une série de bac ou une filière — puisque justement, cette personne
     n'en a pas. */
  function construireQuestionnaireMetier() {
    return [
      {
        id: "secteur_metier_interet", type: "single", poids: 4, categorie: "Ton métier",
        label: "Le secteur qui t'intéresse le plus", required: true,
        options: BANQUE_SECTEUR_METIER
      },
      {
        id: "competence_pratique", type: "single", poids: 3, categorie: "Ton métier",
        label: "Ce que tu fais le plus naturellement bien", required: true,
        options: BANQUE_COMPETENCE_PRATIQUE
      },
      {
        id: "interets_pratiques", type: "multi", max: 2, poids: 2, categorie: "Ton métier",
        label: "Tes centres d'intérêt (jusqu'à 2)", required: false,
        options: BANQUE_INTERET_PRATIQUE
      },
      {
        id: "experience_metier", meta: true, type: "text", categorie: "Ton métier",
        label: "As-tu déjà une expérience, même petite, dans ce domaine ? (optionnel)", required: false,
        placeholder: "Ex : stage, aide à un proche, petit boulot…"
      },
      {
        id: "objectif_pro_metier", meta: true, type: "select", categorie: "Ton objectif",
        label: "Ton objectif principal", required: true,
        options: [
          { value: "emploi_rapide", label: "Trouver un emploi salarié le plus vite possible" },
          { value: "independant", label: "Créer ma propre activité / être indépendant·e" },
          { value: "certification", label: "Obtenir une certification reconnue" }
        ]
      },
      {
        id: "type_etablissement", meta: true, type: "select", categorie: "Ton objectif",
        label: "Centre public ou privé ?", required: true,
        options: [
          { value: "indifferent", label: "Peu importe" },
          { value: "public", label: "Public de préférence" },
          { value: "prive", label: "Privé de préférence" }
        ]
      },
      {
        id: "ville", meta: true, type: "select", categorie: "Ton objectif",
        label: "Ta ville", required: true,
        options: VILLES_SENEGAL.map(v => ({ value: v, label: v }))
      }
    ];
  }

  /* ---------------------------------------------------------------
     4. QUESTIONNAIRE DYNAMIQUE DU PARCOURS "APRÈS UN DIPLÔME"
     Une seule fonction construit le questionnaire adapté au diplôme :
     - "bac" reçoit le questionnaire de découverte complet (matières,
       série, compétences, personnalité, langues…) puisque cette
       personne choisit sa toute première direction ;
     - "bts" / "dut" / "licence" / "master" / "doctorat" / "autre"
       reçoivent un questionnaire compact centré sur leur filière
       actuelle et leur projet, avec un intitulé et des options propres
       à leur niveau (on ne demande pas la même chose à un titulaire de
       Master qu'à un titulaire de BTS).
     Le tronc commun (secteurs, objectif de carrière, valeurs, budget,
     région, ville…) reste partagé pour que le moteur de recommandation
     reste cohérent d'un niveau à l'autre. */
  function construireQuestionnaireApresDiplome(diplome, objectif) {
    const infoDiplome = DIPLOMES.find(d => d.value === diplome) || DIPLOMES[0];
    const estBac = diplome === "bac";
    const questions = [];

    if (estBac) {
      questions.push(
        { id: "serie_bac", type: "single", poids: 2.5, categorie: "Ton profil scolaire",
          label: "Ta série actuelle ou celle de ton bac", required: false, options: BANQUE_SERIE_BAC },
        { id: "matieres_preferees", type: "multi", max: 3, poids: 2.2, categorie: "Matières & compétences",
          label: "Tes matières préférées (jusqu'à 3)", required: true, options: BANQUE_MATIERES },
        { id: "matieres_moins_aimees", type: "multi", max: 2, poids: -1.8, categorie: "Matières & compétences",
          label: "Tes matières les moins appréciées (jusqu'à 2)", required: false,
          aide: "Ces matières réduisent légèrement le score des filières associées.", options: BANQUE_MATIERES },
        { id: "competences_naturelles", type: "multi", max: 3, poids: 2, categorie: "Matières & compétences",
          label: "Tes compétences naturelles (jusqu'à 3)", required: true, options: BANQUE_COMPETENCES },
        { id: "resolution_problemes", type: "single", poids: 2, categorie: "Matières & compétences",
          label: "Face à un problème compliqué, tu réagis plutôt…", required: true, options: BANQUE_RESOLUTION },
        { id: "centres_interet", type: "multi", max: 4, poids: 1.4, categorie: "Intérêts & passions",
          label: "Tes centres d'intérêt (jusqu'à 4)", required: true, options: BANQUE_INTERETS },
        { id: "type_travail", type: "single", poids: 2, categorie: "Environnement de travail",
          label: "Ton environnement de travail idéal", required: true, options: BANQUE_TYPE_TRAVAIL },
        { id: "mode_travail", type: "scale", poids: 1.5, categorie: "Environnement de travail",
          label: "Seul·e ou en équipe ?", required: true, echelle: ECHELLE_MODE_TRAVAIL },
        { id: "stabilite_innovation", type: "scale", poids: 1.5, categorie: "Environnement de travail",
          label: "Tu préfères plutôt…", required: true, echelle: ECHELLE_STABILITE_INNOVATION },
        { id: "qualites_personnelles", type: "multi", max: 3, poids: 2, categorie: "Personnalité",
          label: "Tes qualités personnelles (jusqu'à 3)", required: true, options: BANQUE_QUALITES },
        { id: "niveau_informatique", type: "single", poids: 2, categorie: "Compétences techniques",
          label: "Ton niveau en informatique", required: true, options: NIVEAU_INFORMATIQUE },
        { id: "niveau_langues", type: "single", poids: 1.5, categorie: "Compétences techniques",
          label: "Ton niveau en langues étrangères", required: true, options: NIVEAU_LANGUES }
      );
    } else {
      const labelFiliere = {
        bts: "Ta filière de BTS actuelle", dut: "Ta filière de DUT actuelle",
        licence: "Ta filière de Licence actuelle", master: "Ta filière ou spécialité de Master actuelle",
        doctorat: "Ton domaine de recherche (thèse)", autre: "Ton diplôme et ton domaine actuels"
      }[diplome] || "Ta filière actuelle";

      questions.push(
        { id: "filiere_actuelle", meta: true, type: "text", categorie: "Ta situation actuelle",
          label: labelFiliere, required: false, placeholder: infoDiplome.placeholderFiliere },
        { id: "domaine_filiere_actuelle", type: "single", poids: 3.5, categorie: "Ta situation actuelle",
          label: "Dans quel grand domaine se situe ta filière actuelle ?", required: true, options: BANQUE_DOMAINE_ACTUEL },
        { id: "competences_naturelles", type: "multi", max: 3, poids: 2, categorie: "Ta situation actuelle",
          label: "Tes compétences naturelles (jusqu'à 3)", required: true, options: BANQUE_COMPETENCES },
        { id: "type_travail", type: "single", poids: 2, categorie: "Ta situation actuelle",
          label: "Ton environnement de travail idéal", required: true, options: BANQUE_TYPE_TRAVAIL }
      );

      if (diplome === "master" || diplome === "doctorat") {
        const optionsRecherchePro = diplome === "doctorat"
          ? [
              { value: "academique", label: "Carrière académique / recherche", scores: { education_humaines: 3 } },
              { value: "recherche_appliquee", label: "Recherche appliquée en entreprise", scores: { ingenierie: 2, info_num: 1 } },
              { value: "conseil_expertise", label: "Conseil / expertise indépendante", scores: { commerce_gestion: 2, droit_admin: 1 } },
              { value: "enseignement_sup", label: "Enseignement supérieur", scores: { education_humaines: 3 } }
            ]
          : [
              { value: "doctorat_suite", label: "Recherche et poursuite en doctorat", scores: { education_humaines: 2 } },
              { value: "expertise_technique", label: "Expertise technique pointue en entreprise", scores: { info_num: 2, ingenierie: 2 } },
              { value: "creation_entreprise", label: "Création de ma propre activité", scores: { commerce_gestion: 3 } },
              { value: "enseignement_transmission", label: "Enseignement / transmission", scores: { education_humaines: 2 } }
            ];
        questions.push({
          id: "orientation_recherche_pro", type: "single", poids: 2.5, categorie: "Ta situation actuelle",
          label: diplome === "doctorat" ? "Après ce doctorat, tu te vois plutôt en…" : "Après ce Master, tu te vois plutôt en…",
          required: true, options: optionsRecherchePro
        });
      }
    }

    // --- Tronc commun : objectifs, secteurs, valeurs ---
    questions.push(
      { id: "objectif_carriere", type: "single", poids: 3, categorie: "Objectifs de carrière",
        label: "Ce qui te ferait le plus vibrer dans 10 ans", required: true, options: BANQUE_OBJECTIFS_CARRIERE },
      { id: "secteurs_attirants", type: "multi", max: 3, poids: 2.2, categorie: "Objectifs de carrière",
        label: "Les secteurs professionnels qui t'attirent (jusqu'à 3)", required: true, options: BANQUE_SECTEURS },
      { id: "valeurs_importantes", type: "rank", max: 3, categorie: "Objectifs de carrière",
        label: "Classe les 3 valeurs les plus importantes pour toi, dans l'ordre", required: true, options: BANQUE_VALEURS }
    );

    // --- Tronc commun : études et logistique ---
    questions.push(
      { id: "type_etablissement", meta: true, type: "select", categorie: "Études & logistique",
        label: "École ou université publique ou privée ?", required: true,
        options: [
          { value: "indifferent", label: "Peu importe" },
          { value: "public", label: "Publique de préférence" },
          { value: "prive", label: "Privée de préférence" }
        ] },
      { id: "niveau_etudes_vise", meta: true, type: "select", categorie: "Études & logistique",
        label: "Niveau d'études visé", required: true,
        options: NIVEAU_VISE_PAR_DIPLOME[diplome] || NIVEAU_VISE_PAR_DIPLOME.bac },
      { id: "region", meta: true, type: "select", categorie: "Études & logistique",
        label: "Région souhaitée pour étudier", required: false,
        options: REGIONS_SENEGAL.map(v => ({ value: v, label: v })) },
      { id: "ville", meta: true, type: "select", categorie: "Études & logistique",
        label: "Ta ville", required: true,
        options: VILLES_SENEGAL.map(v => ({ value: v, label: v })) }
    );

    return questions;
  }

  /* ---------------------------------------------------------------
     EXPORT
     --------------------------------------------------------------- */
  global.OrientationData = {
    PROFILS,
    METIERS,
    MACRO_STYLE,
    PARCOURS,
    DIPLOMES,
    OBJECTIFS_PAR_DIPLOME,
    BANQUE_PROJET_APRES,
    VILLES_SENEGAL,
    REGIONS_SENEGAL,
    construireQuestionnaireApresDiplome,
    construireQuestionnaireMetier
  };
})(window);
