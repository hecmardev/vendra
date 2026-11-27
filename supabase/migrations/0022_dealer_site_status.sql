-- 0022 — Distinguir un dominio de un dealer suspendido de uno que no existe.
--
-- El middleware resuelve el dealer con la anon key, y la RLS le esconde a los
-- inactivos: un dealer suspendido y un dominio que no es de nadie se veían igual,
-- y los dos respondían 200 con "Sitio no disponible". Para un buscador eso es una
-- página válida: si un dealer indexado se suspendía (por ejemplo, por impago),
-- Google reemplazaba sus fichas y perdía su posicionamiento.
--
-- Con esta función el middleware responde:
--   dealer suspendido -> 503 + Retry-After: caído temporalmente, Google conserva
--                        lo indexado.
--   dominio sin dealer -> 404.
--
-- Solo dice si un dominio es de un dealer suspendido; no expone ningún otro dato.
-- Los dados de baja (deleted) cuentan como dominio libre: su dominio se puede
-- reusar (índice dealers_domain_live_uk de la 0005).
--
-- Idempotente.

create or replace function dealer_site_status (p_domain text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select 'suspended'
  from dealers
  where domain = lower(p_domain)
    and record_status = 'suspended'
  limit 1
$$;

revoke all on function dealer_site_status (text) from public;
grant execute on function dealer_site_status (text) to anon, authenticated, service_role;
