'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentDealer } from '@/services/dealers'
import { updateLeadStatus, updateLeadNotes, markLeadSold, type LeadSaleInput } from '@/services/leads'
import { LEAD_STATUSES, type LeadStatus } from '@/interfaces/lead'

/** Cambia el estado de un lead del dealer autenticado. */
export async function setLeadStatusAction (leadId: string, status: LeadStatus): Promise<{ error?: string }> {
  const dealer = await getCurrentDealer()
  if (!dealer) return { error: 'No autorizado' }
  // Una server action se puede llamar con cualquier valor; el CHECK de la 0010
  // lo rechazaría igual, pero con un error de Postgres en vez de uno legible.
  if (!LEAD_STATUSES.includes(status)) return { error: 'Estado no válido' }
  try {
    await updateLeadStatus(dealer.id, leadId, status)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No se pudo actualizar el estado' }
  }
  revalidatePath('/dashboard/leads')
  return {}
}

/**
 * Marca el lead como vendido (o corrige su venta) y, si se pidió, el auto.
 * `error` = la venta no se guardó. `warning` = sí se guardó, pero el auto no se
 * pudo marcar vendido.
 */
export async function markLeadSoldAction (leadId: string, input: LeadSaleInput): Promise<{ error?: string; warning?: string }> {
  const dealer = await getCurrentDealer()
  if (!dealer) return { error: 'No autorizado' }
  if (!Number.isFinite(input.saleAmount) || input.saleAmount < 0) return { error: 'Escribe el monto de la venta.' }
  const wantsCar = Boolean(input.markCarSold && input.soldCarId)
  let carMarked = false
  try {
    ({ carMarked } = await markLeadSold(dealer.id, leadId, {
      soldCarId: input.soldCarId || null,
      saleAmount: input.saleAmount,
      markCarSold: wantsCar
    }))
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'No se pudo guardar la venta' }
  }
  revalidatePath('/dashboard/leads')
  // Si el auto pasó a vendido, cambia el inventario y el sitio público.
  if (carMarked) {
    revalidatePath('/dashboard/inventario')
    revalidatePath('/', 'layout')
  }
  if (wantsCar && !carMarked) {
    return { warning: 'La venta se guardó, pero no se pudo marcar el auto como vendido. Márcalo desde Inventario.' }
  }
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
