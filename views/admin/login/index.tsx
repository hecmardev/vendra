'use client'

import { useActionState } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { adminLoginAction, type AdminLoginState } from '@/app/admin/login/actions'

const initial: AdminLoginState = { error: null }

/** Login del panel de plataforma (superadmin). */
export function AdminLoginView () {
  const [state, action, pending] = useActionState(adminLoginAction, initial)

  return (
    <main className="flex min-h-dvh items-center justify-center bg-primary p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold tracking-tight">Vendra · Plataforma</h1>
          <p className="text-sm text-muted-foreground">Acceso de administración.</p>
        </div>

        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">Correo</label>
            <Input id="email" name="email" type="email" required placeholder="admin@vendra.mx" autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
            <Input id="password" name="password" type="password" required placeholder="••••••••" autoComplete="current-password" />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" variant="cta" size="lg" className="w-full" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      </div>
    </main>
  )
}
