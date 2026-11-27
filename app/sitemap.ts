import type { MetadataRoute } from 'next'
import { requestOrigin } from '@/lib/requestOrigin'
import { getSiteIndexing } from '@/lib/siteIndexing'
import { getDealerLegalInfo } from '@/lib/dealerLegal'
import { getVendraLegal } from '@/lib/vendraLegal'
import { listPublicCars } from '@/services/cars'

/**
 * sitemap.xml por dominio: cada dealer lista sus páginas y sus autos publicados;
 * vendra.com.mx, las suyas. Se arma en cada petición para que un auto nuevo
 * aparezca sin redeploy.
 *
 * Vacío donde el sitio no se indexa (lib/seo.ts): robots.txt ya lo prohíbe y no
 * hay por qué listar nada.
 */
export const dynamic = 'force-dynamic'

export default async function sitemap (): Promise<MetadataRoute.Sitemap> {
  const { host, origin } = await requestOrigin()
  const site = await getSiteIndexing(host)
  if (!site.indexable) return []
  const url = (path: string) => `${origin}${path}`

  if (site.kind === 'platform') {
    return [
      { url: url('/'), changeFrequency: 'monthly', priority: 1 },
      ...(getVendraLegal() ? [{ url: url('/aviso-de-privacidad'), changeFrequency: 'yearly' as const, priority: 0.1 }] : [])
    ]
  }

  if (site.kind !== 'dealer') return []
  try {
    const cars = await listPublicCars(site.dealer.id)
    return [
      { url: url('/'), changeFrequency: 'daily', priority: 1 },
      { url: url('/autos'), changeFrequency: 'daily', priority: 0.9 },
      ...cars.map((car) => ({ url: url(`/autos/${car.slug}`), changeFrequency: 'weekly' as const, priority: 0.8 })),
      { url: url('/acerca-de'), changeFrequency: 'monthly', priority: 0.5 },
      { url: url('/contacto'), changeFrequency: 'monthly', priority: 0.5 },
      ...(getDealerLegalInfo(site.dealer) ? [{ url: url('/aviso-de-privacidad'), changeFrequency: 'yearly' as const, priority: 0.1 }] : [])
    ]
  } catch {
    // Un sitemap vacío es mejor que un error 500 que Google reintenta y reporta.
    return []
  }
}
