-- 0011 — Historial de estatus del lead.
--
-- Hasta aquí `leads.status` se sobrescribía: se sabía el estatus actual y
-- cuándo llegó el lead, pero no cuándo se contactó, cuánto tardó en llegar a
-- cita ni quién lo movió. Sin eso no hay métricas de seguimiento (tiempo de
-- respuesta, conversión por etapa) ni manera de reconstruir qué pasó.
--
-- Lo escribe un TRIGGER, no el código de la app. Así queda registrado todo
-- cambio venga de donde venga —el panel, el webhook de Meta, un script, un
-- update a mano en el SQL Editor— y nadie tiene que acordarse de llamar a un
-- "log" en cada ruta nueva.
--
-- Es de solo agregar: no hay políticas de INSERT, UPDATE ni DELETE, así que con
-- la anon key o la sesión del dealer no se puede escribir, corregir ni borrar
-- un renglón. Solo el trigger (security definer, dueño de la tabla) inserta.
-- Por eso esta tabla NO lleva `force row level security`: el dueño tiene que
-- poder escribir a través del trigger.
--
-- Idempotente.

create table if not exists lead_status_history (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references leads (id) on delete cascade,
  dealer_id    uuid not null references dealers (id) on delete cascade, -- denormalizado para RLS
  from_status  text,          -- null = el lead se acaba de crear
  to_status    text not null,
  changed_by   uuid references auth.users (id) on delete set null, -- null = sistema (API, webhook, script)
  changed_at   timestamptz not null default now()
);
create index if not exists lead_status_history_lead_idx   on lead_status_history (lead_id, changed_at);
create index if not exists lead_status_history_dealer_idx on lead_status_history (dealer_id, changed_at);

alter table lead_status_history enable row level security;

drop policy if exists lead_status_history_owner_read on lead_status_history;
create policy lead_status_history_owner_read on lead_status_history
  for select using (dealer_id = auth_dealer_id());

-- `auth.uid()` lee el JWT de la petición: es el vendedor cuando el cambio sale
-- del panel, y null cuando sale del service role (/api/leads, webhooks).
create or replace function log_lead_status ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into lead_status_history (lead_id, dealer_id, from_status, to_status, changed_by)
    values (new.id, new.dealer_id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into lead_status_history (lead_id, dealer_id, from_status, to_status, changed_by)
    values (new.id, new.dealer_id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists leads_status_history on leads;
create trigger leads_status_history
  after insert or update of status on leads
  for each row execute function log_lead_status();

-- Leads que ya existían: se les registra su llegada con la fecha real
-- (created_at). Si ya no están en `nuevo`, se agrega el paso a su estatus
-- actual con la fecha de ESTA migración: el momento real del cambio se perdió,
-- y una métrica de tiempos debe excluir esos renglones (changed_by null y
-- changed_at = fecha de la migración). Solo a los leads que no tienen historial,
-- para que correrla de nuevo no duplique.
insert into lead_status_history (lead_id, dealer_id, from_status, to_status, changed_at)
select l.id, l.dealer_id, null, 'nuevo', l.created_at
from leads l
where not exists (select 1 from lead_status_history h where h.lead_id = l.id);

insert into lead_status_history (lead_id, dealer_id, from_status, to_status)
select l.id, l.dealer_id, 'nuevo', l.status
from leads l
where l.status <> 'nuevo'
  and not exists (
    select 1 from lead_status_history h
    where h.lead_id = l.id and h.from_status is not null
  );

-- Verificación: renglones de historial por estatus de destino.
select to_status as estatus, count(*) as cambios
from lead_status_history
group by to_status
order by to_status;
