import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import { DealerThemeStyle } from '@/components/providers/DealerThemeStyle'
import './globals.css'

// Manrope como familia principal (variable font, auto-hospedada por next/font,
// font-display: swap). Expuesta como --font-manrope para Tailwind/shadcn.
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Vendra',
  description: 'Plataforma multi-tenant de venta de autos'
}

/**
 * Layout raíz. Aquí se inyecta:
 *  - El contenedor GTM compartido (un solo container; dispara el Pixel/GA4
 *    correcto según el dealer_id resuelto).
 *  - El branding por dealer: un <style> con overrides de variables CSS
 *    (--primary, --background, --radius, ...) a partir de dealers.branding.
 * TODO(impl): leer el tenant (getTenant) y su config para GTM + branding.
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
        {children}
      </body>
    </html>
  )
}
