'use server'

import { redirect } from 'next/navigation'
import { signIn, signOut } from '@/services/auth'
import { getPlatformAdmin } from '@/services/admin'

export interface AdminLoginState { error: string | null }

/**
 * Login de plataforma. Además de validar credenciales, exige que el correo esté
 * en PLATFORM_ADMIN_EMAILS: un dealer con sesión válida NO entra al /admin.
 */
export async function adminLoginAction (_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const { error } = await signIn(email, password)
  if (error) return { error }

  const admin = await getPlatformAdmin()
  if (!admin) {
    await signOut()
    return { error: 'Esta cuenta no tiene acceso de plataforma.' }
  }

  redirect('/admin')
}

export async function adminLogoutAction (): Promise<void> {
  await signOut()
  redirect('/admin/login')
}
