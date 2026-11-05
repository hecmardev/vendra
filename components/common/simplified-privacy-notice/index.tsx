'use client'

import { useDealerLegal } from '@/components/providers/DealerLegalContext'

/**
 * Referencia al aviso de privacidad, debajo de cada formulario. Mismo texto que el
 * § 5 de docs/legal/aviso-privacidad-dealer.md: si cambia uno, cambia el otro.
 * El enlace abre otra pestaña para no perder lo que ya se escribió.
 */
export function SimplifiedPrivacyNotice () {
  const legal = useDealerLegal()
  if (!legal) return null

  return (
    <p className="text-center text-xs text-muted-foreground">
      Usaremos tus datos para atender tu solicitud. Consulta nuestro{' '}
      <a href="/aviso-de-privacidad" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-foreground">aviso de privacidad</a>.
    </p>
  )
}
