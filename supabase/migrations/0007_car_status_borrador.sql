-- 0007 — Estatus "borrador": registrar un auto sin publicarlo todavía.
--
-- Un lote captura la unidad, sube una foto, se distrae y sube otra al rato. Con
-- los estatus anteriores el auto estaba público desde el primer guardado, a
-- medio llenar. Con `borrador` no sale al sitio hasta que el dealer lo publique.
--
-- No hace falta tocar la RLS: la política pública de `cars` ya expone solo los
-- `disponible`, así que cualquier estatus nuevo queda oculto por construcción.
--
--   create policy cars_public_read on cars for select using (status = 'disponible');
--
-- Ojo: NO se usa `record_status = 'draft'` para esto. Ese campo es del borrado
-- lógico y está atado por CHECK a `is_active = (record_status = 'active')`, así
-- que un borrador por esa vía quedaría inactivo y desaparecería también del
-- panel del dealer, que es justo donde tiene que verse para terminarlo.
--
-- Idempotente.

alter type car_status add value if not exists 'borrador';

-- Un auto que se crea sin estatus explícito nace oculto, no publicado: el error
-- barato es que no se vea, no que se publique a medias.
alter table cars alter column status set default 'borrador';

-- Verificación: los valores que acepta el enum.
select enumlabel as estatus
from pg_enum
join pg_type on pg_type.oid = pg_enum.enumtypid
where pg_type.typname = 'car_status'
order by enumsortorder;
