import { Car, CalendarDays, Star, Users } from 'lucide-react'
import { Reveal } from '@/components/motion/Reveal'
import { getContent } from '@/lib/content'

// Iconos fijos; los valores/labels de los stats vienen del contenido editable.
const STAT_ICONS = [Car, CalendarDays, Star, Users]

/** Hero imponente de "Acerca de": imagen de fondo + stats integrados. */
export async function AboutHero () {
  const { about } = await getContent()
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      {/* Fondo */}
      <div aria-hidden className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&h=900&fit=crop&q=80"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/85 to-primary/95" />
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-cta/25 blur-3xl" />
      </div>

      <div className="container relative pb-12 pt-32 md:pt-40">
        <div className="max-w-3xl">
          <Reveal>
            <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-primary-foreground/80 backdrop-blur">
              {about.heroBadge}
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-4 whitespace-pre-line text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              {about.heroTitle}
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-4 max-w-xl text-lg text-primary-foreground/70">
              {about.heroSubtitle}
            </p>
          </Reveal>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {about.stats.map(({ value, label }, i) => {
            const Icon = STAT_ICONS[i % STAT_ICONS.length]
            return (
              <Reveal key={label} delay={0.1 + i * 0.08}>
                <div className="rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                  <Icon className="mb-2 h-5 w-5 text-primary-foreground/80" />
                  <p className="text-2xl font-extrabold tracking-tight md:text-3xl">{value}</p>
                  <p className="text-xs text-primary-foreground/70">{label}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
