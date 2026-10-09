-- 0013 — Qué auto se vendió y en cuánto.
--
-- `leads.car_id` dice por qué auto preguntó el cliente. No siempre es el que
-- compra: pregunta por un CX-5 y se lleva un Tucson. Con las dos referencias se
-- mide cuántos compran el auto por el que llegaron y cuántos terminan en otro.
--
--   sold_car_id  -> el auto que compró. Null con status 'vendido' = compró un
--                   auto que no está en el inventario (p. ej. un nuevo que la
--                   agencia vende por formulario de Meta sin tenerlo cargado).
--   sale_amount  -> lo que pagó. Es el valor que se reporta a Meta como compra
--                   y la base del costo por venta.
--
-- No hay `sold_at`: la fecha de la venta ya está en lead_status_history (0011).
-- Guardarla dos veces permite que no coincidan.
--
-- Si un lead SALE de 'vendido' (error de dedo, crédito rechazado), el trigger
-- borra sold_car_id y sale_amount: si se quedaran, el reporte contaría una
-- venta que no existió. El historial conserva que estuvo vendido. El auto en
-- inventario NO se regresa a disponible: eso lo decide el vendedor.
--
-- El mismo trigger valida que car_id y sold_car_id sean autos del dealer del
-- lead. Antes /api/leads guardaba el carId que mandara el navegador sin
-- revisarlo, y un lead podía quedar ligado al auto de otro dealer.
--
-- Idempotente.

alter table leads
  add column if not exists sold_car_id  uuid references cars (id) on delete set null,
  add column if not exists sale_amount  numeric(12,2);

alter table leads drop constraint if exists leads_sale_amount_valid;
alter table leads add constraint leads_sale_amount_valid
  check (sale_amount is null or sale_amount >= 0);

-- Datos de venta solo en leads vendidos. El trigger ya los limpia; esto es la
-- garantía por si alguien desactiva el trigger.
alter table leads drop constraint if exists leads_sale_only_when_sold;
alter table leads add constraint leads_sale_only_when_sold
  check (status = 'vendido' or (sold_car_id is null and sale_amount is null));

-- security definer: tiene que ver los autos aunque la RLS del que escribe se
-- los esconda (un borrador de su propio lote sí debe poder validarse).
create or replace function leads_sale_guard ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'vendido' then
    new.sold_car_id := null;
    new.sale_amount := null;
  end if;

  if new.car_id is not null
     and not exists (select 1 from cars where id = new.car_id and dealer_id = new.dealer_id) then
    raise exception 'El auto de interés no pertenece a este dealer' using errcode = 'check_violation';
  end if;

  if new.sold_car_id is not null
     and not exists (select 1 from cars where id = new.sold_car_id and dealer_id = new.dealer_id) then
    raise exception 'El auto vendido no pertenece a este dealer' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists leads_sale_guard on leads;
create trigger leads_sale_guard
  before insert or update on leads
  for each row execute function leads_sale_guard();

-- Verificación: leads ya ligados a un auto de otro dealer (debería ser 0). El
-- trigger solo revisa lo que se escriba de aquí en adelante.
select count(*) as leads_con_auto_de_otro_dealer
from leads l
join cars c on c.id = l.car_id
where c.dealer_id <> l.dealer_id;
