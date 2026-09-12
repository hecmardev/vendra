import type { MetadataRoute } from 'next'
import { isIndexable } from '@/lib/seo'

/**
 * robots.txt por ambiente. Solo producción se indexa: QA y cualquier preview
 * quedan cerrados, para no competir con el sitio real por contenido duplicado.
 *
 * El interruptor es la variable ALLOW_INDEXING, y el default es NO indexar: si
 * se olvida ponerla, el ambiente queda cerrado en vez de abierto por accidente.
 */
export const dynamic = 'force-dynamic'

export default function robots (): MetadataRoute.Robots {
  if (!isIndexable()) {
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
    ]
  }
}
