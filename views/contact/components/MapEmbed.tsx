import { MapPin } from 'lucide-react'

/**
 * Mapa de la dirección del dealer, como iframe de Google Maps.
 *
 * Sin librería y sin llave a propósito. La *Maps JavaScript API* sí exige llave
 * y cuenta de facturación; el iframe no. Leaflet o MapLibre serían igual de
 * gratuitos, pero necesitan latitud y longitud: obligarían a geocodificar, a
 * guardar las coordenadas y a mantenerlas cuando un dealer se mude. Esta forma
 * trabaja con el texto que el dealer ya captura en Ajustes.
 *
 * La URL `?q=…&output=embed` NO está documentada por Google. Lleva años
 * funcionando, pero si algún día la retiran el reemplazo es la Maps Embed API
 * oficial, que pide llave y es gratuita e ilimitada — un cambio de `src`, no
 * rehacer esto.
 *
 * `loading="lazy"` porque el iframe arrastra scripts y cookies de Google: así no
 * cuesta nada hasta que el visitante baja a verlo.
 */
export function MapEmbed ({ address }: { address: string }) {
  const dir = address.trim()

  // Sin dirección el mapa caería en cualquier lado, que es peor que no tenerlo.
  if (!dir) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-xl border bg-muted text-muted-foreground">
        <div className="flex flex-col items-center gap-2 px-6 text-center">
          <MapPin className="h-8 w-8" />
          <span className="text-sm">Dirección no configurada</span>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <iframe
        src={`https://www.google.com/maps?q=${encodeURIComponent(dir)}&output=embed`}
        title={`Mapa de ${dir}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="block aspect-[16/10] w-full border-0"
      />
    </div>
  )
}
