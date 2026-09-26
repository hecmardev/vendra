'use client'

import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Combo } from '@/components/common/combo'
import { useCatalog, SORT_OPTIONS, type SortKey } from '../states/CatalogProvider'

/**
 * Barra superior del catálogo en ESCRITORIO: muestra/oculta la columna de
 * filtros, cuenta resultados y ordena. En móvil la reemplaza MobileFilterBar,
 * que además se queda pegada al hacer scroll.
 */
export function SortBar () {
  const { filtered, sort, setSort, filtersOpen, toggleFilters } = useCatalog()

  return (
    <div className="hidden items-center justify-between gap-4 lg:flex">
      <div className="flex items-center gap-3">
        <Button variant={filtersOpen ? 'secondary' : 'outline'} size="sm" onClick={toggleFilters} className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          {filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
        </Button>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
          {filtered.length === 1 ? 'auto' : 'autos'}
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Ordenar por</span>
        <Combo
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={SORT_OPTIONS}
          placeholder="Ordenar por"
          className="h-9 w-56"
        />
      </label>
    </div>
  )
}
