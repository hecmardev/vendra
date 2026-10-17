# Avisos de privacidad — borradores

> **BORRADORES. No publicar sin revisión de un abogado.** Están escritos a partir
> de lo que el código de Vendra hace realmente con los datos (octubre 2026),
> pero el texto legal, los plazos y las referencias a la ley los tiene que
> validar alguien con cédula. Ver § 4.

Iniciado el 15/oct/2026.

---

## 1. Por qué son dos avisos

En la ley mexicana de protección de datos hay dos papeles:

- **Responsable:** quien decide para qué se usan los datos y responde por ellos.
- **Encargado:** quien los trata **por cuenta** del responsable, sin decidir sus
  fines (un proveedor de software o de hosting).

En Vendra cada dealer y Vendra juegan papeles distintos según el dato:

| Datos | Responsable | Encargado |
|---|---|---|
| Leads y visitantes del sitio de un dealer (nombre, teléfono, mensaje, cookies de medición, fichas vistas, clics de contacto) | **El dealer** | Vendra (y sus proveedores: Supabase, Vercel, Resend) |
| Cuenta del dealer en Vendra (correo de acceso, datos del negocio, configuración) | **Vendra** | Supabase, Vercel |
| Visitantes de `vendra.com.mx` | **Vendra** | Vercel |

Por eso:

| Archivo | Se publica en | Lo firma |
|---|---|---|
| [`aviso-privacidad-dealer.md`](aviso-privacidad-dealer.md) | `/aviso-de-privacidad` del sitio de **cada dealer** | El dealer (plantilla con sus datos) |
| [`aviso-privacidad-vendra.md`](aviso-privacidad-vendra.md) | `vendra.com.mx/aviso-de-privacidad` | Vendra |

Además, Vendra y cada dealer deberían firmar un **contrato de encargo**
(cláusula en los términos del servicio): Vendra solo usa los datos de los
clientes del dealer para prestarle el servicio, no los vende ni los usa para sí,
los protege, y los devuelve o elimina al terminar la relación.

El mismo contrato debe incluir, **desde el primer cliente**, la autorización
para **estadísticas agregadas**: Vendra puede usar la información de inventario,
ventas, precios, vistas y leads del dealer, sin datos personales, para generar
estadísticas del mercado que combinen varios dealers (p. ej. "qué se vende en
Nuevo León"), sin identificar al dealer ni a sus clientes. Las ventas y precios
del dealer son información comercial suya aunque no sean datos personales: sin
esa cláusula, Vendra no podría usarlas. Agregarla después obligaría a
renegociar con cada dealer.

Regla para publicar una estadística (anonimato real): solo si junta al menos
**5 dealers y 10 unidades**. Si no, agrupar más (ciudad → estado, modelo →
marca) o no mostrarla. Con un solo dealer Kia en una ciudad, "precio promedio
del Seltos en esa ciudad" es el precio de ese dealer. Las consultas entre
dealers corren con permisos de administrador y nunca se exponen en el panel de
un dealer.

## 2. Qué hay que completar

Los campos entre `{{ }}`:

**Por cada dealer** (lo ideal: que los capture en su panel, ver § 3):

| Campo | Ejemplo |
|---|---|
| `{{NOMBRE_COMERCIAL}}` | Autos del Norte |
| `{{RAZON_SOCIAL}}` | Autos del Norte, S.A. de C.V. — o el nombre completo si es persona física |
| `{{DOMICILIO}}` | Calle, número, colonia, C.P., ciudad, estado |
| `{{CORREO_PRIVACIDAD}}` | privacidad@autosdelnorte.mx (un buzón que alguien revise) |
| `{{TELEFONO}}` | 81 1234 5678 |
| `{{SITIO}}` | autosdelnorte.mx |
| `{{FECHA}}` | Última actualización |

**De Vendra:** `{{RAZON_SOCIAL_VENDRA}}`, `{{DOMICILIO_VENDRA}}`,
`{{CORREO_PRIVACIDAD_VENDRA}}` (p. ej. privacidad@vendra.com.mx), `{{FECHA}}`.

## 3. Cambios técnicos para que el aviso diga la verdad

El aviso describe cómo se tratan los datos. Hoy hay cosas que el aviso promete
y el código todavía no hace. **Hay que construirlas antes de publicarlo:**

1. **Rechazar la medición.** El aviso trata la medición de campañas como
   finalidad *secundaria*, que el visitante puede rechazar. Hoy las cookies
   `vd_vid` y `vd_attr` se ponen siempre. Falta:
   - Un banner o panel de preferencias con "Aceptar" y "Rechazar medición".
   - Una cookie de decisión (p. ej. `vd_consent`) que el middleware respete: si
     es "rechazada", no pone ni lee `vd_vid`/`vd_attr`, y `/api/views` y
     `/api/contact-clicks` no registran nada.
   - El Pixel de Meta y GA4 (Fase 1) **solo** se cargan si aceptó.
2. **Cancelación de datos (derecho ARCO).** El proyecto usa borrado lógico
   inmutable: nada se borra. Pero si un cliente pide la cancelación, sus datos
   no pueden quedarse para siempre. Falta un procedimiento: **anonimizar** el
   lead (nombre, teléfono, correo y mensaje → vacíos; conservar solo fechas,
   estatus y montos para estadística) y desligarlo de su `visitor_id`. Puede
   empezar como un botón del admin.
3. **Plazos de conservación.** El aviso promete un plazo (propuesto: datos de
   leads que no compraron, 2 años desde el último contacto; de clientes que
   compraron, lo que pidan las leyes fiscales y comerciales; datos de medición
   sin lead, 13 meses). Falta un proceso que anonimice lo vencido.
4. **Publicar.** Página `/aviso-de-privacidad` en cada sitio de dealer con sus
   datos, enlace en el pie de página, y el **aviso simplificado** (§ 5 de la
   plantilla del dealer) debajo de cada formulario (Contacto, Apartar,
   WhatsApp).
5. **Datos del dealer en el alta (admin).** Razón social o nombre, domicilio,
   correo de privacidad, y **estado y ciudad como campos aparte** (hoy el
   domicilio es texto libre en `content`, y sin estado/ciudad estructurados no
   se pueden hacer estadísticas por región). Los captura Vendra al dar de alta
   al dealer: el dealer no tiene que hacer nada. Sin ellos, la página del aviso
   no se puede generar.

## 4. Qué tiene que revisar el abogado

- **La ley vigente y la autoridad.** Los borradores se basan en la Ley Federal
  de Protección de Datos Personales en Posesión de los Particulares publicada en
  el DOF el 20 de marzo de 2025, que sustituyó a la de 2010, y mencionan como
  autoridad a la Secretaría Anticorrupción y Buen Gobierno, que asumió las
  funciones del INAI. **Confirmar ambos datos y ajustar cualquier referencia.**
- **Plazos de respuesta a solicitudes ARCO** (los borradores dicen "los que
  marca la ley" a propósito).
- **Si la medición de campañas puede quedarse como finalidad secundaria con
  opción de rechazo**, o si debe pedirse consentimiento previo (como ya se hará
  con Meta y Google).
- **Transferencias internacionales:** la base de datos está en Canadá (Supabase,
  región `ca-central-1`), el hosting y el correo en Estados Unidos (Vercel,
  Resend). Los borradores las tratan como remisiones a encargados.
- **El contrato de encargo** entre Vendra y cada dealer, incluida la cláusula de
  estadísticas agregadas y si anonimizar datos personales para ese fin cabe
  dentro del encargo.
- **Plazos de conservación** propuestos en § 3.3.
