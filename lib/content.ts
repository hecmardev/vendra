import { cache } from 'react'
import { DEFAULT_CONTENT, type SiteContent } from '@/constants/defaultContent'
import { getTenant } from '@/lib/tenant'
import { getDealerById } from '@/services/dealers'

/** Merge profundo: objetos se combinan; arrays y primitivos los reemplaza el override. */
function deepMerge<T> (base: T, override: unknown): T {
  if (!override || typeof override !== 'object' || Array.isArray(override)) return base
  const out: any = { ...base }
  for (const key of Object.keys(override as object)) {
    const b = (base as any)?.[key]
    const o = (override as any)[key]
    out[key] = b && typeof b === 'object' && !Array.isArray(b) && o && typeof o === 'object' && !Array.isArray(o)
      ? deepMerge(b, o)
      : o
  }
  return out
}

/**
 * Fusiona los overrides guardados en `dealers.content` sobre los defaults.
 * Lo usa el panel para editar el contenido del dealer autenticado sin depender
 * de los headers de tenant.
 */
export function mergeContent (overrides: unknown): SiteContent {
  return overrides && typeof overrides === 'object' && Object.keys(overrides as object).length > 0
    ? deepMerge(DEFAULT_CONTENT, overrides)
    : DEFAULT_CONTENT
}

/**
 * Contenido del sitio para el dealer actual: DEFAULT_CONTENT con los overrides
 * de `dealers.content` fusionados encima. Cacheado por request. Sin tenant o sin
 * overrides -> defaults.
 */
export const getContent = cache(async (): Promise<SiteContent> => {
  try {
    const tenant = await getTenant()
    if (!tenant) return DEFAULT_CONTENT
    const dealer = await getDealerById(tenant.dealerId)
    return mergeContent(dealer?.content)
  } catch {
    return DEFAULT_CONTENT
  }
})
