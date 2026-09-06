# Entornos QA y producción — Vendra

> Cómo están separados los dos ambientes, por qué, y los pasos para montarlos.
> Documento vivo. Complementa `deploy-checklist.md` (que cubre el deploy en sí).

## Topología

Cada ambiente es **un proyecto de Vercel + un proyecto de Supabase propios**. No
comparten base de datos: un lead de prueba nunca aparece en producción.

| | Plataforma | Dealer demo | Supabase | Rama |
|---|---|---|---|---|
| **PROD** | `vendra.com.mx` | `demo.vendra.com.mx` | proyecto PROD | `main` |
| **QA** | `test.vendra.com.mx` | `demo.test.vendra.com.mx` | proyecto QA (`tokyj…`) | `test` |

**No hace falta ningún cambio de código.** El middleware deriva todo de
`NEXT_PUBLIC_BASE_DOMAIN`: en QA vale `test.vendra.com.mx`, y entonces
`demo.test.vendra.com.mx` cae solo por la rama de dealer. Ver `middleware.ts`.

### Por qué el subdominio va anidado
`demo.test.vendra.com.mx` y no `test.demo.vendra.com.mx`: el DNS se lee de derecha
a izquierda, así que la segunda forma colgaría QA por debajo del dominio de
producción del dealer. Además `*.test.vendra.com.mx` es un wildcard limpio para
todo QA el día que haya Vercel Pro.

### Por qué la base actual se vuelve QA
El proyecto `tokyj…` arrastra dos meses de datos de desarrollo y su `service_role`
key ya circuló fuera del dashboard. Degradarlo a QA es gratis; producción nace
limpia, con llaves que nunca han salido de Supabase.

---

## Fase 1 — Limpiar la base actual (pasa a ser QA)

1. **Backup**: dashboard → *Download backups*. Lo que sigue es irreversible.
2. **Borrado duro**: lo hace `pnpm qa:seed -- --reset` (paso 4). Si prefieres
   verlo correr en el SQL Editor, `scripts/cleanup-qa.sql` hace lo mismo a mano.
3. **Vaciar el bucket**: también lo cubre `--reset`.
4. **Sembrar**: un solo comando deja el ambiente completo (admin, dealer con su
   usuario, 6 autos con foto y 3 leads):
   ```bash
   pnpm qa:seed -- --reset
   ```
   `--reset` borra Storage, tablas y usuarios antes de sembrar. Sin la bandera es
   idempotente: reemplaza autos y leads y respeta lo demás. Los correos y
   contraseñas salen de las variables `QA_*` del `.env` (ver `.env.example`);
   nunca se hardcodean en el script.

   Trae un seguro: `--reset` aborta si `QA_DEALER_DOMAIN` no contiene "test",
   para no apuntarle a producción por error. `--force` lo salta.

   El correo del admin debe estar en `PLATFORM_ADMIN_EMAILS` o el script avisa.

> **Borrado duro, no soft delete.** El panel hace baja lógica y deja la fila viva;
> aquí queremos la tabla vacía de verdad. `dealers_domain_active_uk` es un índice
> único **parcial** (`where is_active`), así que un dealer dado de baja libera su
> dominio pero sigue ocupando espacio y ensuciando queries de admin.

## Fase 2 — Crear producción desde cero

1. Proyecto nuevo en Supabase, **misma región** que QA.
2. Las 4 migraciones en orden en el SQL Editor: `0001` → `0002` → `0003` → `0004`.
3. `node --env-file=.env.prod.local scripts/setup-storage.mjs` (crea `car-photos`).
4. Admin + dealer `demo.vendra.com.mx` con los mismos dos scripts de la Fase 1.
5. Las llaves nuevas van **del dashboard directo a Vercel**. No pasan por el `.env`
   de trabajo ni por un chat.

## Fase 3 — Vercel: dos proyectos, un repo

Dos proyectos importando el mismo repo (`vendra-prod`, `vendra-test`), en vez de
asignar dominios a ramas dentro de un proyecto: el aislamiento de variables es
total y el modelo mental es más simple.

| Variable | vendra-prod | vendra-test |
|---|---|---|
| Rama de producción | `main` | `test` |
| `NEXT_PUBLIC_BASE_DOMAIN` | `vendra.com.mx` | `test.vendra.com.mx` |
| `NEXT_PUBLIC_SUPABASE_URL` | proyecto PROD | proyecto QA |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | PROD | QA |
| `SUPABASE_SERVICE_ROLE_KEY` | PROD (⚠ secreto) | QA |
| `PLATFORM_ADMIN_EMAILS` | tu correo | tu correo |
| `RESEND_API_KEY` | opcional | dejar vacía |

> En QA conviene **no** poner `RESEND_API_KEY`: los leads de prueba no deben
> disparar correos. El lead se guarda igual; el envío se omite (fail-safe).

## Fase 4 — Entorno local

- **`.env` apunta SIEMPRE a QA.** Nunca a producción.
- Para los scripts de alta en prod, usar `.env.prod.local` (el `.gitignore` cubre
  `.env*.local`; un `.env.prod` a secas **sí se commitearía**).
- Para ver el storefront en local sin crear un segundo dealer, apuntar el dominio
  de QA a la máquina en `/etc/hosts`:
  ```
  127.0.0.1 demo.test.vendra.com.mx
  ```
  Luego `http://demo.test.vendra.com.mx:3000`. Así un solo dealer demo sirve para
  el local y para el QA desplegado.

## Fase 5 — DNS

Cinco registros, todos CNAME hacia Vercel (los valores exactos los da Vercel al
agregar cada dominio; no inventarlos antes):

| Nombre | Ambiente |
|---|---|
| `@` / `vendra.com.mx` | prod — plataforma |
| `www` | prod — plataforma |
| `demo` | prod — dealer |
| `test` | QA — plataforma |
| `demo.test` | QA — dealer |

Si el DNS se lleva a Cloudflare, estos registros van en **DNS-only (nube gris)**.
El proxy naranja encima de Vercel rompe la emisión del certificado.

## Fase 6 — Smoke test (los 6 checks, en cada ambiente)

Ver `deploy-checklist.md` § 6. Se corren dos veces: una contra `test.vendra.com.mx`
y otra contra `vendra.com.mx`.

---

## Costos reales

- **Supabase free**: caben 2 proyectos activos, pero **ambos se pausan tras ~1
  semana sin actividad**. Cuando un proyecto se pausa, el middleware no puede
  resolver el tenant y **todos los storefronts caen a `/not-available`**. Para QA
  da igual; para producción, en cuanto entre un dealer real son ~$25 USD/mes.
- **Vercel**: Hobby alcanza para estos 5 dominios. Pro hace falta para el wildcard
  (`*.vendra.com.mx`, `*.test.vendra.com.mx`) y formalmente para uso comercial.

## Regla de oro

Un hostname pertenece a **un** ambiente. Si algún día se comparte un dominio entre
QA y prod, deja de haber dos ambientes: hay uno con dos nombres.
