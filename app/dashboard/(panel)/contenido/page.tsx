import { redirect } from 'next/navigation'
import { ContentView } from 'views/dashboard/content'
import { getCurrentDealer } from '@/services/dealers'
import { mergeContent } from '@/lib/content'

/** Editor de contenido del sitio (copy de marca por sección), con datos reales. */
export default async function Page () {
  const dealer = await getCurrentDealer()
  if (!dealer) redirect('/dashboard/login')

  return <ContentView initial={mergeContent(dealer.content)} />
}
