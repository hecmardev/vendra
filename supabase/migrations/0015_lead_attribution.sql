-- 0015 — De dónde llegó cada lead (atribución de campañas).
--
-- `attribution_touches` guarda las visitas CON ORIGEN de cada visitante: una
-- campaña, un anuncio, un buscador, otro sitio, y además su primera visita
-- aunque haya sido directa. No es solo UTM: una visita de Google orgánico o un
-- clic de Google Ads sin UTM también es un renglón.
--
-- El lead no copia esos datos: los referencia.
--
--   first_touch_id -> la visita que trajo a la persona la primera vez.
--   last_touch_id  -> la última visita con origen antes de escribir: la que la
--                     hizo volver. Es la que se usa para el reporte por campaña.
--
-- Así el mismo origen sirve para varios leads de la misma persona (preguntó
-- por dos autos) y, después, para las vistas de fichas (car_views).
--
-- Quién escribe: el middleware le pone id a cada visita y la guarda en la
-- cookie vd_attr, SIN tocar la base (no agrega latencia a cada entrada). El
-- servidor inserta la visita con ese id cuando el visitante hace algo —deja sus
-- datos, abre una ficha—; si ya existe, no la duplica. Las visitas de quien
-- entra y se va sin hacer nada no se guardan: no aportan a ninguna métrica.
--
-- Solo el service role escribe (sin políticas de INSERT/UPDATE/DELETE). El
-- dealer lee las suyas.
--
-- Columnas de la visita (ver lib/attribution.ts → Touch):
--   source / medium  -> el UTM si lo traía; si no, deducido del clic o del sitio
--                       que refirió (google/organic, google/cpc,
--                       facebook/social, direct/(none)…). Igual que GA.
--   campaign / content / term -> tal cual del UTM. Con la convención del plan,
--                       content = id del anuncio, term = id del conjunto.
--   gclid / fbc      -> ids de clic de Google y Meta, para reportarles la venta
--                       (Fase 2). fbc ya viene en el formato _fbc de Meta.
--   referrer         -> host externo que lo mandó.
--   landing_path     -> página donde aterrizó, sin query.
--   touched_at       -> cuándo llegó (lo marca el middleware, no el insert).
--
-- Idempotente.

create table if not exists attribution_touches (
  id            uuid primary key,   -- lo genera el middleware, no la base
  dealer_id     uuid not null references dealers (id) on delete cascade,
  visitor_id    uuid not null,
  source        text not null,
  medium        text not null,
  campaign      text,
  content       text,
  term          text,
  gclid         text,
  fbc           text,
  referrer      text,
  landing_path  text,
  touched_at    timestamptz not null,
  created_at    timestamptz not null default now()
);
create index if not exists attribution_touches_dealer_idx   on attribution_touches (dealer_id, touched_at);
create index if not exists attribution_touches_campaign_idx on attribution_touches (dealer_id, campaign);
create index if not exists attribution_touches_visitor_idx  on attribution_touches (visitor_id, touched_at);

alter table attribution_touches enable row level security;
alter table attribution_touches force row level security;

drop policy if exists attribution_touches_owner_read on attribution_touches;
create policy attribution_touches_owner_read on attribution_touches
  for select using (dealer_id = auth_dealer_id());

-- En leads, solo las referencias. `fbp` (cookie del Pixel) es del navegador, no
-- de una visita, por eso va en el lead.
alter table leads
  add column if not exists visitor_id      uuid,
  add column if not exists first_touch_id  uuid references attribution_touches (id) on delete set null,
  add column if not exists last_touch_id   uuid references attribution_touches (id) on delete set null,
  add column if not exists fbp             text;

create index if not exists leads_first_touch_idx on leads (first_touch_id) where first_touch_id is not null;
create index if not exists leads_last_touch_idx  on leads (last_touch_id)  where last_touch_id is not null;
create index if not exists leads_visitor_idx     on leads (visitor_id)     where visitor_id is not null;

-- Verificación: leads con y sin origen (los anteriores a esta migración quedan
-- sin origen: no hay forma de reconstruirlo).
select (last_touch_id is not null) as con_origen, count(*) as leads
from leads
group by 1
order by 1;
