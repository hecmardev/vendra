/**
 * Branding por dealer. Cada vendedor define su paleta y se traduce a overrides
 * de las variables CSS de shadcn, inyectadas en el layout raíz según el dominio.
 *
 * Los colores se guardan en formato HSL "H S% L%" (el mismo que usan los tokens
 * en app/globals.css), p. ej. "217 91% 60%". El radius es una longitud CSS
 * (p. ej. "0.5rem"). Todos los campos son opcionales: lo que no venga usa el
 * tema por defecto de la plataforma.
 */
export interface DealerBranding {
  primary?: string
  primaryForeground?: string
  secondary?: string
  secondaryForeground?: string
  accent?: string
  accentForeground?: string
  cta?: string
  ctaForeground?: string
  background?: string
  foreground?: string
  ring?: string
  radius?: string
  /** Overrides opcionales para modo oscuro (mismas llaves). */
  dark?: Omit<DealerBranding, 'dark' | 'radius'>
}

const VAR_MAP: Record<string, string> = {
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  cta: '--cta',
  ctaForeground: '--cta-foreground',
  background: '--background',
  foreground: '--foreground',
  ring: '--ring',
  radius: '--radius'
}

function declsFrom (obj: Record<string, unknown>): string {
  return Object.entries(VAR_MAP)
    .filter(([key]) => typeof obj[key] === 'string' && obj[key])
    .map(([key, cssVar]) => `${cssVar}: ${obj[key] as string};`)
    .join(' ')
}

/**
 * Convierte el branding del dealer en CSS con overrides de variables.
 * Devuelve '' si no hay nada que sobreescribir (se usa el tema por defecto).
 */
export function brandingToCss (branding: DealerBranding | null | undefined): string {
  if (!branding) return ''
  const rootDecls = declsFrom(branding as Record<string, unknown>)
  const darkDecls = branding.dark ? declsFrom(branding.dark as Record<string, unknown>) : ''

  let css = ''
  if (rootDecls) css += `:root{${rootDecls}}`
  if (darkDecls) css += `.dark{${darkDecls}}`
  return css
}
