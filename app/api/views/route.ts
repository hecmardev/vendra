import { NextRequest, NextResponse } from 'next/server'
import { getDealerByDomain } from '@/services/dealers'
import { recordCarView } from '@/services/views'
import { ATTR_COOKIE, VISITOR_COOKIE, isUuid, parseAttribution } from '@/lib/attribution'
import { CONSENT_COOKIE, canMeasure, parseConsent } from '@/lib/consent'

// Robots que ejecutan JavaScript (previsualizadores, crawlers modernos). La
// señal sale del navegador, así que la mayoría de los bots ni llega aquí; esto
// filtra los que sí.
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|headless|lighthouse/i

/**
 * POST /api/views — la ficha de un auto avisa que se abrió (ver CarViewBeacon).
 * Registra 1 vista en car_views (0016) para este auto, visitante y día.
 *
 * Siempre responde 204: lo llama `navigator.sendBeacon`, que no lee la
 * respuesta, y una vista perdida no debe molestar al visitante.
 */
export async function POST (req: NextRequest) {
  const done = new NextResponse(null, { status: 204 })
  if (BOT.test(req.headers.get('user-agent') ?? '')) return done
  // Rechazó la medición en el aviso de cookies (lib/consent.ts).
  if (!canMeasure(parseConsent(req.cookies.get(CONSENT_COOKIE)?.value))) return done

  // El dealer sale del host, nunca del body (igual que /api/leads).
  const host = (req.headers.get('host') ?? '').split(':')[0].toLowerCase()
  const dealer = await getDealerByDomain(host)
  if (!dealer) return done

  const body = await req.json().catch(() => null)
  const visitorId = req.cookies.get(VISITOR_COOKIE)?.value
  // Sin visitante (cookies bloqueadas) no hay a quién atribuir la vista.
  if (!isUuid(body?.carId) || !isUuid(visitorId)) return done

  await recordCarView({
    dealerId: dealer.id,
    carId: body.carId,
    visitorId,
    attribution: parseAttribution(req.cookies.get(ATTR_COOKIE)?.value)
  })
  return done
}
