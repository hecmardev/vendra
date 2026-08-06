import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Lead } from '@/interfaces/lead'

export interface CreateLeadInput {
  dealerId: string
  name: string
  phone: string
  email?: string | null
  carId?: string | null
  message?: string | null
  source?: string
}

/**
 * Inserta un lead. El dealer_id lo provee el caller (API route) desde el tenant
 * resuelto por el middleware, nunca desde el body del cliente.
 */
export async function createLead (input: CreateLeadInput) {
  // Service-role: no hay policy de INSERT público en `leads` (a propósito).
  // Seguro porque solo se llama server-side con un dealerId ya validado
  // contra el tenant del middleware.
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('leads')
    .insert({
      dealer_id: input.dealerId,
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      car_id: input.carId ?? null,
      message: input.message ?? null,
      source: input.source ?? 'web_form',
      status: 'nuevo'
    })
    .select()
    .single()
  if (error) throw error
  return data
}

/** Leads del dealer autenticado (RLS: solo ve los suyos), mapeados a la UI. */
export async function listLeads (dealerId: string): Promise<Lead[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*, cars(brand, model, year)')
    .eq('dealer_id', dealerId)
    .eq('is_active', true) // oculta los leads descartados (baja lógica)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email ?? null,
    carLabel: r.cars ? `${r.cars.brand} ${r.cars.model} ${r.cars.year}` : null,
    status: r.status,
    notes: r.notes ?? '', // '' si la columna aún no existe (migración 0004)
    createdAt: r.created_at
  }))
}

/** Cambia el estado del lead (RLS: solo del dealer dueño). */
export async function updateLeadStatus (dealerId: string, leadId: string, status: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('leads').update({ status }).eq('id', leadId).eq('dealer_id', dealerId)
  if (error) throw error
}

/** Guarda las notas de seguimiento del lead (requiere la migración 0004). */
export async function updateLeadNotes (dealerId: string, leadId: string, notes: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('leads').update({ notes }).eq('id', leadId).eq('dealer_id', dealerId)
  if (error) throw error
}
