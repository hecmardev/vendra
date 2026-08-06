import { createClient } from '@/lib/supabase/server'
import type { DealerBranding } from '@/lib/branding'

/**
 * Operaciones sobre `dealers`. La resolución hostname->dealer del middleware
 * usará una variante cacheada de getDealerByDomain.
 */
export async function getDealerByDomain (domain: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dealers')
    .select('*')
    .eq('domain', domain)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Dealer activo por id. Un dealer suspendido o dado de baja devuelve null: su
 * storefront deja de personalizarse y, vía getCurrentDealer, tampoco entra al
 * panel. Para gestionarlo desde plataforma se usa services/admin.ts (service-role).
 */
export async function getDealerById (dealerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dealers')
    .select('*')
    .eq('id', dealerId)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Dealer del usuario autenticado (sesión -> profiles -> dealer). Null si no hay
 * sesión, si el profile está dado de baja, o si el dealer está inactivo
 * (suspendido/eliminado). Lo usa el panel del dealer.
 */
export async function getCurrentDealer () {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('dealer_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()
  if (!profile) return null
  return getDealerById(profile.dealer_id)
}

/* ---------- Escritura de ajustes (dealer autenticado; RLS owner) ---------- */

export interface DealerUpdate {
  name?: string
  whatsapp_number?: string | null
  meta_pixel_id?: string | null
  ga4_measurement_id?: string | null
  branding?: DealerBranding
  content?: Record<string, unknown>
}

/**
 * Actualiza los ajustes del dealer autenticado. La RLS (`dealers_owner_write`)
 * garantiza que solo pueda tocar su propia fila. Solo se envían los campos
 * presentes en `patch`.
 */
export async function updateDealer (dealerId: string, patch: DealerUpdate) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dealers')
    .update(patch)
    .eq('id', dealerId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

/** Feature flags del dealer como mapa { key: enabled }. */
export async function getDealerFeatures (dealerId: string): Promise<Record<string, boolean>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dealer_features')
    .select('key, enabled')
    .eq('dealer_id', dealerId)
  if (error) throw error
  return Object.fromEntries((data ?? []).map((r: any) => [r.key, r.enabled]))
}

/** Upsert de feature flags del dealer (RLS owner mediante políticas de escritura). */
export async function setDealerFeatures (dealerId: string, flags: Record<string, boolean>): Promise<void> {
  const supabase = await createClient()
  const rows = Object.entries(flags).map(([key, enabled]) => ({ dealer_id: dealerId, key, enabled }))
  if (rows.length === 0) return
  const { error } = await supabase
    .from('dealer_features')
    .upsert(rows, { onConflict: 'dealer_id,key' })
  if (error) throw error
}
