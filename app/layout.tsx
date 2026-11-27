import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import { DealerThemeStyle } from '@/components/providers/DealerThemeStyle'
import { ContactClickTracker } from '@/components/providers/ContactClickTracker'
import { DealerMarketing, getDealerDomainVerification } from '@/components/providers/DealerMarketing'
import { DealerLegal } from '@/components/providers/DealerLegal'
import { requestOrigin } from '@/lib/requestOrigin'
import { getTenant } from '@/lib/tenant'
import { getBusiness } from '@/lib/business'
import './globals.css'

// Manrope como familia principal (variable font, auto-hospedada por next/font,
// font-display: swap). Expuesta como --font-manrope para Tailwind/shadcn.
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap'
})

export async function generateMetadata (): Promise<Metadata> {
  // Etiqueta <meta name="facebook-domain-verification"> con la que Meta verifica
  // que el dominio es del dealer (0018). Solo en sitios de dealer que la tengan.
  const fbVerification = await getDealerDomainVerification()
  // Base de las URLs absolutas (canonical, imágenes para compartir): el dominio
  // que se está viendo. Sin esto, en Vercel Next las arma con la dirección
  // *.vercel.app del proyecto y el canonical de un dealer apuntaría a otro sitio.
  const { origin } = await requestOrigin()
  const tenant = await getTenant()
  const siteName = tenant ? (await getBusiness()).name : 'Vendra'
  return {
    metadataBase: new URL(origin),
    title: 'Vendra',
    description: 'Plataforma multi-tenant de venta de autos',
    openGraph: { siteName, locale: 'es_MX', type: 'website' },
    ...(fbVerification ? { other: { 'facebook-domain-verification': fbVerification } } : {})
  }
}

/**
 * Layout raíz. Aquí se inyecta, según el dealer resuelto por el dominio:
 *  - El branding: un <style> con overrides de variables CSS (DealerThemeStyle).
 *  - El aviso de cookies y el Pixel de Meta del dealer (DealerMarketing).
 *  - El registro de clics de contacto (ContactClickTracker).
 * Cada pieza decide sola si actúa: en la plataforma y en los paneles no hacen nada.
 */
export default function RootLayout ({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={manrope.variable} suppressHydrationWarning>
      <body>
        {/* Tema del dealer (overrides de variables CSS) según el dominio. */}
        <DealerThemeStyle />
        {/* Clics de WhatsApp, teléfono, correo y mapa en el storefront (0017). */}
        <ContactClickTracker />
        {/* Aviso de cookies y Pixel de Meta del dealer (0018). */}
        <DealerLegal>
          <DealerMarketing />
          {children}
        </DealerLegal>
      </body>
    </html>
  )
}
