'use client'

import { useEffect, useRef } from 'react'

/**
 * Avisa a /api/views que se abrió esta ficha (car_views, 0016). No pinta nada.
 *
 * Desde el navegador y no al generar la página: los robots y los prefetch de
 * <Link> no ejecutan esto, así que no inflan las vistas, y la caché del sitio
 * no se salta ninguna. `sendBeacon` no bloquea la página y sobrevive a que el
 * visitante se vaya enseguida. Manda las cookies del dominio, que es de donde
 * sale el visitante y su campaña.
 */
export function CarViewBeacon ({ carId }: { carId: string }) {
  // En desarrollo React monta los efectos dos veces: sin esto cada vista
  // contaría doble en local.
  const sent = useRef<string | null>(null)

  useEffect(() => {
    if (sent.current === carId) return
    sent.current = carId
    const body = JSON.stringify({ carId })
    try {
      const ok = navigator.sendBeacon?.('/api/views', new Blob([body], { type: 'application/json' }))
      if (!ok) {
        fetch('/api/views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
          .catch(() => {})
      }
    } catch {}
  }, [carId])

  return null
}
