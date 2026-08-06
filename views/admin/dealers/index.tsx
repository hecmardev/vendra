'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, ExternalLink, Pencil, Trash2, Loader2, Building2, Car, Users, Ban, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { deleteDealerAction, setDealerActiveAction } from '@/app/admin/(panel)/actions'
import type { DealerStats } from '@/services/admin'

/** URL pública del sitio del dealer: en prod https sin puerto; en dev, :3000. */
function dealerSiteUrl (domain: string): string {
  return process.env.NODE_ENV === 'production' ? `https://${domain}` : `http://${domain}:3000`
}

function Kpi ({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

/** Lista de dealers de la plataforma con sus métricas y acciones. */
export function AdminDealersView ({ dealers }: { dealers: DealerStats[] }) {
  const [confirm, setConfirm] = useState<DealerStats | null>(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const totals = {
    dealers: dealers.length,
    active: dealers.filter((d) => d.isActive).length,
    cars: dealers.reduce((n, d) => n + d.cars, 0),
    leads: dealers.reduce((n, d) => n + d.leads, 0)
  }

  const onDelete = (d: DealerStats) => {
    setError('')
    startTransition(async () => {
      const res = await deleteDealerAction(d.id)
      if (res?.error) setError(res.error)
      else setConfirm(null)
    })
  }

  const onToggleActive = (d: DealerStats) => {
    setError('')
    setBusyId(d.id)
    startTransition(async () => {
      const res = await setDealerActiveAction(d.id, !d.isActive)
      if (res?.error) setError(res.error)
      setBusyId(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dealers</h1>
          <p className="text-sm text-muted-foreground">Clientes de la plataforma y su actividad.</p>
        </div>
        <Button asChild variant="cta" className="gap-2">
          <Link href="/admin/dealers/nuevo"><Plus className="h-4 w-4" /> Alta de dealer</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi icon={Building2} label={`Dealers (${totals.active} activos)`} value={totals.dealers} />
        <Kpi icon={Car} label="Autos publicados" value={totals.cars} />
        <Kpi icon={Users} label="Leads totales" value={totals.leads} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Tabla (desktop) */}
      <div className="hidden overflow-hidden rounded-xl border bg-card sm:block">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Dealer</th>
              <th className="px-4 py-3 font-medium">Autos</th>
              <th className="px-4 py-3 font-medium">Leads</th>
              <th className="px-4 py-3 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {dealers.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Aún no hay dealers.</td></tr>
            )}
            {dealers.map((d) => (
              <tr key={d.id} className={`border-b last:border-0 ${d.isActive ? '' : 'bg-muted/30'}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{d.name}</p>
                    {!d.isActive && <Badge variant="secondary" className="border-amber-500/30 bg-amber-500/15 text-amber-700">Suspendido</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{d.domain}</p>
                </td>
                <td className="px-4 py-3">
                  {d.cars} <span className="text-muted-foreground">({d.carsAvailable} disp.)</span>
                </td>
                <td className="px-4 py-3">{d.leads}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Ver sitio">
                      <a href={dealerSiteUrl(d.domain)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Editar">
                      <Link href={`/admin/dealers/${d.id}`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title={d.isActive ? 'Suspender (impago)' : 'Reactivar'}
                      onClick={() => onToggleActive(d)}
                      disabled={pending && busyId === d.id}
                    >
                      {pending && busyId === d.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : d.isActive ? <Ban className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost" size="icon" title="Eliminar"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setConfirm(d)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards (móvil) */}
      <div className="space-y-3 sm:hidden">
        {dealers.length === 0 && (
          <p className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">Aún no hay dealers.</p>
        )}
        {dealers.map((d) => (
          <div key={d.id} className="space-y-3 rounded-xl border bg-card p-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{d.name}</p>
                {!d.isActive && <Badge variant="secondary" className="border-amber-500/30 bg-amber-500/15 text-amber-700">Suspendido</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">{d.domain}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">{d.cars} autos</Badge>
              <Badge variant="secondary">{d.leads} leads</Badge>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href={`/admin/dealers/${d.id}`}>Editar</Link>
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => onToggleActive(d)}
                disabled={pending && busyId === d.id}
              >
                {pending && busyId === d.id
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : d.isActive ? <><Ban className="h-4 w-4" /> Suspender</> : <><RotateCcw className="h-4 w-4" /> Reactivar</>}
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setConfirm(d)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmación de baja */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirm(null)}>
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-lg font-bold">Dar de baja “{confirm.name}”</h2>
            <p className="mb-1 text-sm text-muted-foreground">
              Se dan de baja también sus {confirm.cars} autos y {confirm.leads} leads, y su dominio queda libre.
            </p>
            <p className="mb-5 text-xs text-muted-foreground">
              Los datos no se borran de la base (baja lógica), pero deja de aparecer en el panel. Para una
              suspensión temporal por impago usa mejor “Suspender”.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirm(null)} disabled={pending}>Cancelar</Button>
              <Button variant="destructive" onClick={() => onDelete(confirm)} disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Dar de baja
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
