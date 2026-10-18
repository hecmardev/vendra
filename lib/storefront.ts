/**
 * ¿Esta página es el sitio público de un dealer? Lo preguntan los componentes
 * del layout raíz que solo deben actuar ahí (banner de cookies, Pixel, clics de
 * contacto): el layout raíz envuelve también la plataforma y los paneles.
 *
 * Para el navegador. El middleware tiene su propia versión con el mismo
 * criterio (isPlatformHost en middleware.ts).
 */

/** Mismo criterio que isPlatformHost del middleware: ahí no hay dealer. */
export function isPlatformHost (host: string): boolean {
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app')) return true
  const base = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'vendra.com.mx'
  return host === base || host === `www.${base}`
}

/** El panel del dealer y el del admin no son visitas de clientes. */
export const isPanelPath = (path: string): boolean => /^\/(dashboard|admin)(\/|$)/.test(path)

/** Página pública de un dealer, vista desde el navegador. */
export function isStorefrontPage (): boolean {
  if (typeof location === 'undefined') return false
  return !isPlatformHost(location.hostname) && !isPanelPath(location.pathname)
}
