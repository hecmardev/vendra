import { createClient } from '@/lib/supabase/server'

/** Inicia sesión (email + contraseña). Devuelve el mensaje de error o null. */
export async function signIn (email: string, password: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error?.message ?? null }
}

/** Cierra la sesión del dealer. */
export async function signOut (): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
