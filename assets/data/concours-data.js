/* Données de la rubrique "Concours". Chaque entrée est sourcée (voir
   "source" et "lienOfficiel") et date de vérification août 2026. Les
   dates d'épreuves changent chaque année : elles sont indiquées ici à
   titre de repère ("session 2026") et doivent être reconfirmées sur le
   site officiel de l'établissement avant toute démarche. */
window.CONCOURS_DATA = [
  {
    id: "campusen",
    nom: "Campusen — orientation post-BAC",
    organisme: "Ministère de l'Enseignement supérieur, de la Recherche et de l'Innovation (MESRI)",
    description: "Le portail national qui oriente tous les nouveaux bacheliers sénégalais vers les universités publiques et les Instituts Supérieurs d'Enseignement Professionnel (ISEP). Étape obligatoire pour viser le public, même si tu comptes aussi passer un concours indépendant (EPT, écoles privées…).",
    niveauRequis: "Être candidat ou titulaire du baccalauréat sénégalais (une procédure séparée existe pour les bacheliers étrangers)",
    age: "Aucune limite d'âge spécifique",
    epreuves: ["Pas d'épreuve : l'orientation se fait selon les résultats du BAC et les vœux formulés"],
    pieces: ["Numéro de table du BAC", "Date de naissance", "Un compte créé sur orientation.campusen.sn (génère un INE, l'identifiant national étudiant)"],
    datesIndicatives: "Session 2026 : ouverture des inscriptions le 17 août 2026 pour les candidats de la session normale du BAC 2026.",
    lienOfficiel: "https://orientation.campusen.sn",
    source: "SeneNews, 31 juillet 2026",
    lienSource: "https://www.senenews.com/actualites/campusen-2026-les-inscriptions-ouvrent-le-17-aout-ce-quil-faut-savoir-pour-les-bacheliers_595103.html"
  },
  {
    id: "ept-thies",
    nom: "Concours d'entrée — École Polytechnique de Thiès (EPT)",
    organisme: "École Polytechnique de Thiès",
    description: "Le concours public le plus réputé pour intégrer une formation d'ingénieur de conception (5 ans) au Sénégal. Indépendant de Campusen : il faut s'inscrire séparément.",
    niveauRequis: "Élève de Terminale scientifique ou technique (S1, S2, S3, STIDD, T1, T2), bachelier ou candidat libre",
    age: "Moins de 22 ans au 1er octobre de l'année du concours",
    epreuves: ["QCM de mathématiques et autres matières scientifiques, 3 heures"],
    pieces: ["Fiche de candidature", "Bulletins de notes légalisés (Seconde, Première, 1er semestre de Terminale)", "7 000 FCFA de frais de dossier, non remboursables"],
    datesIndicatives: "Session 2026 (déjà passée) : inscriptions du 2 février au 15 avril 2026, concours le 13 juin 2026. Une nouvelle session s'ouvre chaque année sur le même rythme (dossiers vers février-avril, épreuve en juin).",
    lienOfficiel: "https://concours.ept.edu.sn",
    source: "École Polytechnique de Thiès (site officiel), 2026",
    lienSource: "https://ept.edu.sn/?lang=fr"
  },
  {
    id: "isep",
    nom: "Concours d'admission — ISEP (Instituts Supérieurs d'Enseignement Professionnel)",
    organisme: "ISEP (Thiès, Bignona, Diamniadio, Matam, Mbacké, Richard-Toll)",
    description: "Formations publiques de technicien supérieur (BAC+2/3), en lien direct avec le marché de l'emploi : numérique, tourisme, agriculture, transport ferroviaire, et bien d'autres selon le site. L'admission se fait aussi via Campusen.",
    niveauRequis: "Baccalauréat ou Brevet de Technicien (BT), séries exigées variables selon la filière visée",
    age: "Non communiqué publiquement — se renseigner directement auprès de l'ISEP visé",
    epreuves: ["Sélection sur dossier", "Test", "Entretien avec un jury"],
    pieces: ["Formulaire de demande d'admission", "Bulletins de notes", "Diplôme (BAC ou BT) ou attestation"],
    datesIndicatives: "Calendrier aligné sur celui de Campusen (mai-juin). Droits d'inscription annuels : environ 90 000 FCFA (tarif ISEP-Thiès, peut varier selon le site).",
    lienOfficiel: "https://www.campusen.sn",
    source: "ISEP-Thiès (site officiel) et Kamerpower, 2025-2026",
    lienSource: "https://www.isep-thies.sn/"
  },
  {
    id: "ena",
    nom: "Concours d'entrée — École Nationale d'Administration (ENA)",
    organisme: "École Nationale d'Administration du Sénégal",
    description: "La voie royale vers la haute fonction publique sénégalaise (administrateurs civils, inspecteurs, diplomates). Concours par cycle selon le niveau de diplôme déjà obtenu.",
    niveauRequis: "Cycle A : Maîtrise ou diplôme équivalent (hiérarchie A3). Cycle B : Baccalauréat.",
    age: "18 à 33 ans au 1er janvier de l'année du concours (conditions différentes pour les concours professionnels réservés aux agents de l'État déjà en poste)",
    epreuves: ["Épreuves écrites réparties sur plusieurs jours selon le cycle (ex. cycle A : 3 jours, cycle B : 2 jours)"],
    pieces: ["Dossier de candidature en ligne sur le site officiel de l'ENA", "Diplômes requis pour le cycle visé", "Pièce d'identité"],
    datesIndicatives: "Session 2026 (déjà passée) : cycle A du 10 au 12 juin, cycle B les 16-17 juin, cycle C les 18-19 juin 2026. Une session supplémentaire est parfois organisée en septembre.",
    lienOfficiel: "https://www.ena.sn",
    source: "École Nationale d'Administration du Sénégal (site officiel)",
    lienSource: "https://www.ena.sn/conditions-dacces-a-lena/"
  }
];
