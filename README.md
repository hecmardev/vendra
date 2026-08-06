# Vendra

Plataforma multi-tenant (SaaS) de venta de autos. Un solo código base y una sola
base de datos sirven a múltiples dealers, cada uno con su dominio, inventario y
leads aislados por `dealer_id` + RLS.

## Stack

- **Next.js (App Router) + TypeScript** — SSR para SEO del catálogo público.
- **Supabase** — Postgres + Auth + Storage. Acceso vía `@supabase/ssr` + RLS.
- **Tailwind CSS + shadcn/ui** — theming por variables CSS (branding por dealer).
- **TanStack Query** — estado de cliente en panel y filtros post-carga.

## Convenciones (estilo doorvel_next)

- **Páginas delgadas, vistas pesadas**: `app/<ruta>/page.tsx` solo importa una
  vista de `views/…`. Toda la UI vive en la vista.
- **`views/<vista>/`**: `index.tsx` + `components/` + `states/<Vista>Provider.tsx`.
- **`components/common/<comp>/`**: componentes de dominio compartidos, con barrel
  `components/common/index.ts`. Primitivos shadcn en `components/ui/`.
- **`services/`**: operaciones de datos sobre Supabase (las vistas no consultan directo).
- **`middlewares/`**: clases componibles con `.handle()`, orquestadas por `middleware.ts`.

Panel del dealer en `/dashboard`. `/admin` (plataforma/superadmin) se reserva para el futuro.

## Setup (pendiente)

Este repo está andamiado (estructura + config). Faltan las instalaciones y la conexión a Supabase:

```bash
pnpm install                 # instalar dependencias
cp .env.example .env.local   # completar llaves de Supabase
supabase start               # o proyecto en la nube
supabase db push             # aplica supabase/migrations/0001_init.sql
pnpm db:types                # regenera types/database.ts
pnpm dev
```

Onboarding de un dealer:

```bash
pnpm dealer:create -- --name "AutosMX" --domain autosmx.com --email dueno@autosmx.com
```
