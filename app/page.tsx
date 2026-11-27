import type { Metadata, ResolvingMetadata } from 'next'
import { Homepage } from 'views/homepage'
import { getContent } from '@/lib/content'
import { getBusiness } from '@/lib/business'

export async function generateMetadata (_: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  const { hero, brand } = await getContent()
  const { name } = await getBusiness()
  const title = `${name} — ${hero.title}`
  // openGraph de una página reemplaza completo al del layout: se hereda el nombre
  // del sitio y el idioma, y solo se agrega lo propio.
  const { openGraph } = await parent
  return {
    title,
    description: brand.description,
    alternates: { canonical: '/' },
    // La foto del hero es la imagen al compartir el sitio (WhatsApp, Facebook).
    openGraph: {
      siteName: openGraph?.siteName,
      locale: openGraph?.locale,
      type: 'website',
      title,
      description: brand.description,
      images: hero.image ? [hero.image] : []
    }
  }
}

/** Home del dealer. Página delgada: toda la UI vive en views/homepage. */
export default function Page () {
  return <Homepage />
}
