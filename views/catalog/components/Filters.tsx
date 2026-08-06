'use client'

import { useState } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCatalog } from '../states/CatalogProvider'

/** Sección colapsable (acordeón). Abierta por defecto; badge con el conteo activo. */
function Section ({ title, count = 0, children }: { title: string; count?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-t pt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-semibold"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {title}
          {count > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cta px-1.5 text-xs font-medium text-cta-foreground">
              {count}
            </span>
          )}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open ? '' : '-rotate-90')} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}

function CheckGroup ({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      {options.map((opt) => (
        <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input accent-[hsl(var(--cta))]"
            checked={selected.includes(opt)}
            onChange={() => onToggle(opt)}
          />
          {opt}
        </label>
      ))}
    </div>
  )
}

/** Panel de filtros del catálogo. Deriva las opciones del inventario cargado. */
export function Filters () {
  const { all, filters, setQ, toggle, setPrice, reset } = useCatalog()

  const brands = Array.from(new Set(all.map((c) => c.brand))).sort()
  const bodyTypes = Array.from(new Set(all.map((c) => c.bodyType))).sort()
  const transmissions = Array.from(new Set(all.map((c) => c.transmission))).sort()

  const priceActive = filters.minPrice != null || filters.maxPrice != null
  const hasActiveFilters =
    filters.q.trim() !== '' ||
    filters.brands.length > 0 ||
    filters.bodyTypes.length > 0 ||
    filters.transmissions.length > 0 ||
    priceActive ||
    filters.model !== '' ||
    filters.year != null

  return (
    <aside className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Filtros</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={reset} className="h-7 gap-1 text-xs">
            <X className="h-3.5 w-3.5" /> Limpiar
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar…"
          className="pl-9"
        />
      </div>

      <Section title="Precio" count={priceActive ? 1 : 0}>
        <div className="flex items-center gap-2">
          <Input
            type="number" placeholder="Mín" className="h-9"
            value={filters.minPrice ?? ''}
            onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : null, filters.maxPrice)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number" placeholder="Máx" className="h-9"
            value={filters.maxPrice ?? ''}
            onChange={(e) => setPrice(filters.minPrice, e.target.value ? Number(e.target.value) : null)}
          />
        </div>
      </Section>

      <Section title="Tipo" count={filters.bodyTypes.length}>
        <CheckGroup options={bodyTypes} selected={filters.bodyTypes} onToggle={(v) => toggle('bodyTypes', v)} />
      </Section>

      <Section title="Marca" count={filters.brands.length}>
        <CheckGroup options={brands} selected={filters.brands} onToggle={(v) => toggle('brands', v)} />
      </Section>

      <Section title="Transmisión" count={filters.transmissions.length}>
        <CheckGroup options={transmissions} selected={filters.transmissions} onToggle={(v) => toggle('transmissions', v)} />
      </Section>
    </aside>
  )
}
