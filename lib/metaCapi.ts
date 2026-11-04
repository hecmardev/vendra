import { createHash } from 'node:crypto'

/**
 * Arma los eventos de Conversions API. Funciones puras: sin base ni red, para
 * poder probarlas. El envío está en services/metaCapi.ts.
 *
 * Solo servidor (node:crypto). Docs de Meta:
 * https://developers.facebook.com/docs/marketing-api/conversions-api/parameters
 */

/** Versión de la Graph API. v26.0 salió el 29/jul/2026; las versiones duran ~2 años. */
export const META_GRAPH_VERSION = 'v26.0'

/** Meta rechaza eventos con event_time de más de 7 días. */
export const META_MAX_EVENT_AGE_MS = 7 * 24 * 60 * 60 * 1000

export type MetaEventName = 'Lead' | 'Contactado' | 'Schedule' | 'Purchase'

const sha256 = (v: string): string => createHash('sha256').update(v).digest('hex')

/**
 * Teléfono a formato internacional sin "+", como lo pide Meta antes del hash.
 * Solo México: 10 dígitos -> 52 + 10. El 521 de los móviles (formato viejo que
 * aún usa WhatsApp) -> 52 + 10. Otra cosa no se puede interpretar y no se manda:
 * un teléfono mal normalizado no empareja, y con el hash no se nota.
 */
export function normalizePhone (raw: string | null | undefined): string | null {
  const d = (raw ?? '').replace(/\D/g, '')
  if (d.length === 10) return `52${d}`
  if (d.length === 12 && d.startsWith('52')) return d
  if (d.length === 13 && d.startsWith('521')) return `52${d.slice(3)}`
  return null
}

export function normalizeEmail (raw: string | null | undefined): string | null {
  const v = (raw ?? '').trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null
}

/**
 * Nombre a { fn, ln } en minúsculas y sin signos, como lo pide Meta. El
 * formulario tiene un solo campo: primera palabra = nombre, última = apellido.
 */
export function normalizeName (raw: string | null | undefined): { fn: string | null; ln: string | null } {
  const parts = (raw ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return { fn: null, ln: null }
  return { fn: parts[0], ln: parts.length > 1 ? parts[parts.length - 1] : null }
}

/**
 * El auto que va en el evento. En la compra es el que compró, no por el que
 * preguntó: Meta aprende qué se vende. Sin auto vendido (compró uno fuera del
 * inventario) la compra va sin auto: mandar el de interés sería decirle a Meta
 * que se vendió algo que sigue en el lote.
 */
export function carForEvent<T> (eventName: MetaEventName, carOfInterest: T | null, soldCar: T | null): T | null {
  return eventName === 'Purchase' ? soldCar : carOfInterest
}

export interface MetaEventInput {
  eventName: MetaEventName
  eventId: string
  eventTime: Date
  lead: {
    id: string
    name: string
    phone: string
    email: string | null
    visitorId: string | null
    fbc: string | null
    fbp: string | null
    clientIp: string | null
    clientUserAgent: string | null
    saleAmount: number | null
  }
  /** Página de entrada: la exige Meta en eventos de sitio web. */
  eventSourceUrl: string
  car: { id: string; label: string; condition: string } | null
}

/**
 * Un evento listo para Meta. Lo que identifica a la persona va con hash SHA-256
 * (Meta no lo ve en claro); `fbc`, `fbp`, IP y navegador van tal cual, como pide
 * su documentación.
 *
 * action_source: el lead pasó en el sitio (website); contactado, cita y venta los
 * registra el vendedor en el panel, que para Meta es un CRM (system_generated).
 */
export function buildMetaEvent (input: MetaEventInput): Record<string, unknown> {
  const { lead, car } = input
  const phone = normalizePhone(lead.phone)
  const email = normalizeEmail(lead.email)
  const { fn, ln } = normalizeName(lead.name)
  const isWeb = input.eventName === 'Lead'

  const user_data: Record<string, unknown> = {
    country: [sha256('mx')],
    external_id: [sha256(lead.visitorId ?? lead.id)]
  }
  if (phone) user_data.ph = [sha256(phone)]
  if (email) user_data.em = [sha256(email)]
  if (fn) user_data.fn = [sha256(fn)]
  if (ln) user_data.ln = [sha256(ln)]
  if (lead.fbc) user_data.fbc = lead.fbc
  if (lead.fbp) user_data.fbp = lead.fbp
  if (lead.clientIp) user_data.client_ip_address = lead.clientIp
  if (lead.clientUserAgent) user_data.client_user_agent = lead.clientUserAgent

  const custom_data: Record<string, unknown> = {}
  if (car) {
    custom_data.content_ids = [car.id]
    custom_data.content_type = 'vehicle'
    custom_data.content_name = car.label
    custom_data.condition = car.condition
  }
  if (input.eventName === 'Purchase') {
    custom_data.currency = 'MXN'
    custom_data.value = lead.saleAmount ?? 0
  }

  return {
    event_name: input.eventName,
    event_time: Math.floor(input.eventTime.getTime() / 1000),
    event_id: input.eventId,
    action_source: isWeb ? 'website' : 'system_generated',
    ...(isWeb ? { event_source_url: input.eventSourceUrl } : {}),
    user_data,
    ...(Object.keys(custom_data).length ? { custom_data } : {})
  }
}

/** Primera IP de x-forwarded-for: la del visitante (las demás son proxies). */
export function clientIpFrom (headers: Headers): string | null {
  const fwd = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return (fwd || headers.get('x-real-ip')?.trim() || '').slice(0, 64) || null
}
