import { Search, MessageCircle, KeyRound } from 'lucide-react'
import { Reveal } from '@/components/motion/Reveal'
import { getContent } from '@/lib/content'

// Los iconos son fijos (UI); los textos vienen del contenido editable.
const STEP_ICONS = [Search, MessageCircle, KeyRound]

/** Sección "cómo funciona" en 3 pasos. */
export async function HowItWorks () {
  const { sections } = await getContent()
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-cta/20 blur-3xl" />
      </div>
      <div className="container relative py-16">
        <h2 className="mb-10 text-center text-2xl font-bold tracking-tight">{sections.howItWorksTitle}</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {sections.howItWorksSteps.map(({ title, desc }, i) => {
            const Icon = STEP_ICONS[i % STEP_ICONS.length]
            return (
            <Reveal key={title} delay={i * 0.1} className="flex flex-col items-center gap-3 text-center">
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-primary-foreground backdrop-blur">
                <Icon className="h-6 w-6" />
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-cta text-xs font-bold text-cta-foreground">
                  {i + 1}
                </span>
              </span>
              <h3 className="font-semibold">{title}</h3>
              <p className="max-w-xs text-sm text-primary-foreground/70">{desc}</p>
            </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
