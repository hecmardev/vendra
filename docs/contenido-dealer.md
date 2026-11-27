# Contenido del sitio de un dealer

Qué secciones tiene el sitio de cada dealer, dónde se editan en su panel y qué hay
que revisar antes de publicarlo o de abrirlo a Google. Lo edita **el propio dealer**;
Vendra solo lo acompaña la primera vez.

> **Regla:** al crear un dealer, su sitio sale con **textos de ejemplo de la
> plantilla**. Algunos parecen datos reales ("+500 autos entregados", "10 años de
> experiencia", fechas de una historia). **Todo lo que no sea cierto de ese dealer se
> cambia o se quita antes de publicar.** Lo que publica es su responsabilidad
> (términos del servicio, § 3), y anunciar datos falsos puede traerle problemas con
> PROFECO.

Su panel está en `su-dominio/dashboard`. Las secciones del menú son **Inicio**,
**Autos**, **Leads**, **Contenido** y **Ajustes**.

---

## 1. Datos del negocio y aviso de privacidad

**Ajustes** (pestañas):

| Pestaña | Qué se captura | Dónde se ve | Revisar |
|---|---|---|---|
| **Negocio** | Nombre, WhatsApp, teléfono, correo, dirección, horario | Encabezado, pie de página, Contacto, botón de WhatsApp. **El correo recibe los avisos de leads** | Que sean suyos, no de la agencia ni los de ejemplo. Un correo que sí revise |
| **Aviso de privacidad** | Nombre completo o razón social, domicilio, correo y teléfono de privacidad | `/aviso-de-privacidad` y debajo de los formularios | Datos reales: él responde por ellos. Sin ellos no se publica el aviso ni carga el Pixel |
| **Meta** | Pixel, verificación de dominio, token | No se ve; mide anuncios | Solo cuando haya campañas: ver `configurar-meta-dealer.md` |
| **Módulos** | Calculadora de financiamiento, etc. | Fichas de autos | Encender solo lo que use |
| **Tema** | Colores y bordes | Todo el sitio | Que se lea bien |

## 2. Textos e imágenes del sitio

**Contenido** (pestañas). Un solo **Guardar cambios** guarda todas las pestañas a la vez.

### Marca

| Campo | Dónde se ve | Default de la plantilla | Revisar |
|---|---|---|---|
| Descripción para buscadores | Google y al compartir el enlace | "Autos seminuevos verificados…" | **Que describa lo que vende de verdad.** Si no "verifica" ni "certifica" sus autos, quitarlo |
| Descripción (footer) | Pie de página | Igual | Igual |
| Imagen de cabecera | Fondo de Autos y Contacto | Vacía | Opcional: foto propia |

### Inicio

| Campo | Dónde se ve | Default | Revisar |
|---|---|---|---|
| Etiqueta, título y subtítulo del hero | Portada | "Seminuevos verificados", "Encuentra tu próximo auto" | Que la etiqueta sea cierta (nuevos, seminuevos…) |
| Imagen del hero | Fondo de la portada | **Foto de archivo** (Unsplash) | Mejor una foto propia |
| Títulos de secciones | Portada | "Explora por tipo", "Destacados", "Cómo funciona" | Genéricos, se pueden dejar |
| Pasos de "Cómo funciona" | Portada | Explora / Contacta / Estrena | Genéricos, se pueden dejar. Si se borran todos, la sección no se muestra |

### Nosotros (`/acerca-de`) — **la más importante de revisar**

| Campo | Default de la plantilla | ¿Es dato inventado? | Qué hacer |
|---|---|---|---|
| Etiqueta, título, subtítulo | "Somos un equipo… cada unidad pasa por una revisión rigurosa" | **Sí** (promete revisión) | Reescribir con lo que él hace |
| Imagen del hero | Foto de archivo | — | Foto propia o quitarla |
| **Estadísticas** | +500 autos, 10 años, 4.8, +480 clientes | **Sí** | Poner solo números que pueda sostener, o **borrarlas todas** (la sección desaparece) |
| Historia (etiqueta, título, foto, párrafos) | "Empezamos con una idea simple… cientos de familias" | **Sí** | Su historia real en 2 o 3 párrafos |
| **Compromisos** | Revisión de 150 puntos, historial verificado, prueba de manejo, factura en regla | **Sí** | Solo lo que de verdad ofrece |
| **Trayectoria (hitos)** | 2015 nace el negocio, 2018 local propio, 2021, 2024 | **Sí** | Sus fechas reales, o **borrarlos todos** (la sección desaparece) |
| **Valores** ("Por qué elegirnos") | Confianza, trato directo, transparencia, rapidez | Parcial ("cada auto pasa por una revisión") | Ajustar a lo que es cierto |
| CTA final | "¿Listo para encontrar tu auto?" | No | Se puede dejar |
| ~~Testimonios~~ | Reseñas de "Ana R.", "Carlos M.", "Laura T." | **Sí** | **Apagados para todos** hasta tener reseñas reales (ver `pendientes.md`) |

### Contacto

| Campo | Default | Revisar |
|---|---|---|
| Título, subtítulo, título del formulario | "Contacto", "Estamos para ayudarte" | Genéricos, se pueden dejar |
| Imagen de cabecera | Vacía (usa la de Marca) | Opcional |

**Restablecer** en Contenido regresa todos los textos a los de la plantilla,
**incluidos los inventados** de Nosotros. Si se usa, hay que volver a revisar esa
pestaña antes de guardar.

## 3. Inventario

**Autos** (`/dashboard/inventario`):

- [ ] Cada auto con **fotos propias**, no de catálogo de la marca ni de internet.
- [ ] Precio, año, kilometraje y condición (nuevo, seminuevo, demo) correctos.
- [ ] Marcar como **vendido** lo que ya no esté; un auto vendido publicado genera leads
      que no se pueden atender.

## 4. Lo que el dealer no edita (es de la plataforma)

- Nombres de botones y campos de los formularios.
- Categorías del inicio (SUV, Sedán, Pickup, Hatchback).
- Aviso de cookies y texto bajo los formularios.
- Íconos de las secciones.

---

## Checklist para cada dealer nuevo

Antes de publicarlo o de encender la indexación en Google:

- [ ] **Ajustes → Negocio:** datos de contacto suyos; el correo es uno que revisa.
- [ ] **Ajustes → Aviso de privacidad:** completo; `/aviso-de-privacidad` abre bien.
- [ ] **Contenido → Marca:** descripción real (sin "verificados" si no aplica).
- [ ] **Contenido → Inicio:** etiqueta del hero real; foto propia si la tiene.
- [ ] **Contenido → Nosotros:** sin estadísticas, historia, compromisos ni hitos
      inventados.
- [ ] **Autos:** fotos propias, precios y estatus al día.
- [ ] **Marcas:** si usa el nombre de una marca (por ejemplo, en su dominio), tiene
      autorización.
- [ ] **Revisión final:** recorrer el sitio como cliente (Inicio, Autos, una ficha,
      Nosotros, Contacto) en computadora y celular.
- [ ] **Google:** en el admin, al editar al dealer, marcar **"Permitir que Google
      indexe este sitio"**. Todo dealer nuevo empieza sin indexar. Después, darlo de alta
      en Google Search Console y mandar su sitemap (`su-dominio/sitemap.xml`).

## Fichas

| Dealer | Negocio | Aviso | Marca | Inicio | Nosotros | Autos | Revisión final | Google | Fecha |
|---|---|---|---|---|---|---|---|---|---|
| Pablo Quintanilla | ✅ | ✅ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
