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
    // Desde la 0013 `leads` apunta dos veces a `cars` (car_id y sold_car_id), así
    // que cada embed tiene que decir por cuál llave: sin eso PostgREST no sabe
    // cuál usar y la consulta falla.
    .select(`*,
      car:cars!leads_car_id_fkey(brand, model, year, price),
      sold_car:cars!leads_sold_car_id_fkey(brand, model, year),
      lead_status_history(from_status, to_status, changed_at)`)
    .eq('dealer_id', dealerId)
    .eq('is_active', true) // oculta los leads descartados (baja lógica)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email ?? null,
    carId: r.car_id ?? null,
    carLabel: r.car ? `${r.car.brand} ${r.car.model} ${r.car.year}` : null,
    carPrice: r.car ? Number(r.car.price) : null,
    status: r.status,
    soldCarId: r.sold_car_id ?? null,
    soldCarLabel: r.sold_car ? `${r.sold_car.brand} ${r.sold_car.model} ${r.sold_car.year}` : null,
    saleAmount: r.sale_amount != null ? Number(r.sale_amount) : null,
    notes: r.notes ?? '', // '' si la columna aún no existe (migración 0004)
    createdAt: r.created_at,
    history: (r.lead_status_history ?? [])
      .map((h: any) => ({ from: h.from_status, to: h.to_status, at: h.changed_at }))
      .sort((a: any, b: any) => a.at.localeCompare(b.at))
  }))
}

/** Cambia el estado del lead (RLS: solo del dealer dueño). */
export async function updateLeadStatus (dealerId: string, leadId: string, status: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('leads').update({ status }).eq('id', leadId).eq('dealer_id', dealerId)
  if (error) throw error
}

export interface LeadSaleInput {
  /** null = compró un auto que no está en el inventario. */
  soldCarId: string | null
  saleAmount: number
  /** Además, marcar `soldCarId` como vendido en el inventario. */
  markCarSold: boolean
}

/**
 * Marca el lead como vendido con su auto y monto (0013). Sirve también para
 * corregir la venta de un lead que ya estaba vendido: en ese caso el estatus no
 * cambia y el historial no registra nada nuevo.
 *
 * Son dos updates sin transacción: si el del auto falla, la venta del lead ya
 * quedó guardada. Se acepta porque el auto se puede marcar a mano desde
 * Inventario. Por eso ese fallo no lanza: se devuelve `carMarked: false` para
 * que la pantalla avise sin tratar la venta como perdida.
 */
export async function markLeadSold (dealerId: string, leadId: string, input: LeadSaleInput): Promise<{ carMarked: boolean }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('leads')
    .update({ status: 'vendido', sold_car_id: input.soldCarId, sale_amount: input.saleAmount })
    .eq('id', leadId)
    .eq('dealer_id', dealerId)
  if (error) throw error

  if (!input.markCarSold || !input.soldCarId) return { carMarked: false }
  const { error: carErr } = await supabase
    .from('cars')
    .update({ status: 'vendido' })
    .eq('id', input.soldCarId)
    .eq('dealer_id', dealerId)
  if (carErr) console.error('[leads] venta guardada, el auto no se pudo marcar vendido:', carErr)
  return { carMarked: !carErr }
}

/** Guarda las notas de seguimiento del lead (requiere la migración 0004). */
export async function updateLeadNotes (dealerId: string, leadId: string, notes: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('leads').update({ notes }).eq('id', leadId).eq('dealer_id', dealerId)
  if (error) throw error
}
