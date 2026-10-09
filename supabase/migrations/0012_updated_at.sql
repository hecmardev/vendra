-- 0012 — `updated_at` en leads y cars.
--
-- Ninguna tabla sabía cuándo se modificó por última vez. El historial de la
-- 0011 cubre solo el estatus del lead; un cambio de notas, de teléfono o de
-- precio de un auto no dejaba rastro.
--
-- Sirve para ordenar por última actividad, detectar leads abandonados
-- ("contactado hace 10 días sin movimiento") y, en cars, para que el feed de
-- inventario de Meta pueda mandar solo lo que cambió.
--
-- Lo mantiene un trigger BEFORE UPDATE: ningún código tiene que acordarse de
-- escribirlo. La función es genérica para reusarla en otras tablas.
--
-- OJO en cars: cambiar solo las fotos toca `car_images`, no `cars`, así que no
-- mueve `cars.updated_at` por sí solo. Desde el panel no pasa, porque guardar
-- el auto siempre actualiza también su fila.
--
-- Idempotente.

create or replace function set_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Filas que ya existían: su última modificación conocida es la baja lógica si
-- la hubo, y si no, su creación. Ponerles now() diría que todo se tocó hoy.
-- Solo la vez que se crea la columna, para que correrla de nuevo no las pise.
do $$
declare t text;
begin
  foreach t in array array['leads', 'cars']
  loop
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'updated_at'
    ) then
      execute format('alter table %I add column updated_at timestamptz', t);
      execute format('update %I set updated_at = coalesce(deleted_at, created_at)', t);
      execute format('alter table %I alter column updated_at set not null', t);
    end if;
    execute format('alter table %I alter column updated_at set default now()', t);

    execute format('drop trigger if exists %I on %I', t || '_set_updated_at', t);
    execute format(
      'create trigger %I before update on %I for each row execute function set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end $$;

-- Verificación: rango de updated_at por tabla.
select 'leads' as tabla, count(*) as filas, min(updated_at) as desde, max(updated_at) as hasta from leads
union all
select 'cars', count(*), min(updated_at), max(updated_at) from cars;
