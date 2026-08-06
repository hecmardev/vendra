'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentDealer, updateDealer } from '@/services/dealers'
import { uploadCarPhoto } from '@/services/storage'
import type { SiteContent } from '@/constants/defaultContent'

/**
 * Sube la imagen de cabecera del dealer y devuelve su URL. Reutiliza el bucket
 * de imágenes del dealer (mismo prefijo `<dealerId>/`, mismos límites de tipo/peso).
 */
export async function uploadHeaderImageAction (formData: FormData): Promise<{ url?: string; error?: string }> {
  const dealer = await getCurrentDealer()
  if (!dealer) return { error: 'No autorizado' }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: 'No se recibió la imagen.' }

  try {
    return { url: await uploadCarPhoto(dealer.id, file) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No se pudo subir la imagen' }
  }
}

/**
 * Guarda el contenido editable del dealer autenticado en `dealers.content`.
 * Se guarda el objeto completo (no solo los diffs): el editor ya parte del
 * contenido fusionado, así que incluye `business` y no se pierde lo de Ajustes.
 */
export async function saveContentAction (content: SiteContent): Promise<{ error?: string; ok?: boolean }> {
  const dealer = await getCurrentDealer()
  if (!dealer) return { error: 'No autorizado' }

  try {
    await updateDealer(dealer.id, { content: content as unknown as Record<string, unknown> })
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al guardar' }
  }

  revalidatePath('/dashboard/contenido')
  revalidatePath('/', 'layout') // refresca el storefront con el copy nuevo
  return { ok: true }
}
