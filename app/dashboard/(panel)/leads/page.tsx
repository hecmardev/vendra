import { redirect } from 'next/navigation'
import { LeadsView } from 'views/dashboard/leads'
import { getCurrentDealer } from '@/services/dealers'
import { listLeads } from '@/services/leads'
import { listCars } from '@/services/cars'
import { listViewedCarsByVisitor } from '@/services/views'
import { listContactClicksByVisitor } from '@/services/contactClicks'

export default async function Page () {
  const dealer = await getCurrentDealer()
  if (!dealer) redirect('/dashboard/login')
  const [leads, cars] = await Promise.all([listLeads(dealer.id), listCars(dealer.id)])

  // "Autos que vio" y clics de contacto de cada lead: lo que hizo el mismo visitante.
  const visitorIds = Array.from(new Set(leads.map((l) => l.visitorId).filter((v): v is string => Boolean(v))))
  const [viewed, clicks] = await Promise.all([
    listViewedCarsByVisitor(dealer.id, visitorIds),
    listContactClicksByVisitor(dealer.id, visitorIds)
  ])
  const withViews = leads.map((l) => ({
    ...l,
    viewedCars: (l.visitorId && viewed.get(l.visitorId)) || [],
    contactClicks: (l.visitorId && clicks.get(l.visitorId)) || []
  }))

  // Autos que se pueden elegir como "el que compró": todo lo que no esté ya
  // vendido. El que sí lo esté pero sea el auto de un lead se agrega en la vista.
  const saleOptions = cars
    .filter((c) => c.status !== 'vendido')
    .map((c) => ({ id: c.id, label: `${c.brand} ${c.model} ${c.year}`, price: c.price }))
  return <LeadsView leads={withViews} saleOptions={saleOptions} />
}
