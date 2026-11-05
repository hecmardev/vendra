import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { DealerPrivacyNotice } from 'views/legal/DealerPrivacyNotice'
import { getCurrentDealerLegal } from '@/components/providers/DealerLegal'
import { getVendraLegal } from '@/lib/vendraLegal'

export async function generateMetadata (): Promise<Metadata> {
  const legal = await getCurrentDealerLegal()
  return { title: legal ? `Aviso de privacidad — ${legal.commercialName}` : 'Aviso de privacidad' }
}

/** Aviso de privacidad del dealer de este dominio. No se publica con datos incompletos. */
export default async function Page () {
  const legal = await getCurrentDealerLegal()
  if (!legal) notFound()
  return <DealerPrivacyNotice legal={legal} vendraName={getVendraLegal()?.responsible ?? null} />
}
