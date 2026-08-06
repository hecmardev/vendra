'use client'

import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import type { Car } from '@/interfaces/car'

export type SortKey = 'recientes' | 'precio-asc' | 'precio-desc'

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

const EMPTY: CatalogFilters = {
  q: '', brands: [], bodyTypes: [], transmissions: [], minPrice: null, maxPrice: null, model: '', year: null
}

interface CatalogContextValue {
  all: Car[]
  filtered: Car[]
  filters: CatalogFilters
  sort: SortKey
  setSort: (s: SortKey) => void
  toggle: (key: 'brands' | 'bodyTypes' | 'transmissions', value: string) => void
  setQ: (q: string) => void
  setPrice: (min: number | null, max: number | null) => void
  reset: () => void
  filtersOpen: boolean
  toggleFilters: () => void
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
  const toggleFilters = () => setFiltersOpen((o) => !o)

  const toggle = (key: 'brands' | 'bodyTypes' | 'transmissions', value: string) => {
    setFilters((f) => {
      const set = new Set(f[key])
      set.has(value) ? set.delete(value) : set.add(value)
      return { ...f, [key]: Array.from(set) }
    })
  }
  const setQ = (q: string) => setFilters((f) => ({ ...f, q }))
  const setPrice = (minPrice: number | null, maxPrice: number | null) =>
    setFilters((f) => ({ ...f, minPrice, maxPrice }))
  const reset = () => setFilters({ ...EMPTY })

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    const result = cars.filter((c) => {
      if (q && !`${c.brand} ${c.model}`.toLowerCase().includes(q)) return false
      if (filters.brands.length && !filters.brands.includes(c.brand)) return false
      if (filters.bodyTypes.length && !filters.bodyTypes.includes(c.bodyType)) return false
      if (filters.transmissions.length && !filters.transmissions.includes(c.transmission)) return false
      if (filters.model && c.model.toLowerCase() !== filters.model.toLowerCase()) return false
      if (filters.year != null && c.year !== filters.year) return false
      if (filters.minPrice != null && c.price < filters.minPrice) return false
      if (filters.maxPrice != null && c.price > filters.maxPrice) return false
      return true
    })
    if (sort === 'precio-asc') result.sort((a, b) => a.price - b.price)
    if (sort === 'precio-desc') result.sort((a, b) => b.price - a.price)
    if (sort === 'recientes') result.sort((a, b) => b.year - a.year)
    return result
  }, [cars, filters, sort])

  const value: CatalogContextValue = {
    all: cars, filtered, filters, sort, setSort, toggle, setQ, setPrice, reset, filtersOpen, toggleFilters
  }
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog () {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within a CatalogProvider')
  return ctx
}
