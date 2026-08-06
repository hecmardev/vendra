import { headers } from 'next/headers'

/** Headers internos inyectados por ResolveDealerMiddleware. */
export const DEALER_ID_HEADER = 'x-dealer-id'
export const DEALER_DOMAIN_HEADER = 'x-dealer-domain'

export interface TenantContext {
  dealerId: string
  domain: string
}

/**
 * Lee el tenant resuelto por el middleware desde los headers de la request.
 * Los Server Components y Route Handlers lo usan para SIEMPRE filtrar por dealer_id.
 * Devuelve null si el host no corresponde a ningún dealer registrado.
 */
export async function getTenant (): Promise<TenantContext | null> {
  const h = await headers()
  const dealerId = h.get(DEALER_ID_HEADER)
  const domain = h.get(DEALER_DOMAIN_HEADER)
  if (!dealerId || !domain) return null
  return { dealerId, domain }
}

/**
 * Igual que getTenant pero lanza si no hay tenant. Úsalo en páginas que
 * asumen un dealer válido (todo el sitio público y el dashboard).
 */
export async function requireTenant (): Promise<TenantContext> {
  const tenant = await getTenant()
  if (!tenant) throw new Error('No dealer resolved for this request')
  return tenant
}
