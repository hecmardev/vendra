import { NextRequest, NextResponse } from 'next/server'
import { getDealerByDomain } from '@/services/dealers'
import { recordContactClick, CONTACT_CHANNELS, type ContactChannel } from '@/services/contactClicks'
import { ATTR_COOKIE, VISITOR_COOKIE, isUuid, parseAttribution } from '@/lib/attribution'

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse/i

/**
 * POST /api/contact-clicks — el visitante tocó WhatsApp, teléfono, correo o la
 * dirección (ver ContactClickTracker). Registra el clic en contact_clicks (0017).
 *
 * Siempre responde 204: lo llama `sendBeacon`, que no lee la respuesta.
 */
export async function POST (req: NextRequest) {
  const done = new NextResponse(null, { status: 204 })
  if (BOT.test(req.headers.get('user-agent') ?? '')) return done

  // El dealer sale del host, nunca del body. En el host de plataforma no hay
  // dealer y el clic se ignora.
  const host = (req.headers.get('host') ?? '').split(':')[0].toLowerCase()
  const dealer = await getDealerByDomain(host)
  if (!dealer) return done

  const body = await req.json().catch(() => null)
  const visitorId = req.cookies.get(VISITOR_COOKIE)?.value
  const channel = body?.channel as ContactChannel
  const path = typeof body?.path === 'string' && body.path.startsWith('/') ? body.path : null
  if (!isUuid(visitorId) || !CONTACT_CHANNELS.includes(channel) || !path) return done

  await recordContactClick({
    dealerId: dealer.id,
    visitorId,
    channel,
    placement: body?.placement === 'pie' ? 'pie' : 'pagina',
    path,
    attribution: parseAttribution(req.cookies.get(ATTR_COOKIE)?.value)
  })
  return done
}
