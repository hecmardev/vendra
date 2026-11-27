/**
 * ¿Este sitio debe aparecer en buscadores? Tres interruptores, todos apagados por
 * default (el error barato es dejar algo cerrado, no abierto):
 *
 *  1. ALLOW_INDEXING — el general del ambiente. Solo se enciende en producción:
 *     QA y los previews sirven el mismo contenido que el sitio real, y
 *     indexarlos crearía duplicados.
 *  2. ALLOW_PLATFORM_INDEXING — vendra.com.mx. Aparte, para abrir los sitios de
 *     dealers sin abrir la página de Vendra mientras se termina.
 *  3. dealers.allow_indexing (0021) — cada dealer. Lo enciende Vendra desde el
 *     admin cuando su contenido ya es real.
 *
 * Las direcciones *.vercel.app nunca se indexan: duplicarían los dominios reales.
 */

/** El interruptor general del ambiente. */
export function isIndexable (): boolean {
  return process.env.ALLOW_INDEXING === 'true'
}

function isVercelHost (host: string): boolean {
  return host.endsWith('.vercel.app')
}

/** vendra.com.mx (o su www) en este ambiente. */
export function canIndexPlatform (host: string): boolean {
  return isIndexable() && process.env.ALLOW_PLATFORM_INDEXING === 'true' && !isVercelHost(host)
}

/** El sitio de un dealer, con su interruptor del admin. */
export function canIndexDealer (host: string, allowIndexing: boolean | null | undefined): boolean {
  return isIndexable() && allowIndexing === true && !isVercelHost(host)
}
