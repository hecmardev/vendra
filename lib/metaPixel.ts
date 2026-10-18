/**
 * Pixel de Meta en el navegador. Cada dealer tiene el suyo (dealers.meta_pixel_id,
 * 0018); MetaPixel lo carga solo en su sitio público y solo si el visitante
 * aceptó las cookies (lib/consent.ts).
 *
 * `trackMeta` es seguro de llamar siempre: si el Pixel no está cargado (sin
 * aceptación, dealer sin Pixel, panel, plataforma) no hace nada. Así los
 * componentes que mandan eventos no tienen que saber nada de consentimiento.
 */

import { canUseMetaPixel, readConsentCookie } from '@/lib/consent'

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown }
    _fbq?: unknown
  }
}

/** Eventos estándar de Meta; cualquier otro va como trackCustom. */
const STANDARD = new Set(['PageView', 'ViewContent', 'Lead', 'Contact', 'FindLocation', 'Search', 'Schedule', 'Purchase'])

/**
 * El snippet oficial de Meta, escrito como función: crea la cola `fbq` (los
 * eventos que lleguen antes de que baje el script se guardan y se envían
 * después) y carga fbevents.js.
 */
export function loadMetaPixel (pixelId: string): void {
  if (typeof window === 'undefined' || window.fbq) return
  const fbq: any = function (...args: unknown[]) {
    fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args)
  }
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  window.fbq = fbq
  if (!window._fbq) window._fbq = fbq

  const s = document.createElement('script')
  s.async = true
  s.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(s)

  fbq('init', pixelId)
}

export const isMetaPixelLoaded = (): boolean => typeof window !== 'undefined' && typeof window.fbq === 'function'

/**
 * Manda un evento al Pixel, si está cargado.
 *
 * `eventId`: para eventos que también reportará el servidor por Conversions API
 * (Lead, en la Fase B). Con el mismo id en los dos lados, Meta lo cuenta una vez.
 */
export function trackMeta (event: string, params: Record<string, unknown> = {}, eventId?: string): void {
  if (!isMetaPixelLoaded()) return
  // Si aceptó y luego cambió a rechazar, el script sigue en la pestaña: se
  // revisa la decisión vigente en cada evento.
  if (!canUseMetaPixel(readConsentCookie())) return
  const method = STANDARD.has(event) ? 'track' : 'trackCustom'
  if (eventId) window.fbq!(method, event, params, { eventID: eventId })
  else window.fbq!(method, event, params)
}

/**
 * Id para un evento que se emparejará con el servidor. crypto.randomUUID solo
 * existe en páginas seguras (https, localhost): el respaldo arma un uuid v4 con
 * getRandomValues para que un formulario nunca truene por esto.
 */
export function newEventId (): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** Datos del auto en el formato de los eventos (mismo en ViewContent y Lead). */
export function carEventParams (car: {
  id: string
  brand: string
  model: string
  year: number
  condition: string
  price: number
}): Record<string, unknown> {
  return {
    content_ids: [car.id],
    content_type: 'vehicle',
    content_name: `${car.brand} ${car.model} ${car.year}`,
    make: car.brand,
    model: car.model,
    year: car.year,
    // nuevo / seminuevo / demo: permite conversiones y audiencias por condición.
    condition: car.condition,
    value: car.price,
    currency: 'MXN'
  }
}
