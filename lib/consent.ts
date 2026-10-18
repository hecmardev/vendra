/**
 * Decisión del visitante sobre cookies (aviso de privacidad del dealer, § 6).
 *
 *   sin cookie  -> no ha elegido. Corre la medición propia (vd_vid, vd_attr,
 *                  vistas, clics): es finalidad secundaria con opción de
 *                  rechazo. El Pixel de Meta NO carga: necesita aceptación.
 *   accepted    -> medición propia + Pixel de Meta.
 *   rejected    -> nada: ni medición propia ni Pixel. Los leads se reciben igual.
 *
 * La cookie NO es httpOnly: el banner y el Pixel la leen en el navegador, y el
 * servidor (middleware, /api/*) también. La pone /api/consent, que además borra
 * las cookies de medición al rechazar (son httpOnly: el navegador no puede).
 *
 * Sin dependencias de Node: lo usan el middleware (edge) y componentes cliente.
 */

export const CONSENT_COOKIE = 'vd_consent'
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365

export type Consent = 'accepted' | 'rejected'

export const parseConsent = (v: string | undefined | null): Consent | null =>
  v === 'accepted' || v === 'rejected' ? v : null

/** ¿Se puede medir (cookies propias, vistas, clics)? Todo menos un rechazo explícito. */
export const canMeasure = (c: Consent | null): boolean => c !== 'rejected'

/** ¿Se puede cargar el Pixel de Meta? Solo con aceptación explícita. */
export const canUseMetaPixel = (c: Consent | null): boolean => c === 'accepted'

/** Lee la decisión en el navegador. */
export function readConsentCookie (): Consent | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`))
  return parseConsent(m ? decodeURIComponent(m[1]) : null)
}

/** Evento de ventana: alguien pidió reabrir las preferencias (enlace del pie). */
export const OPEN_CONSENT_EVENT = 'vd:open-consent'
/** Evento de ventana: el visitante acaba de decidir (el Pixel lo escucha). */
export const CONSENT_CHANGED_EVENT = 'vd:consent-changed'
/**
 * Evento de ventana: el visitante mostró interés (abrió la ficha de un auto).
 * El aviso de cookies espera a este momento para aparecer: pedir permiso cuando
 * la persona ya vio que el sitio le sirve se acepta más que al entrar.
 */
export const ENGAGED_EVENT = 'vd:engaged'
