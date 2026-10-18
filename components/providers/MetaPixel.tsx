'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { CONSENT_CHANGED_EVENT, canUseMetaPixel, readConsentCookie } from '@/lib/consent'
import { isStorefrontPage } from '@/lib/storefront'
import { isMetaPixelLoaded, loadMetaPixel, trackMeta } from '@/lib/metaPixel'

/**
 * Carga el Pixel de Meta del dealer de este dominio (lib/metaPixel.ts) y manda
 * PageView en cada página. Solo en el sitio público y solo si el visitante
 * aceptó las cookies; si acepta después de entrar, se carga en ese momento.
 *
 * El id viene del servidor (layout raíz → dealers.meta_pixel_id). Si el dealer
 * no tiene Pixel, este componente ni se monta.
 */
export function MetaPixel ({ pixelId }: { pixelId: string }) {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  const pageView = (path: string) => {
    if (!isStorefrontPage() || !isMetaPixelLoaded() || lastPath.current === path) return
    lastPath.current = path
    trackMeta('PageView')
  }

  // Carga inicial, y carga tardía si acepta con el sitio ya abierto.
  useEffect(() => {
    const start = () => {
      if (!isStorefrontPage() || !canUseMetaPixel(readConsentCookie())) return
      loadMetaPixel(pixelId)
      pageView(location.pathname)
    }
    start()
    window.addEventListener(CONSENT_CHANGED_EVENT, start)
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, start)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixelId])

  // Navegación dentro del sitio: Next cambia de página sin recargar.
  useEffect(() => {
    if (pathname) pageView(pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return null
}
