-- =====================================================================
-- Schéma "Test avancé — paiement unique" — Parcourio
-- ---------------------------------------------------------------------
-- À exécuter dans Supabase : Dashboard > SQL Editor > New query > coller
-- ce fichier en entier > Run. Suppose que schema-comptes.sql a déjà été
-- exécuté (la table `utilisateurs` doit exister).
--
-- Remplace le modèle "abonnement mensuel" (table `abonnements`, encore
-- présente mais plus utilisée pour le test avancé) par un modèle
-- "paiement unique = une tentative" :
--   - 500 FCFA, une seule tentative de test avancé par paiement validé ;
--   - vérification manuelle par un admin dans un premier temps (voir
--     supabase-functions/valider-paiement-avance) ;
--   - `moyen_verification` distingue déjà 'manuel' de 'wave_api', pour
--     pouvoir brancher l'API Wave plus tard SANS changer la structure :
--     il suffira qu'un futur webhook Wave insère/valide directement une
--     ligne avec moyen_verification = 'wave_api', au lieu qu'un humain
--     le fasse à la main depuis admin-paiements.html.
-- =====================================================================

create table if not exists test_avance_achats (
  id                       uuid primary key default gen_random_uuid(),
  utilisateur_id           uuid not null references utilisateurs(id) on delete cascade,
  montant_fcfa             integer not null default 500,
  statut                   text not null default 'en_attente' check (statut in ('en_attente','valide','rejete')),
  moyen_verification       text not null default 'manuel' check (moyen_verification in ('manuel','wave_api')),
  -- Ce que l'utilisateur indique lui-même en déclarant son paiement,
  -- pour aider l'admin à retrouver la transaction dans le Business
  -- Portal Wave (aucun des deux champs n'est garanti/vérifié à ce stade
  -- — d'où la vérification manuelle).
  numero_wave_utilisateur  text,
  reference_wave           text,
  notes_admin              text,
  valide_par               uuid references utilisateurs(id),
  valide_le                timestamptz,
  -- Passe à true dès que l'utilisateur termine un test avec ce
  -- paiement validé (voir le trigger plus bas) — une tentative validée
  -- ne peut alors plus servir une deuxième fois.
  tentative_utilisee       boolean not null default false,
  created_at               timestamptz default now()
);

-- Un seul paiement "en_attente" à la fois par utilisateur : empêche de
-- spammer les déclarations pendant qu'une vérification est en cours.
-- (Après un rejet ou une tentative déjà utilisée, une nouvelle ligne
-- "en_attente" redevient possible pour un nouvel achat.)
create unique index if not exists idx_test_avance_achats_en_attente_unique
  on test_avance_achats (utilisateur_id)
  where statut = 'en_attente';

create index if not exists idx_test_avance_achats_utilisateur on test_avance_achats (utilisateur_id);
create index if not exists idx_test_avance_achats_statut on test_avance_achats (statut);

alter table test_avance_achats enable row level security;

drop policy if exists "Un utilisateur voit ses propres paiements" on test_avance_achats;
create policy "Un utilisateur voit ses propres paiements"
  on test_avance_achats for select
  using (auth.uid() = utilisateur_id);

-- Le client peut créer SA déclaration de paiement (toujours au statut
-- "en_attente" — l'index unique ci-dessus empêche d'en empiler
-- plusieurs). Il ne peut en revanche ni la valider ni la modifier
-- ensuite : seule une Edge Function avec la clé service_role (donc
-- passée par un vrai contrôle admin) peut faire passer une ligne à
-- "valide" ou "rejete". Ça évite qu'un utilisateur ne s'auto-débloque
-- le test avancé en trafiquant le JS du navigateur.
drop policy if exists "Un utilisateur déclare son propre paiement" on test_avance_achats;
create policy "Un utilisateur déclare son propre paiement"
  on test_avance_achats for insert
  with check (auth.uid() = utilisateur_id and statut = 'en_attente');

-- ---------------------------------------------------------------------
-- Marque automatiquement une tentative comme "utilisée" dès qu'un
-- résultat de type "avance" est enregistré pour l'utilisateur, sur son
-- paiement validé le plus ancien pas encore utilisé. Géré côté base de
-- données (et non par un appel du navigateur) pour que ce soit fiable
-- même si le JS client plante ou est contourné.
-- ---------------------------------------------------------------------
create or replace function public.marquer_tentative_avancee_utilisee()
returns trigger as $$
begin
  if new.type_test = 'avance' then
    update test_avance_achats
    set tentative_utilisee = true
    where id = (
      select id from test_avance_achats
      where utilisateur_id = new.utilisateur_id
        and statut = 'valide'
        and tentative_utilisee = false
      order by valide_le asc nulls last
      limit 1
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_resultat_avance_insere on resultats_tests;
create trigger on_resultat_avance_insere
  after insert on resultats_tests
  for each row execute function public.marquer_tentative_avancee_utilisee();
