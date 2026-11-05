'use client'

import { createContext, useContext } from 'react'
import type { DealerLegalInfo } from '@/lib/dealerLegal'

const Ctx = createContext<DealerLegalInfo | null>(null)

/** Datos legales del dealer de este dominio, para los formularios y el aviso de cookies. */
export function DealerLegalContext ({ value, children }: { value: DealerLegalInfo | null; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Null fuera de un sitio de dealer, o si sus datos están incompletos. */
export const useDealerLegal = () => useContext(Ctx)
