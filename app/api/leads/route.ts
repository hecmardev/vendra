import { NextRequest, NextResponse } from 'next/server'
import { getDealerByDomain } from '@/services/dealers'
import { createLead } from '@/services/leads'
import { notifyNewLead } from '@/services/notifications'
import { createAdminClient } from '@/lib/supabase/admin'
import { mergeContent } from '@/lib/content'

/**
 * POST /api/leads — captura un lead desde el sitio público.
 * El middleware NO corre en /api, así que el dealer se resuelve desde el Host
 * de la petición (server-side, no del body) para evitar inserts cruzados.
 */
export async function POST (req: NextRequest) {
  const host = (req.headers.get('host') ?? '').split(':')[0].toLowerCase()
  const dealer = await getDealerByDomain(host)
  if (!dealer) {
    return NextResponse.json({ error: 'Unknown dealer' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.name || !body?.phone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 })
  }

  // Origen del lead, validado contra una lista blanca (no confiar en el body).
  // 'whatsapp' = el visitante dejó sus datos ANTES de abrir el chat. Importa
  // distinguirlo: ese lead puede no tener conversación detrás si nunca llegó a
  // enviar el mensaje, y el teléfono es lo único con lo que el dealer lo alcanza.
  const ALLOWED_SOURCES = new Set(['web_form', 'apartado', 'whatsapp'])
  const source = ALLOWED_SOURCES.has(body.source) ? String(body.source) : 'web_form'

  // El auto de interés viene del navegador: solo se acepta si es un auto de
  // ESTE dealer. Si no, el lead se guarda sin auto en vez de perderse (el
  // trigger de la 0013 rechazaría el insert completo). La forma de uuid se
  // revisa antes porque Postgres truena con un id mal formado.
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  let car: { id: string; brand: string; model: string; year: number } | null = null
  if (typeof body.carId === 'string' && UUID.test(body.carId)) {
    const { data } = await createAdminClient()
      .from('cars').select('id, brand, model, year')
      .eq('id', body.carId).eq('dealer_id', dealer.id).maybeSingle()
    car = data
  }

  // TODO(impl): validar/sanitizar phone/email; rate limiting; Turnstile.
  const lead = await createLead({
    dealerId: dealer.id,
    name: String(body.name),
    phone: String(body.phone),
    email: body.email ?? null,
    carId: car?.id ?? null,
    message: body.message ?? null,
    source
  })

  // Notifica al dealer. A prueba de fallos: nunca rompe la captura del lead.
  try {
    const carLabel = car ? `${car.brand} ${car.model} ${car.year}` : undefined
    const proto = host === 'localhost' || host.endsWith('.localhost') ? 'http' : 'https'
    await notifyNewLead({
      to: mergeContent(dealer.content).business.email,
      dealerName: dealer.name,
      lead: { name: String(body.name), phone: String(body.phone), email: body.email ?? null, message: body.message ?? null, source },
      carLabel,
      leadsUrl: `${proto}://${req.headers.get('host')}/dashboard/leads`
    })
  } catch (e) {
    console.error('[api/leads] fallo notificando (ignorado):', e)
  }

  return NextResponse.json({ ok: true, lead }, { status: 201 })
}
