import { Navbar, Footer, PageHeader } from '@/components/common'
import { getTenant } from '@/lib/tenant'
import { getContent } from '@/lib/content'
import { listCars } from '@/services/cars'
import { CatalogProvider, type CatalogFilters } from './states/CatalogProvider'
import { CatalogBody } from './components/CatalogBody'

/**
 * Vista catálogo: filtros laterales + grilla. Los autos vienen de Supabase (SSR,
 * filtrados por dealer); el estado de filtros vive en CatalogProvider (client).
 */
export async function Catalog ({ initial }: { initial?: Partial<CatalogFilters> }) {
  const tenant = await getTenant()
  const cars = tenant ? await listCars(tenant.dealerId) : []
  const { headerImage } = await getContent()

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar overlay />
      <main className="flex-1">
        <PageHeader title="Autos" subtitle="Encuentra el auto ideal para ti." image={headerImage || undefined} />

        <CatalogProvider cars={cars} initial={initial}>
          <CatalogBody />
        </CatalogProvider>
      </main>
      <Footer />
    </div>
  )
}
