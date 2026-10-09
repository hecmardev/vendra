/**
 * Atribución de campañas: de dónde llegó cada visitante y, cuando deja sus
 * datos, de dónde llegó cada lead.
 *
 * El middleware guarda los "toques" (visitas con origen) en una cookie propia
 * del dominio del dealer, cada uno con su id. NO escribe en la base: eso
 * agregaría latencia a cada entrada al sitio. Los toques se guardan en
 * `attribution_touches` (0015) hasta que el visitante hace algo —deja sus
 * datos, abre una ficha—, con ese mismo id para no duplicarlos.
 *
 *   first -> la primera visita: qué campaña trajo a la persona.
 *   last  -> la última visita CON origen (campaña, anuncio o sitio externo):
 *            cuál la hizo volver y escribir. Navegar dentro del sitio o volver
 *            escribiendo la URL no la reemplaza, para no borrar la campaña.
 *
 * Sin dependencias de Node: lo usa el middleware, que corre en edge.
 * Ver docs/plan-medicion-campanas.md (Fase 0).
 */

export const ATTR_COOKIE = 'vd_attr'
export const VISITOR_COOKIE = 'vd_vid'
/** Ventana de atribución: una campaña cuenta si el lead llega dentro de 90 días. */
export const ATTR_MAX_AGE = 60 * 60 * 24 * 90
export const VISITOR_MAX_AGE = 60 * 60 * 24 * 365

export interface Touch {
  /** Id del renglón en attribution_touches. Lo genera el middleware. */
  id: string
  /** utm_source, o deducido: google, facebook, instagram, direct, el host que refirió… */
  source: string
  /** utm_medium, o deducido: cpc, organic, social, referral, (none) */
  medium: string
  campaign: string | null
  /** utm_content. Con la convención del plan, el id del anuncio de Meta. */
  content: string | null
  /** utm_term. Con la convención del plan, el id del conjunto de anuncios. */
  term: string | null
  gclid: string | null
  /** Formato de la cookie _fbc de Meta (fb.1.<ms>.<fbclid>), listo para Conversions API. */
  fbc: string | null
  /** Host del sitio que refirió, si fue externo. */
  referrer: string | null
  /** Ruta de la página donde aterrizó (sin query: puede traer datos personales). */
  landing: string
  at: string // ISO
}

export interface Attribution {
  first: Touch
  last: Touch
}

const clip = (v: string | null | undefined, n = 150): string | null => {
  const t = v?.trim()
  return t ? t.slice(0, n) : null
}

const SEARCH = ['google', 'bing', 'yahoo', 'duckduckgo', 'ecosia', 'yandex', 'baidu']
const SOCIAL: Record<string, string> = {
  'facebook.com': 'facebook',
  'fb.com': 'facebook',
  'instagram.com': 'instagram',
  't.co': 'twitter',
  'x.com': 'twitter',
  'twitter.com': 'twitter',
  'tiktok.com': 'tiktok',
  'youtube.com': 'youtube',
  'linkedin.com': 'linkedin',
  'whatsapp.com': 'whatsapp'
}

const bareHost = (h: string) => h.toLowerCase().replace(/^www\./, '')

/** El host de un Referer, o null si no hay o es del mismo sitio. */
function externalHost (referer: string | null, ownHost: string): string | null {
  if (!referer) return null
  try {
    const h = bareHost(new URL(referer).hostname)
    return h === bareHost(ownHost) ? null : h
  } catch {
    return null
  }
}

/** facebook / instagram / google… a partir del host que refirió. */
function classifyHost (host: string): { source: string; medium: string } {
  for (const [domain, name] of Object.entries(SOCIAL)) {
    if (host === domain || host.endsWith(`.${domain}`)) return { source: name, medium: 'social' }
  }
  const engine = SEARCH.find((e) => host.split('.').includes(e))
  if (engine) return { source: engine, medium: 'organic' }
  return { source: host, medium: 'referral' }
}

/**
 * El toque de esta visita. `direct` = no trae ninguna señal de origen (ni UTM,
 * ni id de clic, ni sitio externo): navegación interna o URL escrita a mano.
 */
export function touchFromRequest (
  url: URL,
  referer: string | null,
  ownHost: string,
  now = new Date()
): { touch: Touch; direct: boolean } {
  const p = url.searchParams
  const utm = {
    source: clip(p.get('utm_source'))?.toLowerCase() ?? null,
    medium: clip(p.get('utm_medium'))?.toLowerCase() ?? null,
    campaign: clip(p.get('utm_campaign')),
    content: clip(p.get('utm_content')),
    term: clip(p.get('utm_term'))
  }
  const gclid = clip(p.get('gclid'), 255)
  const fbclid = clip(p.get('fbclid'), 255)
  const refHost = externalHost(referer, ownHost)

  let source: string
  let medium: string
  if (utm.source) {
    source = utm.source
    medium = utm.medium ?? (gclid ? 'cpc' : '(none)')
  } else if (gclid) {
    // Google agrega gclid solo a clics de anuncios.
    source = 'google'
    medium = 'cpc'
  } else if (fbclid) {
    // Meta agrega fbclid a TODO enlace saliente, pagado u orgánico: sin UTM no
    // se puede saber si fue anuncio. Por eso los anuncios deben llevar UTM.
    source = refHost?.includes('instagram') ? 'instagram' : 'facebook'
    medium = 'social'
  } else if (refHost) {
    ({ source, medium } = classifyHost(refHost))
  } else {
    source = 'direct'
    medium = '(none)'
  }

  const direct = !utm.source && !gclid && !fbclid && !refHost
  return {
    direct,
    touch: {
      id: crypto.randomUUID(),
      source,
      medium,
      campaign: utm.campaign,
      content: utm.content,
      term: utm.term,
      gclid,
      fbc: fbclid ? `fb.1.${now.getTime()}.${fbclid}` : null,
      referrer: refHost,
      landing: url.pathname.slice(0, 200),
      at: now.toISOString()
    }
  }
}

/** Combina la cookie que ya había con el toque de esta visita. */
export function mergeAttribution (prev: Attribution | null, visit: { touch: Touch; direct: boolean }): Attribution | null {
  if (!prev) return { first: visit.touch, last: visit.touch }
  if (visit.direct) return null // nada que actualizar
  return { first: prev.first, last: visit.touch }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v)

const isTouch = (t: any): t is Touch =>
  isUuid(t?.id) && typeof t?.source === 'string' && typeof t?.medium === 'string' && typeof t?.at === 'string'

/**
 * Lee la cookie. Cualquier cosa rara (editada a mano, formato viejo sin id)
 * cuenta como vacía: el siguiente request empieza una atribución nueva.
 */
export function parseAttribution (raw: string | undefined): Attribution | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw)
    if (isTouch(v?.first) && isTouch(v?.last)) return v as Attribution
  } catch {}
  return null
}

const NAMES: Record<string, string> = {
  google: 'Google', facebook: 'Facebook', instagram: 'Instagram', meta: 'Meta',
  bing: 'Bing', yahoo: 'Yahoo', duckduckgo: 'DuckDuckGo', tiktok: 'TikTok',
  youtube: 'YouTube', twitter: 'X', linkedin: 'LinkedIn', whatsapp: 'WhatsApp'
}
const PAID = ['cpc', 'ppc', 'paid', 'paid_social', 'paidsocial', 'display', 'cpm']

/** "Meta · anuncio", "Google · orgánico", "Directo"… para el panel. */
export function originLabel (source: string | null, medium: string | null): string {
  if (!source) return 'Sin datos'
  if (source === 'direct') return 'Directo'
  const name = NAMES[source] ?? source
  if (medium && PAID.includes(medium)) return `${name} · anuncio`
  if (medium === 'organic') return `${name} · orgánico`
  if (medium === 'social') return `${name} · publicación`
  if (medium === 'referral') return `${name} · enlace`
  return name
}
