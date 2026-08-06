import { cache } from 'react'
import { getContent } from '@/lib/content'
import { getTenant } from '@/lib/tenant'
import { getDealerById } from '@/services/dealers'
import { DEMO_DEALER } from '@/constants/dealer'

export interface Business {
  name: string
  whatsapp: string
  phone: string
  email: string
  address: string
  hours: string
}

/**
 * Datos de contacto del dealer actual para el sitio público (footer, contacto…).
 * Nombre y WhatsApp salen de columnas de `dealers`; teléfono/correo/dirección/
 * horario del contenido editable (`dealers.content.business`). Sin tenant o sin
 * Supabase -> valores demo. Cacheado por request.
 */
export const getBusiness = cache(async (): Promise<Business> => {
  const { business } = await getContent()
  let dealer: any = null
  try {
    const tenant = await getTenant()
    if (tenant) dealer = await getDealerById(tenant.dealerId)
  } catch {
    // Sin Supabase configurado: se usan defaults.
  }
  return {
    name: dealer?.name ?? DEMO_DEALER.name,
    whatsapp: dealer?.whatsapp_number ?? DEMO_DEALER.whatsapp,
    phone: business.phone,
    email: business.email,
    address: business.address,
    hours: business.hours
  }
})
