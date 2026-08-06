'use client'

import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCatalog, type SortKey } from '../states/CatalogProvider'

const OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' }
]

/** Barra superior del catálogo: toggle de filtros + conteo de resultados + orden. */
export function SortBar () {
  const { filtered, sort, setSort, filtersOpen, toggleFilters } = useCatalog()

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Button variant={filtersOpen ? 'secondary' : 'outline'} size="sm" onClick={toggleFilters} className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">{filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}</span>
          <span className="sm:hidden">Filtros</span>
        </Button>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
          {filtered.length === 1 ? 'auto' : 'autos'}
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <span className="hidden text-muted-foreground sm:inline">Ordenar por</span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
    </div>
  )
}
