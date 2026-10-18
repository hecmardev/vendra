import { getTenant } from '@/lib/tenant'
import { getDealerById } from '@/services/dealers'
import { MetaPixel } from './MetaPixel'
import { CookieConsent } from './CookieConsent'

/**
 * Herramientas de marketing del sitio del dealer: el aviso de cookies y su
 * Pixel de Meta (0018). Server Component: resuelve el dealer por el dominio y
 * solo monta el Pixel si tiene uno capturado. Las piezas del navegador deciden
 * además si la página es del sitio público y si hay consentimiento.
 */
export async function DealerMarketing () {
  let pixelId: string | null = null
  try {
    const tenant = await getTenant()
    if (tenant) pixelId = (await getDealerById(tenant.dealerId))?.meta_pixel_id ?? null
  } catch {
    // Sin tenant / sin Supabase: sin Pixel. El sitio funciona igual.
  }

  return (
    <>
      <CookieConsent />
      {pixelId && <MetaPixel pixelId={pixelId} />}
    </>
  )
}

/** Código de verificación del dominio en Meta del dealer de este dominio, si lo tiene. */
export async function getDealerDomainVerification (): Promise<string | null> {
  try {
    const tenant = await getTenant()
    if (!tenant) return null
    return (await getDealerById(tenant.dealerId))?.meta_domain_verification ?? null
  } catch {
    return null
  }
}
