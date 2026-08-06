'use client'

import { Reveal } from '@/components/motion/Reveal'
import { cn } from '@/lib/utils'
import { useCatalog } from '../states/CatalogProvider'
import { Filters } from './Filters'
import { SortBar } from './SortBar'
import { CarGrid } from './CarGrid'

/**
 * Cuerpo del catálogo: columna de filtros + grilla. Reacciona a `filtersOpen`
 * para ocultar/mostrar el panel y dar el ancho completo a la grilla. Los filtros
 * se ocultan con `hidden` (no se desmontan) para conservar el estado de los
 * acordeones al reabrir.
 */
export function CatalogBody () {
  const { filtersOpen } = useCatalog()

  return (
    <div className={cn('container grid grid-cols-1 gap-8 py-8', filtersOpen && 'lg:grid-cols-[260px_1fr]')}>
      <Reveal className={cn('lg:sticky lg:top-20 lg:h-fit', !filtersOpen && 'hidden')}>
        <Filters />
      </Reveal>
      <Reveal delay={0.08} className="space-y-5">
        <SortBar />
        <CarGrid />
      </Reveal>
    </div>
  )
}
