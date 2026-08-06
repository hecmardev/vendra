'use client'

import { SearchX } from 'lucide-react'
import CarCard from '@/components/common/carCard'
import { useCatalog } from '../states/CatalogProvider'

/** Grilla de resultados del catálogo, con empty state. */
export function CarGrid () {
  const { filtered } = useCatalog()

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
        <SearchX className="h-10 w-10 text-muted-foreground/50" />
        <p className="font-medium">Sin resultados</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Ajusta los filtros para ver más autos.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {filtered.map((car) => (
        <CarCard key={car.id} car={car} />
      ))}
    </div>
  )
}
