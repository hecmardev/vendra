'use client'

import { Reveal } from '@/components/motion/Reveal'
import { cn } from '@/lib/utils'
import { useCatalog } from '../states/CatalogProvider'
import { Filters } from './Filters'
import { MobileFilterBar } from './MobileFilterBar'
import { SortBar } from './SortBar'
import { CarGrid } from './CarGrid'

/**
 * Cuerpo del catálogo. Dos armados según el ancho:
 *
 *   Móvil      barra pegajosa + cajón a pantalla completa (MobileFilterBar).
 *   Escritorio columna lateral de filtros + SortBar, como siempre.
 *
 * La barra móvil va fuera del contenedor y fuera de los `Reveal`: el transform
 * de framer-motion rompería su `position: sticky`.
 *
 * El panel lateral se oculta con clases y no se desmonta, para conservar el
 * estado de los acordeones al reabrirlo.
 */
export function CatalogBody () {
  const { filtersOpen, control } = useCatalog()

  return (
    <>
      <MobileFilterBar />

      <div className={cn('container grid grid-cols-1 gap-8 py-8', filtersOpen && 'lg:grid-cols-[260px_1fr]')}>
        <Reveal className={cn('hidden lg:sticky lg:top-20 lg:h-fit', filtersOpen && 'lg:block')}>
          <Filters control={control} />
        </Reveal>
        <Reveal delay={0.08} className="space-y-5">
          <SortBar />
          <CarGrid />
        </Reveal>
      </div>
    </>
  )
}
