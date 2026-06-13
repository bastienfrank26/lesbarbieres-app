-- =====================================================================
-- CRM Signa — Les Frères Barbiers
-- Migration initiale : modules Services, Clients, Barbiers, Agenda
-- Réf. : docs/cahier-des-charges-crm.md
-- =====================================================================

-- ---------- Enums ----------
create type appointment_status as enum ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
create type appointment_source as enum ('online', 'internal');

-- ---------- Services ----------
create table services (
  id            uuid primary key default gen_random_uuid(),
  category      text not null,
  name          text not null,
  description   text,
  price_cents   integer not null default 0,
  duration_min  integer not null default 60,
  prep_min      integer not null default 0,
  cleanup_min   integer not null default 0,
  is_active     boolean not null default true,
  display_order integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------- Barbiers ----------
create table barbers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text not null default '#b87333',
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- Clients ----------
create table clients (
  id         uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name  text,
  phone      text,
  email      text,
  notes      text,
  created_at timestamptz not null default now()
);

-- ---------- Rendez-vous ----------
create table appointments (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references clients(id) on delete set null,
  service_id uuid not null references services(id) on delete restrict,
  barber_id  uuid not null references barbers(id) on delete restrict,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  status     appointment_status not null default 'pending',
  source     appointment_source not null default 'internal',
  notes      text,
  created_at timestamptz not null default now()
);
create index appointments_barber_start_idx on appointments (barber_id, starts_at);
create index appointments_start_idx on appointments (starts_at);

-- ---------- Heures d'ouverture (globales au salon) ----------
-- weekday : 0 = lundi ... 6 = dimanche
create table business_hours (
  id         uuid primary key default gen_random_uuid(),
  weekday    smallint not null unique check (weekday between 0 and 6),
  open_time  time,
  close_time time,
  is_closed  boolean not null default false
);

-- ---------- Congés / fermetures ponctuelles ----------
create table closures (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  reason     text,
  barber_id  uuid references barbers(id) on delete cascade  -- null = tout le salon
);

-- ---------- Paramètres globaux (clé/valeur) ----------
create table settings (
  key   text primary key,
  value text
);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table services       enable row level security;
alter table barbers        enable row level security;
alter table clients        enable row level security;
alter table appointments   enable row level security;
alter table business_hours enable row level security;
alter table closures       enable row level security;
alter table settings       enable row level security;

-- Lecture publique (nécessaire à la landing + calcul des disponibilités) :
-- services actifs, barbiers actifs, heures d'ouverture, congés.
create policy "public read active services"
  on services for select to anon using (is_active = true);

create policy "public read active barbers"
  on barbers for select to anon using (is_active = true);

create policy "public read business hours"
  on business_hours for select to anon using (true);

create policy "public read closures"
  on closures for select to anon using (true);

-- Accès complet pour les utilisateurs authentifiés (console /admin).
create policy "authenticated full services"     on services       for all to authenticated using (true) with check (true);
create policy "authenticated full barbers"       on barbers        for all to authenticated using (true) with check (true);
create policy "authenticated full clients"       on clients        for all to authenticated using (true) with check (true);
create policy "authenticated full appointments"  on appointments   for all to authenticated using (true) with check (true);
create policy "authenticated full business_hours" on business_hours for all to authenticated using (true) with check (true);
create policy "authenticated full closures"      on closures       for all to authenticated using (true) with check (true);
create policy "authenticated full settings"      on settings       for all to authenticated using (true) with check (true);

-- Note : la création de rendez-vous depuis la landing (rôle anon) se fera via une
-- Edge Function / RPC SECURITY DEFINER validée côté serveur (Phase 5). Aucune écriture
-- directe anon sur `appointments` ou `clients` n'est ouverte ici.

-- =====================================================================
-- Données initiales (seed)
-- =====================================================================

-- Barbier par défaut
insert into barbers (name, color) values ('Admin', '#b87333');

-- Heures d'ouverture (issues de la landing actuelle)
insert into business_hours (weekday, open_time, close_time, is_closed) values
  (0, null,    null,    true),   -- Lundi : fermé
  (1, '10:00', '17:00', false),  -- Mardi
  (2, '10:00', '17:00', false),  -- Mercredi
  (3, '10:00', '20:00', false),  -- Jeudi
  (4, '10:00', '20:00', false),  -- Vendredi
  (5, '09:00', '16:00', false),  -- Samedi
  (6, null,    null,    true);   -- Dimanche : fermé

-- Services (durée 60 min pour tous au lancement)
insert into services (category, name, description, price_cents, duration_min, display_order) values
  ('Adultes',     'Coupe classique',    'La coupe homme intemporelle, machine et ciseaux.', 3000, 60, 1),
  ('Adultes',     'Coupe stylée',       'Dégradés nets, contours au rasoir, finitions sur mesure.', 3500, 60, 2),
  ('Enfants',     'Coupe classique',    'Coupe classique pour enfant.', 2000, 60, 3),
  ('Enfants',     'Coupe stylée',       'Coupe stylée pour enfant.', 2500, 60, 4),
  ('65 ans et +', 'Coupe',              'Tarif privilège pour nos habitués.', 2500, 60, 5),
  ('Barbe',       'Taille au clipper',  'Mise en forme au clipper.', 1000, 60, 6),
  ('Barbe',       'Taille à la lame',   'Mise en forme à la lame, serviette chaude.', 1500, 60, 7),
  ('Combo',       'Cheveux + Barbe',    'L''expérience complète du gentleman.', 4000, 60, 8),
  ('Rasage',      'Rasage à la lame',   'Rasage traditionnel au coupe-chou, serviette chaude et baume.', 1500, 60, 9);

-- Paramètres par défaut
insert into settings (key, value) values
  ('online_booking_mode', 'request'),  -- 'request' (demande à confirmer) | 'auto'
  ('notify_email_enabled', 'false'),
  ('notify_sms_enabled',  'false');
