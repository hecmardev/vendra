-- 0017 — Clics de contacto sin datos (WhatsApp, teléfono, correo, mapa).
--
-- El botón de WhatsApp del pie y de Contacto, el teléfono, el correo y la
-- dirección abren el canal directo, sin pedir datos. Antes no dejaban rastro:
-- una campaña podía generar conversaciones por WhatsApp que el panel nunca veía.
-- No es un lead —no hay nombre ni teléfono—, pero sí cuenta cuántas veces cada
-- campaña hizo que alguien contactara al dealer.
--
-- Un renglón por clic. No se agrupa por día como car_views: cada clic es un
-- intento de contacto y vale por sí mismo. Para contar personas, `count(distinct
-- visitor_id)`.
--
--   channel    -> whatsapp, telefono, correo, mapa ("cómo llegar": de las
--                 señales de intención más fuertes).
--   placement  -> pie (pie de página, sale en todo el sitio) o pagina (cualquier
--                 otro lugar). Junto con `path` dice dónde estaba el botón.
--   car_id     -> el auto, si el clic fue en su ficha. Lo resuelve la función
--                 por el slug de `path`: el navegador no lo manda.
--   touch_id   -> la visita con origen vigente (attribution_touches, 0015).
--
-- Escritura SOLO por record_contact_click, con el service role, desde
-- /api/contact-clicks. Descarta el doble clic (mismo visitante, canal y página
-- en 10 s). El dealer lee los suyos.
--
-- Idempotente.

create table if not exists contact_clicks (
  id          uuid primary key default gen_random_uuid(),
  dealer_id   uuid not null references dealers (id) on delete cascade,
  visitor_id  uuid not null,
  channel     text not null check (channel in ('whatsapp', 'telefono', 'correo', 'mapa')),
  placement   text not null check (placement in ('pie', 'pagina')),
  path        text not null,
  car_id      uuid references cars (id) on delete set null,
  touch_id    uuid references attribution_touches (id) on delete set null,
  clicked_at  timestamptz not null default now()
);
create index if not exists contact_clicks_dealer_idx  on contact_clicks (dealer_id, clicked_at);
create index if not exists contact_clicks_visitor_idx on contact_clicks (visitor_id, clicked_at);
create index if not exists contact_clicks_car_idx     on contact_clicks (car_id) where car_id is not null;
create index if not exists contact_clicks_touch_idx   on contact_clicks (touch_id) where touch_id is not null;

alter table contact_clicks enable row level security;
alter table contact_clicks force row level security;

drop policy if exists contact_clicks_owner_read on contact_clicks;
create policy contact_clicks_owner_read on contact_clicks
  for select using (dealer_id = auth_dealer_id());

create or replace function record_contact_click (
  p_dealer_id   uuid,
  p_visitor_id  uuid,
  p_channel     text,
  p_placement   text,
  p_path        text,
  p_touch_id    uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_car_id uuid;
begin
  -- Doble clic o dedo nervioso: no es un segundo intento de contacto.
  if exists (
    select 1 from contact_clicks
    where visitor_id = p_visitor_id and channel = p_channel and path = p_path
      and dealer_id = p_dealer_id and clicked_at > now() - interval '10 seconds'
  ) then
    return;
  end if;

  -- /autos/<slug> -> el auto de esa ficha, solo si es de este dealer.
  if p_path ~ '^/autos/[^/]+$' then
    select id into v_car_id from cars
    where dealer_id = p_dealer_id and slug = substring(p_path from '^/autos/([^/]+)$') and is_active
    limit 1;
  end if;

  insert into contact_clicks (dealer_id, visitor_id, channel, placement, path, car_id, touch_id)
  values (p_dealer_id, p_visitor_id, p_channel, p_placement, left(p_path, 200), v_car_id, p_touch_id);
end;
$$;

-- Igual que record_car_view: con la anon key (pública) cualquiera inflaría los
-- clics. Solo el service role.
revoke all on function record_contact_click (uuid, uuid, text, text, text, uuid) from public, anon, authenticated;
grant execute on function record_contact_click (uuid, uuid, text, text, text, uuid) to service_role;

-- Verificación: la tabla existe y anon no puede ejecutar la función.
select to_regclass('public.contact_clicks') is not null as tabla,
       has_function_privilege('anon', 'record_contact_click(uuid, uuid, text, text, text, uuid)', 'execute') as anon_puede_ejecutar;
