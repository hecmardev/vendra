'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Status = 'idle' | 'loading' | 'success' | 'error'

/**
 * Formulario de leads. Postea a /api/leads (el dealer_id lo pone el server desde
 * el tenant, nunca el cliente). `carId`/`carLabel` opcionales para prellenar
 * desde una ficha de auto.
 */
export function LeadForm ({ carId, carLabel, source }: { carId?: string; carLabel?: string; source?: string }) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function onSubmit (e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setError('')
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          phone: form.get('phone'),
          email: form.get('email'),
          message: form.get('message'),
          carId,
          source
        })
      })
      if (!res.ok) throw new Error('No se pudo enviar. Intenta de nuevo.')
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-cta" />
        <h3 className="font-semibold">¡Gracias! Te contactaremos pronto.</h3>
        <p className="text-sm text-muted-foreground">Recibimos tus datos correctamente.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {carLabel && (
        <p className="rounded-md bg-secondary px-3 py-2 text-sm">
          Auto de interés: <span className="font-medium">{carLabel}</span>
        </p>
      )}
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">Nombre <span className="text-cta">*</span></label>
        <Input id="name" name="name" required placeholder="Tu nombre" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-medium">Teléfono <span className="text-cta">*</span></label>
          <Input id="phone" name="phone" type="tel" required placeholder="55 1234 5678" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">Correo</label>
          <Input id="email" name="email" type="email" placeholder="tu@correo.com" />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="message" className="text-sm font-medium">Mensaje</label>
        <textarea
          id="message" name="message" rows={4}
          placeholder="¿En qué te podemos ayudar?"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {status === 'error' && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" variant="cta" size="lg" className="w-full" disabled={status === 'loading'}>
        {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
        Enviar
      </Button>
    </form>
  )
}
