import { redirect } from 'next/navigation'
import { LeadsView } from 'views/dashboard/leads'
import { getCurrentDealer } from '@/services/dealers'
import { listLeads } from '@/services/leads'

export default async function Page () {
  const dealer = await getCurrentDealer()
  if (!dealer) redirect('/dashboard/login')
  const leads = await listLeads(dealer.id)
  return <LeadsView leads={leads} />
}
