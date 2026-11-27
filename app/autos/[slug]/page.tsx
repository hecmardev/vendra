import type { Metadata, ResolvingMetadata } from 'next'
import { CarDetail } from 'views/carDetail'
import { getTenant } from '@/lib/tenant'
import { getCarBySlug } from '@/services/cars'
import { getBusiness } from '@/lib/business'
import { formatPrice } from '@/helpers/format'

/** Metadata dinámica de la ficha (título + descripción + OG + canonical). */
export async function generateMetadata ({ params }: { params: Promise<{ slug: string }> }, parent: ResolvingMetadata): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenant()
  const car = tenant ? await getCarBySlug(tenant.dealerId, slug) : null
  const { name } = await getBusiness()
  if (!car) return { title: `Auto no encontrado — ${name}` }

  const title = `${car.brand} ${car.model} ${car.year} — ${name}`
  const condition = { nuevo: 'Nuevo', seminuevo: 'Seminuevo verificado', demo: 'Auto demo' }[car.condition]
  const description = car.description ?? `${car.brand} ${car.model} ${car.year}, ${formatPrice(car.price)}. ${condition} en ${name}.`
  // openGraph de una página reemplaza completo al del layout: se hereda el nombre
  // del sitio y el idioma.
  const { openGraph } = await parent
  return {
    title,
    description,
    alternates: { canonical: `/autos/${car.slug}` },
    openGraph: {
      siteName: openGraph?.siteName,
      locale: openGraph?.locale,
      type: 'website',
      title,
      description,
      images: car.images.length ? [car.images[0]] : []
    }
  }
}

/** Ficha de auto. SSR para SEO; galería + specs + WhatsApp + similares. */
export default async function Page ({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <CarDetail slug={slug} />
}
