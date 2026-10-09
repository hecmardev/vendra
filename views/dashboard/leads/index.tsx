'use client'

import { useState, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { Phone, Mail, X, Car, Check, Loader2 } from 'lucide-react'
import { WhatsAppIcon } from '@/components/common/whatsapp-cta/icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/helpers/format'
import { originLabel } from '@/lib/attribution'
import { setLeadStatusAction, saveLeadNotesAction, markLeadSoldAction } from '@/app/dashboard/(panel)/leads/actions'
import { LEAD_STATUSES, type Lead, type LeadStatus } from '@/interfaces/lead'
import { SaleForm, type SaleOption, type SaleInput } from './SaleForm'

// Nuevo resalta porque es lo que hay que atender; perdido se apaga porque ya no.
const STATUS_VARIANT: Record<LeadStatus, 'cta' | 'secondary' | 'default' | 'outline'> = {
  nuevo: 'cta',
  contactado: 'secondary',
  cita: 'secondary',
  vendido: 'default',
  perdido: 'outline'
}

/** Por cuál formulario del sitio entró (`leads.source`). */
const FORM_LABEL: Record<string, string> = {
  web_form: 'Formulario de contacto',
  apartado: 'Botón Apartar',
  whatsapp: 'WhatsApp (dejó sus datos)'
}

function formatDate (iso: string) {
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

/** Leads del dealer: métricas + tabla + panel de detalle con gestión de estado. */
export function LeadsView ({ leads: initialLeads, saleOptions }: { leads: Lead[]; saleOptions: SaleOption[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [error, setError] = useState('')
  const [notesSaved, setNotesSaved] = useState(false)
  // "Vendido" no cambia el estatus de un clic: abre la captura de la venta.
  const [selling, setSelling] = useState(false)
  const [pending, startTransition] = useTransition()
  const selected = leads.find((l) => l.id === selectedId) ?? null

  const openLead = (id: string | null) => {
    setSelectedId(id)
    setSelling(false)
    setError('')
  }

  const count = (s: LeadStatus) => leads.filter((l) => l.status === s).length
  const stats = [
    { label: 'Total', value: leads.length },
    { label: 'Nuevos', value: count('nuevo') },
    { label: 'Citas', value: count('cita') },
    { label: 'Vendidos', value: count('vendido') }
  ]

  /** Cambia el estado: optimista en UI + persiste en la BD. */
  const setStatus = (id: string, status: LeadStatus) => {
    const lead = leads.find((l) => l.id === id)
    if (!lead || lead.status === status) return // el trigger tampoco registra un "cambio" al mismo estatus
    setError('')
    // El renglón real lo escribe el trigger de la 0011; este solo lo adelanta en
    // pantalla y se reemplaza al revalidar.
    const change = { from: lead.status, to: status, at: new Date().toISOString() }
    // Al salir de vendido, el trigger de la 0013 borra el auto y el monto de la
    // venta: aquí se refleja igual para que la pantalla no muestre una venta
    // que ya no cuenta.
    const sale = { soldCarId: null, soldCarLabel: null, saleAmount: null }
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...sale, status, history: [...l.history, change] } : l)))
    startTransition(async () => {
      const res = await setLeadStatusAction(id, status)
      if (res?.error) setError(res.error)
    })
  }

  /** Guarda la venta (y el estatus vendido, si no lo estaba). */
  const confirmSale = (lead: Lead, input: SaleInput) => {
    setError('')
    const soldCarLabel = input.soldCarId
      ? (input.soldCarId === lead.carId ? lead.carLabel : saleOptions.find((o) => o.id === input.soldCarId)?.label ?? lead.soldCarLabel)
      : null
    const history = lead.status === 'vendido'
      ? lead.history
      : [...lead.history, { from: lead.status, to: 'vendido' as const, at: new Date().toISOString() }]
    startTransition(async () => {
      const res = await markLeadSoldAction(lead.id, {
        soldCarId: input.soldCarId || null,
        saleAmount: input.saleAmount,
        markCarSold: input.markCarSold
      })
      if (res?.error) {
        setError(res.error)
        return
      }
      // La venta sí se guardó aunque el auto no se haya marcado: se avisa igual.
      if (res?.warning) setError(res.warning)
      setLeads((ls) => ls.map((l) => (l.id === lead.id
        ? { ...l, status: 'vendido', soldCarId: input.soldCarId || null, soldCarLabel, saleAmount: input.saleAmount, history }
        : l)))
      setSelling(false)
    })
  }

  /** Guarda las notas (al salir del campo) si cambiaron. */
  const saveNotes = (id: string, notes: string) => {
    const current = leads.find((l) => l.id === id)?.notes ?? ''
    if (notes === current) return
    setError('')
    setNotesSaved(false)
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, notes } : l)))
    startTransition(async () => {
      const res = await saveLeadNotesAction(id, notes)
      if (res?.error) setError(res.error)
      else setNotesSaved(true)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">Contactos capturados desde tu sitio. Haz clic para gestionar.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4">
            <p className="text-2xl font-bold tracking-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Auto de interés</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Origen</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Fecha</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => openLead(lead.id)}
                  className="cursor-pointer hover:bg-secondary/30"
                >
                  <td className="px-4 py-3 font-medium">{lead.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>
                      {lead.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{lead.carLabel ?? '—'}</td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <p className="text-muted-foreground">{originLabel(lead.origin?.source ?? null, lead.origin?.medium ?? null)}</p>
                    {lead.origin?.campaign && <p className="max-w-[12rem] truncate text-xs text-muted-foreground/80">{lead.origin.campaign}</p>}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{formatDate(lead.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[lead.status]} className="capitalize">{lead.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer de detalle. En portal a <body> para escapar del transform de
          PageTransition (si no, el `fixed` se posiciona relativo a ese div). */}
      {selected && mounted && createPortal(
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => openLead(null)} />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l bg-card shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="font-bold">Detalle del lead</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openLead(null)}><X className="h-4 w-4" /></Button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              <div>
                <p className="text-lg font-semibold">{selected.name}</p>
                <p className="text-xs text-muted-foreground">Recibido el {formatDate(selected.createdAt)}</p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{selected.phone}</p>
                {selected.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{selected.email}</p>}
                <p className="flex items-center gap-2"><Car className="h-4 w-4 text-muted-foreground" />{selected.carLabel ?? 'Sin auto de interés'}</p>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium">Origen</p>
                <dl className="space-y-1 text-xs">
                  {[
                    ['Llegó por', originLabel(selected.origin?.source ?? null, selected.origin?.medium ?? null)],
                    ['Campaña', selected.origin?.campaign],
                    ['Anuncio', selected.origin?.content],
                    ['Conjunto', selected.origin?.term],
                    ['Desde', selected.origin?.referrer],
                    ['Entró en', selected.origin?.landing],
                    ['Formulario', FORM_LABEL[selected.form] ?? selected.form],
                    ['Primera visita', selected.firstOrigin &&
                      `${originLabel(selected.firstOrigin.source, selected.firstOrigin.medium)}` +
                      `${selected.firstOrigin.campaign ? ` · ${selected.firstOrigin.campaign}` : ''} · ${formatDate(selected.firstOrigin.at)}`]
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="w-24 shrink-0 text-muted-foreground">{k}</dt>
                      <dd className="min-w-0 break-words">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium">Estado</p>
                <div className="flex flex-wrap gap-2">
                  {LEAD_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => (s === 'vendido' ? setSelling(true) : setStatus(selected.id, s))}
                      className={cn(
                        'h-8 rounded-md border px-3 text-sm capitalize transition-colors',
                        selected.status === s ? 'border-cta bg-cta text-cta-foreground' : 'hover:bg-accent'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {selling && (
                  <div className="mt-3">
                    <SaleForm
                      key={selected.id}
                      lead={selected}
                      options={saleOptions}
                      pending={pending}
                      onCancel={() => setSelling(false)}
                      onConfirm={(input) => confirmSale(selected, input)}
                    />
                  </div>
                )}

                {!selling && selected.status === 'vendido' && (
                  <div className="mt-3 flex items-start justify-between gap-3 rounded-lg border bg-background p-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{selected.soldCarLabel ?? 'Un auto fuera del inventario'}</p>
                      <p className="text-xs text-muted-foreground">
                        {selected.saleAmount != null ? formatPrice(selected.saleAmount) : 'Sin monto registrado'}
                        {selected.soldCarId && selected.carId && selected.soldCarId !== selected.carId && ' · No es el auto por el que preguntó'}
                      </p>
                    </div>
                    <button onClick={() => setSelling(true)} className="shrink-0 text-xs font-medium text-cta hover:underline">
                      Editar
                    </button>
                  </div>
                )}
              </div>

              {selected.history.length > 0 && (
                <div>
                  <p className="mb-1.5 text-sm font-medium">Historial</p>
                  <ol className="space-y-1.5 border-l pl-3">
                    {selected.history.slice().reverse().map((h, i) => (
                      <li key={`${h.at}-${i}`} className="text-xs text-muted-foreground">
                        <span className="font-medium capitalize text-foreground">{h.from ? h.to : 'Recibido'}</span>
                        {' · '}{formatDate(h.at)}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-medium">Notas</p>
                  {notesSaved && <span className="flex items-center gap-1 text-xs text-emerald-600"><Check className="h-3.5 w-3.5" /> Guardado</span>}
                </div>
                <textarea
                  key={selected.id}
                  defaultValue={selected.notes}
                  rows={4}
                  onFocus={() => setNotesSaved(false)}
                  onBlur={(e) => saveNotes(selected.id, e.target.value)}
                  placeholder="Anota seguimiento, acuerdos, etc."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">Se guarda al salir del campo.</p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="border-t p-4">
              <a
                href={`https://wa.me/${selected.phone.replace(/[^\d]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-white"
                style={{ backgroundColor: '#25D366' }}
              >
                <WhatsAppIcon className="h-5 w-5" /> Contactar por WhatsApp
              </a>
            </div>
          </aside>
        </>,
        document.body
      )}
    </div>
  )
}
