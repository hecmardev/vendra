# Onboarding de vendedores (admin de la plataforma)

Cómo tú, como administrador de Vendra, das de alta a un vendedor (dealer) para que
tenga su propio dashboard, su dominio y publique sus autos — aislado del resto.

> **Requisito previo:** este flujo necesita **Supabase conectado** (tablas + RLS + Auth).
> Hoy el sitio está maquetado con datos mock; el alta real se activa al integrar Supabase.

---

## Qué implica dar de alta a un vendedor

Son 5 pasos; solo 1–2 los captura el admin, el resto los completa el propio vendedor:

1. **Crear el dealer** → fila en la tabla `dealers` (nombre, dominio, WhatsApp).
2. **Crear su usuario de acceso** → usuario en Supabase Auth + fila en `profiles`
   que lo vincula a su `dealer_id` (esta es la fuente de verdad para el aislamiento por RLS).
3. **Enviarle acceso** → invitación por correo (Supabase) para que fije su contraseña.
4. **Conectar su dominio** → CNAME en Vercel apuntando al proyecto (paso manual/externo).
   Ver la checklist [Conectar el dominio del dealer](#conectar-el-dominio-del-dealer):
   la redirección de `www` es **obligatoria**.
5. **El vendedor configura lo suyo** desde `su-dominio.com/dashboard`:
   - Branding (colores/tema) y contenido (textos/slogans).
   - Sus IDs de marketing (Meta Pixel, GA4, número de WhatsApp).
   - **Da de alta sus autos** (inventario).

**Aislamiento garantizado:** Row Level Security por `dealer_id` — un vendedor nunca
ve ni edita datos de otro, ni siquiera si conoce el ID.

---

## Conectar el dominio del dealer

Checklist para cada dealer con dominio propio. **Ningún paso es opcional.**

- [ ] **Elegir la versión canónica** del dominio: `sudominio.com` o
      `www.sudominio.com`. Recomendado sin `www`, igual que la plataforma. Si el
      DNS del dealer no permite un CNAME en la raíz (pasa con Neubox, ver
      `liberacion-prod.md` § Fase 3), la canónica es la de `www`.
- [ ] **`dealers.domain` = exactamente la versión canónica.** El middleware busca
      el host exacto: la otra versión sirve `/not-available` si no redirige.
- [ ] **Agregar las DOS versiones en Vercel** (proyecto de producción, Settings →
      Domains), copiando el Target que muestre su propia pantalla.
- [ ] **La versión no canónica redirige a la canónica con `308` permanente.**
      Vercel hace por default lo contrario (manda la raíz al `www`): revisarlo a
      mano. `307` no sirve: reparte el posicionamiento entre las dos.
- [ ] **Verificar que la redirección conserve la URL completa**, ruta y
      parámetros:
      ```bash
      curl -sI "https://www.sudominio.com/autos?utm_source=prueba" | grep -i -E '^(HTTP|location)'
      ```
      Debe responder `308` con `location: https://sudominio.com/autos?utm_source=prueba`.

**Por qué es obligatorio:** el navegador trata `www.sudominio.com` y
`sudominio.com` como sitios distintos y no comparte cookies entre ellos. Si las
dos versiones sirven el sitio, alguien que llega por un anuncio a una y vuelve
después a la otra empieza con cookies nuevas, y **el lead pierde la campaña que
lo trajo** (ver `lib/attribution.ts`). Con la redirección, todo el tráfico
termina en un solo dominio y la atribución se conserva. Si la redirección
perdiera los parámetros, se perderían los UTM del anuncio en el primer clic.

---

## Fase 1 — MVP: alta por script (sin panel `/admin`)

Para los primeros vendedores no se construye UI de admin: el alta se hace por comando.
Ya existe el andamiaje en [`scripts/create-dealer.ts`](../scripts/create-dealer.ts).

**Flujo:**

```bash
# 1) Tú corres el script (crea dealer + usuario Auth + profile)
pnpm dealer:create -- --name "AutosMX" --domain autosmx.com --email dueno@autosmx.com

# 2) El vendedor recibe correo de Supabase → fija su contraseña
# 3) Tú conectas su dominio en Vercel (DNS/CNAME)
# 4) El vendedor entra a  autosmx.com/dashboard  y publica sus autos
```

- **Ajustes puntuales:** desde el panel de **Supabase Studio** (editar una fila, reenviar invitación).
- **Ventaja:** rápido, sin construir nada extra. Ideal mientras son pocos vendedores.
- **Pendiente en el script:** usar `auth.admin.inviteUserByEmail` para el correo de invitación
  y validar duplicados (dominio/email) con mensajes claros.

---

## Fase 2 — Panel `/admin` (superadmin) — cuando el volumen lo justifique

Una interfaz propia para ti, para no depender de la terminal. Reservamos la ruta `/admin`
desde ahora (el `/dashboard` es del vendedor; `/admin` es tuyo).

**Qué tendría:**

- **Lista de vendedores**: dominio, estado, nº de autos, nº de leads, plan.
- **"Nuevo vendedor"**: formulario (nombre, dominio, correo, WhatsApp) que hace los pasos 1–3
  en una sola acción (misma lógica del script, pero con UI).
- **Invitar / reenviar acceso** a un vendedor.
- **Activar módulos** (feature flags) y **plan** por vendedor (base / superior).
- **(Opcional)** conectar dominio automáticamente vía **Vercel API**.

**Seguridad:** protegido por un rol superadmin (`profiles.role = 'superadmin'` o una tabla
`admins` aparte). El middleware añade un scope `/admin` que solo deja pasar a ese rol.

---

## Modelo de datos involucrado (ya definido en la migración)

- `dealers` — el vendedor (dominio, nombre, whatsapp, branding, content…).
- `profiles` — vincula `auth.users` ↔ `dealer_id` (+ `role`).
- `cars`, `leads`, `dealer_features` — todo con `dealer_id` + RLS.

(Para el superadmin se añadiría el rol/tabla de admins y políticas RLS que le den acceso global.)

---

## Roadmap sugerido

1. **Conectar Supabase** (crear proyecto, aplicar `supabase/migrations/0001_init.sql`, generar tipos).
2. **Completar `create-dealer.ts`** (invitación por correo + validaciones) y **dar de alta 1 vendedor real**.
3. El vendedor usa su **dashboard** (ya maquetado) con **datos reales** (branding, contenido, autos, leads).
4. Cuando haya varios vendedores → **construir el panel `/admin`** (Fase 2).

> En resumen: el alta de vendedores **no necesita más maquetación** — necesita Supabase.
> Con eso, el script te deja onboardear ya, y el panel `/admin` se hace después para escalar.
