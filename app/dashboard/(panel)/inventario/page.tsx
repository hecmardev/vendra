import { redirect } from 'next/navigation'
import { InventoryView } from 'views/dashboard/inventory'
import { getCurrentDealer } from '@/services/dealers'
import { listCars } from '@/services/cars'

export default async function Page () {
  const dealer = await getCurrentDealer()
  if (!dealer) redirect('/dashboard/login')
  const cars = await listCars(dealer.id) // authed: RLS devuelve todos sus autos
  return <InventoryView cars={cars} />
}
