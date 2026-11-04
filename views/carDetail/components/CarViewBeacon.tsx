'use client'

import { useEffect, useRef } from 'react'
import { carEventParams, trackMeta } from '@/lib/metaPixel'
import { CONSENT_CHANGED_EVENT, ENGAGED_EVENT } from '@/lib/consent'

interface BeaconCar {
  id: string
  brand: string
  model: string
  year: number
  condition: string
  price: number
}

/**
 * Avisa que se abrió esta ficha. No pinta nada. Dos destinos:
 *
 *  - /api/views (car_views, 0016): las vistas propias del panel.
 *  - El Pixel de Meta del dealer: ViewContent con los datos del auto, para
 *    audiencias como "vio un Kia nuevo" (lib/metaPixel.ts; no hace nada sin
 *    Pixel o sin aceptación de cookies).
 *
 * Desde el navegador y no al generar la página: los robots y los prefetch de
 * <Link> no ejecutan esto, así que no inflan las vistas, y la caché del sitio
 * no se salta ninguna. `sendBeacon` no bloquea la página y sobrevive a que el
 * visitante se vaya enseguida. Manda las cookies del dominio, que es de donde
 * sale el visitante y su campaña.
 *
 * ViewContent también sale al ACEPTAR las cookies con la ficha abierta. Quien
 * llega de un anuncio directo a un auto ve el aviso segundos después de abrirla,
 * cuando el Pixel aún no cargaba: sin esto se perdería la vista de justo el auto
 * del anuncio, la que más sirve para remarketing. MetaPixel escucha el mismo
 * evento y, por montarse antes en el layout, ya cargó el Pixel cuando llega aquí.
 */
export function CarViewBeacon ({ car }: { car: BeaconCar }) {
  // En desarrollo React monta los efectos dos veces: sin esto cada vista
  // contaría doble en local.
  const sent = useRef<string | null>(null)
  // Aparte de `sent`: la vista propia sale al abrir, la de Meta puede salir después.
  const sentToMeta = useRef<string | null>(null)

  const viewContent = () => {
    if (sentToMeta.current === car.id) return
    if (trackMeta('ViewContent', carEventParams(car))) sentToMeta.current = car.id
  }

  useEffect(() => {
    window.addEventListener(CONSENT_CHANGED_EVENT, viewContent)
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, viewContent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [car.id])

  useEffect(() => {
    viewContent()

    if (sent.current === car.id) return
    sent.current = car.id

    // Abrir una ficha es el momento en que el aviso de cookies aparece (CookieConsent).
    window.dispatchEvent(new Event(ENGAGED_EVENT))

    const body = JSON.stringify({ carId: car.id })
    try {
      const ok = navigator.sendBeacon?.('/api/views', new Blob([body], { type: 'application/json' }))
      if (!ok) {
        fetch('/api/views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
          .catch(() => {})
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [car.id])

  return null
}
