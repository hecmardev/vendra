-- 0009 — Condición del auto: nuevo, seminuevo o demo.
--
-- Hasta aquí todo el inventario se asumía seminuevo (el copy del sitio lo dice
-- así). Un lote que maneja ambos no podía separarlos ni en la ficha ni en los
-- filtros, y la estrategia de campañas necesita el dato en cada evento del
-- Pixel para armar conversiones y audiencias por condición.
--
--   nuevo      -> 0 km, de agencia. Es el default.
--   seminuevo  -> usado.
--   demo       -> unidad de prueba de manejo o exhibición: pocos km, precio con
--                 descuento. Se anuncia distinto que un seminuevo, por eso no
--                 se mete en él.
--
-- "Certificado" NO es una condición: es una marca que puede tener un
-- seminuevo. Si fuera un valor más de esta columna, el filtro de seminuevos
-- dejaría fuera a los certificados. Si llega, va en su propia columna.
--
-- Texto + CHECK y no enum (como `car_status`): agregar un valor a un enum no se
-- puede revertir, y cambiar este CHECK es una línea.
--
-- Idempotente.

-- Autos que ya existían: quedan como nuevos, salvo los que tienen más de
-- 1,000 km, que pasan a seminuevo. Un nuevo llega con algunos km de traslado y
-- pruebas, nunca con miles. Los demos no se pueden deducir: el dealer los marca
-- a mano.
--
-- La clasificación corre SOLO la vez que se crea la columna. Si esta migración
-- se volviera a correr, no debe pisar lo que el dealer ya corrigió (un demo con
-- 3,000 km volvería a seminuevo).
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cars' and column_name = 'condition'
  ) then
    alter table cars add column condition text not null default 'nuevo';
    update cars set condition = 'seminuevo' where coalesce(mileage, 0) > 1000;
  end if;
end $$;

alter table cars alter column condition set default 'nuevo';

alter table cars drop constraint if exists cars_condition_valid;
alter table cars add constraint cars_condition_valid
  check (condition in ('nuevo', 'seminuevo', 'demo'));

-- Verificación: cuántos autos quedaron en cada condición.
select condition as condicion, count(*) as autos
from cars
group by condition
order by condition;
