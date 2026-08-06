import { notFound, redirect } from 'next/navigation'
import { CarForm } from 'views/dashboard/inventory/CarForm'
import { getCurrentDealer } from '@/services/dealers'
import { getCarById } from '@/services/cars'

/** Edición de un auto existente del dealer autenticado. */
export default async function Page ({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dealer = await getCurrentDealer()
  if (!dealer) redirect('/dashboard/login')

  const car = await getCarById(dealer.id, id)
  if (!car) notFound()

  return <CarForm car={car} />
}
