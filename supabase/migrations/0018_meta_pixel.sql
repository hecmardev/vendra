-- 0018 — Pixel de Meta por dealer: configuración que solo toca Vendra,
-- verificación del dominio y lo que el lead necesita para reportarse a Meta.
--
-- Vendra maneja las campañas de los dealers con acceso de socio en su Business
-- Manager. El Pixel y la verificación del dominio los captura Vendra en el
-- admin; el dealer los ve en sus Ajustes pero no los puede cambiar: si borrara
-- su Pixel a media campaña, Meta dejaría de recibir eventos sin que nadie se
-- entere. El candado va en la base (trigger), no solo en la pantalla, porque la
-- política dealers_owner_write deja al dealer actualizar cualquier columna de
-- su fila.
--
--   dealers.meta_pixel_id            -> ya existía (0001). Ahora con formato
--                                       validado: solo dígitos.
--   dealers.meta_domain_verification -> el código de la etiqueta
--                                       <meta name="facebook-domain-verification">
--                                       que Meta pide para verificar el dominio
--                                       del dealer. El sitio la publica sola.
--   leads.meta_event_id              -> id del evento Lead. El navegador lo
--                                       manda con el Pixel y el servidor con
--                                       Conversions API (Fase B): con el mismo id,
--                                       Meta cuenta el lead una sola vez.
--   leads.tracking_consent           -> lo que el visitante eligió en el aviso de
--                                       cookies al dejar sus datos: accepted,
--                                       rejected o null (no eligió). La Fase B
--                                       solo reporta a Meta los aceptados.
--
-- Al escribir esta migración ningún dealer tenía Pixel capturado, ni en QA ni
-- en producción (18/oct/2026): las validaciones no chocan con datos viejos.
--
-- Idempotente.

alter table dealers
  add column if not exists meta_domain_verification text;

alter table dealers drop constraint if exists dealers_meta_pixel_id_valid;
alter table dealers add constraint dealers_meta_pixel_id_valid
  check (meta_pixel_id is null or meta_pixel_id ~ '^[0-9]{6,20}$');

alter table dealers drop constraint if exists dealers_meta_domain_verification_valid;
alter table dealers add constraint dealers_meta_domain_verification_valid
  check (meta_domain_verification is null or meta_domain_verification ~ '^[A-Za-z0-9_-]{10,100}$');

-- Solo el service role (el admin de Vendra) cambia la configuración de Meta.
-- auth.role() es null cuando el cambio sale de una conexión directa (SQL
-- Editor, scripts con psql): esos también pasan.
create or replace function dealers_meta_guard ()
returns trigger
language plpgsql
as $$
begin
  if (new.meta_pixel_id is distinct from old.meta_pixel_id
      or new.meta_domain_verification is distinct from old.meta_domain_verification)
     and coalesce(auth.role(), 'service_role') <> 'service_role' then
    raise exception 'La configuración de Meta la administra Vendra' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

drop trigger if exists dealers_meta_guard on dealers;
create trigger dealers_meta_guard
  before update on dealers
  for each row execute function dealers_meta_guard();

alter table leads
  add column if not exists meta_event_id     text,
  add column if not exists tracking_consent  text;

alter table leads drop constraint if exists leads_tracking_consent_valid;
alter table leads add constraint leads_tracking_consent_valid
  check (tracking_consent is null or tracking_consent in ('accepted', 'rejected'));

-- Verificación: columnas nuevas.
select table_name as tabla, column_name as columna
from information_schema.columns
where table_schema = 'public'
  and ((table_name = 'dealers' and column_name = 'meta_domain_verification')
    or (table_name = 'leads' and column_name in ('meta_event_id', 'tracking_consent')))
order by 1, 2;
