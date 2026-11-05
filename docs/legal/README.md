# Documentos legales — borradores

> **BORRADORES pendientes de revisión de un abogado.** Están escritos a partir de lo que el
> código de Vendra hace realmente con los datos. El texto legal, los plazos y las referencias a la
> ley los tiene que validar alguien con cédula. Ver § 5.

Iniciado el 15/oct/2026. Revisado contra el código el 05/nov/2026.

---

## 1. Por qué son dos avisos y unos términos

En la ley mexicana de protección de datos hay dos papeles:

- **Responsable:** quien decide para qué se usan los datos y responde por ellos.
- **Encargado:** quien los trata **por cuenta** del responsable, sin decidir sus fines (un proveedor de
  software o de hosting).

| Datos | Responsable | Encargado |
|---|---|---|
| Leads y visitantes del sitio de un dealer | **El dealer** | Vendra y sus proveedores (Supabase, Vercel, Resend) |
| Cuenta del dealer en Vendra | **Vendra** | Supabase, Vercel |
| Visitantes de `vendra.com.mx` | **Vendra** | Vercel |

| Archivo | Para qué | Dónde va | Quién acepta |
|---|---|---|---|
| [`aviso-privacidad-dealer.md`](aviso-privacidad-dealer.md) | Le explica a sus clientes qué pasa con sus datos | `/aviso-de-privacidad` de cada dealer | El dealer (plantilla con sus datos) |
| [`aviso-privacidad-vendra.md`](aviso-privacidad-vendra.md) | Le explica a dealers y visitantes de Vendra lo mismo | `vendra.com.mx/aviso-de-privacidad` | Vendra |
| [`terminos-servicio-vendra.md`](terminos-servicio-vendra.md) | Reparte responsabilidades entre Vendra y el dealer | Lo acepta cada dealer antes de publicar | Vendra y el dealer |

**La protección de Vendra está en los términos, no en los avisos.** Un aviso informa a los clientes del
dealer: decir ahí que el contenido es del dealer ayuda, pero lo que obliga al dealer es que acepte los
términos. Ahí están: responsabilidad por contenido y marcas, encargo de datos, estadísticas agregadas,
límite de responsabilidad e indemnización.

## 2. Dealers sin empresa

Un dealer puede ser un vendedor independiente o un asesor sin razón social. **Esto no cambia su papel:** una
persona física también puede ser responsable de datos personales. Lo mismo aplica a Vendra mientras opere a
nombre de su titular.

- `{{RESPONSABLE}}` = razón social, o nombre completo si es persona física.
- `{{DOMICILIO}}` = un domicilio donde pueda recibir notificaciones. Se publica: puede usar uno de trabajo si
  lo tiene y puede usarlo.
- `{{CORREO_PRIVACIDAD}}` = un correo que el dealer sí revise.

### Dónde se capturan y quién lo hace

Es igual para todos los dealers:

| Dato | Dónde se guarda | Lo captura |
|---|---|---|
| Nombre o razón social | `dealers.legal_name` (nuevo) | Vendra en el alta; el dealer lo corrige en Ajustes |
| Domicilio | `dealers.legal_address` (nuevo) | Vendra en el alta; el dealer lo corrige en Ajustes |
| Correo de privacidad | `dealers.privacy_email` (nuevo) | Vendra en el alta; el dealer lo corrige en Ajustes |
| Teléfono de privacidad | `dealers.privacy_phone` (nuevo); si está vacío, el teléfono del negocio | Vendra en el alta; el dealer lo corrige en Ajustes |
| Nombre comercial | `dealers.name` (ya existe) | Ya se captura |
| Sitio | `dealers.domain` (ya existe) | Ya se captura |

El dealer da sus datos y responde por ellos (términos, § 5), aunque Vendra los capture.

**Reglas para que escale:**

- En el alta del admin se piden junto con el dominio y el acceso. Los dealers ya existentes los completan al editarlos.
- Mientras falte alguno, el dealer está **incompleto**: el admin lo marca y `/aviso-de-privacidad` no se publica con huecos.
- **Sin estos datos no se puede guardar un Pixel ni un token.** Así ningún dealer manda datos a Meta sin aviso.
- Son columnas y no `content`, para validarlas y poder consultar qué dealers están incompletos.

**Si el vendedor trabaja para una agencia,** preguntar antes de configurar: ¿vende por su cuenta o a nombre de la
agencia? ¿Tiene su autorización para usar la marca y captar a estos clientes? Si los clientes son de la agencia, la
agencia podría ser la responsable, y eso se lleva al abogado.

## 3. Qué hay que completar

**Por cada dealer:**

| Campo | Ejemplo |
|---|---|
| `{{NOMBRE_COMERCIAL}}` | Autos del Norte |
| `{{RESPONSABLE}}` | Autos del Norte, S.A. de C.V., o Juan Pérez López |
| `{{DOMICILIO}}` | Calle, número, colonia, C.P., ciudad, estado |
| `{{CORREO_PRIVACIDAD}}` | privacidad@autosdelnorte.mx |
| `{{CORREO_DEALER}}` | Correo para avisos de los términos |
| `{{TELEFONO}}` | 81 1234 5678 |
| `{{SITIO}}` | autosdelnorte.mx |
| `{{PLAN_Y_PRECIO}}` | Plan y precio acordados |
| `{{FECHA}}` | Última actualización |

**De Vendra:** `{{RESPONSABLE_VENDRA}}`, `{{DOMICILIO_VENDRA}}`, `{{CORREO_PRIVACIDAD_VENDRA}}`, y los plazos de los
términos: `{{MESES_LIMITE}}`, `{{DIAS_AVISO}}`, `{{DIAS_EXPORTACION}}`, `{{CIUDAD}}`.

## 4. Cambios técnicos para que los textos digan la verdad

**Antes de encender el Pixel de un dealer:**

1. ✅ **Rechazar la medición.** Banner, "Preferencias de cookies" en el pie, y el middleware y las APIs respetan el rechazo.
2. ✅ **Publicar el aviso del dealer.** Página `/aviso-de-privacidad` generada con sus datos, enlace en el pie y en el banner,
   y el aviso simplificado (§ 5 de la plantilla) debajo de cada formulario.
3. ✅ **Datos legales del dealer.** Migración `0020`, campos en el alta del admin y en Ajustes, y la regla de no
   guardar Pixel ni token si faltan.
4. ✅ **Publicar el aviso de Vendra** en `vendra.com.mx/aviso-de-privacidad`, con enlace en su pie de página. Requiere las
   variables `LEGAL_VENDRA_NAME`, `LEGAL_VENDRA_ADDRESS` y `LEGAL_VENDRA_EMAIL`; sin ellas responde 404.
5. ⬜ **Aceptación de términos.** Al inicio, se firma o se acepta por correo y se guarda la evidencia. Después, publicarlos y
   agregar una casilla en el panel con fecha, versión y usuario.
6. ✅ **No prometer lo que no existe.** GA4 se ocultó de Ajustes, del admin y de `views/platform/index.tsx` (ver § 6).

**Los textos publicados están en `views/legal/`.** Si cambia un aviso aquí, hay que cambiarlo también ahí y actualizar
`LEGAL_LAST_UPDATED` en `lib/vendraLegal.ts`. Se publican antes de la revisión del abogado, por decisión del 05/nov/2026; se
ajustan cuando responda.

**Inmediatamente después:**

7. ⬜ **Cancelación (ARCO).** Hasta tener un botón en el admin, Vendra lo hace a mano cuando el dealer lo pida: dejar vacíos
   nombre, teléfono, correo, mensaje, notas, `client_ip`, `client_user_agent` y `fbp`, conservar fechas, estatus y montos, y
   desligarlo de su `visitor_id`. Dejar registrada la solicitud. Revisar también `meta_events` pendientes.
8. ⬜ **Plazos de conservación.** Proceso que anonimice lo vencido. Los plazos se empiezan a vencer a 13 meses para la navegación
   y a 2 años para los leads: hay que tenerlo antes de diciembre de 2027, y conviene mucho antes.

**Estado y ciudad como campos aparte** (para estadísticas por región) se pueden agregar cuando se construya esa analítica.

## 5. Qué tiene que revisar el abogado

**Lo que más importa:**

- **Los términos completos**, en especial responsabilidad por contenido y marcas, límite de responsabilidad, indemnización, encargo de
  datos y si bastan para un dealer persona física.
- **Vendra operando como persona física:** qué riesgo patrimonial implica para el titular, si conviene constituir una sociedad y cuándo,
  y su situación fiscal antes de cobrar.
- **Marcas:** el uso de "Kia" y "certificado" en el dominio y el contenido de un vendedor, y si Vendra corre algún riesgo al alojarlo.
- **Vendedor empleado de una agencia:** quién es el responsable de los datos si capta clientes de esa agencia.
- **Conversions API:** se le manda a Meta que la persona fue contactada, agendó cita o compró, con el monto, y con teléfono, correo, nombre,
  país e identificador interno en hash, más IP, navegador e ids de clic. El código solo lo hace si aceptó las cookies
  (`tracking_consent = accepted`). Confirmar si aceptar el banner basta y si su texto informa lo suficiente, porque no menciona a Meta: ¿debe
  nombrarla? Revisar también si es remisión o transferencia.
- **Monto de la venta:** ¿es un dato patrimonial o financiero? La ley pide consentimiento expreso para esos datos. El código lo guarda siempre que
  el dealer registra la venta, y a Meta solo va con aceptación. El borrador dice que no pedimos datos de tarjetas, cuentas o ingresos, y sí
  menciona el monto.

**También:**

- **La ley vigente y la autoridad.** Los borradores se basan en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares
  publicada en el DOF el 20 de marzo de 2025, y mencionan a la Secretaría Anticorrupción y Buen Gobierno. Confirmar contra el texto oficial,
  incluida su reforma de noviembre de 2025.
- **Aviso debajo de los formularios.** Se publica solo una línea con enlace al aviso completo, para no saturar el formulario. Fuentes secundarias
  indican que la ley de 2025 pide que el aviso simplificado incluya identidad y domicilio del responsable, datos tratados y finalidades. **Confirmar si esta
  línea basta.** Si no, el texto más completo ya estuvo probado: "{{RESPONSABLE}} ("{{NOMBRE_COMERCIAL}}"), con domicilio en {{DOMICILIO}}, usará tu nombre, teléfono,
  correo y mensaje para atender tu solicitud y darle seguimiento. También medimos de dónde llegaste y qué autos viste para mejorar nuestra publicidad y, si lo
  aceptas, se lo informamos a Meta. Puedes rechazarlo en "Preferencias de cookies". Consulta el aviso de privacidad completo."
- **Plazos de respuesta ARCO.** Los borradores dicen "los que establece la ley" a propósito.
- **Medición antes de decidir.** Sin decisión, `vd_vid` y `vd_attr` ya funcionan, con opción de rechazo. ¿Puede quedarse así, o debe pedirse
  consentimiento previo?
- **Si "saber por qué canal nos contactaste" puede ser finalidad primaria.** Hoy, quien rechaza la medición deja un lead sin campaña.
- **Transferencias internacionales:** Supabase en Canadá (`ca-central-1`; confirmar la región de producción), Vercel y Resend en Estados Unidos. Se
  tratan como remisiones a encargados.
- **Estadísticas agregadas:** si anonimizar datos personales para ese fin cabe dentro del encargo.
- **Plazos de conservación** de § 4.

## 6. Google Analytics

**Estado actual:** el dealer puede capturar un ID de GA4 (`ga4_measurement_id`), pero **no se carga en ningún lado**. Por eso el texto publicado del
aviso del dealer no lo menciona; la fila de `_ga` queda comentada en su § 6.

**Prioridad alta después de la liberación**, junto con la indexación: ver [pendientes.md § 0](../pendientes.md).

**Decisión propuesta:**

- **Sitios de dealers:** GA4 opcional y por dealer, con su propia propiedad, igual que el Pixel, y solo si acepta cookies. No entra en el lanzamiento: la
  medición propia ya da vistas, leads y campañas.
- **`vendra.com.mx`:** Vendra puede tener su propio GA4 más adelante. Necesita primero su propio aviso de cookies, porque el actual solo aparece en
  sitios de dealers.
- **No usar un GA4 de Vendra en los sitios de dealers.** Mezclaría datos de sus clientes para fines propios de Vendra y rompería lo que promete como
  encargado.

**Al activarlo por dealer, agregar al aviso del dealer:**

- En § 2 y § 3, "Google" junto a Meta.
- En § 4: "Google recibe información de tu navegación si aceptas, y la trata conforme a su propio aviso".
- En § 6: `_ga`, `_ga_*` | Google | Estadísticas de visitas | Hasta 2 años | Solo se usan si aceptas.

## 7. Copias en Drive

La carpeta "Vendra - Legal" de Google Drive tiene copias de los dos avisos y de los términos, actualizadas al 05/nov/2026 para compartirlas con el abogado.
Si cambia algo aquí, hay que actualizarlas. En Drive, las notas de GA4 aparecen como "PENDIENTE INTERNO, NO PUBLICAR".
