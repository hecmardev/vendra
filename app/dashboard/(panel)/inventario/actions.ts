'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getCurrentDealer } from '@/services/dealers'
import { createCar, updateCar, deleteCar, setCarStatus, type CarInput } from '@/services/cars'
import { uploadCarPhoto } from '@/services/storage'

/**
 * Revalida panel + storefront. Un cambio de auto afecta el inventario, el
 * catálogo, la home (destacados), la ficha y el footer ("últimos autos", que va
 * en todas las páginas), por eso se invalida todo el árbol del layout raíz.
 */
function revalidateCarPaths () {
  revalidatePath('/dashboard/inventario')
  revalidatePath('/', 'layout')
}

/** Crea o actualiza un auto del dealer autenticado. En éxito vuelve al inventario. */
export async function saveCarAction (carId: string | null, input: CarInput): Promise<{ error: string } | void> {
  const dealer = await getCurrentDealer()
  if (!dealer) return { error: 'No autorizado' }
  try {
    if (carId) await updateCar(dealer.id, carId, input)
    else await createCar(dealer.id, input)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Error al guardar' }
  }
  revalidateCarPaths()
  redirect('/dashboard/inventario')
}

/**
 * Sube una foto del auto al bucket del dealer autenticado y devuelve su URL.
 * La foto se guarda en `car_images` hasta que se guarda el auto.
 */
export async function uploadCarPhotoAction (formData: FormData): Promise<{ url?: string; error?: string }> {
  const dealer = await getCurrentDealer()
  if (!dealer) return { error: 'No autorizado' }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { error: 'No se recibió la foto.' }

  try {
    return { url: await uploadCarPhoto(dealer.id, file) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No se pudo subir la foto' }
  }
}

export async function deleteCarAction (carId: string): Promise<void> {
  const dealer = await getCurrentDealer()
  if (!dealer) return
  await deleteCar(dealer.id, carId)
  revalidateCarPaths()
}

export async function setCarStatusAction (carId: string, status: string): Promise<void> {
  const dealer = await getCurrentDealer()
  if (!dealer) return
  await setCarStatus(dealer.id, carId, status)
  revalidateCarPaths()
}
