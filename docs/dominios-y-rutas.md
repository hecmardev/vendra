# Dominios y rutas (dos sitios, un solo código)

Vendra sirve **dos tipos de sitio** desde el mismo proyecto Next.js, decididos por el
**dominio** con el que entra el visitante.

## 1. Dominio de plataforma (admin) — `vendra.com.mx`

Tu sitio de marketing para atraer dealers + tu administración.

| Ruta | Qué es |
|------|--------|
| `vendra.com.mx/` | Landing de la plataforma (qué es Vendra, beneficios) |
| `vendra.com.mx/precios` | Planes / precios |
| `vendra.com.mx/conviertete-en-dealer` | CTA para registrarse como vendedor |
| `vendra.com.mx/admin` | Panel superadmin (dar de alta dealers, feature flags, planes) |

## 2. Dominio de dealer — p. ej. `hectorauto.com`

La **tienda** de cada vendedor. Mismo código, datos por `dealer_id`.

| Ruta | Qué es |
|------|--------|
| `hectorauto.com/` | **Home del dealer** (hero + destacados + … con SUS autos/branding/textos) |
| `hectorauto.com/catalogo` | Su catálogo |
| `hectorauto.com/auto/[slug]` | Ficha de su auto |
| `hectorauto.com/contacto`, `/acerca-de` | Sus páginas |
| `hectorauto.com/dashboard` | Su panel (inventario, leads, contenido, ajustes) |

---

## Cómo se decide (middleware)

```
host = hostname de la request
if (host === vendra.com.mx / www.vendra.com.mx)   → SITIO PLATAFORMA
else                                          → resolver dealer por dominio → STOREFRONT
```

- **Plataforma:** el middleware reescribe internamente `/*` → `/plataforma/*`
  (la URL pública sigue siendo `vendra.com.mx/`). Las páginas viven en `app/plataforma/`.
  `/admin` se maneja aparte (protegido por rol superadmin).
- **Dealer:** se queda en las rutas raíz actuales (`/`, `/catalogo`, …), inyectando
  `x-dealer-id` como hoy. Si el dominio no está registrado → `/not-available`.

Así no hay conflicto: la home raíz `app/page.tsx` solo la ven los dominios de dealer;
la plataforma nunca llega ahí porque se reescribe a `/plataforma`.

## Estructura propuesta de `app/`

```
app/
├─ page.tsx                 # HOME del DEALER (storefront) — dominios de dealer
├─ catalogo/ auto/ contacto/ acerca-de/   # storefront del dealer
├─ dashboard/               # panel del dealer
├─ plataforma/              # SITIO DE PLATAFORMA (vendra.com.mx) — reescrito por middleware
│  ├─ page.tsx              # landing
│  ├─ precios/  conviertete-en-dealer/
├─ admin/                   # panel superadmin (vendra.com.mx/admin)
└─ not-available/           # dominio no registrado
```

## Preview en desarrollo

Como en local solo hay `localhost`, para ver ambos sitios:

- **Plataforma:** `localhost:3000` → landing de plataforma.
- **Dealer:** `demo.localhost:3000` (los `*.localhost` resuelven a 127.0.0.1 en navegadores
  modernos) → storefront del dealer demo. Configurable con `DEV_DEALER_ID`.

(Alternativa: una variable/param para forzar uno u otro en dev.)

## Qué falta para tenerlo

1. Añadir la **rama de plataforma** en `middlewares/ResolveDealerMiddleware` / `middleware.ts`.
2. Crear el **sitio `app/plataforma/`** (landing, precios, conviértete-en-dealer).
3. Construir el **panel `/admin`** (ver `onboarding-vendedores.md`, Fase 2).
4. Ajustar el **preview de dev** para ver plataforma vs. dealer.

> El storefront del dealer ya está completo; lo que falta es el **sitio de plataforma**
> y la bifurcación por dominio en el middleware.
