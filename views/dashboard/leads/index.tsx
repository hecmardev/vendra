'use client'

import { useState, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { Phone, Mail, X, MessageCircle, Car, Check, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { setLeadStatusAction, saveLeadNotesAction } from '@/app/dashboard/(panel)/leads/actions'
import type { Lead, LeadStatus } from '@/interfaces/lead'

const STATUS_VARIANT: Record<LeadStatus, 'cta' | 'secondary' | 'outline'> = {
  nuevo: 'cta',
  contactado: 'secondary',
  cerrado: 'outline'
}
const STATUSES: LeadStatus[] = ['nuevo', 'contactado', 'cerrado']

function formatDate (iso: string) {
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

/** Leads del dealer: métricas + tabla + panel de detalle con gestión de estado. */
export function LeadsView ({ leads: initialLeads }: { leads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [error, setError] = useState('')
  const [notesSaved, setNotesSaved] = useState(false)
  const [, startTransition] = useTransition()
  const selected = leads.find((l) => l.id === selectedId) ?? null

  const nuevos = leads.filter((l) => l.status === 'nuevo').length
  const contactados = leads.filter((l) => l.status === 'contactado').length
  const stats = [
    { label: 'Total', value: leads.length },
    { label: 'Nuevos', value: nuevos },
    { label: 'Contactados', value: contactados }
  ]

  /** Cambia el estado: optimista en UI + persiste en la BD. */
  const setStatus = (id: string, status: LeadStatus) => {
    setError('')
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)))
    startTransition(async () => {
      const res = await setLeadStatusAction(id, status)
      if (res?.error) setError(res.error)
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

      <div className="grid grid-cols-3 gap-4">
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
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Fecha</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedId(lead.id)}
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
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSelectedId(null)} />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l bg-card shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="font-bold">Detalle del lead</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedId(null)}><X className="h-4 w-4" /></Button>
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
                <p className="mb-1.5 text-sm font-medium">Estado</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(selected.id, s)}
                      className={cn(
                        'h-8 rounded-md border px-3 text-sm capitalize transition-colors',
                        selected.status === s ? 'border-cta bg-cta text-cta-foreground' : 'hover:bg-accent'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

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
                <MessageCircle className="h-5 w-5" /> Contactar por WhatsApp
              </a>
            </div>
          </aside>
        </>,
        document.body
      )}
    </div>
  )
}
