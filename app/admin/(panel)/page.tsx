import { AdminDealersView } from 'views/admin/dealers'
import { listDealersWithStats } from '@/services/admin'

export const metadata = { title: 'Dealers — Vendra Plataforma' }

/** Home del panel de plataforma: lista de dealers con métricas. */
export default async function Page () {
  const dealers = await listDealersWithStats()
  return <AdminDealersView dealers={dealers} />
}
