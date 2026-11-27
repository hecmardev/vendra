import { headers } from 'next/headers'

/**
 * Host y origen de la petición actual (`https://su-dominio.com`). Para
 * robots.txt y sitemap.xml, donde el middleware no corre (su matcher excluye
 * rutas con punto) y por eso no hay headers de tenant.
 */
export async function requestOrigin (): Promise<{ host: string; origin: string }> {
  const h = await headers()
  const host = (h.get('x-forwarded-host') ?? h.get('host') ?? '').split(',')[0].trim().toLowerCase()
  const bare = host.split(':')[0]
  const local = bare === 'localhost' || bare === '127.0.0.1' || bare.endsWith('.localhost')
  const proto = (h.get('x-forwarded-proto') ?? (local ? 'http' : 'https')).split(',')[0].trim()
  return { host: bare, origin: `${proto}://${host}` }
}
