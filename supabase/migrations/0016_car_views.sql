-- 0016 — Vistas de las fichas de autos.
--
-- Un renglón por AUTO + VISITANTE + DÍA. Abrir la misma ficha varias veces en
-- un día suma `views` en el mismo renglón: cuenta como 1 visitante único y no
-- se pierde cuántas veces la abrió.
--
-- Por qué día calendario y no ventanas de 24 h desde la primera vista: es como
-- cuentan GA y Meta ("usuarios por día"), los reportes por día cuadran, y una
-- ventana móvil haría que cada visitante tenga su propio reloj (alguien que
-- entra a las 23:00 y a la 01:00 contaría distinto según cuándo empezó). El día
-- es el de México (America/Mexico_City), no UTC: si no, las vistas de la noche
-- caerían en el día siguiente.
--
--   touch_id -> la visita con origen vigente en la vista más reciente del día
--               (attribution_touches, 0015). Es lo que permite contar fichas
--               vistas por campaña aunque la persona nunca deje sus datos.
--
-- Escritura SOLO por la función record_car_view, con el service role, desde
-- /api/views. La función hace el upsert atómico (suma views sin carreras) y
-- valida que el auto sea del dealer. El dealer lee las suyas.
--
-- Idempotente.

create table if not exists car_views (
  id               uuid primary key default gen_random_uuid(),
  dealer_id        uuid not null references dealers (id) on delete cascade,
  car_id           uuid not null references cars (id) on delete cascade,
  visitor_id       uuid not null,
  viewed_on        date not null,  -- día en America/Mexico_City
  views            int  not null default 1 check (views > 0),
  first_viewed_at  timestamptz not null default now(),
  last_viewed_at   timestamptz not null default now(),
  touch_id         uuid references attribution_touches (id) on delete set null,
  unique (car_id, visitor_id, viewed_on)
);
create index if not exists car_views_dealer_day_idx on car_views (dealer_id, viewed_on);
create index if not exists car_views_car_day_idx    on car_views (car_id, viewed_on);
create index if not exists car_views_visitor_idx    on car_views (visitor_id, first_viewed_at);
create index if not exists car_views_touch_idx      on car_views (touch_id) where touch_id is not null;

alter table car_views enable row level security;
alter table car_views force row level security;

drop policy if exists car_views_owner_read on car_views;
create policy car_views_owner_read on car_views
  for select using (dealer_id = auth_dealer_id());

create or replace function record_car_view (
  p_dealer_id   uuid,
  p_car_id      uuid,
  p_visitor_id  uuid,
  p_touch_id    uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Un auto de otro dealer (o inexistente) no se registra: no truena, para que
  -- un carId inventado desde el navegador no genere errores en el log.
  if not exists (select 1 from cars where id = p_car_id and dealer_id = p_dealer_id) then
    return;
  end if;

  insert into car_views (dealer_id, car_id, visitor_id, viewed_on, touch_id)
  values (p_dealer_id, p_car_id, p_visitor_id, (now() at time zone 'America/Mexico_City')::date, p_touch_id)
  on conflict (car_id, visitor_id, viewed_on) do update
    set views          = car_views.views + 1,
        last_viewed_at = now(),
        touch_id       = coalesce(excluded.touch_id, car_views.touch_id);
end;
$$;

-- En Supabase las funciones de `public` las puede ejecutar anon por default:
-- con la anon key (pública) cualquiera inflaría las vistas. Solo el service role.
revoke all on function record_car_view (uuid, uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function record_car_view (uuid, uuid, uuid, uuid) to service_role;

-- Verificación: la tabla existe y anon no puede ejecutar la función.
select to_regclass('public.car_views') is not null as tabla,
       has_function_privilege('anon', 'record_car_view(uuid, uuid, uuid, uuid)', 'execute') as anon_puede_ejecutar;
