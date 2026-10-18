import { NextRequest, NextResponse } from 'next/server'
import { CONSENT_COOKIE, CONSENT_MAX_AGE, parseConsent } from '@/lib/consent'
import { ATTR_COOKIE, VISITOR_COOKIE } from '@/lib/attribution'

/**
 * POST /api/consent { decision: 'accepted' | 'rejected' } — guarda lo que el
 * visitante eligió en el aviso de cookies (ver lib/consent.ts).
 *
 * Va por el servidor y no por document.cookie porque al rechazar hay que BORRAR
 * vd_vid y vd_attr, que son httpOnly: el JavaScript de la página no las ve ni
 * las puede tocar. Las cookies de Meta (_fbp, _fbc) son del Pixel: si el
 * visitante rechaza, el Pixel deja de cargarse y ya no se renuevan.
 */
export async function POST (req: NextRequest) {
  const body = await req.json().catch(() => null)
  const decision = parseConsent(body?.decision)
  if (!decision) return NextResponse.json({ error: 'Decisión no válida' }, { status: 400 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(CONSENT_COOKIE, decision, {
    httpOnly: false, // el banner y el Pixel la leen en el navegador
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CONSENT_MAX_AGE
  })
  if (decision === 'rejected') {
    res.cookies.delete(VISITOR_COOKIE)
    res.cookies.delete(ATTR_COOKIE)
  }
  return res
}
