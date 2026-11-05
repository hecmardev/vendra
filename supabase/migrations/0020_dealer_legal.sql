-- 0020 — Datos legales del dealer, para generar su aviso de privacidad.
--
-- Salen publicados en su sitio (/aviso-de-privacidad). El dealer puede ser una
-- persona física sin empresa, así que legal_name es su razón social o su nombre
-- completo. Los captura Vendra en el alta y el dealer los corrige en sus Ajustes.
--
--   dealers.legal_name     -> razón social o nombre completo del responsable.
--   dealers.legal_address  -> domicilio para el aviso.
--   dealers.privacy_email  -> correo para solicitudes de privacidad.
--   dealers.privacy_phone  -> teléfono para esas solicitudes. Si está vacío, se usa
--                             el del negocio (content.business.phone).
--
-- Son columnas y no parte de `content` para poder validarlas y consultar qué
-- dealers están incompletos. Sin estos datos el sitio no publica el aviso ni carga
-- el Pixel (lib/dealerLegal.ts).
--
-- Idempotente.

alter table dealers
  add column if not exists legal_name    text,
  add column if not exists legal_address text,
  add column if not exists privacy_email text,
  add column if not exists privacy_phone text;

alter table dealers drop constraint if exists dealers_privacy_email_valid;
alter table dealers add constraint dealers_privacy_email_valid
  check (privacy_email is null or privacy_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$');
