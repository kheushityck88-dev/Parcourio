-- =====================================================================
-- Schéma "Analytique" — Parcourio
-- ---------------------------------------------------------------------
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller
-- ce fichier en entier > Run. Suppose que schema-comptes.sql a déjà été
-- exécuté.
--
-- Principe : une seule table d'événements, volontairement générique
-- (type + donnees en JSON), pour ne pas avoir à créer une table par
-- métrique. Le dashboard admin (voir supabase-functions/admin-stats)
-- fait l'agrégation à la lecture.
--
-- Ce qui N'A PAS besoin de cette table, car déjà disponible ailleurs :
--   - Nombre d'utilisateurs / nouveaux utilisateurs → table `utilisateurs`
--     (created_at déjà présent)
--   - Tests terminés → table `resultats_tests` (déjà enregistrée à
--     chaque résultat affiché, voir script.js/enregistrerResultat)
--   - Abonnements actifs → table `abonnements`
--
-- Ce que CETTE table enregistre (pas suivi ailleurs) :
--   - test_commence      : la personne a lancé un test (avant résultat)
--   - test_termine       : la personne a terminé un test, connectée ou
--                           non (resultats_tests n'enregistre QUE les
--                           personnes connectées — voir auth.js)
--   - consultation_ecole : ouverture de la fiche détaillée d'une école
--   - clic_ecole         : clic vers le site officiel d'une école
--   - consultation_formation : vue d'une page métier (ex. metiers/*.html)
--   - consultation_ville     : vue d'une page ville (ex. ecoles/*.html)
--   - visite_page        : vue de la page d'accueil (mesure de trafic
--                           générale, sans action précise)
-- =====================================================================

create table if not exists evenements (
  id              uuid primary key default gen_random_uuid(),
  type            text not null check (type in (
                    'test_commence',
                    'test_termine',
                    'consultation_ecole',
                    'clic_ecole',
                    'consultation_formation',
                    'consultation_ville',
                    'visite_page'
                  )),
  utilisateur_id  uuid references utilisateurs(id) on delete set null, -- null = visiteur non connecté
  donnees         jsonb default '{}'::jsonb,   -- ex: {"ecoleId":"...", "nom":"...", "ville":"..."}
  created_at      timestamptz default now()
);

-- Si la table existait déjà avec l'ancienne liste de types (avant l'ajout
-- de test_termine et visite_page), on élargit la contrainte sans tout
-- recréer — ce bloc est sans effet si la table vient d'être créée
-- ci-dessus avec la liste déjà à jour.
do $$
begin
  if exists (
    select 1 from information_schema.tables where table_name = 'evenements'
  ) then
    alter table evenements drop constraint if exists evenements_type_check;
    alter table evenements add constraint evenements_type_check check (type in (
      'test_commence',
      'test_termine',
      'consultation_ecole',
      'clic_ecole',
      'consultation_formation',
      'consultation_ville',
      'visite_page'
    ));
  end if;
end $$;

create index if not exists idx_evenements_type on evenements (type);
create index if not exists idx_evenements_created on evenements (created_at);
-- Index utile pour compter les consultations par école/formation sans
-- scanner tout le JSON à chaque fois :
create index if not exists idx_evenements_donnees on evenements using gin (donnees);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
-- Tout le monde (y compris un visiteur non connecté) peut ENREGISTRER
-- un événement — c'est le but, on veut mesurer l'usage réel du site
-- public. Personne ne peut LIRE cette table depuis le navigateur : la
-- lecture se fait uniquement via la fonction Edge admin-stats, avec la
-- clé service_role, réservée aux administrateurs (voir ADMIN_EMAILS).
alter table evenements enable row level security;

drop policy if exists "Tout le monde peut enregistrer un événement" on evenements;
create policy "Tout le monde peut enregistrer un événement"
  on evenements for insert
  with check (true);

-- Volontairement AUCUNE policy "select" : ni les visiteurs, ni les
-- utilisateurs connectés (pas même sur leurs propres événements) ne
-- peuvent lire cette table depuis le client. Seule la fonction Edge
-- admin-stats (clé service_role, qui contourne RLS) y a accès.
