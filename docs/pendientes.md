# Pendientes abiertos

Lo que queda por resolver, ordenado por lo que costaría dejarlo pasar — no por
esfuerzo.

Revisado el 29 de septiembre de 2026 contra el código. Si algo de aquí ya está
hecho, bórralo: un mapa que manda a arreglar cosas resueltas deja de servir.

---

## 1. Bloquea el negocio hoy

### Los correos de leads no se envían

El código está completo: [services/notifications.ts](../services/notifications.ts) arma el correo y
[route.ts](../app/api/leads/route.ts) lo dispara a prueba de fallos. Falta solo
la configuración.

```
if (!key) { console.warn('[notify] RESEND_API_KEY ausente: se omite el email del lead.') }
```

Cada lead entra a la base y **nadie le avisa al dealer**. Solo los ve si entra a
su panel. Para un lote, un lead sin ver un día es una venta perdida — y desde
que el botón de WhatsApp captura datos, el volumen subió.

Lo que falta: cuenta de Resend, dominio verificado, `RESEND_API_KEY` y
`RESEND_FROM` en Vercel.

**Ojo con la dependencia:** el correo se manda a `content.business.email`, el que
el dealer pone en Ajustes. Si ese buzón está en su propio dominio y el MX apunta
a Vercel, el correo se va al vacío y el código ni se entera.

### `ALLOW_INDEXING` sigue apagado en producción

Sin esa variable el sitio sirve `robots.txt` con `Disallow: /` y cabecera
`noindex`. **El sitio del dealer no existe para Google.**

Se dejó así a propósito mientras el contenido era de relleno. El posicionamiento
es parte de lo que se le vendió, así que cada semana apagado es costo.

Es una variable y un redeploy — las variables solo toman efecto en un build nuevo.

### Supabase y Vercel siguen en plan gratuito

Dos problemas distintos:

- El plan gratuito de Supabase **pausa el proyecto tras una semana sin
  actividad**, y cuando eso pasa todos los storefronts caen a `/not-available`.
- El plan Hobby de Vercel es para proyectos personales, **no comerciales**. Con
  un dealer pagando, eso ya no aplica. La consecuencia no es lentitud: es la
  cuenta pausada y el sitio del cliente caído.

---

## 2. Promesas que la landing hace y el producto no cumple

### Meta Pixel y GA4 se guardan pero no se inyectan

Las columnas existen y el dealer las captura en Ajustes, pero nada las escribe en
el sitio. El `TODO` vive en [app/layout.tsx](../app/layout.tsx).

El plan es un contenedor de GTM compartido que dispare el Pixel y GA4 correctos
según el dealer resuelto.

Además es la herramienta correcta para medir **cuántos contactan por WhatsApp**
sin cobrar el peaje de un formulario: hoy el botón flotante y el del footer van
directo al chat y no dejan rastro. Medir con analítica, capturar con formulario.

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

### El storefront suspendido responde 200

Un dealer suspendido sirve una página que **dice** 404 pero responde **HTTP 200**.
Para un buscador eso es una página normal y válida.

El escenario caro: un dealer con sus autos indexados deja de pagar, se suspende,
y Google reemplaza sus fichas por "Sitio no disponible". Cuando pague y lo
reactives, su posicionamiento ya se perdió.

Hay que distinguir dos casos que hoy se ven igual:

- **Dominio no registrado** → `404`. No existe.
- **Dealer suspendido** → `503` con `Retry-After`. Está caído temporalmente.

El middleware no puede distinguirlos: consulta con la anon key y la RLS le
esconde a los inactivos, así que en ambos casos recibe `null`.

### El middleware no tolera el `www` de un dealer

Busca el hostname **exacto** en `dealers.domain`. Si un dealer se registra con
`sudominio.com` y un visitante llega a `www.sudominio.com`, se sirve
`/not-available`.

Con el dominio de plataforma no pasa: `isPlatformHost` acepta el base y su `www`.
Para dealers no hay equivalente.

Hoy se compensa configurando el redirect en Vercel, pero eso depende de que quien
dé de alta al dealer se acuerde — y el default de Vercel es justo el contrario.

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

### Falta distinguir nuevo de seminuevo

No existe el campo. Si un lote maneja ambos, hoy no puede separarlos ni en la
ficha ni en los filtros.

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
