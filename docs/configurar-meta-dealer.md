# Configurar Meta para un dealer

Guía para conectar a un dealer con Meta: su Pixel, su dominio y el reporte de
leads, citas y ventas. Se repite con cada dealer nuevo, y el avance de cada uno se
anota en las fichas al final de este documento.

**Resultado esperado:**

- Su sitio manda a **su** Pixel las visitas, las fichas vistas y los leads.
- El panel le reporta a Meta cuando un lead pasa a contactado, cita o vendido.
- Quien maneje sus campañas (Vendra u otra agencia) usa esos datos sin ser dueño
  de ellos.

> Los nombres de los menús de Meta cambian seguido ("Pixel" ahora es "conjunto de
> datos"). Si un menú no coincide, busca el equivalente y actualiza esta guía.

---

## Reglas que no cambian

1. **Todo es del dealer.** El portafolio, la página, la cuenta publicitaria y el
   conjunto de datos se crean a su nombre. Vendra o la agencia solo reciben acceso
   de socio, y si se van, el dealer conserva todo su historial.
2. **Un conjunto de datos por dealer.** Nunca se reutiliza entre dealers: se
   mezclarían sus audiencias y su medición.
3. **El token no se manda por chat ni por correo.** Se captura directo en el panel.
   Si se llegó a compartir, se revoca y se genera otro.
4. **En producción, el código de eventos de prueba se queda vacío.** Solo se pone
   durante la prueba del paso 8.
5. **Sin aviso de privacidad publicado no se lanzan campañas** (ver requisitos).

---

## Quién hace qué

| Paso | Quién | Dónde |
|---|---|---|
| 1. Revisar requisitos | Vendra | Panel y sitio |
| 2. Crear portafolio, página y cuenta publicitaria | Dealer | Meta |
| 3. Crear el conjunto de datos | Dealer o socio con permiso | Meta |
| 4. Dar acceso de socio | Dealer | Meta |
| 5. Verificar el dominio | Dealer o socio con permiso | Meta + panel |
| 6. Generar el token | Administrador del portafolio del dealer | Meta |
| 7. Capturar los datos | Dealer, agencia o admin de Vendra | Panel |
| 8. Probar | Quien configura | Sitio + Meta |
| 9. Dejarlo listo para campañas | Quien configura | Panel + Meta |

El dealer captura en `su-dominio/dashboard/ajustes`, sección **Meta**. Vendra captura
en `/admin`, editando al dealer. Los dos ven y cambian los mismos datos.

---

## Paso 1. Requisitos

- [ ] El dealer está activo y tiene autos publicados.
- [ ] Su dominio está conectado y `www` redirige con `308`, conservando parámetros
      (ver [onboarding-vendedores.md](onboarding-vendedores.md#conectar-el-dominio-del-dealer)).
      Sin esto, los leads pierden la campaña que los trajo.
- [ ] La migración `0019` está aplicada y `CRON_SECRET` está en Vercel.
- [ ] **Aviso de privacidad publicado y enlazado en su sitio**, con el Pixel y la
      Conversions API incluidos. Los borradores están en [legal/](legal/README.md).
- [ ] El aviso de cookies aparece en su sitio y se puede aceptar o rechazar.

---

## Paso 2. Portafolio, página y cuenta publicitaria

El dealer entra a [business.facebook.com](https://business.facebook.com) con **su
propia** cuenta de Facebook.

- [ ] Crea su **portafolio comercial**, o usa el que ya tenga.
- [ ] Agrega o crea su **página de Facebook** (e Instagram, si aplica).
- [ ] Crea su **cuenta publicitaria**, con moneda MXN y zona horaria de México. Estos
      dos datos son difíciles de cambiar después.
- [ ] Agrega **su método de pago**. El gasto en anuncios le cobra directo a él.
- [ ] Deja a una segunda persona de confianza como administradora, para no perder el
      acceso si falla su cuenta.

---

## Paso 3. Conjunto de datos (Pixel)

- [ ] **Administrador de eventos → Conectar orígenes de datos → Web**.
- [ ] Nombre sugerido: `<Dealer> - Sitio`.
- [ ] Si Meta ofrece instalar con un socio o pegar código, **ciérralo**: Vendra ya
      instala el Pixel.
- [ ] Copia el **identificador**, que son solo números. Este dato no es secreto.

Si el dealer ya tiene un Pixel con historial, se usa ese en vez de crear otro.

---

## Paso 4. Acceso de socio

Lo da el dealer, en **Configuración del negocio**, con el identificador del
portafolio de quien maneja las campañas. El de Vendra está en su **Configuración del
negocio → Información del negocio**.

- [ ] **Conjunto de datos:** Orígenes de datos → Conjuntos de datos → **Asignar socio**.
- [ ] **Cuenta publicitaria:** Cuentas → Cuentas publicitarias → **Asignar socio**.
- [ ] **Página:** Cuentas → Páginas → **Asignar socio**.
- [ ] Con el nivel de acceso que haga falta para operar las campañas.
- [ ] Quien recibe acepta la solicitud y asigna personas de su equipo a esos activos.

**Para quitar a un socio** se usa la misma pantalla. No borra nada del dealer.

---

## Paso 5. Verificar el dominio

Es opcional para medir, pero se recomienda antes de anunciarse: acredita que el
dominio es del dealer.

- [ ] **Configuración del negocio → Seguridad de la marca → Dominios → Agregar**.
      Se captura el dominio raíz, sin `www`.
- [ ] Elige **Etiqueta meta** y copia la etiqueta completa.
- [ ] Pégala en **Verificación del dominio**, en el panel, y guarda. Vendra la publica
      sola en su sitio.
- [ ] Regresa a Meta y dale **Verificar**. Puede tardar hasta 72 horas.

**Si la raíz del dominio redirige a `www`** y Meta no encuentra la etiqueta, usa la
opción de registro DNS TXT en el proveedor del dominio. Esa vía no usa el panel.

---

## Paso 6. Token de Conversions API

- [ ] **Administrador de eventos → el conjunto de datos → Configuración → API de
      conversiones → Generar token de acceso**.
- [ ] Hazlo **al mismo tiempo que el paso 7**: Meta muestra el token una sola vez.
- [ ] Si un socio no ve la opción, que lo genere un administrador del portafolio del
      dealer y lo capture él mismo en sus Ajustes.

Por eso los Ajustes del dealer tienen este campo: el token nunca tiene que pasar por
otra persona.

---

## Paso 7. Capturar en el panel

Los datos se capturan en la sección **Meta**:

| Campo | Valor |
|---|---|
| Pixel | El identificador del paso 3 |
| Verificación del dominio | La etiqueta del paso 5 |
| Token de Conversions API | El token del paso 6 |
| Código de eventos de prueba | Vacío por ahora |

Al guardar y recargar, el token debe decir **"Token configurado ✓"** y el campo se ve
vacío. Es normal: nunca se vuelve a mostrar.

**Un Pixel nuevo necesita su propio token.** Si cambias el Pixel y dejas el token
anterior, los reportes pueden fallar.

---

## Paso 8. Probar

Usa una prueba con el código puesto para no mezclar datos de prueba con los reales.

1. En **Administrador de eventos → Probar eventos**, copia el código `TEST…`, pégalo en
   **Código de eventos de prueba** y guarda.
2. En esa misma pantalla, escribe el sitio del dealer y dale **Abrir sitio web**. En
   incógnito los eventos pueden no aparecer ahí.
3. Acepta las cookies. Si no sale el aviso, abre una ficha y espera unos segundos.
4. Navega por varias páginas y abre una ficha.
5. Envía el formulario de una ficha con el nombre `Prueba Meta`.

**Debes ver:**

| Evento | Esperado |
|---|---|
| PageView | Uno por página, desde que aceptaste |
| Ver contenido | Uno por ficha |
| Cliente potencial | Navegador "Procesados" y servidor "Deduplicados", con el mismo identificador |
| `SubscribedButtonClick` | No debe aparecer |

6. En el panel, abre el lead `Prueba Meta`. El Historial debe decir "Reportado a Meta ✓".
7. Márcalo como **perdido**, para que no cuente como cliente. No lo pases a contactado,
   cita o vendido: esos eventos se reportan una sola vez por lead y aquí serían de prueba.

Contactado, cita y venta **no aparecen en Probar eventos**. Se revisan en **Información
general**, con el filtro en Hoy o 7 días, y pueden tardar en reflejarse.

---

## Paso 9. Listo para campañas

- [ ] **Borra el código de prueba** y guarda. Con él puesto, los eventos del servidor
      no deben usarse para medir campañas.
- [ ] Confírmalo en `/admin`: el campo debe estar vacío.
- [ ] Usa estos parámetros de URL en los anuncios:

```
utm_source=meta&utm_medium=paid_social&utm_campaign=<condición>_<objetivo>_<aaaamm>&utm_content={{ad.id}}&utm_term={{adset.id}}
```

- [ ] Después del primer lead real, revisa en el panel que traiga **Origen** con su
      campaña y "Reportado a Meta ✓" (si aceptó cookies).
- [ ] Llena la ficha del dealer, al final de este documento.

---

## Qué esperar

- **Sin aceptar cookies no se reporta nada a Meta.** El lead sí llega al panel, pero sin
  datos de campaña en Meta. Es correcto, no es una falla.
- **Lo ocurrido antes de capturar el token no se reporta después.** Un lead anterior
  que aceptó cookies no manda su "Cliente potencial", pero sus cambios de estatus
  posteriores sí se reportan.
- **Cada evento sale una vez por lead.** Regresar de estatus y volver no lo reenvía.
- **Si un envío falla**, se reintenta con el cron diario hasta 5 veces. Después de 7 días
  ya no se manda, porque Meta no lo acepta.

---

## Problemas comunes

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| No sale ningún evento | No aceptó cookies, o falta el Pixel | Acepta cookies y revisa el Pixel en el panel |
| Se ve en el sitio, pero no en Probar eventos | Se abrió en incógnito u otra ventana | Abrir con **Abrir sitio web** |
| "No se pudo reportar a Meta" | Token inválido, revocado o de otro Pixel | Generar otro token y capturarlo |
| Un renglón del historial no muestra marca de Meta | Sin aceptar cookies, o el evento ocurrió antes de tener token | Normal; revisar con un lead nuevo |
| Contadores bajos en Información general | Retraso de Meta o filtro de fechas | Filtrar por Hoy o 7 días y dar tiempo |
| Meta no verifica el dominio | Etiqueta sin guardar, redirección o tiempo de espera | Revisar, usar DNS TXT, esperar hasta 72 horas |

---

## Cambios posteriores

**Cambiar de agencia o dejar de trabajar con Vendra**

1. El dealer quita al socio anterior del conjunto de datos, la cuenta y la página.
2. Da acceso al nuevo socio, como en el paso 4.
3. Genera un token nuevo, lo captura y revoca el anterior.

El Pixel y su historial no cambian.

**Cambiar el token:** se escribe uno nuevo en el mismo campo y se guarda.

**Dejar de reportar:** marca **Quitar el token** y guarda. Dejan de salir los eventos
del servidor. Para apagar también los del navegador, borra el Pixel.

---

## Decisiones pendientes

- **Coincidencia avanzada automática** (Configuración del conjunto de datos). Aún no se
  decide. Déjala apagada hasta revisarla junto con el aviso de privacidad.
- **Permisos del socio para generar el token.** Se confirma con el primer dealer real.
  Si el socio sí puede generarlo, actualiza el paso 6.

---

## Fichas de dealers

Registra solo datos no secretos. **Nunca el token.**

| Dealer | Dominio | Portafolio | Pixel | Socio | Dominio verificado | Token | Prueba | Código vacío | Fecha |
|---|---|---|---|---|---|---|---|---|---|
| Pablo Quintanilla | `asesorkiacertificadopabloquintanilla.com.mx` | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
