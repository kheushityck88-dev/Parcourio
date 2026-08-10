-- =====================================================================
-- Schéma "Avis étudiants" — Parcourio
-- ---------------------------------------------------------------------
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller
-- ce fichier en entier > Run. Suppose que schema-comptes.sql a déjà été
-- exécuté (la table `utilisateurs` doit exister).
-- =====================================================================

-- 1. Avis (note + commentaire) sur une école. Un avis par (école,
--    utilisateur) — pas de doublons.
create table if not exists avis (
  id              uuid primary key default gen_random_uuid(),
  ecole_id        text not null,             -- correspond au "id" de ecoles.json
  utilisateur_id  uuid not null references utilisateurs(id) on delete cascade,
  note            smallint not null check (note between 1 and 5),
  commentaire     text,
  statut          text not null default 'en_attente' check (statut in ('en_attente','approuve','rejete')),
  created_at      timestamptz default now(),
  unique (ecole_id, utilisateur_id)
);

create index if not exists idx_avis_ecole on avis (ecole_id);
create index if not exists idx_avis_statut on avis (statut);

-- 2. Signalements : une personne peut signaler un avis existant
--    (contenu abusif, faux avis…). Un signalement par (avis, personne).
create table if not exists signalements_avis (
  id              uuid primary key default gen_random_uuid(),
  avis_id         uuid not null references avis(id) on delete cascade,
  utilisateur_id  uuid not null references utilisateurs(id) on delete cascade,
  motif           text,
  created_at      timestamptz default now(),
  unique (avis_id, utilisateur_id)
);

-- ---------------------------------------------------------------------
-- 3. Row Level Security
-- ---------------------------------------------------------------------
alter table avis enable row level security;
alter table signalements_avis enable row level security;

drop policy if exists "Avis approuvés visibles par tous, + ses propres avis" on avis;
create policy "Avis approuvés visibles par tous, + ses propres avis"
  on avis for select
  using (statut = 'approuve' or auth.uid() = utilisateur_id);

drop policy if exists "Un utilisateur poste son propre avis" on avis;
create policy "Un utilisateur poste son propre avis"
  on avis for insert
  with check (auth.uid() = utilisateur_id);

drop policy if exists "Un utilisateur modifie son propre avis avant modération" on avis;
create policy "Un utilisateur modifie son propre avis avant modération"
  on avis for update
  using (auth.uid() = utilisateur_id and statut = 'en_attente')
  with check (auth.uid() = utilisateur_id);

drop policy if exists "Un utilisateur supprime son propre avis" on avis;
create policy "Un utilisateur supprime son propre avis"
  on avis for delete
  using (auth.uid() = utilisateur_id);

drop policy if exists "Un utilisateur signale un avis" on signalements_avis;
create policy "Un utilisateur signale un avis"
  on signalements_avis for insert
  with check (auth.uid() = utilisateur_id);

-- Note : pas de policy "select" sur signalements_avis — inutile pour
-- l'usage actuel (la modération se fait manuellement, voir plus bas).

-- ---------------------------------------------------------------------
-- 4. Modération — IMPORTANT, à lire
-- ---------------------------------------------------------------------
-- Chaque nouvel avis part avec statut = 'en_attente' et N'EST PAS
-- visible publiquement tant qu'il n'est pas passé à 'approuve'. Il n'y
-- a volontairement PAS de policy "update" ouverte à tout le monde pour
-- changer ce statut (sinon n'importe qui pourrait approuver son propre
-- avis) : c'est un choix de sécurité, pas un oubli.
--
-- Tant qu'aucun panneau d'administration n'est construit, la
-- modération se fait à la main dans Supabase :
--   Dashboard > Table Editor > avis > filtrer statut = en_attente
--   > relire le commentaire > changer 'statut' en 'approuve' ou 'rejete'.
--
-- Les signalements (table signalements_avis) sont à consulter de la
-- même façon : trier par avis_id pour repérer les avis les plus
-- signalés et les remonter en priorité dans la file de modération.
