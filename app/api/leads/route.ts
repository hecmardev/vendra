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
  const ALLOWED_SOURCES = new Set(['web_form', 'apartado'])
  const source = ALLOWED_SOURCES.has(body.source) ? String(body.source) : 'web_form'

  // TODO(impl): validar/sanitizar phone/email; rate limiting; Turnstile.
  const lead = await createLead({
    dealerId: dealer.id,
    name: String(body.name),
    phone: String(body.phone),
    email: body.email ?? null,
    carId: body.carId ?? null,
    message: body.message ?? null,
    source
  })

  // Notifica al dealer. A prueba de fallos: nunca rompe la captura del lead.
  try {
    let carLabel: string | undefined
    if (body.carId) {
      const { data: car } = await createAdminClient()
        .from('cars').select('brand, model, year').eq('id', String(body.carId)).maybeSingle()
      if (car) carLabel = `${car.brand} ${car.model} ${car.year}`
    }
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
