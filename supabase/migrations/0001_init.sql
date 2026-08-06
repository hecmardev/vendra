-- =============================================================================
-- Vendra — esquema inicial multi-tenant + RLS
-- Aislamiento por dealer_id. RLS estricto en panel/leads; catálogo público
-- se aísla por filtro de query (SELECT de disponibles con anon key).
-- =============================================================================

create extension if not exists "pgcrypto";

-- --- Tipos -------------------------------------------------------------------
do $$ begin
  create type car_status as enum ('disponible', 'vendido', 'apartado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type dealer_role as enum ('owner', 'staff');
exception when duplicate_object then null; end $$;

-- --- Tablas ------------------------------------------------------------------
create table if not exists dealers (
  id                  uuid primary key default gen_random_uuid(),
  domain              text unique not null,
  name                text not null,
  whatsapp_number     text,
  meta_pixel_id       text,
  ga4_measurement_id  text,
  branding            jsonb not null default '{}'::jsonb,
  content             jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

-- Liga el usuario de Supabase Auth con su dealer. Fuente de verdad para RLS.
create table if not exists profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  dealer_id   uuid not null references dealers (id) on delete cascade,
  role        dealer_role not null default 'owner',
  created_at  timestamptz not null default now()
);
create index if not exists profiles_dealer_id_idx on profiles (dealer_id);

create table if not exists cars (
  id            uuid primary key default gen_random_uuid(),
  dealer_id     uuid not null references dealers (id) on delete cascade,
  slug          text not null,
  brand         text not null,
  model         text not null,
  year          int not null,
  price         numeric(12,2) not null,
  mileage       int,
  transmission  text,
  fuel          text,
  color         text,
  body_type     text,
  location      text,
  status        car_status not null default 'disponible',
  description   text,
  created_at    timestamptz not null default now(),
  unique (dealer_id, slug)
);
create index if not exists cars_dealer_id_idx on cars (dealer_id);
create index if not exists cars_dealer_status_idx on cars (dealer_id, status);

create table if not exists car_images (
  id            uuid primary key default gen_random_uuid(),
  car_id        uuid not null references cars (id) on delete cascade,
  dealer_id     uuid not null references dealers (id) on delete cascade, -- denormalizado para RLS de storage
  storage_path  text not null,
  position      int not null default 0
);
create index if not exists car_images_car_id_idx on car_images (car_id);

create table if not exists leads (
  id          uuid primary key default gen_random_uuid(),
  dealer_id   uuid not null references dealers (id) on delete cascade,
  car_id      uuid references cars (id) on delete set null,
  name        text not null,
  phone       text not null,
  email       text,
  message     text,
  source      text not null default 'web_form',
  status      text not null default 'nuevo',
  created_at  timestamptz not null default now()
);
create index if not exists leads_dealer_id_idx on leads (dealer_id);

create table if not exists dealer_features (
  dealer_id   uuid not null references dealers (id) on delete cascade,
  key         text not null,
  enabled     boolean not null default false,
  primary key (dealer_id, key)
);

-- --- Helper: dealer_id del usuario autenticado -------------------------------
create or replace function auth_dealer_id ()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select dealer_id from profiles where user_id = auth.uid()
$$;

-- --- RLS ---------------------------------------------------------------------
alter table dealers          enable row level security;
alter table profiles         enable row level security;
alter table cars             enable row level security;
alter table car_images       enable row level security;
alter table leads            enable row level security;
alter table dealer_features  enable row level security;

alter table dealers          force row level security;
alter table profiles         force row level security;
alter table cars             force row level security;
alter table car_images       force row level security;
alter table leads            force row level security;
alter table dealer_features  force row level security;

-- dealers: lectura PÚBLICA (el storefront necesita branding/contenido/whatsapp,
-- que ya son datos públicos en la página). Escritura solo del dealer dueño.
create policy dealers_public_read on dealers
  for select using (true);
create policy dealers_owner_write on dealers
  for update using (id = auth_dealer_id()) with check (id = auth_dealer_id());

-- profiles: cada quien ve su propio profile.
create policy profiles_self on profiles
  for select using (user_id = auth.uid());

-- cars: lectura PÚBLICA solo de disponibles (anon). Escritura solo del dealer dueño.
create policy cars_public_read on cars
  for select using (status = 'disponible');
create policy cars_owner_write on cars
  for all using (dealer_id = auth_dealer_id()) with check (dealer_id = auth_dealer_id());

-- car_images: lectura pública de imágenes de autos disponibles; escritura del dueño.
create policy car_images_public_read on car_images
  for select using (
    exists (select 1 from cars c where c.id = car_images.car_id and c.status = 'disponible')
  );
create policy car_images_owner_write on car_images
  for all using (dealer_id = auth_dealer_id()) with check (dealer_id = auth_dealer_id());

-- leads: SIN lectura pública. Insert vía service-role/API server-side. El dealer
-- solo lee/gestiona los suyos.
create policy leads_owner_read on leads
  for select using (dealer_id = auth_dealer_id());
create policy leads_owner_update on leads
  for update using (dealer_id = auth_dealer_id()) with check (dealer_id = auth_dealer_id());

-- dealer_features: el dealer lee sus flags.
create policy dealer_features_owner_read on dealer_features
  for select using (dealer_id = auth_dealer_id());
