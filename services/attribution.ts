import { createAdminClient } from '@/lib/supabase/admin'
import type { Attribution, Touch } from '@/lib/attribution'

export interface SavedTouches {
  firstTouchId: string | null
  lastTouchId: string | null
}

const NONE: SavedTouches = { firstTouchId: null, lastTouchId: null }

/**
 * Guarda en attribution_touches (0015) las visitas de la cookie del visitante y
 * devuelve sus ids para referenciarlas. Si ya estaban, no las duplica: el id lo
 * puso el middleware y es la llave.
 *
 * Service role: el visitante no tiene sesión. Seguro porque `dealerId` viene
 * del tenant resuelto por el host, nunca del navegador.
 *
 * La cookie la manda el navegador y se puede editar a mano: alguien podría
 * poner el id de una visita de OTRO dealer. El insert no la pisa (on conflict
 * no hace nada) y la relectura filtra por dealer, así que esa referencia
 * simplemente no se usa.
 *
 * A prueba de fallos: si algo sale mal (p. ej. la 0015 sin aplicar) devuelve
 * ids vacíos. Perder el origen es malo; romper la captura del lead, peor.
 */
export async function saveTouches (
  dealerId: string,
  visitorId: string | null,
  attribution: Attribution | null
): Promise<SavedTouches> {
  if (!visitorId || !attribution) return NONE

  const toRow = (t: Touch) => ({
    id: t.id,
    dealer_id: dealerId,
    visitor_id: visitorId,
    source: t.source,
    medium: t.medium,
    campaign: t.campaign,
    content: t.content,
    term: t.term,
    gclid: t.gclid,
    fbc: t.fbc,
    referrer: t.referrer,
    landing_path: t.landing,
    touched_at: t.at
  })
  const { first, last } = attribution
  const rows = first.id === last.id ? [toRow(first)] : [toRow(first), toRow(last)]

  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('attribution_touches')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: true })
    if (error) throw error

    const { data, error: readErr } = await supabase
      .from('attribution_touches')
      .select('id')
      .in('id', rows.map((r) => r.id))
      .eq('dealer_id', dealerId)
    if (readErr) throw readErr

    const ours = new Set((data ?? []).map((r: { id: string }) => r.id))
    return {
      firstTouchId: ours.has(first.id) ? first.id : null,
      lastTouchId: ours.has(last.id) ? last.id : null
    }
  } catch (e) {
    console.error('[attribution] no se pudieron guardar las visitas (lead sin origen):', e)
    return NONE
  }
}
