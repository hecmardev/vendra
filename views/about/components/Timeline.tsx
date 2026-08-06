import { Rocket, Store, ShieldCheck, Trophy } from 'lucide-react'
import { Reveal } from '@/components/motion/Reveal'
import { getContent } from '@/lib/content'

const ICONS = [Rocket, Store, ShieldCheck, Trophy]

/** Trayectoria: hitos del negocio en una línea de tiempo horizontal. */
export async function Timeline () {
  const { about } = await getContent()
  return (
    <section className="container py-16">
      <Reveal className="mb-12 text-center">
        <span className="text-sm font-bold uppercase tracking-wide text-cta">{about.timelineEyebrow}</span>
        <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{about.timelineTitle}</h2>
      </Reveal>

      <div className="relative">
        {/* Línea conectora (desktop) */}
        <div aria-hidden className="absolute left-0 right-0 top-7 hidden h-0.5 bg-gradient-to-r from-transparent via-border to-transparent md:block" />

        <div className="grid gap-10 md:grid-cols-4 md:gap-6">
          {about.milestones.map((m, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <Reveal key={m.year + m.title} delay={i * 0.1}>
                <div className="flex flex-col items-center text-center">
                  <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-8 ring-background">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="mt-4 text-3xl font-extrabold tracking-tight text-cta">{m.year}</span>
                  <h3 className="mt-1 font-semibold">{m.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{m.desc}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
