# Vistas de un dealer

Inventario de todo lo que ve y usa un dealer, dentro y fuera de su panel. Sirve
como mapa para saber qué existe antes de agregar algo nuevo.

Todo vive en **el dominio del dealer** (p. ej. `demo.test.vendra.com.mx`). El
middleware resuelve el tenant por hostname e inyecta `x-dealer-id`; las vistas
nunca reciben el dealer por URL. Ver `dominios-y-rutas.md`.

---

## 1. Storefront público (sin sesión)

Lo que ve un comprador que llega al sitio del dealer.

| Ruta | Vista | Qué muestra |
|---|---|---|
| `/` | `views/homepage` | Hero, Categorías, Destacados, Cómo funciona |
| `/autos` | `views/catalog` | Filtros laterales (marca, precio, año, tipo) + grilla |
| `/autos/[slug]` | `views/carDetail` | Galería, specs, FAQ y botón **Apartar** |
| `/contacto` | `views/contact` | Formulario de contacto → lead |
| `/acerca-de` | `views/about` | Historia, trayectoria, valores y testimonios |

**Redirecciones permanentes** (301, en `next.config.js`) para no perder enlaces
ni valor de SEO de la estructura anterior:

- `/catalogo` → `/autos`
- `/auto/[slug]` → `/autos/[slug]`

**`/not-available`** no es del dealer: es la pantalla que sirve el middleware
cuando el hostname no corresponde a ningún dealer activo.

> El catálogo público solo expone autos con `status = 'disponible'`. No es un
> filtro de la aplicación sino una **política de RLS** sobre la anon key, así que
> los `apartado` y `vendido` quedan ocultos aunque alguien adivine la URL.

## 2. Dashboard (con sesión)

Bajo `/dashboard`, en el mismo dominio. Los cinco primeros son el menú lateral
(`views/dashboard/components/Sidebar.tsx`).

| Ruta | Sección | Qué hace |
|---|---|---|
| `/dashboard` | **Inicio** | Métricas: Autos publicados, Disponibles, Leads totales, Leads nuevos. Más los últimos leads |
| `/dashboard/inventario` | **Inventario** | Lista filtrable: Todos / Disponibles / Apartados / Vendidos. Editar y eliminar |
| `/dashboard/leads` | **Leads** | Filtros Total / Nuevos / Contactados, y detalle con **notas editables** |
| `/dashboard/contenido` | **Contenido** | Textos e imágenes por sección: Marca, Inicio, Nosotros, Contacto |
| `/dashboard/ajustes` | **Ajustes** | Datos del negocio (nombre, WhatsApp, teléfono) y módulos |
| `/dashboard/inventario/nuevo` | — | Alta de auto |
| `/dashboard/inventario/[id]` | — | Edición: specs, estado y fotos |
| `/dashboard/login` | — | Acceso del dealer |

Las páginas del panel llevan `export const dynamic = 'force-dynamic'` en su
`layout.tsx`: sin eso, Next intenta prerenderizarlas y el guard de sesión
revienta el build en Vercel.

### Módulos de Ajustes

Feature flags por dealer, en la tabla `dealer_features`:

| `key` | Etiqueta en el panel |
|---|---|
| `financiamiento` | Calculadora de financiamiento |
| `seccion_personalizada` | Sección personalizada |
| `ia_whatsapp` | Asistente de IA por WhatsApp |

> **Pendiente conocido:** los flags se guardan pero **todavía no gatean nada** en
> el storefront. Prenderlos no cambia lo que ve el comprador. Está en Tier 1 de
> `estado-proyecto.md`.

## 3. Lo que hay detrás

**`/api/leads`** — el endpoint al que pegan tanto el formulario de contacto como
el de Apartar. Valida el `source` contra una lista blanca (`web_form`,
`apartado`) y es un INSERT **anónimo**: corre con la anon key, sin sesión, bajo
una política de RLS distinta a la del dashboard.

**Storage** — las fotos viven en el bucket `car-photos`, en una carpeta por
`dealer_id`. La tabla `car_images` solo guarda la URL. El bucket es de lectura
pública (son autos en venta) pero cada dealer únicamente escribe en su carpeta.

## Lo que un dealer NO ve

Para tener el mapa completo: `/admin` y todo lo que cuelga de él es el panel de
**plataforma**, y vive en el dominio de plataforma, no en el del dealer. Si un
dealer entra a `/admin` desde su dominio, no existe esa ruta ahí; y si alguien
llega a `/dashboard` desde el dominio de plataforma, el middleware lo redirige a
la landing.
