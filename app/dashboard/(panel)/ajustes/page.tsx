import { redirect } from 'next/navigation'
import { SettingsView } from 'views/dashboard/settings'
import { getCurrentDealer, getDealerFeatures } from '@/services/dealers'
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

  const initial = {
    name: dealer.name ?? '',
    whatsapp: dealer.whatsapp_number ?? '',
    phone: business.phone,
    email: business.email,
    address: business.address,
    hours: business.hours,
    metaPixelId: dealer.meta_pixel_id ?? '',
    ga4Id: dealer.ga4_measurement_id ?? '',
    primary: hslToHex(branding.primary, '#1e293b'),
    cta: hslToHex(branding.cta, '#dc2626'),
    radius: branding.radius ? parseFloat(branding.radius) : 0.65,
    flags
  }

  return <SettingsView initial={initial} />
}

export const metadata = { title: `Ajustes — ${DEMO_DEALER.name}` }
