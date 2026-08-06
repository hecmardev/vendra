import type { Metadata } from 'next'
import { Homepage } from 'views/homepage'
import { getContent } from '@/lib/content'
import { getBusiness } from '@/lib/business'

export async function generateMetadata (): Promise<Metadata> {
  const { hero, brand } = await getContent()
  const { name } = await getBusiness()
  return { title: `${name} — ${hero.title}`, description: brand.description }
}

/** Home del dealer. Página delgada: toda la UI vive en views/homepage. */
export default function Page () {
  return <Homepage />
}
