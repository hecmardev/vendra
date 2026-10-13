import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { saveTouches } from '@/services/attribution'
import type { Attribution } from '@/lib/attribution'
import type { ViewedCar } from '@/interfaces/lead'

/**
 * Registra que un visitante abrió la ficha de un auto (car_views, 0016).
 *
 * Antes guarda las visitas de la cookie en attribution_touches, para que la
 * vista quede ligada a la campaña que trajo a la persona. El upsert y la
 * validación de que el auto sea del dealer los hace la función
 * record_car_view, en una sola operación.
 *
 * A prueba de fallos: una vista que no se registra no debe romper nada.
 */
export async function recordCarView (input: {
  dealerId: string
  carId: string
  visitorId: string
  attribution: Attribution | null
}): Promise<void> {
  try {
    const { lastTouchId } = await saveTouches(input.dealerId, input.visitorId, input.attribution)
    const { error } = await createAdminClient().rpc('record_car_view', {
      p_dealer_id: input.dealerId,
      p_car_id: input.carId,
      p_visitor_id: input.visitorId,
      p_touch_id: lastTouchId
    })
    if (error) throw error
  } catch (e) {
    console.error('[views] no se pudo registrar la vista:', e)
  }
}

/**
 * Autos que vio cada visitante, agrupados por auto, del más reciente al más
 * antiguo. Para la sección "Autos que vio" del lead. RLS: solo los del dealer.
 */
export async function listViewedCarsByVisitor (dealerId: string, visitorIds: string[]): Promise<Map<string, ViewedCar[]>> {
  const out = new Map<string, ViewedCar[]>()
  if (visitorIds.length === 0) return out

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('car_views')
    .select('visitor_id, car_id, views, first_viewed_at, last_viewed_at, cars(brand, model, year)')
    .eq('dealer_id', dealerId)
    .in('visitor_id', visitorIds)
  if (error) {
    // Sin la 0016 la tabla no existe: el panel sigue funcionando, sin la sección.
    console.error('[views] no se pudieron leer las vistas:', error.message)
    return out
  }

  const byKey = new Map<string, ViewedCar & { visitor: string }>()
  for (const r of (data ?? []) as any[]) {
    const key = `${r.visitor_id}:${r.car_id}`
    const prev = byKey.get(key)
    if (prev) {
      prev.views += r.views
      prev.days += 1
      if (r.first_viewed_at < prev.firstViewedAt) prev.firstViewedAt = r.first_viewed_at
      if (r.last_viewed_at > prev.lastViewedAt) prev.lastViewedAt = r.last_viewed_at
    } else {
      byKey.set(key, {
        visitor: r.visitor_id,
        carId: r.car_id,
        label: r.cars ? `${r.cars.brand} ${r.cars.model} ${r.cars.year}` : 'Auto dado de baja',
        views: r.views,
        days: 1,
        firstViewedAt: r.first_viewed_at,
        lastViewedAt: r.last_viewed_at
      })
    }
  }

  for (const { visitor, ...car } of byKey.values()) {
    const list = out.get(visitor) ?? []
    list.push(car)
    out.set(visitor, list)
  }
  for (const list of out.values()) list.sort((a, b) => b.lastViewedAt.localeCompare(a.lastViewedAt))
  return out
}
