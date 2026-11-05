import { redirect } from 'next/navigation'
import { SettingsView } from 'views/dashboard/settings'
import { getCurrentDealer, getDealerFeatures } from '@/services/dealers'
import { getMetaConfigStatus } from '@/services/metaConfig'
import { mergeContent } from '@/lib/content'
import type { DealerBranding } from '@/lib/branding'
import { hslToHex } from '@/helpers/color'
import { DEMO_DEALER } from '@/constants/dealer'

/** Ajustes del dealer: negocio, marketing, branding y módulos (datos reales). */
export default async function Page () {
  const dealer = await getCurrentDealer()
  if (!dealer) redirect('/dashboard/login')

  const branding = (dealer.branding ?? {}) as DealerBranding
  const { business } = mergeContent(dealer.content)
  let flags: Record<string, boolean> = {}
  try {
    flags = await getDealerFeatures(dealer.id)
  } catch {
    // Sin política de escritura/lectura aún: se muestran apagados.
  }
  const metaStatus = await getMetaConfigStatus(dealer.id)

  const initial = {
    name: dealer.name ?? '',
    whatsapp: dealer.whatsapp_number ?? '',
    phone: business.phone,
    email: business.email,
    address: business.address,
    hours: business.hours,
    domain: dealer.domain ?? '',
    metaPixelId: dealer.meta_pixel_id ?? '',
    metaDomainVerification: dealer.meta_domain_verification ?? '',
    metaTokenConfigured: metaStatus.tokenConfigured,
    metaTestEventCode: metaStatus.testEventCode ?? '',
    legal: {
      legalName: dealer.legal_name ?? '',
      legalAddress: dealer.legal_address ?? '',
      privacyEmail: dealer.privacy_email ?? '',
      privacyPhone: dealer.privacy_phone ?? ''
    },
    primary: hslToHex(branding.primary, '#1e293b'),
    cta: hslToHex(branding.cta, '#dc2626'),
    radius: branding.radius ? parseFloat(branding.radius) : 0.65,
    flags
  }

  return <SettingsView initial={initial} />
}

export const metadata = { title: `Ajustes — ${DEMO_DEALER.name}` }
