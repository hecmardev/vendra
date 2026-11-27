import type { MetadataRoute } from 'next'
import { requestOrigin } from '@/lib/requestOrigin'
import { getSiteIndexing } from '@/lib/siteIndexing'

/**
 * robots.txt por dominio. Cada sitio se abre a los buscadores solo si su
 * interruptor y el general están encendidos (lib/seo.ts): vendra.com.mx con
 * ALLOW_PLATFORM_INDEXING, cada dealer desde el admin (0021). Todo lo demás,
 * incluidos QA y los previews, queda cerrado.
 *
 * Cuando se abre, apunta al sitemap del mismo dominio (app/sitemap.ts).
 */
export const dynamic = 'force-dynamic'

export default async function robots (): Promise<MetadataRoute.Robots> {
  const { host, origin } = await requestOrigin()
  const site = await getSiteIndexing(host)

  if (!site.indexable) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Nada de esto aporta a un buscador y sí expone rutas internas.
        disallow: ['/admin', '/dashboard', '/api', '/plataforma', '/not-available']
      }
    ],
    sitemap: `${origin}/sitemap.xml`
  }
}
