import { notFound } from 'next/navigation'
import { DealerFormView } from 'views/admin/dealerForm'
import { getDealerStats } from '@/services/admin'
import { isIndexable } from '@/lib/seo'

export const metadata = { title: 'Editar dealer — Vendra Plataforma' }

export default async function Page ({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dealer = await getDealerStats(id)
  if (!dealer) notFound()

  // El interruptor general: sin él, marcar a un dealer no lo abre a Google todavía.
  return <DealerFormView dealer={dealer} indexingEnabled={isIndexable()} />
}
