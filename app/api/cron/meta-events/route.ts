import { NextRequest, NextResponse } from 'next/server'
import { sendPendingMetaEvents } from '@/services/metaCapi'

/**
 * GET /api/cron/meta-events — reintenta los eventos de Meta que quedaron
 * pendientes (0019). Lo llama Vercel Cron (vercel.json), que manda
 * `Authorization: Bearer $CRON_SECRET`.
 *
 * Sin CRON_SECRET configurado responde 401: es mejor que no corra a que
 * cualquiera lo pueda disparar.
 */
export async function GET (req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  return NextResponse.json(await sendPendingMetaEvents({ limit: 500 }))
}
