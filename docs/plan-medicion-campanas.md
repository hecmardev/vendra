# Plan de medición de campañas (UTM, Pixel y regreso a Meta)

Validación de `Estrategia de leads y campañas` (03/oct/2026) contra el código de
`main` y el plan técnico que sale de ahí. Revisado el 08/oct/2026.

---

## 1. Qué hay hoy en el código

Se buscó `utm_`, `fbclid`, `gclid`, `fbq`, `gtag` y `consent` en `main` y en
todas las ramas remotas (`feat/*`, `test`): **cero resultados**. No hay nada de
medición construido todavía.

| Pieza | Estado | Dónde |
|---|---|---|
| Captura de UTM / `fbclid` / `gclid` | No existe | — |
| Pixel de Meta / GA4 en el sitio | No se inyecta. Los IDs se guardan en Ajustes y nada los usa | `app/layout.tsx` (TODO), `dealers.meta_pixel_id` |
| Identificación de visitantes | No existe. No hay cookie, ni id anónimo, ni tabla de visitas | — |
| Aviso de privacidad / cookies | No existe (ya está en Tier 2 de `estado-proyecto.md`) | — |
| Leads | Solo los que llenan un formulario en el sitio | `app/api/leads/route.ts` |
| Origen del lead | `source` ∈ `web_form`, `apartado`, `whatsapp` (lista blanca) | `route.ts:29` |
| Estatus del lead | `nuevo`, `contactado`, `cerrado` | `views/dashboard/leads/index.tsx:18` |
| Nuevo vs seminuevo | No existe el campo en `cars` | `pendientes.md` §3 |
| Webhooks (Meta / WhatsApp) | Carpeta vacía | `app/api/webhooks/.gitkeep` |
| Conversions API (regreso a Meta) | No existe | — |

### ¿Cómo se identifica hoy a quien visita?

**No se identifica.** Quien entra al sitio, ve autos y se va sin escribir no deja
ningún rastro: ni en la base ni en una herramienta de analítica (el Pixel y GA4 no
están puestos). Tampoco se sabe de dónde llegó: un visitante de Google orgánico,
uno de un anuncio de Meta y uno que escribió la URL se ven igual.

El único registro es el lead, y solo con lo que el visitante tecleó (nombre,
teléfono, auto). Además:

- El botón flotante de WhatsApp y el de Contacto (`WhatsAppFloat`,
  `views/contact`) abren el chat **sin crear lead ni registrar el clic**. Esos
  contactos se pierden para la medición.
- Solo la ficha del auto (`WhatsAppDialog`) pide datos antes de abrir el chat,
  y guarda el lead con `source: 'whatsapp'`.

---

## 2. Validación del plan contra el código

| Lo que dice el plan | ¿Se sostiene? | Qué falta |
|---|---|---|
| Un solo pixel por dealer | ✅ Coincide con el modelo (`dealers.meta_pixel_id`) | Inyectarlo |
| Cada evento lleva condición, marca, modelo y precio | ✅ Los cuatro datos existen (condición desde la 0009) | Mandarlos en los eventos (Fase 1) |
| Audiencia "vio un Kia y no escribió" | ⚠️ Depende de `ViewContent` con `brand` | Pixel + eventos (Fase 1) |
| Remarketing y **catálogo de autos** | ❌ Los anuncios de catálogo necesitan un feed de inventario | Endpoint de feed de vehículos |
| Todos los leads llegan a un panel con anuncio y campaña | ❌ El lead no guarda ningún dato de campaña | Atribución en `leads` (Fase 0) |
| Formulario de Meta llega al panel | ❌ No hay webhook | Webhook `leadgen` (Fase 3) |
| WhatsApp directo llega al panel | ❌ El chat va directo al teléfono del dealer y nunca toca el sitio | WhatsApp Cloud API o captura manual (Fase 4) |
| Estatus contactado / cita / vendido | ⚠️ Hoy hay `nuevo`, `contactado`, `cerrado`. Faltan `cita`, `vendido`, `perdido` | Migración de estatus |
| El sitio avisa a Meta al cambiar estatus | ❌ No existe | Conversions API (Fase 2) |
| Comparar por costo por venta | ❌ No hay gasto por campaña ni monto de venta | Reporte (Fase 5) |
| Los sitios de Kia sirven en Google como segmento | ✅ Es configuración de Google Ads, no requiere código | — |

### Matices al plan

1. **"50 conversiones por semana".** Es lo que Meta pide por conjunto de anuncios
   para salir de aprendizaje. Un dealer no va a tener 50 *ventas* por semana, así
   que la campaña tiene que optimizar por **lead** (o por un evento intermedio como
   cita) y usar las ventas como señal de calidad, no como objetivo de
   optimización. Conviene decirlo en el plan para no prometer que Meta "optimiza
   por ventas" desde el día uno.
2. **"Cerrado" es ambiguo.** Hoy no distingue vendido de perdido. Al migrar hay que
   decidir qué pasa con los leads que ya están en `cerrado` (propuesta: pasarlos a
   `vendido` solo si el dealer lo confirma; si no, a `perdido`).
3. **WhatsApp directo es el camino más difícil de medir.** Si el dealer contesta
   desde la app de WhatsApp Business en su teléfono, Vendra no se entera de nada.
   Para que entre al panel con su anuncio hace falta la WhatsApp Cloud API (con
   número conectado a Meta) o que el vendedor lo capture a mano. Es una decisión
   de producto, no solo técnica.
4. **Reportar a Meta requiere un token privado por dealer.** Hoy la tabla
   `dealers` es legible con la anon key (`pendientes.md` §1). El token de
   Conversions API **no puede** vivir ahí.
5. **Google queda fuera del regreso.** El plan solo reporta ventas a Meta. Con el
   `gclid` guardado se pueden subir las ventas a Google Ads como conversiones
   offline; vale la pena dejarlo previsto aunque se haga después.

---

## 3. Plan técnico por fases

Cada fase sirve por sí sola. La Fase 0 ya permite medir campañas con links UTM sin
depender de ninguna integración con Meta.

### Fase 0 — Atribución propia (sin integraciones externas)

**Objetivo:** cada lead del sitio queda con la campaña, el anuncio y el canal que
lo trajo.

1. **Cookie de atribución en el middleware.** En la primera página que se carga
   (`middleware.ts`, rama de dealer), leer de la URL `utm_source`, `utm_medium`,
   `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid`, más el `Referer`
   y la ruta de aterrizaje. Guardarlos en una cookie de primera parte
   (`vd_attr`, 90 días, `httpOnly`, `sameSite=lax`).
   - Guardar **primer toque** y **último toque** por separado: el primero dice qué
     campaña trajo a la persona, el último cuál la hizo escribir.
   - Sin UTM: clasificar por `Referer` (`google.*` → `google / organic`,
     `facebook.com`/`instagram.com` → `meta / social`, vacío → `direct`). Así se
     separan también los visitantes que llegan desde un buscador.
   - Generar ahí mismo un id anónimo de visitante (`vd_vid`, uuid). Es lo que
     permite unir varias visitas de la misma persona antes de que deje sus datos.
   - Convertir `fbclid` al formato `_fbc` (`fb.1.<timestamp>.<fbclid>`) para la
     Fase 2.
2. **Leerla en `/api/leads`.** El middleware no corre en `/api`, pero la cookie
   viaja con el `fetch`. La ruta la lee del request (no del body, igual que hoy
   con el dealer) y la guarda en el lead. No hay que tocar `LeadForm` ni
   `WhatsAppDialog`.
3. **Migración de atribución en leads** (siguiente número libre):
   ```sql
   alter table leads
     add column if not exists visitor_id    uuid,
     add column if not exists utm_source    text,
     add column if not exists utm_medium    text,
     add column if not exists utm_campaign  text,
     add column if not exists utm_content   text,
     add column if not exists utm_term      text,
     add column if not exists first_touch   jsonb,   -- {utm_*, referrer, landing, at}
     add column if not exists fbc           text,
     add column if not exists fbp           text,
     add column if not exists gclid         text,
     add column if not exists landing_path  text,
     add column if not exists referrer      text,
     add column if not exists external_id   text,    -- leadgen_id de Meta / ctwa_clid de WhatsApp
     add column if not exists meta_ad_id    text,
     add column if not exists meta_campaign_id text;
   create index if not exists leads_dealer_campaign_idx on leads (dealer_id, utm_campaign);
   ```
4. **Condición y estatus:**
   - ✅ `cars.condition` (`nuevo`, `seminuevo`, `demo`) — hecho en
     `0009_car_condition.sql`, con campo en `CarForm`, filtro en catálogo y
     `?condicion=` en la URL de `/autos` para los links de campañas.
   - Estatus de lead (migración aparte): `nuevo`, `contactado`, `cita`, `vendido`, `perdido`
     (con `check`), y decidir la migración de `cerrado` (ver matiz 2).
   - `leads.sold_at timestamptz`, `leads.sale_amount numeric(12,2)` — el valor que
     se le reporta a Meta como compra y la base del costo por venta.
5. **Ampliar la lista blanca de `source`:** `web_form`, `apartado`, `whatsapp`,
   `whatsapp_click`, `meta_form`, `whatsapp_ad`, `manual`.
6. **Clics de WhatsApp sin datos.** `WhatsAppFloat` y el botón de Contacto mandan un
   `navigator.sendBeacon('/api/events', …)` con `whatsapp_click`. Se guarda en una
   tabla ligera `lead_events` o `contact_clicks` (dealer, visitor_id, campaña,
   ruta). No es un lead, pero sí cuenta cuántas conversaciones generó cada campaña.
7. **Panel de leads:** mostrar origen y campaña en la lista y en el detalle;
   filtro por campaña; los cinco estatus nuevos; al marcar `vendido`, pedir el
   monto.
8. **Aviso de privacidad** en el storefront y mención en el formulario. La cookie
   de atribución es propia y de medición, pero recoge datos que luego se unen a un
   teléfono: tiene que estar en el aviso (LFPDPPP).

**Convención de UTM** (escribirla y no salirse de ella; es lo que hace legible el
reporte):

| Parámetro | Valor | Ejemplo |
|---|---|---|
| `utm_source` | plataforma | `meta`, `google` |
| `utm_medium` | tipo | `paid_social`, `cpc`, `display` |
| `utm_campaign` | `<condición>_<objetivo>_<aaaamm>` | `seminuevo_unidad_202610` |
| `utm_content` | `{{ad.id}}` (macro dinámica de Meta) | se llena solo |
| `utm_term` | `{{adset.id}}` | se llena solo |

En Meta, usar los parámetros de URL del anuncio con macros (`{{campaign.name}}`,
`{{adset.id}}`, `{{ad.id}}`) para no escribirlos a mano.

### Fase 1 — Pixel y GA4 en el sitio

1. Leer `meta_pixel_id` y `ga4_measurement_id` del tenant en `app/layout.tsx`
   (el TODO que ya existe) e inyectar los scripts solo en storefronts, nunca en
   `/dashboard` ni en plataforma.
2. Eventos con los datos del auto (`content_ids`, `brand`, `model`, `year`,
   `condition`, `price`, `currency: MXN`):
   - `PageView` en todas las páginas.
   - `ViewContent` en la ficha `/autos/[slug]`.
   - `Search` en el catálogo con filtros aplicados.
   - `Lead` al guardar un lead, con un `event_id` = id del lead (para deduplicar
     con el servidor en la Fase 2).
   - `Contact` en cada clic de WhatsApp.
3. Banner de consentimiento: el Pixel y GA4 se cargan cuando el visitante acepta.
4. **Feed de catálogo de vehículos** (`/api/feeds/meta?dealer=…` o por dominio)
   con el inventario disponible, para los anuncios de catálogo y el remarketing
   dinámico que el plan pone en la mezcla.

### Fase 2 — Regreso a Meta (Conversions API)

1. **Tabla privada `dealer_integrations`** (sin `grant` a `anon` ni a
   `authenticated` de lectura): `meta_capi_token`, `meta_page_id`,
   `meta_dataset_id`, `wa_phone_number_id`, `wa_token`. Solo el service-role la lee.
2. **Al crear el lead** (`/api/leads`): mandar `Lead` server-side con el mismo
   `event_id` que el Pixel, `fbc`, `fbp`, IP, user agent, y teléfono/correo
   normalizados y con hash SHA-256.
3. **Al cambiar el estatus** (`updateLeadStatus`): mandar el evento que
   corresponde, una sola vez por lead y estatus.
   | Estatus | Evento a Meta |
   |---|---|
   | `contactado` | evento personalizado `Contactado` |
   | `cita` | `Schedule` |
   | `vendido` | `Purchase` con `value = sale_amount`, `currency = MXN` |
   | `perdido` | no se reporta (como dice el plan) |
   - Leads de formulario de Meta: se reportan con su `lead_id` y
     `action_source: system_generated` (integración CRM de Meta), que es lo que
     habilita la optimización por calidad de lead.
   - Leads de WhatsApp por anuncio: `action_source: business_messaging` con el
     `ctwa_clid`.
4. **Registro e idempotencia:** cada envío queda en `lead_events` (lead, evento,
   enviado, respuesta). El envío va fuera del request del vendedor (no debe
   bloquear el panel) y se reintenta si Meta falla.

### Fase 3 — Formularios de Meta al panel

1. App de Meta con permiso `leads_retrieval` y la página del dealer suscrita al
   webhook `leadgen`.
2. `app/api/webhooks/meta/route.ts`: verificar firma (`X-Hub-Signature-256`),
   pedir el lead a la Graph API con el `leadgen_id`, resolver el dealer por
   `page_id` → `dealer_integrations`, e insertar con `source: 'meta_form'`,
   `external_id = leadgen_id`, `meta_ad_id`, `meta_campaign_id` y las respuestas
   de las preguntas de filtro en `message` o en un `jsonb`.
3. Misma notificación por correo que los leads del sitio.

### Fase 4 — WhatsApp directo al panel (requiere decisión)

Dos caminos:

- **WhatsApp Cloud API.** El número del dealer se conecta a Meta; el webhook de
  mensajes trae el `referral` del anuncio (`source_id`, `ctwa_clid`). Se crea el
  lead con `source: 'whatsapp_ad'` en el primer mensaje. Antes de elegirlo,
  confirmar con Meta si el dealer puede seguir usando la app en su teléfono con
  ese número (modo coexistencia) o si tiene que cambiar de herramienta.
- **Captura manual.** Botón "Nuevo lead" en el panel con origen "WhatsApp anuncio"
  y campaña a elegir. Barato, pero depende de que el vendedor lo haga.

Recomendación: arrancar con la manual y pasar a Cloud API cuando el dealer
confirme que va a invertir en ese camino.

### Fase 5 — Costo por venta

1. Gasto por campaña: Meta Marketing API (`insights` por `campaign_id`, diario) a
   una tabla `campaign_spend`; o captura manual mensual al inicio.
2. Vista en el panel: por campaña y por camino (sitio / formulario / WhatsApp) —
   leads, citas, ventas, gasto, **costo por lead** y **costo por venta**.
3. Google Ads: subir las ventas como conversiones offline con el `gclid`.

---

## 4. Orden recomendado y decisiones abiertas

| # | Entregable | Depende de |
|---|---|---|
| 1 | Fase 0 completa (atribución + condición + estatus + aviso) | Nada |
| 2 | Fase 1 (Pixel, GA4, consentimiento, feed) | Pixel del dealer |
| 3 | Fase 2 (CAPI) | Token de CAPI del dealer |
| 4 | Fase 3 (formularios de Meta) | App de Meta aprobada con `leads_retrieval` |
| 5 | Fase 4 manual → Cloud API | Decisión del dealer |
| 6 | Fase 5 (costo por venta) | Fases 0–3 con datos de un mes |

Decisiones que hay que tomar antes de empezar:

- ¿Qué pasa con los leads que hoy están en `cerrado`?
- ¿Se pide el monto al marcar `vendido`, o se toma el precio del auto?
- WhatsApp directo: ¿manual primero o Cloud API desde el inicio?
- ¿Quién es dueño de la app de Meta: Vendra (una app para todos los dealers) o
  cada dealer? Recomendado: una sola app de Vendra, con un token por dealer.
