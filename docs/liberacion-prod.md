# Liberación a producción — bitácora

Pasos reales para montar el ambiente de producción y dar de alta al primer
dealer. Se va llenando conforme se ejecuta: lo que se planeó, lo que salió y lo
que hubo que corregir.

Iniciada el 22 de septiembre de 2026.

**Regla que no se rompe:** primero la migración, después el despliegue. Nada en
Vercel corre migraciones; las aplica una persona desde su máquina.

---

## Fase 1 — Supabase de producción ✅

Completada el 22/sep/2026.

- Proyecto `vendra-prod`, región `ca-central-1` (la misma que QA).
- Ref del proyecto: `tiyjweagulozyovbfouu`.
- En la pantalla de creación, la sección **Security** se deja tal cual viene:
  `Enable Data API` y `Automatically expose new tables` **marcadas**, y
  `Enable automatic RLS` sin marcar.

  Apagar la segunda rompería las migraciones: ninguna de las siete incluye un
  `GRANT`, así que dan por hecho los permisos por defecto de `anon`. Sin ellos
  el storefront responde "permiso denegado" aunque las políticas estén bien.
  La seguridad la da la RLS, que sí está en las seis tablas.

- Credenciales en `.env.prod.local` (fuera de git). La cadena de Postgres sale
  de Connect → Direct connection string → **Session pooler**, puerto **5432**.
  El 6543 es el pooler de transacciones y no sirve para migraciones ni pg_dump.

### Orden que se siguió

1. Merge de `test` a `main` **primero**. `main` se había quedado en la `0004`;
   correr las migraciones desde ahí habría aplicado una base incompleta.
2. Las siete migraciones, desde `main`, contra producción:
   `node --env-file=.env.prod.local scripts/migrate.mjs`
3. Bucket: `node --env-file=.env.prod.local scripts/setup-storage.mjs`
4. Admin: `node --env-file=.env.prod.local scripts/create-admin.mjs --email … --password …`

> La regla que no se puede invertir no es "merge antes que migración", sino que
> **las siete migraciones estén aplicadas antes de que exista el proyecto de
> Vercel de producción**: en cuanto se crea, despliega `main` de inmediato.

### Verificación (no basta con que "corra sin errores")

Se comparó la estructura de producción contra QA: 6 tablas, 12 políticas, el
enum `car_status` con sus cuatro valores, `status` con default `borrador`, los
índices únicos parciales, y el bucket público de 5 MB con 4 tipos permitidos.
Todo idéntico. Base limpia: un admin, cero dealers, cero autos, cero leads.

## Fase 2 — Vercel de producción ✅

Completada el 22/sep/2026. URL provisional: `vendra-prod.vercel.app`.


Proyecto `vendra-prod`, mismo repo, rama `main` (que ya es la de producción por
defecto, así que no hay que cambiarla como en QA).

Variables que se cargaron:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | el proyecto de producción |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable de producción |
| `SUPABASE_SERVICE_ROLE_KEY` | secret de producción |
| `NEXT_PUBLIC_BASE_DOMAIN` | `vendra.com.mx` |
| `PLATFORM_ADMIN_EMAILS` | `admin@vendra.com.mx` |

**NO se cargaron, a propósito:**

- `SUPABASE_DB_URL` — la app no se conecta directo a Postgres; ponerla ahí sería
  exponer la contraseña de la base sin razón.
- Las seis `QA_*` — son de la semilla de pruebas y traen contraseñas de QA.
- `RESEND_API_KEY` — los correos se dejaron para el final.

### Tropiezo: la contraseña del admin

El primer intento de `create-admin.mjs` se escribió con **comillas curvas**
(`‘ ’` en vez de `' '`), que macOS pone al copiar desde Notas, Slack o un
documento. El shell no las reconoce como comillas y el comando no llegó a
correr.

Después, otra corrida sí actualizó la contraseña, pero el login seguía fallando
y ninguna de seis variantes probadas coincidía. No se averiguó qué llegó.

**La salida es no adivinar:** el script es idempotente, así que se vuelve a
correr con una contraseña nueva y listo. Contraseñas sin caracteres especiales
se pueden pasar sin comillas y el problema desaparece.

### ⚠ Pendiente: prender `ALLOW_INDEXING`

Se dejó **sin poner** a propósito: los textos del dealer todavía no están
listos, y un sitio indexado con contenido de relleno es peor que uno no
indexado — Google se queda con esa primera impresión.

Sin esa variable el sitio sirve `robots.txt` con `Disallow: /` y cabecera
`noindex`. **Cuando el contenido esté listo hay que agregar `ALLOW_INDEXING=true`
y redesplegar** (las variables solo toman efecto en un build nuevo).

Si se olvida, el sitio del dealer nunca aparece en Google — y el posicionamiento
es parte de lo que se le vendió.

## Fase 3 — Dominio de plataforma ✅

Completada el 22/sep/2026.

| Dominio | Comportamiento |
|---|---|
| `vendra.com.mx` | Sirve la plataforma (canónico) |
| `www.vendra.com.mx` | 308 permanente → `vendra.com.mx` |

Vercel aplica por defecto *"Redirect apex domains to www"*, que deja el `www`
como principal. Se invirtió a mano: la marca, la presentación y los correos
dicen `vendra.com.mx` a secas. El redirect se puso **308 permanente**, no 307:
el temporal mantiene las dos direcciones como candidatas y reparte el
posicionamiento entre ambas.

### El target de Vercel es por PROYECTO, no por cuenta

```
vendra-prod  ->  a096f4b47e13afef.vercel-dns-017.com
vendra-test  ->  e852c9b45867b118.vercel-dns-017.com
```

Resuelven a las mismas IPs pero son nombres distintos. **Para cada dominio nuevo
hay que copiar el Target que muestre su propia pantalla en Vercel**, no reusar
el que ya se conocía.

### El apex como CNAME funciona por Cloudflare

El estándar de DNS no permite un CNAME en la raíz del dominio. Cloudflare lo
resuelve con aplanado de CNAME, así que `@` funciona sin problema.

**Esto no se puede dar por hecho con otros proveedores.** Para el dominio del
dealer, que está en Neubox, si el sitio va en la raíz probablemente haga falta
un registro `A`, un `ALIAS`/`ANAME` si lo ofrecen, o poner el sitio en `www` y
redirigir la raíz.

## Fase 4 — Alta del primer dealer

Pendiente. Su dominio está en Neubox.

## Fase 5 — Correos de leads

Pendiente. Se deja para el final por decisión propia.

## Fase 6 — Prueba de humo

Pendiente.
