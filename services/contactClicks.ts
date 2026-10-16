import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { saveTouches } from '@/services/attribution'
import type { Attribution } from '@/lib/attribution'
import type { ContactCount } from '@/interfaces/lead'

export const CONTACT_CHANNELS = ['whatsapp', 'telefono', 'correo', 'mapa'] as const
export type ContactChannel = typeof CONTACT_CHANNELS[number]

/**
 * Registra un clic de contacto sin datos (contact_clicks, 0017), ligado a la
 * campaña vigente del visitante. La función record_contact_click descarta el
 * doble clic y resuelve el auto por el slug de la página.
 *
 * A prueba de fallos: un clic que no se registra no debe romper nada.
 */
export async function recordContactClick (input: {
  dealerId: string
  visitorId: string
  channel: ContactChannel
  placement: 'pie' | 'pagina'
  path: string
  attribution: Attribution | null
}): Promise<void> {
  try {
    const { lastTouchId } = await saveTouches(input.dealerId, input.visitorId, input.attribution)
    const { error } = await createAdminClient().rpc('record_contact_click', {
      p_dealer_id: input.dealerId,
      p_visitor_id: input.visitorId,
      p_channel: input.channel,
      p_placement: input.placement,
      p_path: input.path,
      p_touch_id: lastTouchId
    })
    if (error) throw error
  } catch (e) {
    console.error('[contact-clicks] no se pudo registrar el clic:', e)
  }
}

/**
 * Cuántas veces tocó cada canal cada visitante. Para el detalle del lead. RLS:
 * solo los del dealer. Sin la 0017 devuelve vacío y el panel sigue funcionando.
 */
export async function listContactClicksByVisitor (dealerId: string, visitorIds: string[]): Promise<Map<string, ContactCount[]>> {
  const out = new Map<string, ContactCount[]>()
  if (visitorIds.length === 0) return out

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contact_clicks')
    .select('visitor_id, channel, clicked_at')
    .eq('dealer_id', dealerId)
    .in('visitor_id', visitorIds)
  if (error) {
    console.error('[contact-clicks] no se pudieron leer los clics:', error.message)
    return out
  }

  for (const r of (data ?? []) as Array<{ visitor_id: string; channel: ContactChannel; clicked_at: string }>) {
    const list = out.get(r.visitor_id) ?? []
    const prev = list.find((c) => c.channel === r.channel)
    if (prev) {
      prev.clicks += 1
      if (r.clicked_at > prev.lastClickedAt) prev.lastClickedAt = r.clicked_at
    } else {
      list.push({ channel: r.channel, clicks: 1, lastClickedAt: r.clicked_at })
    }
    out.set(r.visitor_id, list)
  }
  return out
}
