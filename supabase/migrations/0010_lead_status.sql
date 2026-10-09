-- 0010 — Estatus del lead: nuevo, contactado, cita, vendido, perdido.
--
-- Antes eran `nuevo`, `contactado` y `cerrado`, y `cerrado` no distinguía si
-- el lead compró o se perdió. Para medir campañas por costo por venta y
-- reportarle a Meta lo que sí pasó, hace falta separarlos.
--
--   nuevo       -> llegó y nadie lo ha atendido. Lo pone /api/leads.
--   contactado  -> el vendedor ya habló con la persona.
--   cita        -> visita o prueba de manejo agendada. Es la señal con volumen
--                  suficiente para que Meta aprenda: un lote cierra pocas
--                  ventas por semana, pero tiene varias citas.
--   vendido     -> compró.
--   perdido     -> no compró. No se reporta a Meta.
--
-- `cerrado` pasa a `perdido`. Al escribir esta migración no había ningún lead
-- en `cerrado` ni en QA ni en producción (09/oct/2026); el update existe por si
-- el código anterior alcanzó a guardar uno entre la migración y el despliegue.
--
-- Texto + CHECK, igual que `cars.condition` (0009).
--
-- Idempotente.

update leads set status = 'perdido' where status = 'cerrado';

alter table leads drop constraint if exists leads_status_valid;
alter table leads add constraint leads_status_valid
  check (status in ('nuevo', 'contactado', 'cita', 'vendido', 'perdido'));

-- Verificación: cuántos leads hay en cada estatus.
select status as estatus, count(*) as leads
from leads
group by status
order by status;
