'use client'

import { CookiePreferencesLink } from '@/components/providers/CookieConsent'
import { useDealerLegal } from '@/components/providers/DealerLegalContext'

const LINK = 'underline underline-offset-2 hover:text-foreground'

/**
 * Aviso de privacidad simplificado, debajo de cada formulario. Mismo texto que el
 * § 5 de docs/legal/aviso-privacidad-dealer.md: si cambia uno, cambia el otro.
 * El enlace abre otra pestaña para no perder lo que ya se escribió.
 */
export function SimplifiedPrivacyNotice () {
  const legal = useDealerLegal()
  if (!legal) return null

  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      <strong>{legal.responsible}</strong> (&quot;{legal.commercialName}&quot;), con domicilio en {legal.address}, usará tu
      nombre, teléfono, correo y mensaje para atender tu solicitud y darle seguimiento. También medimos de dónde llegaste y
      qué autos viste para mejorar nuestra publicidad y, si lo aceptas, se lo informamos a Meta. Puedes rechazarlo en{' '}
      <CookiePreferencesLink className={LINK} />. Consulta el{' '}
      <a href="/aviso-de-privacidad" target="_blank" rel="noopener" className={LINK}>aviso de privacidad completo</a>.
    </p>
  )
}
