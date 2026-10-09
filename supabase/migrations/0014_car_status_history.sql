-- 0014 — Historial de estatus y precio de los autos.
--
-- Igual que con los leads (0011): `cars.status` y `cars.price` se
-- sobrescribían y no quedaba rastro. Con el historial se mide cuántos días
-- tarda un auto en venderse, cuánto duran los apartados y cuántos se caen, y
-- si bajar el precio movió la venta.
--
-- Un renglón por cada cambio de estatus, de precio o de ambos. Si solo cambió
-- el precio, from_status = to_status.
--
-- Lo escribe un trigger y es de solo agregar, con las mismas reglas que
-- lead_status_history: sin políticas de escritura, sin `force row level
-- security` para que el trigger (dueño de la tabla) pueda insertar.
--
-- Idempotente.

create table if not exists car_status_history (
  id           uuid primary key default gen_random_uuid(),
  car_id       uuid not null references cars (id) on delete cascade,
  dealer_id    uuid not null references dealers (id) on delete cascade, -- denormalizado para RLS
  from_status  text,          -- null = el auto se acaba de crear (o línea base, ver abajo)
  to_status    text not null,
  from_price   numeric(12,2),
  to_price     numeric(12,2) not null,
  changed_by   uuid references auth.users (id) on delete set null, -- null = sistema
  changed_at   timestamptz not null default now()
);
create index if not exists car_status_history_car_idx    on car_status_history (car_id, changed_at);
create index if not exists car_status_history_dealer_idx on car_status_history (dealer_id, changed_at);

alter table car_status_history enable row level security;

drop policy if exists car_status_history_owner_read on car_status_history;
create policy car_status_history_owner_read on car_status_history
  for select using (dealer_id = auth_dealer_id());

create or replace function log_car_status ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into car_status_history (car_id, dealer_id, from_status, to_status, from_price, to_price, changed_by)
    values (new.id, new.dealer_id, null, new.status::text, null, new.price, auth.uid());
  elsif new.status is distinct from old.status or new.price is distinct from old.price then
    insert into car_status_history (car_id, dealer_id, from_status, to_status, from_price, to_price, changed_by)
    values (new.id, new.dealer_id, old.status::text, new.status::text, old.price, new.price, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists cars_status_history on cars;
create trigger cars_status_history
  after insert or update of status, price on cars
  for each row execute function log_car_status();

-- Línea base para los autos que ya existían: su estatus y precio de HOY, con la
-- fecha de esta migración. No se usa created_at porque no se sabe con qué
-- estatus nació cada uno (antes de la 0007 nacían disponibles; después, en
-- borrador), y un auto vendido aparecería creado ya vendido.
--
-- Al medir tiempos, estos renglones no son "creación": son from_status null con
-- changed_at = fecha de la migración. Los autos que se den de alta después sí
-- tienen su creación real. Solo a autos sin historial, para no duplicar.
insert into car_status_history (car_id, dealer_id, from_status, to_status, from_price, to_price)
select c.id, c.dealer_id, null, c.status::text, null, c.price
from cars c
where not exists (select 1 from car_status_history h where h.car_id = c.id);

-- Verificación: autos por estatus en el historial.
select to_status as estatus, count(*) as renglones
from car_status_history
group by to_status
order by to_status;
