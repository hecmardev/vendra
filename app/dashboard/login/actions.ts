'use server'

import { redirect } from 'next/navigation'
import { signIn, signOut } from '@/services/auth'

export interface LoginState { error: string | null }

/** Server action de login. En éxito redirige al panel. */
export async function loginAction (_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const { error } = await signIn(email, password)
  if (error) return { error }
  redirect('/dashboard')
}

/** Server action de logout. */
export async function logoutAction (): Promise<void> {
  await signOut()
  redirect('/dashboard/login')
}
