import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Car, CheckCircle2, Users, Sparkles, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getCurrentDealer } from '@/services/dealers'
import { listCars } from '@/services/cars'
import { listLeads } from '@/services/leads'

/** Inicio del panel: KPIs + accesos rápidos + últimos leads (datos reales). */
export async function OverviewView () {
  const dealer = await getCurrentDealer()
  if (!dealer) redirect('/dashboard/login')

  const [cars, leads] = await Promise.all([listCars(dealer.id), listLeads(dealer.id)])
  const disponibles = cars.filter((c) => c.status === 'disponible').length
  const nuevos = leads.filter((l) => l.status === 'nuevo').length

  const kpis = [
    { icon: Car, label: 'Autos publicados', value: cars.length },
    { icon: CheckCircle2, label: 'Disponibles', value: disponibles },
    { icon: Users, label: 'Leads totales', value: leads.length },
    { icon: Sparkles, label: 'Leads nuevos', value: nuevos }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hola, {dealer.name} 👋</h1>
          <p className="text-sm text-muted-foreground">Este es el resumen de tu negocio.</p>
        </div>
        <Button asChild variant="cta" className="gap-2">
          <Link href="/dashboard/inventario/nuevo"><Plus className="h-4 w-4" /> Agregar auto</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-bold">Últimos leads</h2>
          <Link href="/dashboard/leads" className="inline-flex items-center gap-1 text-sm font-medium text-cta hover:underline">
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {leads.length === 0
          ? <p className="p-6 text-center text-sm text-muted-foreground">Aún no tienes leads. Aparecerán aquí cuando alguien te contacte desde tu sitio.</p>
          : (
            <ul className="divide-y">
              {leads.slice(0, 4).map((lead) => (
                <li key={lead.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{lead.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{lead.phone} · {lead.carLabel ?? 'Sin auto'}</p>
                  </div>
                  <Badge variant={lead.status === 'nuevo' ? 'cta' : 'secondary'} className="capitalize">{lead.status}</Badge>
                </li>
              ))}
            </ul>
            )}
      </div>
    </div>
  )
}
