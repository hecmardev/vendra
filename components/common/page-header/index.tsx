import { Reveal } from '@/components/motion/Reveal'

/**
 * Cabecera oscura consistente para páginas internas (catálogo, contacto, etc.).
 * Mismo lenguaje visual que el hero: fondo `primary` (themeable) + glows.
 * Incluye padding superior para el navbar fijo (overlay).
 */
export default function PageHeader ({
  title,
  subtitle,
  image,
  children
}: {
  title: string
  subtitle?: string
  /** Imagen de fondo opcional (URL). Sin ella, se usan los glows por defecto. */
  image?: string
  children?: React.ReactNode
}) {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      {image
        ? (
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-full w-full object-cover" />
            {/* Overlays para que el título siga legible sobre cualquier foto. */}
            <div className="absolute inset-0 bg-primary/70" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />
          </div>
          )
        : (
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-cta/25 blur-3xl" />
            <div className="absolute -right-16 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          </div>
          )}
      <div className="container relative pb-14 pt-28 md:pt-32">
        <Reveal>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-xl text-primary-foreground/70">{subtitle}</p>}
        </Reveal>
        {children && (
          <Reveal delay={0.1} className="mt-6">
            {children}
          </Reveal>
        )}
      </div>
    </section>
  )
}
