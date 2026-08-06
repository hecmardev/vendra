-- =============================================================================
-- Vendra — Notas de seguimiento por lead
-- El panel de leads permite anotar acuerdos/seguimiento. Faltaba la columna.
-- =============================================================================

alter table leads add column if not exists notes text not null default '';
