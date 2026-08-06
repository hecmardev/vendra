'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentDealer, updateDealer, setDealerFeatures } from '@/services/dealers'
import { hexToHsl } from '@/helpers/color'

export interface SettingsInput {
  name: string
  whatsapp: string
  phone: string
  email: string
  address: string
  hours: string
  metaPixelId: string
  ga4Id: string
  /** Colores en hex (#RRGGBB) y radius en rem. */
  primary: string
  cta: string
  radius: number
  flags: Record<string, boolean>
}

/**
 * Guarda los ajustes del dealer autenticado: negocio, marketing, branding
 * (colores/radius) y módulos. Solo `services/` toca Supabase. Los flags se
 * guardan aparte para que un fallo ahí (p.ej. falta la política 0002) no rompa
 * el guardado del resto.
 */
export async function saveSettingsAction (input: SettingsInput): Promise<{ error?: string; ok?: boolean }> {
  const dealer = await getCurrentDealer()
  if (!dealer) return { error: 'No autorizado' }

  try {
    await updateDealer(dealer.id, {
      name: input.name.trim(),
      whatsapp_number: input.whatsapp.trim() || null,
      meta_pixel_id: input.metaPixelId.trim() || null,
      ga4_measurement_id: input.ga4Id.trim() || null,
      branding: {
        ...(dealer.branding as Record<string, unknown>),
        primary: hexToHsl(input.primary) || undefined,
        cta: hexToHsl(input.cta) || undefined,
        radius: `${input.radius}rem`
      },
      content: {
        ...(dealer.content as Record<string, unknown>),
        business: {
          phone: input.phone.trim(),
          email: input.email.trim(),
          address: input.address.trim(),
          hours: input.hours.trim()
        }
      }
    })
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al guardar' }
  }

  // Los módulos son opcionales: si falla (RLS), avisamos pero el resto ya guardó.
  let flagsWarning: string | undefined
  try {
    await setDealerFeatures(dealer.id, input.flags)
  } catch {
    flagsWarning = 'Los datos se guardaron, pero los módulos no (falta aplicar la migración 0002).'
  }

  revalidatePath('/dashboard/ajustes')
  revalidatePath('/', 'layout') // refresca branding/contenido del storefront
  return flagsWarning ? { error: flagsWarning } : { ok: true }
}
