-- =============================================================================
-- NOTA: esta política ya viene incluida (de forma idempotente) en
-- 0003_soft_delete.sql. Si aplicas la 0003, NO hace falta correr esta.
-- Se conserva por historial.
-- =============================================================================
-- Vendra — política de escritura para dealer_features
-- 0001 solo dejaba LECTURA de flags al dealer. El panel de Ajustes necesita que
-- el dealer también pueda activar/desactivar sus módulos (insert/update).
-- =============================================================================

create policy dealer_features_owner_write on dealer_features
  for all using (dealer_id = auth_dealer_id()) with check (dealer_id = auth_dealer_id());
