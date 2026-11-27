import { canIndexDealer, canIndexPlatform } from '@/lib/seo'
import { isPlatformHost } from '@/lib/storefront'
import { getDealerByDomain } from '@/services/dealers'

type Dealer = NonNullable<Awaited<ReturnType<typeof getDealerByDomain>>>

export type SiteIndexing =
  | { kind: 'platform'; indexable: boolean }
  | { kind: 'dealer'; indexable: boolean; dealer: Dealer }
  | { kind: 'none'; indexable: false }

/**
 * Qué sitio sirve este host y si se puede indexar (lib/seo.ts). Para robots.txt
 * y sitemap.xml, donde el middleware no corre y no hay headers de tenant.
 */
export async function getSiteIndexing (host: string): Promise<SiteIndexing> {
  if (isPlatformHost(host)) return { kind: 'platform', indexable: canIndexPlatform(host) }
  try {
    const dealer = await getDealerByDomain(host)
    if (!dealer) return { kind: 'none', indexable: false }
    return { kind: 'dealer', indexable: canIndexDealer(host, dealer.allow_indexing), dealer }
  } catch {
    return { kind: 'none', indexable: false }
  }
}
