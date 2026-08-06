'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { hexToHsl } from '@/helpers/color'
import { saveSettingsAction, type SettingsInput } from '@/app/dashboard/(panel)/ajustes/actions'

/** Interruptor on/off (feature flags). */
function Switch ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-cta' : 'bg-input')}
    >
      <span className={cn('absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0')} />
    </button>
  )
}

const MODULES = [
  { key: 'financiamiento', label: 'Calculadora de financiamiento', desc: 'Muestra un simulador de mensualidades en cada auto.' },
  { key: 'seccion_personalizada', label: 'Sección personalizada', desc: 'Habilita una sección extra a tu medida (se cotiza aparte).' },
  { key: 'ia_whatsapp', label: 'Asistente de IA por WhatsApp', desc: 'Un bot responde preguntas básicas usando tu inventario.' }
]

function Section ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="mb-4">
        <h2 className="font-bold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function Field ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

export interface SettingsInitial {
  name: string
  whatsapp: string
  phone: string
  email: string
  address: string
  hours: string
  metaPixelId: string
  ga4Id: string
  primary: string
  cta: string
  radius: number
  flags: Record<string, boolean>
}

/**
 * Ajustes del dealer: negocio, marketing, módulos y tema/colores. Carga los
 * valores reales (props) y guarda vía server action (services/ toca Supabase).
 */
export function SettingsView ({ initial }: { initial: SettingsInitial }) {
  const [name, setName] = useState(initial.name)
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp)
  const [phone, setPhone] = useState(initial.phone)
  const [email, setEmail] = useState(initial.email)
  const [address, setAddress] = useState(initial.address)
  const [hours, setHours] = useState(initial.hours)
  const [metaPixelId, setMetaPixelId] = useState(initial.metaPixelId)
  const [ga4Id, setGa4Id] = useState(initial.ga4Id)
  const [primary, setPrimary] = useState(initial.primary)
  const [cta, setCta] = useState(initial.cta)
  const [radius, setRadius] = useState(initial.radius)
  const [flags, setFlags] = useState<Record<string, boolean>>(initial.flags)

  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  // Vars aplicadas SOLO al recuadro de preview (no afecta el resto del panel).
  const previewStyle = {
    '--primary': hexToHsl(primary),
    '--cta': hexToHsl(cta),
    '--radius': `${radius}rem`
  } as React.CSSProperties

  const onSave = () => {
    setError('')
    setSaved(false)
    const input: SettingsInput = {
      name, whatsapp, phone, email, address, hours,
      metaPixelId, ga4Id, primary, cta, radius, flags
    }
    startTransition(async () => {
      const res = await saveSettingsAction(input)
      if (res?.error) setError(res.error)
      else setSaved(true)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ajustes</h1>
        <p className="text-sm text-muted-foreground">Configura tu negocio, marketing y la apariencia de tu sitio.</p>
      </div>

      {/* Negocio */}
      <Section title="Información del negocio">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="WhatsApp"><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="5215555555555" /></Field>
          <Field label="Teléfono"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="Correo"><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></Field>
          <Field label="Dirección"><Input value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
          <Field label="Horario"><Input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Lun–Sáb 9:00–19:00" /></Field>
        </div>
      </Section>

      {/* Marketing */}
      <Section title="Integraciones de marketing" description="Tus propios IDs para tracking. Vendra dispara el pixel/GA4 correcto según tu dominio.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Meta Pixel ID"><Input value={metaPixelId} onChange={(e) => setMetaPixelId(e.target.value)} placeholder="1234567890" /></Field>
          <Field label="GA4 Measurement ID"><Input value={ga4Id} onChange={(e) => setGa4Id(e.target.value)} placeholder="G-XXXXXXX" /></Field>
        </div>
      </Section>

      {/* Módulos (feature flags) */}
      <Section title="Módulos" description="Activa funciones opcionales de tu paquete.">
        <div className="space-y-3">
          {MODULES.map((m) => (
            <div key={m.key} className="flex items-start justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
              <Switch checked={!!flags[m.key]} onChange={(v) => setFlags((f) => ({ ...f, [m.key]: v }))} />
            </div>
          ))}
        </div>
      </Section>

      {/* Tema */}
      <Section title="Tema y colores" description="Personaliza la apariencia de tu sitio público.">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Controles */}
          <div className="space-y-4">
            <Field label="Color principal">
              <div className="flex items-center gap-3">
                <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-10 w-14 cursor-pointer rounded border bg-background" />
                <Input value={primary} onChange={(e) => setPrimary(e.target.value)} className="font-mono" />
              </div>
            </Field>
            <Field label="Color de acción (CTA)">
              <div className="flex items-center gap-3">
                <input type="color" value={cta} onChange={(e) => setCta(e.target.value)} className="h-10 w-14 cursor-pointer rounded border bg-background" />
                <Input value={cta} onChange={(e) => setCta(e.target.value)} className="font-mono" />
              </div>
            </Field>
            <Field label={`Redondez de bordes: ${radius}rem`}>
              <input type="range" min={0} max={1.5} step={0.05} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-[hsl(var(--cta))]" />
            </Field>
          </div>

          {/* Preview */}
          <div style={previewStyle} className="flex flex-col gap-3 rounded-[var(--radius)] border bg-background p-5">
            <p className="text-xs font-medium text-muted-foreground">Vista previa</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="default" size="sm">Principal</Button>
              <Button variant="cta" size="sm">Acción</Button>
              <Badge variant="cta">Nuevo</Badge>
            </div>
            <div className="rounded-[var(--radius)] border p-3 text-sm">
              <p className="font-semibold">Tarjeta de ejemplo</p>
              <p className="text-muted-foreground">Así se verían tus componentes.</p>
            </div>
          </div>
        </div>
      </Section>

      <div className="flex items-center justify-end gap-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && !error && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600">
            <Check className="h-4 w-4" /> Cambios guardados
          </p>
        )}
        <Button variant="cta" size="lg" onClick={onSave} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
