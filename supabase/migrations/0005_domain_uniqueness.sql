-- 0005 — El dominio se libera al eliminar, no al suspender.
--
-- La 0003 cambió el UNIQUE de `domain` por un índice parcial `where is_active`,
-- para que un dealer dado de baja liberara su dominio. Efecto no buscado: al
-- suspender también se pone `is_active = false`, así que el dominio de un dealer
-- suspendido quedaba libre. Se le podía dar a otro dealer y entonces el primero
-- ya no podía reactivarse (el índice lo rechazaba).
--
-- Aquí la condición pasa a `record_status <> 'deleted'`: activos, suspendidos y
-- borradores conservan su dominio; solo la baja lógica lo libera.
--
-- Idempotente.

drop index if exists dealers_domain_active_uk;

create unique index if not exists dealers_domain_live_uk
  on dealers (domain) where record_status <> 'deleted';

-- Verificación: no debe haber dominios repetidos entre dealers no eliminados.
-- Si esto devuelve filas, hay que resolverlas a mano ANTES de crear el índice.
select domain, count(*) as repetidos
from dealers
where record_status <> 'deleted'
group by domain
having count(*) > 1;
