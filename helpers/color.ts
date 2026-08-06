/**
 * Convierte un hex (#RRGGBB) al formato "H S% L%" que usan los tokens de shadcn.
 * Ej: "#dc2626" -> "0 72% 51%". Devuelve '' si el hex es inválido.
 */
export function hexToHsl (hex: string): string {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim())
  if (!m) return ''
  const r = parseInt(m[1], 16) / 255
  const g = parseInt(m[2], 16) / 255
  const b = parseInt(m[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h /= 6
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/**
 * Convierte el formato "H S% L%" de shadcn a un hex (#RRGGBB), para precargar
 * los color pickers con el branding guardado. Devuelve fallback si es inválido.
 */
export function hslToHex (hsl: string | undefined, fallback = ''): string {
  if (!hsl) return fallback
  const m = /^\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*$/.exec(hsl)
  if (!m) return fallback
  const h = Number(m[1]) / 360
  const s = Number(m[2]) / 100
  const l = Number(m[3]) / 100

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  const toHex = (x: number): string => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
