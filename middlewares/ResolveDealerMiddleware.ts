import { NextRequest } from 'next/server'
import type { TenantContext } from '@/lib/tenant'

/**
 * Resuelve el dealer a partir del hostname consultando la tabla `dealers`
 * (por columna `domain`). Corre en el edge; usa la REST API de Supabase con la
 * anon key (política de lectura pública en dealers). El orquestador inyecta el
 * resultado como headers de tenant. Hostname no registrado -> null.
 *
 * TODO(perf): cachear domain -> id (TTL corto) para no consultar en cada request.
 */
export default class ResolveDealerMiddleware {
  async resolve (req: NextRequest): Promise<TenantContext | null> {
    const domain = normalizeHost(req.headers.get('host') ?? '')
    const dealerId = await resolveDealerId(domain)
    if (!dealerId) return null
    return { dealerId, domain }
  }
}

/** Quita el puerto y normaliza el host para el lookup. */
function normalizeHost (host: string): string {
  return host.split(':')[0].toLowerCase()
}

async function resolveDealerId (domain: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null

  try {
    const res = await fetch(
      `${url}/rest/v1/dealers?domain=eq.${encodeURIComponent(domain)}&select=id&limit=1`,
      { headers: { apikey: anon, Authorization: `Bearer ${anon}` } }
    )
    if (!res.ok) return null
    const rows = (await res.json()) as Array<{ id: string }>
    return rows[0]?.id ?? null
  } catch {
    return null
  }
}
