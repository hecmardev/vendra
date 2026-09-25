-- 0008 — La RLS deja de decidir QUÉ SE MUESTRA y pasa a decidir QUÉ NUNCA SALE.
--
-- Antes, la política pública repetía la misma regla que el query de
-- services/cars.ts: ambos listaban los estatus visibles. Dos copias de la misma
-- decisión, y cada vez que el dealer cambiara de opinión sobre mostrar sus
-- apartados o sus vendidos había que tocar el código Y escribir una migración.
-- Dos cosas que hay que acordarse de mantener sincronizadas terminan
-- desincronizándose.
--
-- El reparto correcto es por naturaleza del problema, no por capas:
--
--   SEGURIDAD (aquí)  -> qué no puede salir NUNCA, ni por la app ni por alguien
--                        con la anon key, que es pública y va en el navegador de
--                        cada visitante. Eso es `borrador`: un auto a medio
--                        capturar, con precio provisional y fotos incompletas.
--
--   PRESENTACIÓN      -> qué se muestra hoy. Vive en PUBLIC_STATUSES
--   (services/cars.ts)   (services/cars.ts) y es una decisión de producto que va
--                        a cambiar. A partir de aquí, cambiarla es una línea de
--                        código y ninguna migración.
--
-- El query lleva SIEMPRE su propio filtro de estatus, así que el storefront se
-- ve igual para todos: el dealer, fuera de su panel, ve su sitio como lo ve un
-- visitante. Esa garantía la da el código, no esta política.
--
-- COSTO ACEPTADO: con esta política, alguien que tome la anon key y consulte la
-- base directo puede leer apartados y vendidos de cualquier dealer aunque el
-- sitio no los muestre. Se juzgó menor: son datos reales de autos reales. Los
-- borradores siguen protegidos, que es lo que sí importaba.
--
-- Idempotente.

alter policy cars_public_read on cars
  using (status <> 'borrador' and is_active);

-- Las fotos van en la misma condición. Si aquí quedara más cerrado que en
-- `cars`, un auto visible saldría sin imágenes.
alter policy car_images_public_read on car_images
  using (
    is_active and exists (
      select 1 from cars c
      where c.id = car_images.car_id
        and c.status <> 'borrador'
        and c.is_active
    )
  );

-- Verificación: cómo quedaron las dos políticas públicas.
select polname as politica, pg_get_expr(polqual, polrelid) as condicion
from pg_policy
where polname in ('cars_public_read', 'car_images_public_read')
order by polname;
