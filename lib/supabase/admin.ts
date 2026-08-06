import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Cliente Supabase con service-role key. SOLO server, usos puntuales
 * (onboarding de dealers, tareas administrativas). SALTA RLS: nunca
 * exponerlo al navegador ni usarlo para datos con scope de tenant sin
 * filtrar manualmente por dealer_id.
 */
export function createAdminClient () {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
