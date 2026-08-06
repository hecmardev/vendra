'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentDealer } from '@/services/dealers'
import { updateLeadStatus, updateLeadNotes } from '@/services/leads'
import type { LeadStatus } from '@/interfaces/lead'

/** Cambia el estado de un lead del dealer autenticado. */
export async function setLeadStatusAction (leadId: string, status: LeadStatus): Promise<{ error?: string }> {
  const dealer = await getCurrentDealer()
  if (!dealer) return { error: 'No autorizado' }
  try {
    await updateLeadStatus(dealer.id, leadId, status)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No se pudo actualizar el estado' }
  }
  revalidatePath('/dashboard/leads')
  return {}
}

/** Guarda las notas de un lead. Requiere la migración 0004 (columna notes). */
export async function saveLeadNotesAction (leadId: string, notes: string): Promise<{ error?: string }> {
  const dealer = await getCurrentDealer()
  if (!dealer) return { error: 'No autorizado' }
  try {
    await updateLeadNotes(dealer.id, leadId, notes)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'No se pudieron guardar las notas'
    return { error: /column .*notes.* does not exist/i.test(msg) ? 'Falta aplicar la migración 0004 para las notas.' : msg }
  }
  revalidatePath('/dashboard/leads')
  return {}
}
