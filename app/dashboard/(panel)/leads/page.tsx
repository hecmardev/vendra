import { redirect } from 'next/navigation'
import { LeadsView } from 'views/dashboard/leads'
import { getCurrentDealer } from '@/services/dealers'
import { listLeads } from '@/services/leads'
import { listCars } from '@/services/cars'

export default async function Page () {
  const dealer = await getCurrentDealer()
  if (!dealer) redirect('/dashboard/login')
  const [leads, cars] = await Promise.all([listLeads(dealer.id), listCars(dealer.id)])
  // Autos que se pueden elegir como "el que compró": todo lo que no esté ya
  // vendido. El que sí lo esté pero sea el auto de un lead se agrega en la vista.
  const saleOptions = cars
    .filter((c) => c.status !== 'vendido')
    .map((c) => ({ id: c.id, label: `${c.brand} ${c.model} ${c.year}`, price: c.price }))
  return <LeadsView leads={leads} saleOptions={saleOptions} />
}
