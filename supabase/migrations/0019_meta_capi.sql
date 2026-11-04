-- 0019 — Conversions API: reportarle a Meta los leads, citas y ventas.
--
-- El Pixel (0018) solo ve lo que pasa en el navegador. Una cita o una venta
-- ocurren en el panel del dealer, y solo el servidor se las puede contar a Meta.
-- Con eso Meta deja de buscar gente que llena formularios y busca gente parecida
-- a la que compra.
--
-- === dealer_integrations ===
-- Secretos por dealer. El token de Conversions API NO va en `dealers`, que se
-- lee con la anon key. Tampoco va en claro aquí: se guarda en Supabase Vault
-- (cifrado) y la tabla solo tiene su id. Sin políticas de RLS: ni la anon key ni
-- la sesión del dealer pueden leerla. Solo el service role, desde el admin.
--
-- El conjunto de datos de Meta es dealers.meta_pixel_id: es el mismo id, no se
-- duplica. `meta_test_event_code` manda los eventos a "Probar eventos" del
-- Administrador de eventos, sin contarlos en campañas.
--
-- === meta_events ===
-- Cola y registro de lo que se le reporta a Meta. Un renglón por lead + evento:
-- el UNIQUE impide reportar dos veces la misma venta aunque el lead vaya y
-- regrese de `vendido`.
--
--   Lead       -> al crearse el lead. event_id = leads.meta_event_id, el mismo
--                 que mandó el Pixel: Meta lo cuenta una vez.
--   Contactado -> status contactado (evento personalizado).
--   Schedule   -> status cita.
--   Purchase   -> status vendido, con sale_amount en MXN.
--   perdido    -> nada: Meta solo aprende de lo que sí pasó.
--
-- Lo llena un TRIGGER, igual que lead_status_history: se encola venga de donde
-- venga el cambio. Solo si:
--   - el visitante aceptó las cookies (leads.tracking_consent = 'accepted'), que
--     es lo que promete el aviso de privacidad; y
--   - el dealer tiene Pixel y token. Sin eso no se encola nada: si no, al
--     configurarlo después quedaría una cola de eventos viejos que Meta rechaza.
--
-- status: pending -> sent | failed (se agotaron los intentos) | expired (más de
-- 7 días sin enviarse: Meta ya no acepta ese event_time).
--
-- === leads.client_ip / client_user_agent ===
-- Meta los usa para reconocer a la persona. Solo se guardan si aceptó cookies.
--
-- Idempotente.

create table if not exists dealer_integrations (
  dealer_id                  uuid primary key references dealers (id) on delete cascade,
  meta_capi_token_secret_id  uuid,  -- vault.secrets.id
  meta_test_event_code       text,
  updated_at                 timestamptz not null default now()
);

alter table dealer_integrations enable row level security;
revoke all on dealer_integrations from anon, authenticated;

create table if not exists meta_events (
  id          uuid primary key default gen_random_uuid(),
  dealer_id   uuid not null references dealers (id) on delete cascade,
  lead_id     uuid not null references leads (id) on delete cascade,
  event_name  text not null check (event_name in ('Lead', 'Contactado', 'Schedule', 'Purchase')),
  event_id    text not null,
  event_time  timestamptz not null default now(),  -- cuándo pasó, no cuándo se envió
  status      text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'expired')),
  attempts    int  not null default 0,
  last_error  text,
  sent_at     timestamptz,
  created_at  timestamptz not null default now(),
  unique (lead_id, event_name)
);
create index if not exists meta_events_pending_idx on meta_events (event_time) where status = 'pending';
create index if not exists meta_events_dealer_idx  on meta_events (dealer_id, event_time);

-- Sin `force`: el trigger (dueño de la tabla) tiene que poder escribir. Sin
-- políticas de escritura: desde la sesión del dealer es de solo lectura.
alter table meta_events enable row level security;

drop policy if exists meta_events_owner_read on meta_events;
create policy meta_events_owner_read on meta_events
  for select using (dealer_id = auth_dealer_id());

alter table leads
  add column if not exists client_ip          text,
  add column if not exists client_user_agent  text;

-- --- Encolar --------------------------------------------------------------
create or replace function enqueue_meta_event ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event text;
begin
  if new.tracking_consent is distinct from 'accepted' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    v_event := 'Lead';
  elsif new.status is distinct from old.status then
    v_event := case new.status
      when 'contactado' then 'Contactado'
      when 'cita'       then 'Schedule'
      when 'vendido'    then 'Purchase'
    end;
  end if;

  if v_event is null then
    return new;
  end if;

  if not exists (
    select 1
    from dealer_integrations i
    join dealers d on d.id = i.dealer_id
    where i.dealer_id = new.dealer_id
      and i.meta_capi_token_secret_id is not null
      and d.meta_pixel_id is not null
  ) then
    return new;
  end if;

  insert into meta_events (dealer_id, lead_id, event_name, event_id)
  values (
    new.dealer_id,
    new.id,
    v_event,
    case when v_event = 'Lead' then coalesce(new.meta_event_id, new.id::text) else new.id::text || ':' || v_event end
  )
  on conflict (lead_id, event_name) do nothing;

  return new;
end;
$$;

drop trigger if exists leads_enqueue_meta_event on leads;
create trigger leads_enqueue_meta_event
  after insert or update of status on leads
  for each row execute function enqueue_meta_event();

-- --- Token en Vault ---------------------------------------------------------
-- Solo el service role: estas funciones leen y escriben un secreto.

create or replace function set_meta_capi_token (p_dealer_id uuid, p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret uuid;
begin
  select meta_capi_token_secret_id into v_secret from dealer_integrations where dealer_id = p_dealer_id;

  if v_secret is null then
    v_secret := vault.create_secret(p_token, 'meta_capi_token_' || p_dealer_id::text, 'Token de Conversions API del dealer');
    insert into dealer_integrations (dealer_id, meta_capi_token_secret_id)
    values (p_dealer_id, v_secret)
    on conflict (dealer_id) do update
      set meta_capi_token_secret_id = excluded.meta_capi_token_secret_id, updated_at = now();
  else
    perform vault.update_secret(v_secret, p_token);
    update dealer_integrations set updated_at = now() where dealer_id = p_dealer_id;
  end if;

  -- Un token nuevo arregla lo que falló por el token viejo. Lo vencido no: Meta
  -- ya no lo aceptaría.
  update meta_events
  set status = 'pending', attempts = 0, last_error = null
  where dealer_id = p_dealer_id and status = 'failed' and event_time > now() - interval '7 days';
end;
$$;

create or replace function clear_meta_capi_token (p_dealer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret uuid;
begin
  select meta_capi_token_secret_id into v_secret from dealer_integrations where dealer_id = p_dealer_id;
  if v_secret is null then
    return;
  end if;
  update dealer_integrations set meta_capi_token_secret_id = null, updated_at = now() where dealer_id = p_dealer_id;
  delete from vault.secrets where id = v_secret;
end;
$$;

create or replace function get_meta_capi_config (p_dealer_id uuid)
returns table (pixel_id text, token text, test_event_code text)
language sql
stable
security definer
set search_path = public
as $$
  select d.meta_pixel_id, s.decrypted_secret, i.meta_test_event_code
  from dealer_integrations i
  join dealers d on d.id = i.dealer_id
  join vault.decrypted_secrets s on s.id = i.meta_capi_token_secret_id
  where i.dealer_id = p_dealer_id
$$;

-- En Supabase las funciones de `public` las puede ejecutar anon por default: con
-- la anon key (pública) cualquiera leería el token.
revoke all on function set_meta_capi_token (uuid, text)  from public, anon, authenticated;
revoke all on function clear_meta_capi_token (uuid)      from public, anon, authenticated;
revoke all on function get_meta_capi_config (uuid)       from public, anon, authenticated;
revoke all on function enqueue_meta_event ()             from public, anon, authenticated;
grant execute on function set_meta_capi_token (uuid, text) to service_role;
grant execute on function clear_meta_capi_token (uuid)     to service_role;
grant execute on function get_meta_capi_config (uuid)      to service_role;

-- Verificación: tablas y que anon no pueda leer el token.
select to_regclass('public.dealer_integrations') is not null as integraciones,
       to_regclass('public.meta_events') is not null as eventos,
       has_function_privilege('anon', 'get_meta_capi_config(uuid)', 'execute') as anon_lee_token,
       has_table_privilege('anon', 'dealer_integrations', 'select') as anon_lee_tabla;
