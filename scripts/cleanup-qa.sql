-- ============================================================================
-- LIMPIEZA DURA de la base de QA — Vendra
--
--  ⚠  BORRA TODOS LOS DATOS DE NEGOCIO Y TODOS LOS USUARIOS. Irreversible.
--  ⚠  Correr SOLO en el proyecto de QA. NUNCA en producción.
--  ⚠  Hacer backup antes: dashboard -> Download backups.
--
-- Después de correrlo, resembrar con:
--   node --env-file=.env scripts/create-admin.mjs --email … --password …
--   pnpm dealer:create -- --name "AutosDemo" --domain demo.test.vendra.com.mx …
--
-- Ver docs/entornos-qa-prod.md, Fase 1.
-- ============================================================================

-- Antes -----------------------------------------------------------------------
select 'ANTES' as momento, 'dealers' as tabla, count(*) from dealers
union all select 'ANTES', 'profiles',        count(*) from profiles
union all select 'ANTES', 'cars',            count(*) from cars
union all select 'ANTES', 'car_images',      count(*) from car_images
union all select 'ANTES', 'leads',           count(*) from leads
union all select 'ANTES', 'dealer_features', count(*) from dealer_features
union all select 'ANTES', 'auth.users',      count(*) from auth.users;

-- Borrado ---------------------------------------------------------------------
-- Hijos primero: no dependemos de si las FK conservan ON DELETE CASCADE
-- (la migración 0003 reescribió constraints y no conviene asumirlo).
begin;

delete from car_images;
delete from cars;
delete from leads;
delete from dealer_features;
delete from profiles;
delete from dealers;

-- Los usuarios de Auth se van al final: profiles los referencia.
-- El admin se vuelve a crear con create-admin.mjs (es idempotente).
delete from auth.users;

commit;

-- Después ---------------------------------------------------------------------
select 'DESPUES' as momento, 'dealers' as tabla, count(*) from dealers
union all select 'DESPUES', 'profiles',        count(*) from profiles
union all select 'DESPUES', 'cars',            count(*) from cars
union all select 'DESPUES', 'car_images',      count(*) from car_images
union all select 'DESPUES', 'leads',           count(*) from leads
union all select 'DESPUES', 'dealer_features', count(*) from dealer_features
union all select 'DESPUES', 'auth.users',      count(*) from auth.users;

-- Todo debe quedar en 0. El bucket car-photos se vacía aparte, desde Storage.
