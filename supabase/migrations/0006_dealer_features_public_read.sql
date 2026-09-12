-- 0006 — El storefront puede leer los feature flags de su dealer.
--
-- `dealer_features` solo tenía política de lectura para el dueño
-- (`dealer_features_owner_read`, de la 0001), así que un visitante anónimo no
-- podía consultarlos. Efecto: los módulos de Ajustes se guardaban pero el sitio
-- público no tenía forma de saber si estaban prendidos, y por eso no gateaban
-- nada.
--
-- Los flags no son información sensible: dicen qué módulos tiene contratado un
-- dealer, lo mismo que se ve al entrar a su sitio. Se abre solo la LECTURA; la
-- escritura sigue restringida al dueño por `dealer_features_owner_write` (0002).
--
-- Idempotente.

drop policy if exists dealer_features_public_read on dealer_features;

create policy dealer_features_public_read on dealer_features
  for select using (true);

-- La política del dueño queda redundante para SELECT, pero se conserva: si
-- mañana se quisiera cerrar la lectura pública, basta con borrar esta de arriba.
