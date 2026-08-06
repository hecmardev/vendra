import { notFound } from 'next/navigation'
import { DealerFormView } from 'views/admin/dealerForm'
import { getDealerStats } from '@/services/admin'

export const metadata = { title: 'Editar dealer — Vendra Plataforma' }

export default async function Page ({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dealer = await getDealerStats(id)
  if (!dealer) notFound()

  return <DealerFormView dealer={dealer} />
}
