'use client'

import { useEffect } from 'react'
import { isPanelPath, isPlatformHost } from '@/lib/storefront'
import { trackMeta } from '@/lib/metaPixel'

type Channel = 'whatsapp' | 'telefono' | 'correo' | 'mapa'

/** Evento estándar de Meta por canal: "cómo llegar" es FindLocation, el resto Contact. */
const META_EVENT: Record<Channel, string> = {
  whatsapp: 'Contact',
  telefono: 'Contact',
  correo: 'Contact',
  mapa: 'FindLocation'
}

/** Qué canal abre un enlace, por su href. null = no es de contacto. */
function channelOf (href: string): Channel | null {
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(href) || href.startsWith('whatsapp:')) return 'whatsapp'
  if (href.startsWith('tel:')) return 'telefono'
  if (href.startsWith('mailto:')) return 'correo'
  if (/^https?:\/\/(www\.google\.[^/]+\/maps|maps\.google\.|maps\.apple\.com|goo\.gl\/maps|maps\.app\.goo\.gl)/i.test(href)) return 'mapa'
  return null
}

/**
 * Registra los clics de contacto sin datos del storefront: WhatsApp, teléfono,
 * correo y "cómo llegar" (contact_clicks, 0017). No pinta nada.
 *
 * Escucha los clics de TODA la página en vez de que cada botón avise por su
 * cuenta: así cualquier enlace de contacto que se agregue después queda medido
 * sin tocarlo, y los botones siguen siendo componentes de servidor.
 *
 * `sendBeacon` sobrevive a que la página se vaya (wa.me abre la app, tel: el
 * marcador). El servidor resuelve el dealer, el visitante y la campaña.
 *
 * El mismo clic va al Pixel de Meta del dealer (Contact / FindLocation), si
 * está cargado; trackMeta no hace nada si no hay Pixel o no hay aceptación.
 */
export function ContactClickTracker () {
  useEffect(() => {
    if (isPlatformHost(location.hostname)) return

    const onClick = (e: MouseEvent) => {
      // El panel del dealer y el del admin no son visitas de clientes: el
      // WhatsApp del detalle de un lead es el vendedor escribiéndole al cliente.
      if (isPanelPath(location.pathname)) return

      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a) return
      const channel = channelOf(a.getAttribute('href') ?? '')
      if (!channel) return

      const body = JSON.stringify({
        channel,
        placement: a.closest('footer') ? 'pie' : 'pagina',
        path: location.pathname
      })

      // Se espera a que el clic termine de procesarse: si el botón lo canceló
      // (preventDefault), el canal nunca se abrió y no cuenta. Pasa en la ficha,
      // donde WhatsApp no abre hasta que el visitante escribe nombre y teléfono.
      // Con setTimeout y no con una microtarea: las microtareas corren antes que
      // los manejadores del propio botón.
      setTimeout(() => {
        if (e.defaultPrevented) return
        trackMeta(META_EVENT[channel], { channel })
        try {
          const ok = navigator.sendBeacon?.('/api/contact-clicks', new Blob([body], { type: 'application/json' }))
          if (!ok) {
            fetch('/api/contact-clicks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
              .catch(() => {})
          }
        } catch {}
      }, 0)
    }

    // Fase de captura: se entera del clic aunque algún botón detenga la
    // propagación. Si además lo cancela, lo descarta (ver arriba).
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  return null
}
