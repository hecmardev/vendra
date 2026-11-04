'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentDealer, updateDealer, setDealerFeatures } from '@/services/dealers'
import { saveMetaConfig } from '@/services/metaConfig'
import { parseMetaConfig, type MetaConfigInput } from '@/lib/metaConfig'
import { hexToHsl } from '@/helpers/color'

export interface SettingsInput {
  name: string
  whatsapp: string
  phone: string
  email: string
  address: string
  hours: string
  ga4Id: string
  meta: MetaConfigInput
  /** Colores en hex (#RRGGBB) y radius en rem. */
  primary: string
  cta: string
  radius: number
  flags: Record<string, boolean>
}

/**
 * Guarda los ajustes del dealer autenticado: negocio, marketing, Meta, branding
 * (colores/radius) y módulos. Solo `services/` toca Supabase. Los flags se
 * guardan aparte para que un fallo ahí (p.ej. falta la política 0002) no rompa
 * el guardado del resto.
 *
 * El dealer sale siempre de la sesión, nunca del navegador. updateDealer va antes
 * que saveMetaConfig a propósito: pasa por la RLS, así que si esta sesión no puede
 * escribir en su dealer truena ahí, antes de llegar al service role.
 */
export async function saveSettingsAction (input: SettingsInput): Promise<{ error?: string; ok?: boolean }> {
  const dealer = await getCurrentDealer()
  if (!dealer) return { error: 'No autorizado' }

  try {
    // Antes de la primera escritura: un dato mal no deja el guardado a medias.
    const metaConfig = parseMetaConfig(input.meta)

    await updateDealer(dealer.id, {
      name: input.name.trim(),
      whatsapp_number: input.whatsapp.trim() || null,
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

    await saveMetaConfig(dealer.id, metaConfig)
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
