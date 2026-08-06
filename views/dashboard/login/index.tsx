'use client'

import { useActionState } from 'react'
import { Car, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { loginAction, type LoginState } from '@/app/dashboard/login/actions'

const initial: LoginState = { error: null }

/** Login del panel del dealer (Supabase Auth vía server action). */
export function LoginView () {
  const [state, action, pending] = useActionState(loginAction, initial)

  return (
    <main className="flex min-h-dvh items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Car className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold tracking-tight">Panel de vendedor</h1>
          <p className="text-sm text-muted-foreground">Inicia sesión para gestionar tu inventario.</p>
        </div>

        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">Correo</label>
            <Input id="email" name="email" type="email" required placeholder="tu@correo.com" autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
            <Input id="password" name="password" type="password" required placeholder="••••••••" autoComplete="current-password" />
          </div>

          {state.error && <p className="text-sm text-destructive">Correo o contraseña incorrectos.</p>}

          <Button type="submit" variant="cta" size="lg" className="w-full" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      </div>
    </main>
  )
}
