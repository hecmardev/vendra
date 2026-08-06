'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  createDealerAccount,
  updateDealerAsAdmin,
  deleteDealerAccount,
  setDealerActive,
  resetDealerPassword,
  type NewDealerInput,
  type DealerAdminPatch
} from '@/services/admin'

/** Cambiar el estado de un dealer afecta su storefront (deja de resolver). */
function revalidateDealerPaths () {
  revalidatePath('/admin')
  revalidatePath('/', 'layout')
}

/** Alta de un dealer nuevo (dealer + usuario + profile). */
export async function createDealerAction (input: NewDealerInput): Promise<{ error?: string }> {
  if (!input.name.trim() || !input.domain.trim() || !input.email.trim()) {
    return { error: 'Nombre, dominio y correo son obligatorios.' }
  }
  if (input.password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  }

  try {
    await createDealerAccount(input)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No se pudo crear el dealer' }
  }

  revalidatePath('/admin')
  redirect('/admin')
}

export async function updateDealerAction (dealerId: string, patch: DealerAdminPatch): Promise<{ error?: string }> {
  try {
    await updateDealerAsAdmin(dealerId, patch)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No se pudo guardar' }
  }

  revalidatePath('/admin')
  redirect('/admin')
}

export async function deleteDealerAction (dealerId: string): Promise<{ error?: string }> {
  try {
    await deleteDealerAccount(dealerId)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No se pudo eliminar' }
  }

  revalidateDealerPaths()
  return {}
}

/** Restablece la contraseña del dueño de un dealer. Devuelve el correo afectado. */
export async function resetDealerPasswordAction (dealerId: string, newPassword: string): Promise<{ email?: string; error?: string }> {
  if (newPassword.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  try {
    const { email } = await resetDealerPassword(dealerId, newPassword)
    return { email }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No se pudo restablecer la contraseña' }
  }
}

/** Suspende (impago) o reactiva un dealer. */
export async function setDealerActiveAction (dealerId: string, active: boolean): Promise<{ error?: string }> {
  try {
    await setDealerActive(dealerId, active)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No se pudo cambiar el estado' }
  }

  revalidateDealerPaths()
  return {}
}
