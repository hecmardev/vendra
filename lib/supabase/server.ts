import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Cliente Supabase para Server Components / Route Handlers.
 * Usa la anon key + RLS y la sesión del usuario vía cookies.
 */
export async function createClient () {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll () {
          return cookieStore.getAll()
        },
        setAll (cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Llamado desde un Server Component: se ignora. El refresh de sesión
            // lo maneja el middleware.
          }
        }
      }
    }
  )
}
