import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { VendraPrivacyNotice } from 'views/legal/VendraPrivacyNotice'
import { getVendraLegal } from '@/lib/vendraLegal'

export const metadata: Metadata = { title: 'Aviso de privacidad — Vendra' }

/** vendra.com.mx/aviso-de-privacidad. No se publica sin los datos de Vendra (LEGAL_VENDRA_*). */
export default function Page () {
  const legal = getVendraLegal()
  if (!legal) notFound()
  return <VendraPrivacyNotice legal={legal} />
}
