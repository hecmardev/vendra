import { ImageResponse } from 'next/og'
import { getTenant } from '@/lib/tenant'
import { getBusiness } from '@/lib/business'

/**
 * Favicon por sitio: las iniciales del dealer (por ejemplo "PQ") o "V" en
 * vendra.com.mx. Mientras los dealers no puedan subir su logo, es lo que aparece
 * en la pestaña del navegador y junto al resultado en Google.
 */
export const size = { width: 64, height: 64 }
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

function initials (name: string): string {
  const words = name.split(/\s+/).filter((w) => /^[\p{L}\p{N}]/u.test(w))
  return (words.slice(0, 2).map((w) => w[0]).join('') || 'V').toUpperCase()
}

export default async function Icon () {
  const tenant = await getTenant()
  const text = tenant ? initials((await getBusiness()).name) : 'V'
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          borderRadius: 14,
          color: '#ffffff',
          fontSize: text.length > 1 ? 30 : 38,
          fontWeight: 700,
          letterSpacing: -1
        }}
      >
        {text}
      </div>
    ),
    size
  )
}
