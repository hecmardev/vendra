'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronLeft, Loader2, KeyRound, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createDealerAction, updateDealerAction, resetDealerPasswordAction } from '@/app/admin/(panel)/actions'
import type { DealerStats } from '@/services/admin'

function Field ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** Contraseña aleatoria legible (sin caracteres ambiguos) para compartir al dealer. */
function genPassword (): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const arr = new Uint32Array(12)
  crypto.getRandomValues(arr)
  return Array.from(arr, (n) => chars[n % chars.length]).join('')
}

/**
 * Alta y edición de dealers desde el panel de plataforma. En alta se crea
 * además el usuario de acceso; en edición solo se tocan los datos del dealer.
 */
export function DealerFormView ({ dealer }: { dealer?: DealerStats }) {
  const isEdit = Boolean(dealer)

  const [name, setName] = useState(dealer?.name ?? '')
  const [domain, setDomain] = useState(dealer?.domain ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [whatsapp, setWhatsapp] = useState(dealer?.whatsappNumber ?? '')
  const [pixel, setPixel] = useState(dealer?.metaPixelId ?? '')
  const [ga4, setGa4] = useState(dealer?.ga4MeasurementId ?? '')

  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  // Reset de contraseña (solo edición): estado y feedback propios.
  const [newPassword, setNewPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetOk, setResetOk] = useState<{ email: string; password: string } | null>(null)
  const [resetting, startReset] = useTransition()

  const onSave = () => {
    setError('')
    startTransition(async () => {
      const res = isEdit
        ? await updateDealerAction(dealer!.id, { name, domain, whatsappNumber: whatsapp, metaPixelId: pixel, ga4MeasurementId: ga4 })
        : await createDealerAction({ name, domain, email, password })
      if (res?.error) setError(res.error)
    })
  }

  const onResetPassword = () => {
    setResetError('')
    setResetOk(null)
    startReset(async () => {
      const res = await resetDealerPasswordAction(dealer!.id, newPassword)
      if (res.error) setResetError(res.error)
      else setResetOk({ email: res.email ?? '', password: newPassword })
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/admin" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Volver a dealers
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{isEdit ? `Editar ${dealer!.name}` : 'Alta de dealer'}</h1>
      </div>

      <section className="space-y-4 rounded-xl border bg-card p-6">
        <h2 className="font-bold">Negocio</h2>
        <Field label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="AutosMX" />
        </Field>
        <Field label="Dominio" hint="Sin https:// ni barra final. En dev puedes usar algo.localhost">
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="autosmx.com" />
        </Field>
      </section>

      {!isEdit && (
        <section className="space-y-4 rounded-xl border bg-card p-6">
          <div>
            <h2 className="font-bold">Acceso del dealer</h2>
            <p className="text-sm text-muted-foreground">Con estos datos entrará a su panel en {domain || 'su dominio'}/dashboard.</p>
          </div>
          <Field label="Correo">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="dueno@autosmx.com" />
          </Field>
          <Field label="Contraseña" hint="Mínimo 8 caracteres. Compártela con el dealer para que la cambie.">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" placeholder="••••••••" />
          </Field>
        </section>
      )}

      {isEdit && (
        <section className="space-y-4 rounded-xl border bg-card p-6">
          <h2 className="font-bold">Contacto y marketing</h2>
          <Field label="WhatsApp">
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="5215555555555" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Meta Pixel ID">
              <Input value={pixel} onChange={(e) => setPixel(e.target.value)} placeholder="1234567890" />
            </Field>
            <Field label="GA4 Measurement ID">
              <Input value={ga4} onChange={(e) => setGa4(e.target.value)} placeholder="G-XXXXXXX" />
            </Field>
          </div>
        </section>
      )}

      {isEdit && (
        <section className="space-y-4 rounded-xl border bg-card p-6">
          <div>
            <h2 className="flex items-center gap-2 font-bold"><KeyRound className="h-4 w-4" /> Acceso del dealer</h2>
            <p className="text-sm text-muted-foreground">
              Restablece la contraseña si el dealer perdió su acceso. Se aplica a su usuario dueño; compártela para que la cambie.
            </p>
          </div>
          <Field label="Nueva contraseña" hint="Mínimo 8 caracteres.">
            <div className="flex gap-2">
              <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
              <Button type="button" variant="outline" onClick={() => setNewPassword(genPassword())}>Generar</Button>
            </div>
          </Field>

          {resetError && <p className="text-sm text-destructive">{resetError}</p>}
          {resetOk && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-700">Contraseña actualizada para {resetOk.email}.</p>
                <p className="text-muted-foreground">Compártela con el dealer: <code className="rounded bg-background px-1.5 py-0.5 font-mono text-foreground">{resetOk.password}</code></p>
              </div>
            </div>
          )}

          <Button variant="outline" onClick={onResetPassword} disabled={resetting || newPassword.length < 8} className="gap-2">
            {resetting && <Loader2 className="h-4 w-4 animate-spin" />}
            Restablecer contraseña
          </Button>
        </section>
      )}

      {error && <p className="text-right text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        <Button asChild variant="ghost"><Link href="/admin">Cancelar</Link></Button>
        <Button variant="cta" size="lg" onClick={onSave} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar cambios' : 'Crear dealer'}
        </Button>
      </div>
    </div>
  )
}
