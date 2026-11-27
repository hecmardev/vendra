# Pendientes abiertos

Lo que queda por resolver, ordenado por lo que costaría dejarlo pasar — no por
esfuerzo.

Revisado el 29 de septiembre de 2026 contra el código. Si algo de aquí ya está
hecho, bórralo: un mapa que manda a arreglar cosas resueltas deja de servir.

---

## 0. Prioridad alta: justo después de la liberación

Se trabajan juntos, en cuanto Pablo esté en público.

### Google Analytics (GA4)

Hoy el ID se captura, pero no se carga en ningún lado. Alcance en
[legal/README.md § 6](legal/README.md).

- [ ] Cargar el GA4 de cada dealer en su sitio, con su propia propiedad y solo si acepta cookies.
- [ ] Mostrar de nuevo el campo en Ajustes y en el admin, si se oculta para el lanzamiento.
- [ ] Descomentar `_ga` en `legal/aviso-privacidad-dealer.md` § 6 y ajustar sus § 2, § 3 y § 4.
- [ ] Volver a anunciar GA4 en la página de Vendra (`views/platform/index.tsx`).
- [ ] GA4 propio de `vendra.com.mx`, con su propio aviso de cookies y actualizando su aviso de privacidad.

### Indexación en Google

Tres interruptores, todos apagados por default (`lib/seo.ts`). Un sitio solo se
indexa con el suyo y el general encendidos; `*.vercel.app` nunca:

| Interruptor | Qué abre | Dónde |
|---|---|---|
| `ALLOW_INDEXING` | El general del ambiente (solo producción) | Variable en `vendra-prod` |
| `ALLOW_PLATFORM_INDEXING` | `vendra.com.mx` | Variable en `vendra-prod` |
| `dealers.allow_indexing` (0021) | Cada dealer | Casilla "Google" en el admin |

- [x] `sitemap.xml` por dominio y `robots.txt` apuntando a él.
- [ ] Revisar el contenido real de cada dealer (`contenido-dealer.md`) antes de marcarlo.
- [ ] Agregar `ALLOW_INDEXING=true` en `vendra-prod` y hacer redeploy.
- [ ] Marcar "Permitir que Google indexe este sitio" en el dealer que esté listo.
- [ ] Antes de `ALLOW_PLATFORM_INDEXING`: quitar de la página de Vendra los precios de
      ejemplo, las funciones que no existen y el botón a `hola@vendra.com.mx`.
- [ ] Dar de alta cada dominio en Google Search Console y mandar su sitemap.
- [ ] Revisar títulos y descripciones de inicio, catálogo y fichas.
- [x] El storefront suspendido responde `503` y el dominio sin dealer `404` (§ 4, 0022).

### Antes de liberar al segundo dealer: aceptación e historial de datos legales

**Bloquea el alta del segundo dealer.** Pablo confirma por correo, y esa es la evidencia
mientras sea el único. Con más dealers, el correo deja de escalar y hace falta evidencia
dentro del sistema.

**Aceptación de términos en el panel**

- [ ] Agregar al panel la casilla "Confirmo mis datos y acepto los términos del servicio".
- [ ] Guardar fecha, usuario y versión de los términos.
- [ ] Publicar los términos en `vendra.com.mx`, para que esa versión se pueda consultar.

**Historial de los datos legales del dealer**

Decisión (24/nov/2026): el dealer sigue pudiendo editar sus datos del aviso de privacidad
(es el responsable y debe mantenerlos al día, términos § 5), pero cada cambio queda
registrado y Vendra se entera.

- [ ] Migración con una tabla de historial y un trigger, como `lead_status_history`: quién
      cambió, cuándo, qué decía antes y qué dice ahora (`legal_name`, `legal_address`,
      `privacy_email`, `privacy_phone`).
- [ ] Avisar por correo al admin de Vendra cuando un dealer cambie esos datos.
- [ ] Mostrar el historial en el admin, en la edición del dealer.

---

## 1. Bloquea el negocio hoy

### ~~Los correos de leads no se envían~~ (resuelto el 24/nov/2026)

`vendra.com.mx` está verificado en Resend (registros en Cloudflare, sin recepción) y
`vendra-prod` tiene `RESEND_API_KEY` y `RESEND_FROM = Vendra <leads@vendra.com.mx>`.
Probado con un lead real en el sitio de Pablo: entregado.

**Sigue vigente:** el correo se manda a `content.business.email`, el que el dealer pone
en Ajustes → Negocio. Si ese buzón no existe o nadie lo revisa, el aviso se pierde.

### `ALLOW_INDEXING` sigue apagado en producción

Sin esa variable el sitio sirve `robots.txt` con `Disallow: /` y cabecera
`noindex`. **El sitio del dealer no existe para Google.**

Se dejó así a propósito mientras el contenido era de relleno. El posicionamiento
es parte de lo que se le vendió, así que cada semana apagado es costo.

Ya no basta con la variable: además se marca cada dealer en el admin (0021), y
`vendra.com.mx` tiene su propia variable. Pasos en § 0, "Indexación en Google".

### Supabase y Vercel siguen en plan gratuito

Dos problemas distintos:

- El plan gratuito de Supabase **pausa el proyecto tras una semana sin
  actividad**, y cuando eso pasa todos los storefronts caen a `/not-available`.
- El plan Hobby de Vercel es para proyectos personales, **no comerciales**. Con
  un dealer pagando, eso ya no aplica. La consecuencia no es lentitud: es la
  cuenta pausada y el sitio del cliente caído. También limita los deploys: el
  24/nov/2026 frenó uno por crear funciones demasiado seguido.
- El plan gratuito de Supabase **no tiene respaldos** que se puedan restaurar
  ("Last backup: No backups" en el proyecto de producción). Si algo se borra por
  error, no hay cómo recuperarlo. Pro incluye respaldos diarios.

---

## 2. Promesas que la landing hace y el producto no cumple

### GA4 se guarda pero no se inyecta

El Pixel de Meta ya funciona (0018) y los clics de contacto ya se miden (0017). GA4
sigue sin cargarse y la landing lo anuncia: ver § 0.

---

## 3. Seguridad y aislamiento

### El panel resuelve el dealer por sesión, no por dominio

[getCurrentDealer](../services/dealers.ts) va `usuario → profiles.dealer_id →
dealer` y nunca mira el host. El middleware sí resuelve el tenant del dominio e
inyecta los headers, pero nadie compara los dos.

No es fuga de datos: solo ves el dealer de tu propio perfil. Lo que sí es: **el
dominio y la sesión pueden estar en desacuerdo en silencio**. Entrando por
cualquier dominio administras tu propio inventario, y nada avisa.

Con un operador que maneja varias cuentas, es editar el inventario equivocado sin
darse cuenta. Ya pasó una vez en QA.

Peor: el docstring de
[DashboardAuthMiddleware](../middlewares/DashboardAuthMiddleware.ts) **afirma que
esa comprobación existe**. Documenta una defensa imaginaria, que es la peor clase
de comentario.

El arreglo: comparar el `dealer_id` de la sesión contra el header del tenant y
mandar al login si no coinciden.

### Cualquiera puede listar todos los dealers

Con la `anon key` —pública, va en el navegador de cada visitante— se trae la
tabla `dealers` completa: clientes, dominios, WhatsApp, IDs de Pixel y GA4, y
desde cuándo son clientes.

El problema no es el secreto, es la **enumeración**: un competidor baja tu lista
de clientes y ve a qué ritmo creces.

Existe por una razón legítima: el middleware consulta esa tabla con la anon key
para resolver el tenant en cada request.

- **Lo mínimo:** quitarle a `anon` las columnas que no necesita con `GRANT` por
  columna. Reduce la fuga, no frena la enumeración.
- **Lo correcto:** cerrar la tabla y exponer una función `resolve_dealer(domain)`
  que solo devuelva el id del dominio que se le pregunte.

### Las fotos de un dealer eliminado siguen siendo públicas

La baja lógica marca `car_images` como eliminada, pero **el archivo se queda en
Storage y cualquiera con la URL lo descarga**. Verificado: HTTP 200 sobre la foto
de un dealer dado de baja.

El borrado lógico vive en la base, donde la RLS esconde las filas; el bucket es
público y no consulta la base.

No es obvio que haya que borrarlas de inmediato: si la baja lógica existe para
poder recuperar un dealer, borrar sus fotos lo impediría. Lo razonable es moverlas
a un bucket privado al eliminar y purgarlas tras un periodo de gracia.

---

## 4. Le afecta al dealer o a su cliente

### ~~El storefront suspendido responde 200~~ (resuelto en la 0022)

Un dealer suspendido servía una página que **decía** 404 pero respondía **HTTP 200**,
y Google la tomaba como válida: si un dealer indexado dejaba de pagar, sus fichas se
reemplazaban por "Sitio no disponible" y perdía su posicionamiento.

Ahora el middleware distingue los dos casos con la función `dealer_site_status`
(0022), que solo dice si un dominio es de un dealer suspendido:

- **Dominio no registrado** → `404`.
- **Dealer suspendido** → `503` con `Retry-After`: Google conserva lo indexado.

### El middleware no tolera el `www` de un dealer

Busca el hostname **exacto** en `dealers.domain`. Si un dealer se registra con
`sudominio.com` y un visitante llega a `www.sudominio.com`, se sirve
`/not-available`.

Con el dominio de plataforma no pasa: `isPlatformHost` acepta el base y su `www`.
Para dealers no hay equivalente.

Hoy se compensa configurando el redirect en Vercel, pero eso depende de que quien
dé de alta al dealer se acuerde — y el default de Vercel es justo el contrario.

Desde la atribución de campañas (0015) esto pesa más: aunque el middleware
aceptara las dos versiones, cada una tendría sus propias cookies y un lead que
cambie de una a otra perdería la campaña. Por eso la redirección quedó como paso
obligatorio en `onboarding-vendedores.md` § Conectar el dominio del dealer, y el
arreglo de abajo es una red de seguridad, no un sustituto.

El arreglo natural: reintentar la búsqueda quitando el `www.` cuando la primera
falla.

### El dealer no puede administrar su propia cuenta

Su panel no tiene sección de cuenta: no puede cambiar su correo de acceso ni su
contraseña. El campo *Correo* de Ajustes es el de contacto del negocio, otra cosa.

El admin **sí** puede resetearle la contraseña desde `/admin`
([resetDealerPassword](../services/admin.ts)), así que no hay que entrar a
Supabase. Pero sigue implicando que el dealer llame — y el "olvidé mi contraseña"
tampoco sirve, porque su correo de acceso puede no ser un buzón real.

Con tres dealers se resuelve por WhatsApp. Con quince es soporte que se come el
margen.

Cambiar el **correo de acceso** tampoco se puede desde el panel del admin:
`updateDealerAsAdmin` solo acepta nombre, dominio, WhatsApp, Pixel y GA4.
Agregarlo implica tocar `auth.admin.updateUserById` además del `update` de la
tabla.

---

## 5. Decisiones de producto pendientes

### Reseñas de clientes

Hoy un cliente **no tiene forma de dejar una reseña**. La sección de testimonios
mostraba textos que escribe el dealer, y por default los de la plantilla, que son
inventados. Se apagó para todos (`TESTIMONIALS_ENABLED` en `lib/siteFeatures.ts`):
no sale en el sitio ni en el editor de Contenido.

Para volver a encenderla hace falta que las reseñas sean reales. Opciones:

- **Reseña después de la venta:** al marcar un lead como vendido, mandarle al
  cliente un enlace para calificar; el dealer aprueba antes de publicarla.
- **Traer las de Google:** mostrar las reseñas de su perfil de Google Business.
- **Captura manual con respaldo:** el dealer las escribe, pero solo de clientes
  reales y con su permiso. Es la más fácil de abusar.

### ¿Los vendidos deben salir en el catálogo?

Los apartados ya salen (migración `0008`): se caen seguido y mientras están
visibles juntan interesados.

`vendido` sigue fuera, pero **por decisión, no por candado**. La RLS ya los deja
pasar; los frena `PUBLIC_STATUSES` en [services/cars.ts](../services/cars.ts).
Mostrarlos es prueba social; el costo es frustrar a quien pregunta por algo que
no puede comprar. Cambiarlo es una línea de código y ninguna migración.

### La calculadora usa valores fijos

`FinancingCalc` calcula con enganche, plazos y tasa compartidos en
[helpers/format.ts](../helpers/format.ts). Falta decidir si se configuran **por
dealer** —lo más probable, cada uno negocia distinto con su financiera— o **por
auto**.

Mientras tanto, la mensualidad que se muestra es una estimación genérica que puede
no parecerse a lo que el dealer realmente ofrece.

Si se guarda en `dealers.content` (jsonb) no hace falta migración.

### ~~Falta distinguir nuevo de seminuevo~~ (resuelto en la 0009)

`cars.condition` con `nuevo`, `seminuevo` y `demo`. Se captura en el formulario
del auto, se muestra en la tarjeta y la ficha, y el catálogo filtra por ella
cuando el lote tiene más de una (`?condicion=` en la URL).

Queda abierto: **"certificado"** como marca aparte del seminuevo (no como
condición, para que el filtro de seminuevos no deje fuera a los certificados).

### Importar inventario

Un lote que ya vende tiene sus autos en algún lado: un sistema, una hoja de
cálculo, un portal. Capturar cien unidades a mano es la barrera más grande para
que alguien arranque.

Es pregunta de descubrimiento con cada dealer, pero si la respuesta se repite,
conviene una importación desde hoja de cálculo. Cuando llegue, tendrá que llamar
a `canonical()` de [CarForm](../views/dashboard/inventory/CarForm.tsx) por su
cuenta: los catálogos de marca y carrocería restringen el formulario, no la base.

### Equipamiento por unidad y preguntas frecuentes

Se quitaron de la ficha porque venían de `constants/carDetailMock.ts` y pintaban
lo mismo para todos los autos de todos los dealers: afirmaban cosas falsas sobre
la mercancía.

Para que vuelvan: el equipamiento necesita ser un campo de `cars` con casillas en
el formulario; la FAQ, un texto editable por dealer (cabe en `content`, sin
migración). El catálogo de opciones quedó en ese archivo como referencia.

### Módulos de Ajustes

`seccion_personalizada` e `ia_whatsapp` están comentados en
[settings](../views/dashboard/settings/index.tsx) porque eran interruptores que
no gateaban nada. Solo `financiamiento` gatea de verdad (migración `0006`).
Descomentar cuando la función exista.

---

## 6. Operación y calidad

- **`sitemap.xml` por dealer.** `robots.txt` ya existe y depende de
  `ALLOW_INDEXING`; el sitemap no.
- **Optimización de imágenes**: `next/image` no se usa en ningún archivo, así que
  las fotos se sirven a tamaño completo por `<img>`. Con fichas de varias fotos,
  es lo que más pesa en el móvil de un comprador.
- **Sin pruebas automatizadas.** No hay Vitest, Jest ni Playwright. Lo único que
  valida algo es `ts:check` y el build de Vercel. Las funciones puras ya están
  extraídas y listas para probarse: `matches` y `countActive`
  ([CatalogProvider](../views/catalog/states/CatalogProvider.tsx)), `canonical`
  ([CarForm](../views/dashboard/inventory/CarForm.tsx)), `estimateMonthly`
  ([format](../helpers/format.ts)) y `normalizeDomain`
  ([admin](../services/admin.ts)).

  Lo que ninguna prueba unitaria cubriría es la regresión más cara: que un
  borrador salga al sitio público. Esa regla vive a medias en la RLS y pide una
  verificación contra la base, consultando con la anon key. Convertir en script
  lo que se hizo a mano daría más valor que veinte pruebas de componentes.
- **El contador del inventario miente.** "N autos publicados" es `cars.length` a
  secas ([inventory](../views/dashboard/inventory/index.tsx)), contando
  borradores, vendidos y apartados.
