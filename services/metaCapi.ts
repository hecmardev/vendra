import { createAdminClient } from '@/lib/supabase/admin'
import {
  META_GRAPH_VERSION, META_MAX_EVENT_AGE_MS, buildMetaEvent, carForEvent, type MetaEventName
} from '@/lib/metaCapi'

/** Intentos antes de marcar `failed`. Un token nuevo los regresa a pendientes (0019). */
const MAX_ATTEMPTS = 5

export interface SendResult {
  sent: number
  failed: number
  expired: number
}

/**
 * Manda a Meta los eventos pendientes de meta_events (0019). Los encola un
 * trigger al crear un lead o cambiar su estatus; esto solo los despacha.
 *
 *   - Con `leadId`: los de ese lead, justo después del cambio (ver `after()` en
 *     /api/leads y en las acciones del panel). No hace esperar al vendedor.
 *   - Sin `leadId`: todos los pendientes. Lo usa el cron para reintentar.
 *
 * Un evento por petición: si un evento de un lote tiene más de 7 días, Meta
 * rechaza el lote completo. Si el cron y un envío inmediato llegaran a mandar lo
 * mismo, el event_id hace que Meta lo cuente una vez.
 *
 * Nunca lanza: reportar a Meta no debe romper nada del panel.
 */
export async function sendPendingMetaEvents (opts: { leadId?: string; limit?: number } = {}): Promise<SendResult> {
  const result: SendResult = { sent: 0, failed: 0, expired: 0 }
  try {
    const supabase = createAdminClient()

    // Más de 7 días sin enviarse: Meta ya no los acepta.
    const cutoff = new Date(Date.now() - META_MAX_EVENT_AGE_MS).toISOString()
    let expire = supabase
      .from('meta_events')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('event_time', cutoff)
    if (opts.leadId) expire = expire.eq('lead_id', opts.leadId)
    const { data: expired } = await expire.select('id')
    result.expired = expired?.length ?? 0

    let query = supabase
      .from('meta_events')
      .select('id, dealer_id, event_name, event_id, event_time, attempts, leads(*, car:cars!leads_car_id_fkey(id, brand, model, year, condition), sold_car:cars!leads_sold_car_id_fkey(id, brand, model, year, condition), last_touch:attribution_touches!leads_last_touch_id_fkey(fbc, landing_path)), dealers(domain)')
      .eq('status', 'pending')
      .order('event_time')
      .limit(opts.limit ?? 100)
    if (opts.leadId) query = query.eq('lead_id', opts.leadId)
    const { data: events, error } = await query
    if (error) throw error

    // El token se lee una vez por dealer, y no se guarda en ningún lado.
    const configs = new Map<string, { pixel_id: string; token: string; test_event_code: string | null } | null>()

    for (const ev of (events ?? []) as any[]) {
      if (!configs.has(ev.dealer_id)) {
        const { data } = await supabase.rpc('get_meta_capi_config', { p_dealer_id: ev.dealer_id })
        configs.set(ev.dealer_id, data?.[0] ?? null)
      }
      const config = configs.get(ev.dealer_id)
      const attempts = ev.attempts + 1

      if (!config?.pixel_id || !config.token) {
        await supabase.from('meta_events')
          .update({ status: 'failed', attempts, last_error: 'El dealer no tiene Pixel o token' })
          .eq('id', ev.id)
        result.failed++
        continue
      }

      const lead = ev.leads
      const car = carForEvent(ev.event_name as MetaEventName, lead.car, lead.sold_car)
      const body = {
        data: [buildMetaEvent({
          eventName: ev.event_name as MetaEventName,
          eventId: ev.event_id,
          eventTime: new Date(ev.event_time),
          lead: {
            id: lead.id,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            visitorId: lead.visitor_id,
            fbc: lead.last_touch?.fbc ?? null,
            fbp: lead.fbp,
            clientIp: lead.client_ip,
            clientUserAgent: lead.client_user_agent,
            saleAmount: lead.sale_amount != null ? Number(lead.sale_amount) : null
          },
          eventSourceUrl: `https://${ev.dealers.domain}${lead.last_touch?.landing_path ?? '/'}`,
          car: car
            ? { id: car.id, label: `${car.brand} ${car.model} ${car.year}`, condition: car.condition }
            : null
        })],
        ...(config.test_event_code ? { test_event_code: config.test_event_code } : {})
      }

      const error = await postToMeta(config.pixel_id, config.token, body)
      if (!error) {
        await supabase.from('meta_events')
          .update({ status: 'sent', attempts, last_error: null, sent_at: new Date().toISOString() })
          .eq('id', ev.id)
        result.sent++
      } else {
        await supabase.from('meta_events')
          .update({ status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending', attempts, last_error: error })
          .eq('id', ev.id)
        result.failed++
      }
    }
  } catch (e) {
    console.error('[meta-capi] fallo despachando eventos:', e)
  }
  return result
}

/** Devuelve null si Meta lo recibió, o el error. El token nunca va en el mensaje. */
async function postToMeta (pixelId: string, token: string, body: unknown): Promise<string | null> {
  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${encodeURIComponent(pixelId)}/events`
  try {
    const res = await fetch(url, {
      method: 'POST',
      // En cabecera y no en la URL: las URLs terminan en logs.
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000)
    })
    if (res.ok) return null
    const json = await res.json().catch(() => null)
    const msg = json?.error?.error_user_msg ?? json?.error?.message ?? `HTTP ${res.status}`
    return String(msg).slice(0, 500)
  } catch (e) {
    return e instanceof Error ? e.message.slice(0, 500) : 'Error de red'
  }
}
