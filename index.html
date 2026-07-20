-- Schéma de référence pour migrer assets/data/ecoles.json vers Supabase / PostgreSQL.
-- Chaque colonne correspond exactement à une clé du JSON actuel : le fichier
-- JSON peut donc être importé tel quel (COPY ... FROM 'ecoles.json' ou un
-- script d'insertion) sans transformation de données.
-- Ceci est un DOCUMENT DE RÉFÉRENCE, il n'est pas exécuté par le site.

create table if not exists ecoles (
  id               text primary key,          -- slug unique (ex: "dakar-institut-superieur-de-management")
  nom              text not null,
  sigle            text,                       -- ex: "ISM", "ESP"
  ville            text not null,
  region           text not null,              -- l'une des 14 régions du Sénégal
  domaine          text not null check (domaine in ('technologie','gestion','social','creatif')),
  type             text not null check (type in ('public','privé')),
  logo             text,                       -- URL ou chemin vers le logo
  adresse          text,
  description      text,
  site_officiel    text,
  telephone        text,
  email            text,
  reseaux          jsonb default '{}'::jsonb,  -- { "facebook": "...", "linkedin": "..." }
  secteurs         text[] default '{}',        -- filières fines (ex: "Cybersécurité", "Design")
  filieres         text[] default '{}',
  diplomes         text[] default '{}',        -- ex: {"BTS","Licence","Master"}
  niveau_accepte   text[] default '{}',        -- ex: {"Bac","Bac+2"}
  admission        text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_ecoles_region  on ecoles (region);
create index if not exists idx_ecoles_ville   on ecoles (ville);
create index if not exists idx_ecoles_domaine on ecoles (domaine);
create index if not exists idx_ecoles_type    on ecoles (type);

-- Recherche plein texte simple sur nom + sigle + secteurs (à activer si besoin) :
-- create index if not exists idx_ecoles_recherche on ecoles
--   using gin (to_tsvector('french', coalesce(nom,'') || ' ' || coalesce(sigle,'') || ' ' || array_to_string(secteurs, ' ')));

-- Une fois la table alimentée, le front-end (script.js) peut être basculé
-- de `fetch('assets/data/ecoles.json')` vers un client Supabase :
--   const { data } = await supabase.from('ecoles').select('*');
-- La forme des objets retournés reste identique à celle du JSON actuel
-- (à l'exception de site_officiel / niveau_accepte en snake_case au lieu
-- de siteOfficiel / niveauAccepte : prévoir un petit mapping si besoin).
