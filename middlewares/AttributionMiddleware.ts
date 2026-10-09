import { NextRequest, NextResponse } from 'next/server'
import {
  ATTR_COOKIE, ATTR_MAX_AGE, VISITOR_COOKIE, VISITOR_MAX_AGE,
  isUuid, mergeAttribution, parseAttribution, touchFromRequest
} from '@/lib/attribution'

/**
 * Anota de dónde llegó el visitante del storefront en cookies propias del
 * dominio del dealer (ver lib/attribution.ts). Solo escribe cuando hay algo
 * nuevo que guardar, así que navegar por el sitio no reescribe cookies.
 *
 * Las cookies son httpOnly: solo las lee el servidor (/api/leads), nunca el
 * JavaScript de la página ni scripts de terceros.
 */
export default class AttributionMiddleware {
  apply (req: NextRequest, res: NextResponse, host: string): void {
    // Los prefetch de <Link> no son visitas: el usuario no ha llegado a esa página.
    if (req.headers.get('next-router-prefetch')) return

    const opts = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    }

    if (!isUuid(req.cookies.get(VISITOR_COOKIE)?.value)) {
      res.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), { ...opts, maxAge: VISITOR_MAX_AGE })
    }

    const prev = parseAttribution(req.cookies.get(ATTR_COOKIE)?.value)
    const next = mergeAttribution(prev, touchFromRequest(req.nextUrl, req.headers.get('referer'), host))
    if (next) res.cookies.set(ATTR_COOKIE, JSON.stringify(next), { ...opts, maxAge: ATTR_MAX_AGE })
  }
}
