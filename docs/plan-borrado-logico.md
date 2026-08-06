# Plan — Borrado lógico (soft delete) en Vendra

Regla: **ningún registro se borra de la base de datos**. "Eliminar" pasa a ser un
cambio de estado. Aplica a autos, fotos, dealers, usuarios y leads.

## Criterio: los registros eliminados son inmutables (NO se restauran)

Un registro con `record_status = 'deleted'` queda **congelado**: no se revive ni
se edita. Decisión de integridad de datos — si un auto borrado se restaurara y
luego se editara, se convertiría en "otro" auto arrastrando el historial del
anterior, y las métricas (ventas, leads, reportes) quedarían corruptas.

Consecuencias, ya implementadas:

- **No existe función de restaurar** autos ni una "papelera" para el dealer.
- **Un auto eliminado no se puede editar**: `getCarById` filtra `is_active`, así
  que su página de edición devuelve 404.
- Para volver a publicar un auto, el dealer **crea uno nuevo** (id nuevo →
  métricas limpias; el slug viejo queda libre por el índice único parcial).
- La fila eliminada se conserva como **registro histórico inmutable** (mantiene
  su `status` original, sus leads y su `deleted_at`), útil para auditoría.

Excepción que NO contradice esto: `setDealerActive` reactiva un **dealer**
suspendido (`record_status = 'suspended'`, no `'deleted'`) sin tocar a sus
hijos; y `syncCarImages` puede reactivar una **foto** de un auto activo si se
vuelve a agregar la misma. Ninguno revive un registro `deleted`.

## 1. Convención de campos

Tres columnas en cada tabla que admita baja:

| Columna | Tipo | Para qué |
|---|---|---|
| `is_active` | `boolean not null default true` | El interruptor. **Todo query filtra por esto.** |
| `record_status` | `text not null default 'active'` | Estado del registro: `active`, `deleted`, `suspended`, `draft`. |
| `deleted_at` | `timestamptz` | Cuándo se dio de baja (auditoría). |

### Invariante entre los dos campos

```
is_active = true   ⟺   record_status = 'active'
```

`deleted`, `suspended` y `draft` van todos con `is_active = false`. Así el filtro
público es **uno solo** (`is_active`) y es imposible que un borrador o un
suspendido se cuele al catálogo por olvidar una condición.

Se enforza en la base para que no se desincronicen:

```sql
alter table cars add constraint cars_active_consistent
  check (is_active = (record_status = 'active'));
```

(Igual en `dealers`, `profiles`, `leads`, y en `car_images` si se le agrega
`record_status`.)

El panel del dealer sí distingue los estados: para ver borradores filtra
explícitamente por `record_status = 'draft'`.

### Por qué NO se reutiliza el `status` existente

`cars.status` es el enum `car_status` (`disponible`/`vendido`/`apartado`) y
`leads.status` es el flujo comercial (`nuevo`/`contactado`). Si ahí se escribe
`delete` se pierde el estado real del registro: un auto vendido y luego eliminado
dejaría de constar como vendido, y los reportes de ventas se rompen.

`record_status` es el estado **del registro**; `status` sigue siendo el estado
**del negocio**. Son cosas distintas y conviven.

### Sobre renombrar `status` a `business_status`

Se evaluó y **se decidió dejarlo como `status`**: el campo calificado es
`record_status`, y al verlos juntos no hay ambigüedad (el enum ya se llama
`car_status`). Renombrar obliga a tocar la política RLS, el enum, `services/cars.ts`,
los filtros del inventario, el `CarForm`, las interfaces y los seeds, sin ganancia
funcional. Además `business_status` encaja en `cars` pero no en `leads`, cuyo
estado es de flujo, no de negocio.

Si se decide renombrar, hacerlo **dentro de la `0003`**; después implica una
segunda pasada completa sobre RLS y código.

## 2. Tablas afectadas

| Tabla | Flags | Motivo |
|---|---|---|
| `cars` | los 3 | Hoy `deleteCar()` hace DELETE físico. |
| `car_images` | `is_active`, `deleted_at` | `syncCarImages()` borra y reinserta todo. |
| `dealers` | los 3 | `deleteDealerAccount()` borra en cascada; además hace falta **suspender** por impago. |
| `profiles` | los 3 | Baja de usuarios sin perder el histórico. |
| `leads` | los 3 | Descartar leads sin perder el dato comercial. |
| `dealer_features` | — | No hay borrado (es upsert). Se deja igual. |

## 3. Fase 1 — Migración `0003_soft_delete.sql`

1. **Agregar columnas** a las 5 tablas (con defaults, así el backfill es automático).

2. **Reemplazar los unique por índices únicos parciales.** Es el paso que más se
   olvida y el que más duele:

   ```sql
   -- dealers: liberar el dominio cuando el dealer se da de baja
   alter table dealers drop constraint dealers_domain_key;
   create unique index dealers_domain_active_uk on dealers (domain) where is_active;

   -- cars: liberar el slug cuando el auto se da de baja
   alter table cars drop constraint cars_dealer_id_slug_key;
   create unique index cars_dealer_slug_active_uk on cars (dealer_id, slug) where is_active;
   ```

   Sin esto: no puedes reusar el dominio de un cliente que se fue, y al recrear
   un auto igual te salen slugs `-2`, `-3`, `-4`.

3. **Índices de filtrado**, porque ahora todo query lleva `is_active`:

   ```sql
   create index cars_dealer_active_idx on cars (dealer_id, is_active);
   create index leads_dealer_active_idx on leads (dealer_id, is_active);
   ```

> Aplicar junto con `0002_dealer_features_write.sql`, que sigue pendiente.

## 4. Fase 2 — RLS (lo más crítico)

Si esto no se hace, **un auto "eliminado" sigue viéndose en el catálogo público**.

```sql
alter policy cars_public_read on cars
  using (status = 'disponible' and is_active);

alter policy dealers_public_read on dealers
  using (is_active);

alter policy car_images_public_read on car_images
  using (
    is_active and exists (
      select 1 from cars c
      where c.id = car_images.car_id and c.status = 'disponible' and c.is_active
    )
  );
```

La RLS queda como red de seguridad: aunque un query en el código olvide el
filtro, la base no expone lo dado de baja.

Gracias al invariante de la sección 1, estas políticas **solo necesitan
`is_active`**: los borradores y los suspendidos ya quedan fuera sin condiciones
extra. Si se hubiera dejado `draft` con `is_active = true`, cada una de estas
políticas tendría que comprobar además `record_status`.

## 5. Fase 3 — Capa `services/`

Único punto donde se toca Supabase, así que es el lugar natural para centralizar
el filtro (respeta la regla de que los componentes solo importan de `services/`).

**Lecturas** — agregar `.eq('is_active', true)`:
`listCars`, `getCarBySlug`, `getCarById`, `listLeads`, `getDealerByDomain`,
`getDealerById`, `getCurrentDealer`, `listDealersWithStats`.

En `getCurrentDealer` validar además que el `profile` **y** el `dealer` estén
activos: un dealer suspendido no debe poder entrar a su panel.

**Bajas** — dejan de ser DELETE:

```ts
// antes: .delete()
export async function softDeleteCar (dealerId: string, carId: string) {
  await supabase.from('cars')
    .update({ is_active: false, record_status: 'deleted', deleted_at: new Date().toISOString() })
    .eq('id', carId).eq('dealer_id', dealerId)
}
```

**`syncCarImages` hay que rehacerlo.** Hoy borra todas las filas y reinserta; con
borrado lógico eso acumularía basura en cada edición. Nuevo comportamiento:
marcar inactivas las que ya no están, reactivar/actualizar posición las que
siguen, insertar solo las nuevas.

**`deleteDealerAccount` → `deactivateDealer(dealerId, motivo)`.** Como ya no hay
DELETE, el `on delete cascade` deja de dispararse: hay que propagar la baja a
mano a `cars`, `car_images`, `leads` y `profiles` (o con un trigger).

**Storage: no borrar archivos.** `deleteCarPhoto` deja de llamar a
`storage.remove()`; solo se marca inactiva la fila de `car_images`.

## 6. Fase 4 — Middleware

`ResolveDealerMiddleware` consulta `dealers` por dominio vía REST. Agregar
`&is_active=eq.true` a la query, o el sitio de un dealer dado de baja sigue
sirviendo.

## 7. Fase 5 — UI

**Panel de plataforma (`/admin`)**
- "Eliminar" → **"Dar de baja"**, y separar **"Suspender"** (impago, reversible)
  de **"Eliminar"**.
- Filtro para ver inactivos + acción **"Reactivar"**.
- Los contadores de autos/leads deben contar solo activos.

**Panel del dealer**
- El inventario oculta los eliminados por defecto.
- Opcional: vista "Eliminados" con botón de restaurar.

## 8. Usuarios de Auth — limitación real

No se pueden agregar columnas a `auth.users` (la maneja Supabase). El borrado
lógico de un usuario se hace así:

- `profiles.is_active = false` → `getCurrentDealer()` devuelve null → no entra al panel.
- Si además hay que bloquear el login: `auth.admin.updateUserById(id, { ban_duration: '876000h' })`.

Nunca `auth.admin.deleteUser()`.

## 9. Riesgos

| Riesgo | Mitigación |
|---|---|
| Olvidar un `is_active` y filtrar datos dados de baja | Filtro centralizado en `services/` + RLS como respaldo |
| Unique constraints bloqueando altas nuevas | Índices únicos parciales (Fase 1) |
| Contadores inflados por registros inactivos | Revisar `listDealersWithStats` y KPIs del dashboard |
| Storage crece indefinidamente (archivos nunca se borran) | Asumido por la regla de negocio; revisar costo a futuro |
| Tablas crecen sin límite | Índices parciales; a futuro, archivado a tabla histórica |

## 10. Orden sugerido

1. Migración `0003` (+ la `0002` pendiente).
2. RLS.
3. `services/` — lecturas y bajas.
4. Middleware.
5. UI de admin (suspender / reactivar).
6. UI del dealer.

Fases 1–4 son las que dan correctitud; 5 y 6 son producto.
