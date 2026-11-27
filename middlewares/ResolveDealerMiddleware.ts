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
  async resolve (req: NextRequest): Promise<ResolvedDealer | null> {
    const domain = normalizeHost(req.headers.get('host') ?? '')
    const row = await resolveDealer(domain)
    if (!row) return null
    return { dealerId: row.id, domain, allowIndexing: row.allow_indexing === true }
  }
}

/** El tenant más lo que el middleware necesita para decidir la indexación (0021). */
export interface ResolvedDealer extends TenantContext {
  allowIndexing: boolean
}

/** Quita el puerto y normaliza el host para el lookup. */
function normalizeHost (host: string): string {
  return host.split(':')[0].toLowerCase()
}

async function resolveDealer (domain: string): Promise<{ id: string; allow_indexing?: boolean } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null

  const query = (select: string) => fetch(
    `${url}/rest/v1/dealers?domain=eq.${encodeURIComponent(domain)}&select=${select}&limit=1`,
    { headers: { apikey: anon, Authorization: `Bearer ${anon}` } }
  )

  try {
    let res = await query('id,allow_indexing')
    // Sin la 0021 la columna no existe y la consulta falla: se resuelve el dealer
    // igual, sin indexar. Así un deploy antes de la migración no tira los sitios.
    if (!res.ok) res = await query('id')
    if (!res.ok) return null
    const rows = (await res.json()) as Array<{ id: string; allow_indexing?: boolean }>
    return rows[0] ?? null
  } catch {
    return null
  }
}
