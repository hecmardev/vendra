-- =============================================================================
-- Vendra — Borrado lógico (soft delete)
--
-- Ningún registro se borra: "eliminar" pasa a ser un cambio de estado.
--   is_active      -> el interruptor; TODO query público filtra por esto
--   record_status  -> active | deleted | suspended | draft
--   deleted_at     -> cuándo se dio de baja
--
-- Invariante (enforzado con CHECK):  is_active = (record_status = 'active')
-- Así 'deleted', 'suspended' y 'draft' quedan fuera con un solo filtro.
--
-- Incluye la política de escritura de dealer_features (antes 0002), para
-- aplicar todo en una sola pasada. Es idempotente: se puede correr dos veces.
-- =============================================================================

-- --- 1. Columnas -------------------------------------------------------------

alter table dealers
  add column if not exists is_active     boolean not null default true,
  add column if not exists record_status text    not null default 'active',
  add column if not exists deleted_at    timestamptz;

alter table profiles
  add column if not exists is_active     boolean not null default true,
  add column if not exists record_status text    not null default 'active',
  add column if not exists deleted_at    timestamptz;

alter table cars
  add column if not exists is_active     boolean not null default true,
  add column if not exists record_status text    not null default 'active',
  add column if not exists deleted_at    timestamptz;

alter table car_images
  add column if not exists is_active     boolean not null default true,
  add column if not exists record_status text    not null default 'active',
  add column if not exists deleted_at    timestamptz;

alter table leads
  add column if not exists is_active     boolean not null default true,
  add column if not exists record_status text    not null default 'active',
  add column if not exists deleted_at    timestamptz;

-- --- 2. Invariante y valores válidos ----------------------------------------
-- Se dropean primero para que la migración sea re-ejecutable.

do $$
declare t text;
begin
  foreach t in array array['dealers', 'profiles', 'cars', 'car_images', 'leads']
  loop
    execute format('alter table %I drop constraint if exists %I', t, t || '_record_status_valid');
    execute format('alter table %I drop constraint if exists %I', t, t || '_active_consistent');

    execute format(
      'alter table %I add constraint %I check (record_status in (''active'',''deleted'',''suspended'',''draft''))',
      t, t || '_record_status_valid'
    );
    execute format(
      'alter table %I add constraint %I check (is_active = (record_status = ''active''))',
      t, t || '_active_consistent'
    );
  end loop;
end $$;

-- --- 3. Unique -> índices únicos parciales ------------------------------------
-- Sin esto, un dominio o un slug dados de baja quedan ocupados para siempre.
-- Se buscan los constraints por catálogo porque el nombre lo generó Postgres.

do $$
declare c record;
begin
  for c in
    select rel.relname as tbl, con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public'
      and rel.relname in ('dealers', 'cars')
      and con.contype = 'u'
  loop
    execute format('alter table %I drop constraint %I', c.tbl, c.conname);
  end loop;
end $$;

create unique index if not exists dealers_domain_active_uk
  on dealers (domain) where is_active;

create unique index if not exists cars_dealer_slug_active_uk
  on cars (dealer_id, slug) where is_active;

-- --- 4. Índices de filtrado --------------------------------------------------

create index if not exists cars_dealer_active_idx       on cars (dealer_id, is_active);
create index if not exists leads_dealer_active_idx      on leads (dealer_id, is_active);
create index if not exists car_images_car_active_idx    on car_images (car_id, is_active);
create index if not exists profiles_dealer_active_idx   on profiles (dealer_id, is_active);

-- --- 5. RLS ------------------------------------------------------------------
-- Red de seguridad: aunque un query del código olvide el filtro, la base no
-- expone lo dado de baja. Gracias al invariante basta con is_active.

-- Un dealer suspendido o dado de baja deja de ser legible: su storefront no
-- resuelve y getCurrentDealer() devuelve null, así que tampoco entra al panel.
alter policy dealers_public_read on dealers
  using (is_active);

alter policy cars_public_read on cars
  using (status = 'disponible' and is_active);

alter policy car_images_public_read on car_images
  using (
    is_active and exists (
      select 1 from cars c
      where c.id = car_images.car_id
        and c.status = 'disponible'
        and c.is_active
    )
  );

-- OJO: las políticas *_owner_write NO llevan is_active a propósito: el dealer
-- (y el admin) deben poder leer y actualizar sus registros dados de baja para
-- poder restaurarlos.

-- --- 6. dealer_features: escritura (antes 0003 -> era 0002) -------------------
-- 0001 solo dejaba lectura, así que los Módulos de Ajustes no se podían guardar.

drop policy if exists dealer_features_owner_write on dealer_features;
create policy dealer_features_owner_write on dealer_features
  for all using (dealer_id = auth_dealer_id()) with check (dealer_id = auth_dealer_id());
