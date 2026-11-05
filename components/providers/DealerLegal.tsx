import { getTenant } from '@/lib/tenant'
import { getDealerById } from '@/services/dealers'
import { getDealerLegalInfo, type DealerLegalInfo } from '@/lib/dealerLegal'
import { DealerLegalContext } from './DealerLegalContext'

/** Datos legales del dealer de este dominio, o null si no hay dealer o están incompletos. */
export async function getCurrentDealerLegal (): Promise<DealerLegalInfo | null> {
  try {
    const tenant = await getTenant()
    if (!tenant) return null
    return getDealerLegalInfo(await getDealerById(tenant.dealerId))
  } catch {
    return null
  }
}

/** Pasa esos datos a los componentes de navegador (formularios, aviso de cookies). */
export async function DealerLegal ({ children }: { children: React.ReactNode }) {
  return <DealerLegalContext value={await getCurrentDealerLegal()}>{children}</DealerLegalContext>
}
