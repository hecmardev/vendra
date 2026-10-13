# Analítica del dealer (mapa para una futura sección del panel)

Qué se puede medir con los datos que ya se guardan, cómo calcularlo, con qué
cuidados, y qué falta para completarlo. No es una sección construida: es el mapa
para cuando se abra **Analítica** en `/dashboard`.

Iniciado el 13/oct/2026. Actualizarlo cada vez que se agregue una fuente de
datos o se decida una métrica.

Relacionado: `docs/plan-medicion-campanas.md` (de dónde salen estos datos y las
fases que faltan).

---

## 1. De dónde salen los datos

| Tabla | Qué guarda | Desde cuándo hay datos | Migración |
|---|---|---|---|
| `leads` | Cada contacto: auto de interés (`car_id`), formulario (`source`), estatus, auto vendido y monto, visitante y visitas de origen | Siempre; el origen desde el 09/oct/2026 | 0001, 0010, 0013, 0015 |
| `lead_status_history` | Cada cambio de estatus del lead, con quién y cuándo | 09/oct/2026 (ver § 4, línea base) | 0011 |
| `cars` | Inventario: condición, precio, estatus | Siempre; condición desde el 09/oct/2026 | 0001, 0009 |
| `car_status_history` | Cada cambio de estatus o precio de un auto | 09/oct/2026 (ver § 4, línea base) | 0014 |
| `attribution_touches` | Visitas con origen: campaña, anuncio, buscador, sitio que refirió, página de entrada | 09/oct/2026 | 0015 |
| `car_views` | Vistas de fichas: un renglón por auto + visitante + día de México, con número de vistas y visita de origen | 13/oct/2026 en QA; producción al aplicar la 0016 | 0016 |

Cómo se unen:

```
attribution_touches ──┬── leads.first_touch_id / leads.last_touch_id
                      └── car_views.touch_id
leads.visitor_id ═══════ car_views.visitor_id ═══ attribution_touches.visitor_id
leads.car_id / leads.sold_car_id ── cars.id ── car_views.car_id
leads.id ── lead_status_history.lead_id
cars.id  ── car_status_history.car_id
```

`visitor_id` es el id anónimo del navegador (cookie `vd_vid`). Es lo que une las
vistas de una persona con su lead.

---

## 2. Definiciones

Decidirlas una vez y no cambiarlas: si cada pantalla cuenta distinto, nadie
confía en los números.

| Término | Definición |
|---|---|
| **Día** | Día calendario de México (`America/Mexico_City`), no UTC. `car_views.viewed_on` ya viene así. |
| **Visitante** | Un `visitor_id`. Es un navegador, no una persona: el mismo cliente en el celular y en la computadora son dos. |
| **Visitante único de un auto** | Visitantes distintos que abrieron su ficha en el periodo. |
| **Vista** | Una apertura de ficha. Recargar suma; el botón "Atrás" a veces no (el navegador no vuelve a ejecutar la página). |
| **Lead** | Un renglón activo de `leads` (`is_active`). Una persona que pregunta por dos autos son dos leads con el mismo `visitor_id`. |
| **Origen de un lead** | Su **último toque** (`last_touch_id`): la última visita con origen antes de escribir. El primer toque (`first_touch_id`) se muestra aparte. |
| **Venta** | Lead con `status = 'vendido'`. El monto es `sale_amount`; la fecha, su paso a `vendido` en `lead_status_history`. |
| **Ventana de atribución** | 90 días (vida de la cookie `vd_attr`). Distinta de la de Meta (por default 7 días desde el clic): los números de nuestro panel y los de Meta no tienen por qué coincidir. |

---

## 3. Métricas

Las consultas usan `:dealer`, `:desde` y `:hasta` como parámetros. Todas filtran
por `dealer_id`; en el panel correrían con la sesión del dealer y la RLS ya lo
limita a lo suyo.

Estado: ✅ ya hay datos para calcularla · ⚠️ se puede, con salvedades · ❌ falta
la fuente.

### A. Inventario

**A1. Visitantes y vistas por auto** ✅
¿Qué autos atraen más interés?

```sql
select c.id, c.brand || ' ' || c.model || ' ' || c.year as auto,
       count(distinct v.visitor_id) as visitantes,
       sum(v.views) as vistas
from car_views v
join cars c on c.id = v.car_id
where v.dealer_id = :dealer and v.viewed_on between :desde and :hasta
group by c.id, auto
order by visitantes desc;
```

**A2. Autos con interés y sin leads** ✅
Los que la gente ve pero nadie pregunta: precio, fotos o descripción por revisar.

```sql
with vistas as (
  select car_id, count(distinct visitor_id) as visitantes
  from car_views
  where dealer_id = :dealer and viewed_on between :desde and :hasta
  group by car_id
), consultas as (
  select car_id, count(*) as leads
  from leads
  where dealer_id = :dealer and is_active and car_id is not null
    and created_at >= :desde and created_at < :hasta + 1
  group by car_id
)
select c.brand || ' ' || c.model || ' ' || c.year as auto, v.visitantes, coalesce(q.leads, 0) as leads
from vistas v
join cars c on c.id = v.car_id
left join consultas q on q.car_id = v.car_id
where coalesce(q.leads, 0) = 0
order by v.visitantes desc;
```

**A3. Tasa de consulta por auto** ✅
De los que vieron el auto, cuántos escribieron (por ese auto o por otro).

```sql
select c.brand || ' ' || c.model as auto,
       count(distinct v.visitor_id) as visitantes,
       count(distinct l.visitor_id) as escribieron,
       count(distinct l.visitor_id) filter (where l.car_id = v.car_id) as escribieron_por_este
from car_views v
join cars c on c.id = v.car_id
left join leads l on l.visitor_id = v.visitor_id and l.dealer_id = v.dealer_id and l.is_active
where v.dealer_id = :dealer and v.viewed_on between :desde and :hasta
group by c.brand, c.model
order by visitantes desc;
```

**A4. Días en inventario hasta la venta** ⚠️
Solo confiable para autos publicados **después** de la 0014 (ver § 4).

```sql
select h.car_id,
       min(h.changed_at) filter (where h.to_status = 'disponible') as publicado,
       min(h.changed_at) filter (where h.to_status = 'vendido')    as vendido,
       min(h.changed_at) filter (where h.to_status = 'vendido')
         - min(h.changed_at) filter (where h.to_status = 'disponible') as tiempo_en_venta
from car_status_history h
where h.dealer_id = :dealer
  and h.from_status is not null   -- excluye la línea base de la 0014
group by h.car_id
having min(h.changed_at) filter (where h.to_status = 'vendido') is not null;
```

**A5. Efecto de bajar el precio** ⚠️
Visitantes del auto antes y después de cada cambio de precio. Pocos casos al
principio: sirve como anécdota antes que como estadística.

```sql
select h.car_id, h.changed_at, h.from_price, h.to_price,
       (select count(distinct visitor_id) from car_views v
         where v.car_id = h.car_id and v.viewed_on between (h.changed_at - interval '7 days')::date and h.changed_at::date) as visitantes_7d_antes,
       (select count(distinct visitor_id) from car_views v
         where v.car_id = h.car_id and v.viewed_on between h.changed_at::date and (h.changed_at + interval '7 days')::date) as visitantes_7d_despues
from car_status_history h
where h.dealer_id = :dealer and h.from_price is distinct from h.to_price and h.from_status is not null
order by h.changed_at desc;
```

**A6. Apartados que se caen** ⚠️
Autos que pasaron de `apartado` a `disponible`.

```sql
select count(*) as apartados_caidos
from car_status_history
where dealer_id = :dealer and from_status = 'apartado' and to_status = 'disponible'
  and changed_at >= :desde and changed_at < :hasta + 1;
```

### B. Embudo

**B1. Del interés a la venta** ⚠️

| Paso | Cómo se cuenta |
|---|---|
| Visitantes que vieron alguna ficha | `count(distinct visitor_id)` en `car_views` |
| Leads | `count(*)` en `leads` |
| Contactados | Leads que alguna vez llegaron a `contactado`, `cita` o `vendido` (historial) |
| Con cita | Leads que alguna vez llegaron a `cita` o `vendido` |
| Vendidos | Leads con `status = 'vendido'` hoy |

"Alguna vez" se saca del historial, no del estatus actual: un lead que pasó por
cita y se perdió sí contó como cita.

```sql
with l as (
  select id from leads
  where dealer_id = :dealer and is_active and created_at >= :desde and created_at < :hasta + 1
)
select
  (select count(distinct visitor_id) from car_views
    where dealer_id = :dealer and viewed_on between :desde and :hasta)                  as visitantes,
  (select count(*) from l)                                                             as leads,
  (select count(distinct lead_id) from lead_status_history
    where lead_id in (select id from l) and to_status in ('contactado', 'cita', 'vendido')) as contactados,
  (select count(distinct lead_id) from lead_status_history
    where lead_id in (select id from l) and to_status in ('cita', 'vendido'))          as con_cita,
  (select count(*) from leads where id in (select id from l) and status = 'vendido')   as vendidos;
```

Salvedad: "visitantes" solo cuenta a quien abrió al menos una ficha. Quien vio
la portada o el catálogo y se fue no queda registrado (ver § 5).

### C. Campañas

**C1. Leads, ventas y monto por origen** ✅

```sql
select t.source, t.medium, coalesce(t.campaign, '(sin campaña)') as campaign,
       count(distinct l.id)                                        as leads,
       count(distinct l.id) filter (where l.status = 'vendido')     as ventas,
       coalesce(sum(l.sale_amount) filter (where l.status = 'vendido'), 0) as monto
from leads l
join attribution_touches t on t.id = l.last_touch_id
where l.dealer_id = :dealer and l.is_active
  and l.created_at >= :desde and l.created_at < :hasta + 1
group by 1, 2, 3
order by leads desc;
```

**C2. Fichas vistas por campaña** ✅
Interés generado por cada campaña, aunque la gente no escriba.

```sql
select t.source, t.medium, coalesce(t.campaign, '(sin campaña)') as campaign,
       count(distinct v.visitor_id) as visitantes,
       sum(v.views) as vistas,
       count(distinct v.car_id) as autos_distintos
from car_views v
join attribution_touches t on t.id = v.touch_id
where v.dealer_id = :dealer and v.viewed_on between :desde and :hasta
group by 1, 2, 3
order by visitantes desc;
```

**C3. Rendimiento por anuncio** ✅
Igual que C1 agrupando por `t.content` (id del anuncio, según la convención de
UTM del plan) y `t.term` (conjunto). Solo sirve si los anuncios llevan los
macros `{{ad.id}}` y `{{adset.id}}`.

**C4. Primer toque contra último toque** ✅
Qué campañas *traen* gente nueva (primer toque) y cuáles la *hacen escribir*
(último). Una campaña de alcance puede verse mal en último toque y ser la que
abrió la puerta.

```sql
select f.campaign as primera, t.campaign as ultima, count(*) as leads
from leads l
join attribution_touches f on f.id = l.first_touch_id
join attribution_touches t on t.id = l.last_touch_id
where l.dealer_id = :dealer and l.is_active and l.created_at >= :desde
group by 1, 2
order by leads desc;
```

**C5. Costo por lead y por venta** ❌
Falta el gasto por campaña (Fase 5 del plan: Meta Marketing API o captura
manual). Con el gasto, es C1 dividido entre lo gastado. Es la métrica que pide la
estrategia: comparar caminos por **costo por venta**, no por costo por lead.

### D. Seguimiento del vendedor

**D1. Tiempo al primer contacto** ⚠️
Solo para leads creados **después** de la 0011 (ver § 4).

```sql
select l.id, l.created_at,
       min(h.changed_at) filter (where h.from_status is not null) - l.created_at as primer_movimiento
from leads l
join lead_status_history h on h.lead_id = l.id
where l.dealer_id = :dealer and l.is_active and l.created_at >= :desde
group by l.id, l.created_at;
```

Mostrar la **mediana**, no el promedio: un lead olvidado una semana arruina el
promedio de todo el mes.

**D2. Leads sin atender** ✅
`status = 'nuevo'` con más de 24 horas. Sirve como alerta en la portada del panel
más que como reporte.

```sql
select count(*) from leads
where dealer_id = :dealer and is_active and status = 'nuevo'
  and created_at < now() - interval '24 hours';
```

**D3. Leads estancados** ✅
Sin ningún cambio en N días, con `updated_at` (0012). Por ejemplo, contactados
hace más de 7 días sin moverse.

```sql
select id, name, status, updated_at from leads
where dealer_id = :dealer and is_active and status in ('contactado', 'cita')
  and updated_at < now() - interval '7 days'
order by updated_at;
```

**D4. Por vendedor** ⚠️
`lead_status_history.changed_by` guarda el usuario que movió cada lead. Útil
cuando un dealer tenga varios usuarios; hoy cada dealer tiene uno.

### E. Comportamiento del cliente

**E1. Qué más vio quien escribió** ✅
Lo que ya muestra el detalle del lead ("Autos que vio"), agregado: de los que
preguntaron por un auto, qué otros vieron.

```sql
select c1.brand || ' ' || c1.model as pregunto_por,
       c2.brand || ' ' || c2.model as tambien_vio,
       count(distinct l.id) as leads
from leads l
join car_views v on v.visitor_id = l.visitor_id and v.dealer_id = l.dealer_id and v.car_id <> l.car_id
join cars c1 on c1.id = l.car_id
join cars c2 on c2.id = v.car_id
where l.dealer_id = :dealer and l.is_active
group by 1, 2
order by leads desc;
```

**E2. Compró otro auto** ✅
De los vendidos, cuántos compraron un auto distinto al que preguntaron.

```sql
select count(*) filter (where sold_car_id = car_id)                                   as compro_el_mismo,
       count(*) filter (where sold_car_id is distinct from car_id and sold_car_id is not null) as compro_otro,
       count(*) filter (where sold_car_id is null)                                    as fuera_de_inventario
from leads
where dealer_id = :dealer and is_active and status = 'vendido';
```

**E3. Personas con varios leads** ✅
Mismo `visitor_id` con más de un lead: preguntó por varios autos. Base para
agrupar leads de una persona en el panel.

```sql
select visitor_id, count(*) as leads, array_agg(distinct car_id) as autos
from leads
where dealer_id = :dealer and is_active and visitor_id is not null
group by visitor_id
having count(*) > 1;
```

**E4. Nuevo contra seminuevo** ✅
Cualquiera de las anteriores filtrada por `cars.condition`. Responde la
estrategia: ¿qué condición trae más leads y ventas por campaña?

---

## 4. Cuidados al calcular

- **Líneas base de los historiales.** La 0011 y la 0014 escribieron un renglón
  por cada lead y auto que ya existía, con la fecha de la migración (09/oct/2026)
  y `from_status` nulo o `changed_by` nulo. No son eventos reales:
  - En `car_status_history`, la línea base es `from_status is null` con
    `changed_at` = fecha de la migración. Excluirla en tiempos (A4, A5).
  - En `lead_status_history`, la llegada de los leads viejos sí tiene su fecha
    real (`created_at`), pero el paso a su estatus de ese día tiene la fecha de
    la migración. Para tiempos (D1), usar solo leads creados después de la 0011.
- **Leads sin origen.** Los anteriores a la 0015 y los de navegadores que
  bloquean cookies no tienen `last_touch_id`. Mostrarlos como "Sin datos", no
  excluirlos: si se excluyen, el total de leads no cuadra.
- **Un visitante no es una persona.** Distintos dispositivos o borrar cookies
  generan visitantes nuevos. Los números de visitantes son un piso.
- **Bajas lógicas.** Filtrar `leads.is_active`. En `cars`, un auto dado de baja
  sigue teniendo vistas e historial: decidir por métrica si cuenta.
- **Zona horaria.** Agrupar por día con `viewed_on` (ya en México) o con
  `changed_at at time zone 'America/Mexico_City'`. Nunca con la fecha UTC.
- **Datos de prueba.** En QA hay leads "Prueba 1…4c" y vistas de pruebas.
  Producción debería estar limpia; si no, filtrarlos.
- **Nuestros números contra los de Meta.** Atribución y ventanas distintas
  (§ 2). No intentar que cuadren: comparar tendencias.

---

## 5. Lo que falta para completar el mapa

| Falta | Para qué métrica | Cómo | Fase del plan |
|---|---|---|---|
| Gasto por campaña | Costo por lead y por venta (C5) | Meta Marketing API o captura manual mensual | 5 |
| Clics de WhatsApp sin datos | Conversaciones por campaña | Señal desde `WhatsAppFloat` y Contacto a una tabla de eventos | 0, paso 6 |
| Vistas de portada y catálogo | Visitantes totales del sitio, no solo de fichas | Mismo mecanismo que `car_views`, en una tabla de visitas por página o día | Nuevo |
| Leads de formulario de Meta | Comparar los tres caminos de la estrategia | Webhook `leadgen` | 3 |
| WhatsApp directo (anuncios) | Mismo | Cloud API o captura manual | 4 |
| Búsquedas y filtros del catálogo | Qué busca la gente que no encuentra | Evento al aplicar filtros | Nuevo |

---

## 6. Cómo construir la sección cuando toque

**Pantalla propuesta** (`/dashboard/analitica`):

1. Filtros arriba: periodo (7 días, 30 días, mes, personalizado), condición
   (nuevo, seminuevo, demo).
2. Tarjetas: visitantes, leads, citas, ventas, monto vendido, mediana de primer
   contacto.
3. Embudo (B1) en una sola barra horizontal.
4. Tabla de campañas (C1 + C2), ordenable, con costo por venta cuando exista el
   gasto.
5. Tabla de autos (A1 + A2 + A3): visitantes, leads, tasa; resaltar los de mucho
   interés y cero leads.
6. Alertas: leads sin atender (D2) y estancados (D3). Podrían vivir mejor en la
   portada del panel que aquí.

**Implementación:**

- Empezar con **funciones SQL** (RPC) que reciban el periodo y lean con la
  sesión del dealer: `security invoker`, para que la RLS siga limitando a sus
  datos. Nunca exponerlas a `anon`.
- Calcular al vuelo mientras los volúmenes sean chicos (cientos de leads, miles
  de vistas por dealer). Si un día pesa, pasar a vistas materializadas
  refrescadas cada noche.
- Gráficas: barras por día para visitantes y leads; nada de pasteles para más de
  tres categorías.
- Cada número de la pantalla tiene que poder explicarse con una consulta de este
  documento. Si se agrega una métrica, se agrega aquí primero.
