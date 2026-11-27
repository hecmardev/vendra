-- 0021 — Indexación en Google por dealer.
--
-- Un dealer nuevo arranca con textos de ejemplo de la plantilla y se configura con
-- calma: no debe aparecer en Google hasta que Vendra lo decida. Esta columna es su
-- interruptor; el general sigue siendo la variable ALLOW_INDEXING (lib/seo.ts).
-- Un sitio de dealer solo se indexa con los dos encendidos.
--
--   dealers.allow_indexing -> false al crearse, incluidos los que ya existen.
--
-- Solo Vendra la cambia (desde el admin, con el service role). El candado va en la
-- base, igual que dealers_meta_guard (0018), porque la política dealers_owner_write
-- deja al dealer actualizar cualquier columna de su fila.
--
-- Idempotente.

alter table dealers
  add column if not exists allow_indexing boolean not null default false;

create or replace function dealers_indexing_guard ()
returns trigger
language plpgsql
as $$
begin
  if new.allow_indexing is distinct from old.allow_indexing
     and coalesce(auth.role(), 'service_role') <> 'service_role' then
    raise exception 'La indexación en Google la administra Vendra' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

drop trigger if exists dealers_indexing_guard on dealers;
create trigger dealers_indexing_guard
  before update on dealers
  for each row execute function dealers_indexing_guard();
