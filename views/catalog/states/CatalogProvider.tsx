'use client'

import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import type { Car } from '@/interfaces/car'

export type SortKey = 'recientes' | 'precio-asc' | 'precio-desc'

/** Opciones de orden. Las comparten la barra de escritorio y la de móvil. */
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' }
]

export interface CatalogFilters {
  q: string
  brands: string[]
  bodyTypes: string[]
  transmissions: string[]
  minPrice: number | null
  maxPrice: number | null
  /** Filtros de drill-down (breadcrumb): sin UI propia, se fijan por URL. */
  model: string
  year: number | null
}

export const EMPTY: CatalogFilters = {
  q: '', brands: [], bodyTypes: [], transmissions: [], minPrice: null, maxPrice: null, model: '', year: null
}

export type FilterKey = 'brands' | 'bodyTypes' | 'transmissions'

/**
 * Manda sobre un juego de filtros. El panel `Filters` lo recibe por props en vez
 * de leer del contexto, para poder pintarse dos veces contra fuentes distintas:
 * en escritorio sobre los filtros vivos, y en el cajón móvil sobre un borrador
 * que no toca la grilla hasta que se aplica.
 */
export interface FiltersControl {
  filters: CatalogFilters
  setQ: (q: string) => void
  toggle: (key: FilterKey, value: string) => void
  setPrice: (min: number | null, max: number | null) => void
  reset: () => void
  /** Cuántos filtros hay puestos. Alimenta el badge del botón en móvil. */
  activeCount: number
}

/** Cuenta filtros puestos. Precio cuenta como uno aunque tenga mín y máx. */
export function countActive (f: CatalogFilters): number {
  return (
    (f.q.trim() ? 1 : 0) +
    f.brands.length +
    f.bodyTypes.length +
    f.transmissions.length +
    (f.minPrice != null || f.maxPrice != null ? 1 : 0) +
    (f.model ? 1 : 0) +
    (f.year != null ? 1 : 0)
  )
}

/** ¿El auto pasa los filtros? Fuera del provider para poder correrlo contra un borrador. */
export function matches (c: Car, f: CatalogFilters): boolean {
  const q = f.q.trim().toLowerCase()
  if (q && !`${c.brand} ${c.model}`.toLowerCase().includes(q)) return false
  if (f.brands.length && !f.brands.includes(c.brand)) return false
  if (f.bodyTypes.length && !f.bodyTypes.includes(c.bodyType)) return false
  if (f.transmissions.length && !f.transmissions.includes(c.transmission)) return false
  if (f.model && c.model.toLowerCase() !== f.model.toLowerCase()) return false
  if (f.year != null && c.year !== f.year) return false
  if (f.minPrice != null && c.price < f.minPrice) return false
  if (f.maxPrice != null && c.price > f.maxPrice) return false
  return true
}

/**
 * Crea un control sobre estado local. Lo usa el cajón móvil para su borrador:
 * mismas operaciones que el control vivo, pero contra una copia.
 */
export function useFiltersDraft (inicial: CatalogFilters): FiltersControl & { set: (f: CatalogFilters) => void } {
  const [filters, set] = useState<CatalogFilters>(inicial)
  return {
    filters,
    set,
    setQ: (q) => set((f) => ({ ...f, q })),
    toggle: (key, value) => set((f) => {
      const s = new Set(f[key])
      s.has(value) ? s.delete(value) : s.add(value)
      return { ...f, [key]: Array.from(s) }
    }),
    setPrice: (minPrice, maxPrice) => set((f) => ({ ...f, minPrice, maxPrice })),
    reset: () => set({ ...EMPTY }),
    activeCount: countActive(filters)
  }
}

interface CatalogContextValue {
  all: Car[]
  filtered: Car[]
  sort: SortKey
  setSort: (s: SortKey) => void
  /** Control sobre los filtros vivos (los que ve la grilla). */
  control: FiltersControl
  /** Reemplaza los filtros de golpe. Lo usa "Aplicar" del cajón móvil. */
  applyFilters: (f: CatalogFilters) => void
  /** Columna lateral de escritorio. */
  filtersOpen: boolean
  toggleFilters: () => void
  /** Cajón de móvil. Estado aparte: en escritorio "abierto" significa otra cosa. */
  drawerOpen: boolean
  setDrawerOpen: (v: boolean) => void
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined)

export function CatalogProvider ({
  cars,
  initial,
  children
}: {
  cars: Car[]
  /** Filtros iniciales (vienen de la URL: ?marca, ?modelo, ?anio, ?tipo, ?q). */
  initial?: Partial<CatalogFilters>
  children: ReactNode
}) {
  const [filters, setFilters] = useState<CatalogFilters>({ ...EMPTY, ...initial })
  const [sort, setSort] = useState<SortKey>('recientes')
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const control: FiltersControl = {
    filters,
    setQ: (q) => setFilters((f) => ({ ...f, q })),
    toggle: (key, value) => setFilters((f) => {
      const s = new Set(f[key])
      s.has(value) ? s.delete(value) : s.add(value)
      return { ...f, [key]: Array.from(s) }
    }),
    setPrice: (minPrice, maxPrice) => setFilters((f) => ({ ...f, minPrice, maxPrice })),
    reset: () => setFilters({ ...EMPTY }),
    activeCount: countActive(filters)
  }

  const filtered = useMemo(() => {
    const result = cars.filter((c) => matches(c, filters))
    if (sort === 'precio-asc') result.sort((a, b) => a.price - b.price)
    if (sort === 'precio-desc') result.sort((a, b) => b.price - a.price)
    if (sort === 'recientes') result.sort((a, b) => b.year - a.year)
    return result
  }, [cars, filters, sort])

  const value: CatalogContextValue = {
    all: cars,
    filtered,
    sort,
    setSort,
    control,
    applyFilters: setFilters,
    filtersOpen,
    toggleFilters: () => setFiltersOpen((o) => !o),
    drawerOpen,
    setDrawerOpen
  }
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog () {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within a CatalogProvider')
  return ctx
}
