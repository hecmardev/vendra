# Pendientes abiertos

Lo que salió de la validación de QA (septiembre 2026) y de preparar la propuesta
para dealers. Nada de esto bloquea el ambiente de pruebas; casi todo sí importa
antes de tener un dealer real pagando.

Ordenado por lo que costaría dejarlo pasar, no por esfuerzo.

---

## 1. Le afectan al dealer o a su cliente

### El storefront suspendido responde 200

Un dealer suspendido sirve una página que **dice** 404 pero responde **HTTP 200**.
Para un buscador eso es una página normal y válida, no un error.

El escenario caro: un dealer con sus autos ya indexados deja de pagar, se
suspende, y Google recorre su dominio y reemplaza sus fichas por "Sitio no
disponible". Cuando pague y lo reactives, su posicionamiento ya se perdió.

Lo correcto es distinguir dos casos que hoy se ven igual:

- **Dominio no registrado** → `404`. No existe, que lo olvide.
- **Dealer suspendido** → `503` con `Retry-After`. Está caído temporalmente, que
  conserve lo indexado.

El middleware hoy no puede distinguirlos: `ResolveDealerMiddleware` consulta con
la anon key y la RLS le esconde a los inactivos, así que en ambos casos recibe
`null`.

### Las fotos de un dealer eliminado siguen siendo públicas

La baja lógica marca `car_images` como eliminada, pero **el archivo se queda en
Storage y cualquiera con la URL lo descarga**. Verificado: HTTP 200 sobre la foto
de un dealer dado de baja.

Pasa porque el borrado lógico vive en la base, donde la RLS esconde las filas,
mientras que el bucket es público y no consulta la base: sirve el archivo a quien
lo pida.

Dos consecuencias: un dealer que se va deja sus fotos accesibles para siempre, y
los archivos se acumulan contra la cuota (1 GB en el plan gratuito).

No es obvio que haya que borrarlas de inmediato: si la baja lógica existe para
poder recuperar un dealer, borrar sus fotos lo impediría. Lo razonable es
moverlas a un bucket privado al eliminar y purgarlas tras un periodo de gracia.

### Cualquiera puede listar todos los dealers

Con la `anon key` —que es pública, va en el navegador de cada visitante— se puede
traer la tabla `dealers` completa: todos los clientes, sus dominios, sus
WhatsApp, sus IDs de Pixel y GA4, y desde cuándo son clientes.

No es información secreta en sí; el problema es la **enumeración**. Un competidor
puede bajar la lista de clientes de Vendra y ver cuántos son y a qué ritmo crecen.

Existe por una razón legítima: el middleware consulta esa tabla con la anon key
para resolver el tenant en cada request.

- **Lo mínimo:** quitarle a `anon` las columnas que no necesita
  (`meta_pixel_id`, `ga4_measurement_id`, `created_at`, `record_status`) con
  `GRANT` por columna. Reduce la fuga, no frena la enumeración.
- **Lo correcto:** cerrar la tabla y exponer una función `resolve_dealer(domain)`
  que solo devuelva el id del dominio que se le pregunte. Implica cambiar cómo el
  storefront lee su propio dealer.

---

## 2. Promesas que la landing ya hace y el producto no cumple

La página de precios lista estas características del plan. Si se le venden a un
dealer que paga, quedan a deber.

### El branding por dealer no se aplica

`app/layout.tsx` tiene el `TODO`: leer el tenant e inyectar un `<style>` con las
variables CSS de `dealers.branding`. Hoy todos los storefronts se ven igual.

Es el más delicado porque **"tu marca, tu sitio" es literalmente lo que vende la
propuesta**. El nombre del dealer ya sale en el encabezado y el pie; faltan
colores y logo.

### Meta Pixel y GA4 se guardan pero no se inyectan

Las columnas existen y el dealer las captura en Ajustes, pero nada las escribe en
el sitio. El plan es un contenedor de GTM compartido que dispare el Pixel y GA4
correctos según el dealer resuelto.

### Dos de los tres módulos no existen

`seccion_personalizada` e `ia_whatsapp` son interruptores que no gatean nada,
porque la función no está construida. Solo `financiamiento` gatea de verdad
(migración `0006`).

---

## 3. Decisiones de producto pendientes

Salieron de preparar la propuesta. No son errores: son cosas que nadie ha
decidido y que conviene resolver antes de onboardear.

### ¿Un auto apartado debe seguir en el catálogo?

Hoy **no aparece**: la política pública de RLS solo expone los `disponible`.

Vale la pena reconsiderarlo. Un apartado visible, marcado como tal, genera
interesados para cuando el apartado se caiga —cosa que pasa seguido— y hace ver
el lote con más movimiento. El riesgo es frustrar a quien pregunta por algo que
no puede comprar.

Lo mismo aplica a `vendido`: mostrarlo como vendido es prueba social.

### Marcas y tipos de carrocería son texto libre

`cars.brand` y `cars.body_type` son columnas de texto sin catálogo. Dos capturas
pueden escribir "VW" y "Volkswagen", o "Pick up" y "Pickup", y los filtros del
catálogo los tratan como valores distintos.

Con seis autos no se nota. Con doscientos, los filtros dejan de servir.

### Falta distinguir nuevo de seminuevo

No existe el campo. Si un lote maneja ambos, hoy no puede separarlos ni en la
ficha ni en los filtros.

### La calculadora usa valores fijos

`FinancingCalc` calcula con plazos y tasa quemados en el componente. Falta
decidir si el enganche, los plazos y la tasa se configuran **por dealer** (lo más
probable, cada uno negocia distinto con su financiera) o **por auto**.

Mientras tanto, la mensualidad que se muestra es una estimación genérica que
puede no parecerse a lo que el dealer realmente ofrece.

### Importar inventario

Un lote que ya vende tiene sus autos en algún lado: un sistema, una hoja de
cálculo, un portal. Capturar cien unidades a mano es la barrera más grande para
que alguien arranque.

Es pregunta de descubrimiento con cada dealer, pero si la respuesta se repite,
conviene una importación desde hoja de cálculo.

### Equipamiento por unidad y preguntas frecuentes

Ambos se quitaron de la ficha porque venían de `constants/carDetailMock.ts` y
pintaban lo mismo para todos los autos de todos los dealers: afirmaban cosas
falsas sobre la mercancía.

Para que vuelvan: el equipamiento necesita ser un campo de `cars` con casillas en
el formulario de autos; la FAQ, un texto editable por dealer. El catálogo de
opciones quedó en ese mismo archivo como referencia.

---

### El correo de acceso de un dealer no se puede cambiar desde el panel

`updateDealerAsAdmin` solo acepta nombre, dominio, WhatsApp, Pixel y GA4. El
campo *Correo* del formulario existe únicamente en el alta, porque es el usuario
de Supabase Auth.

Cambiarlo después obliga a entrar al dashboard de Supabase → Authentication →
Users. Es un campo, pero rompe la promesa de que el admin se opera desde el
panel — y se necesita cada vez que un dealer arranca con un correo provisional
o cambia el suyo.

Agregarlo al formulario de edición implica tocar `auth.admin.updateUserById`
además del `update` de la tabla.

### El middleware no tolera el `www` de un dealer

`ResolveDealerMiddleware` busca el hostname **exacto** en `dealers.domain`. Si un
dealer se registra con `sudominio.com` y un visitante llega a
`www.sudominio.com`, no hay coincidencia y se sirve `/not-available`.

Con el dominio de plataforma no pasa: `isPlatformHost` acepta el base y su
`www`. Para dealers no hay equivalente.

Hoy se compensa configurando en Vercel que el `www` redirija a la raíz, pero eso
depende de que quien dé de alta al dealer se acuerde — y el default de Vercel es
justo el contrario: redirige la raíz al `www`.

El arreglo natural es intentar la búsqueda quitando el `www.` cuando la primera
falla. Así el dealer queda protegido aunque el DNS esté configurado al revés.

## 4. Operación

- **El dealer no puede administrar su propia cuenta.** Su panel no tiene sección
  de cuenta: no puede cambiar su correo de acceso ni su contraseña. El campo
  *Correo* de Ajustes es el de contacto del negocio, otra cosa.

  Consecuencia: un dealer que olvide su contraseña **tiene que llamar**. Y el
  "olvidé mi contraseña" tampoco sirve, porque el correo de acceso puede no ser
  un buzón real — al primer dealer se le dio uno `@vendra.com.mx`.

  Con tres dealers se resuelve por WhatsApp. Con quince es soporte que se come
  el margen.
- **`sitemap.xml`** por dealer. `robots.txt` ya existe y depende de
  `ALLOW_INDEXING`; el sitemap no.
- **Optimización de imágenes**: `next/image` no se usa en ningún archivo del
  proyecto, así que las fotos se sirven a tamaño completo por `<img>`.
- **Supabase y Vercel de paga** antes del primer dealer real: el plan gratuito de
  Supabase pausa el proyecto tras una semana sin actividad, y cuando eso pasa
  **todos los storefronts caen a `/not-available`**.
