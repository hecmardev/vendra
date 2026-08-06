# Estado del proyecto — Vendra (handoff / continuidad)

> Documento vivo para retomar el proyecto (incluso al cambiar de computadora o de
> sesión). Resume qué es, qué funciona, qué falta y las decisiones clave.

## Qué es
Plataforma **SaaS multi-tenant** para venta / financiamiento / renta de vehículos
(autos, motos, camiones). Cada dealer tiene su propio dominio, storefront,
inventario y leads, aislados por `dealer_id` + RLS.

- **Stack:** Next.js (App Router) + TypeScript · Supabase (Postgres/Auth/Storage) ·
  Tailwind + shadcn/ui · Framer Motion · Vercel · Manrope.
- **Multi-tenancy por dominio:** el middleware resuelve el hostname → dealer y sirve
  su storefront. `localhost` (dev) / `vendra.com.mx` (prod) = plataforma (landing + `/admin`).
  `*.localhost` / `*.vendra.com.mx` = dealer.

## Estado actual (funciona)
- **Storefront** del dealer: home, `/autos` (catálogo con filtros colapsables +
  ocultar panel), ficha `/autos/[slug]` con breadcrumb SEO + JSON-LD, contacto, nosotros.
- **Panel del dealer** (`/dashboard`): overview, inventario (CRUD + fotos reales a
  Storage), leads (estado persistente + notas), contenido (editor por tabs), ajustes
  (branding/tema, negocio, marketing, módulos).
- **Panel admin** (`/admin`): lista de dealers con métricas, alta/edición/baja,
  suspender/reactivar, reset de contraseña de dealer.
- **Leads:** captura pública (contacto + "Apartar" con modal) → BD; notificación por
  email (Resend) fail-safe.
- **Borrado lógico** (soft delete) en cars/leads/dealers/etc.: nada se borra, se marca
  `is_active=false` + `record_status`. Registros `deleted` son **inmutables**.
- **Auth:** login por dominio del dealer; admin por `PLATFORM_ADMIN_EMAILS`.

## Pendientes (priorizados)
**Tier 1 (para usarlo de verdad)**
- [ ] **Deploy a producción** (Vercel + `vendra.com.mx`). Ver `docs/deploy-checklist.md`.
- [x] Botón "Apartar" (hecho) · [x] Notificación de leads por email (hecho, requiere `RESEND_API_KEY`).

**Tier 2 (promesas que aún no funcionan)**
- [ ] Inyectar **Meta Pixel / GA4** en el storefront (hoy solo se capturan en Ajustes).
- [ ] Que los **flags de Módulos** activen/desactiven funciones reales (hoy no gatean nada).
- [ ] **Aviso de privacidad + consentimiento de cookies** (legal + necesario para Pixel/GA4).

**Tier 3 (pulido / SEO / operación)**
- [ ] **sitemap.xml + robots.txt**.
- [ ] Reset de contraseña **self-service** para dealers (hoy solo el admin).
- [ ] Optimización de imágenes (resize al subir; usar next/image donde falte).

## Migraciones de Supabase — aplicar en el SQL Editor
Correr en orden si no están aplicadas (idempotentes):
- `0001_init.sql` — esquema base (aplicada).
- `0002_dealer_features_write.sql` — política de escritura de módulos. **(incluida en 0003)**
- `0003_soft_delete.sql` — columnas is_active/record_status/deleted_at + RLS + índices.
- `0004_lead_notes.sql` — columna `notes` en leads. **Verificar si ya está aplicada.**

## Decisiones clave (criterios del proyecto)
- **Dominio:** `vendra.com.mx` (Akky, ~$249 MXN/año). Se conserva la marca "Vendra".
- **Login de dealers:** solo en su propio dominio (no en el host de plataforma).
- **Borrado:** lógico e inmutable (no se restauran registros `deleted`; para "recuperar"
  se crea uno nuevo). Ver `docs/plan-borrado-logico.md`.
- **Componentes importan solo de `services/`**, nunca de `lib/supabase` directo
  (mantiene el backend intercambiable). Excepción: middlewares (edge).

## Gotchas / cómo trabajar
- **No correr `pnpm build` con `pnpm dev` arriba** → corrompe `.next`. Si algo se rompe
  raro tras cambiar rutas: `rm -rf .next && pnpm dev`.
- **En componentes cliente, importar del módulo específico**, no del barrel
  `@/components/common` (arrastra código server → error de build).
- **Overlays/drawers en portal a `document.body`** (si no, un ancestro los descoloca).
- **Verificar tipos:** `pnpm ts:check` (o `./node_modules/.bin/tsc --noEmit`).
- **Vercel:** el wildcard `*.vendra.com.mx` y el uso comercial requieren **Vercel Pro**.
- **`NEXT_PUBLIC_BASE_DOMAIN`** debe ser el dominio de plataforma o el middleware confunde
  plataforma con dealer.

## Credenciales (referencia — los valores reales van en `.env`, NO en git)
- Dealer demo (dev): `dealer@demo.mx` / `Vendra1234!` (dominio `demo.localhost`).
- Admin plataforma (dev): `admin@vendra.mx` / `Vendra1234!` (debe estar en `PLATFORM_ADMIN_EMAILS`).
- Scripts: `scripts/create-admin.mjs`, `scripts/create-dealer.ts` (`pnpm dealer:create`), `scripts/setup-storage.mjs`.

## Cómo continuar en OTRA computadora
1. `git clone <repo>` y `cd vendra`.
2. **Copiar los secretos a mano** (no están en git): lleva tu `.env` (y `.env.local` si
   aplica) a la nueva compu por un medio seguro (AirDrop, gestor de contraseñas, USB).
   Contienen las llaves de Supabase.
3. `pnpm install`.
4. `pnpm dev` → abre `http://localhost:3000` (plataforma) y `http://demo.localhost:3000` (dealer).
5. Continuar por los **Pendientes** de arriba (siguiente: deploy).
