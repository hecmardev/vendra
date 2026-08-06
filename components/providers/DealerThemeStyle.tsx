import { getTenant } from '@/lib/tenant'
import { getDealerById } from '@/services/dealers'
import { brandingToCss, type DealerBranding } from '@/lib/branding'

/**
 * Inyecta el tema del dealer (overrides de variables CSS) según el dominio.
 * Server Component: se resuelve por request. Si no hay tenant o Supabase aún no
 * está configurado, no inyecta nada y se usa el tema por defecto de la plataforma.
 *
 * Debe renderizarse DESPUÉS de globals.css (dentro del <body>) para que los
 * overlays de :root ganen por orden de cascada.
 */
export async function DealerThemeStyle () {
  let css = ''
  try {
    const tenant = await getTenant()
    if (tenant) {
      const dealer = await getDealerById(tenant.dealerId)
      css = brandingToCss(dealer?.branding as DealerBranding | undefined)
    }
  } catch {
    // Sin tenant / sin Supabase configurado: tema por defecto.
  }

  if (!css) return null
  return <style id="dealer-theme" dangerouslySetInnerHTML={{ __html: css }} />
}
