-- =====================================================================
-- Schéma "Comptes & abonnement" — Parcourio
-- ---------------------------------------------------------------------
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller
-- ce fichier en entier > Run.
--
-- Ce fichier suppose que l'authentification Supabase (auth.users) est
-- déjà active par défaut sur ton projet — c'est le cas sans rien à
-- configurer, Supabase gère `auth.users` automatiquement dès que tu
-- utilises supabase.auth.signUp() / signInWithPassword().
-- =====================================================================

-- 1. Profil utilisateur (miroir léger de auth.users, avec nos propres champs)
create table if not exists utilisateurs (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  prenom        text,
  nom           text,
  telephone     text,
  region        text,
  created_at    timestamptz default now()
);

-- Si la table existait déjà (installation précédente), on ajoute les
-- colonnes manquantes sans rien casser :
alter table utilisateurs add column if not exists prenom text;
alter table utilisateurs add column if not exists telephone text;
alter table utilisateurs add column if not exists region text;
alter table utilisateurs add column if not exists essai_utilise boolean default false;

-- 2. Abonnements (test avancé)
create table if not exists abonnements (
  id                  uuid primary key default gen_random_uuid(),
  utilisateur_id      uuid not null references utilisateurs(id) on delete cascade,
  statut              text not null check (statut in ('actif','expire','annule')),
  plan                text not null default 'test_avance',
  date_debut          timestamptz default now(),
  date_fin            timestamptz,
  reference_paiement  text
);

create index if not exists idx_abonnements_utilisateur on abonnements (utilisateur_id);
create unique index if not exists idx_abonnements_reference_paiement on abonnements (reference_paiement) where reference_paiement is not null;

-- 3. Résultats de tests (rapide + avancé), pour l'espace "Mon compte" plus tard
create table if not exists resultats_tests (
  id              uuid primary key default gen_random_uuid(),
  utilisateur_id  uuid references utilisateurs(id) on delete cascade,
  parcours        text not null,       -- 'apres_diplome' / 'apprendre_metier'
  type_test       text not null check (type_test in ('rapide','avance')),
  reponses        jsonb,
  resultat        jsonb,
  created_at      timestamptz default now()
);

create index if not exists idx_resultats_utilisateur on resultats_tests (utilisateur_id);

-- ---------------------------------------------------------------------
-- 4. Row Level Security : chaque utilisateur ne voit / modifie QUE ses
--    propres lignes. Indispensable dès qu'on stocke des données
--    personnelles accessibles depuis le navigateur (clé "anon").
-- ---------------------------------------------------------------------

alter table utilisateurs enable row level security;
alter table abonnements enable row level security;
alter table resultats_tests enable row level security;

-- Chaque "create policy" est précédé d'un "drop policy if exists" pour
-- que ce script reste ré-exécutable sans erreur (utile si tu dois le
-- relancer après une première installation partielle).

drop policy if exists "Un utilisateur voit son propre profil" on utilisateurs;
create policy "Un utilisateur voit son propre profil"
  on utilisateurs for select
  using (auth.uid() = id);

drop policy if exists "Un utilisateur crée son propre profil" on utilisateurs;
create policy "Un utilisateur crée son propre profil"
  on utilisateurs for insert
  with check (auth.uid() = id);

drop policy if exists "Un utilisateur modifie son propre profil" on utilisateurs;
create policy "Un utilisateur modifie son propre profil"
  on utilisateurs for update
  using (auth.uid() = id);

drop policy if exists "Un utilisateur voit son propre abonnement" on abonnements;
create policy "Un utilisateur voit son propre abonnement"
  on abonnements for select
  using (auth.uid() = utilisateur_id);

drop policy if exists "Un utilisateur voit ses propres résultats" on resultats_tests;
create policy "Un utilisateur voit ses propres résultats"
  on resultats_tests for select
  using (auth.uid() = utilisateur_id);

drop policy if exists "Un utilisateur enregistre ses propres résultats" on resultats_tests;
create policy "Un utilisateur enregistre ses propres résultats"
  on resultats_tests for insert
  with check (auth.uid() = utilisateur_id);

-- Note : la table `abonnements` n'a volontairement pas de policy
-- "insert"/"update" ouverte au client. La création/mise à jour d'un
-- abonnement (après paiement confirmé) se fera côté serveur, via une
-- Supabase Edge Function utilisant la clé service_role (Phase 4) — pas
-- depuis le navigateur, pour éviter qu'un utilisateur ne s'auto-déclare
-- abonné en trafiquant le JS.

-- ---------------------------------------------------------------------
-- 5. Création automatique du profil `utilisateurs` à chaque inscription
-- ---------------------------------------------------------------------

create or replace function public.gerer_nouvel_utilisateur()
returns trigger as $$
begin
  insert into public.utilisateurs (id, email, prenom, nom, telephone, region)
  values (
    new.id, new.email,
    new.raw_user_meta_data->>'prenom',
    new.raw_user_meta_data->>'nom',
    new.raw_user_meta_data->>'telephone',
    new.raw_user_meta_data->>'region'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.gerer_nouvel_utilisateur();
