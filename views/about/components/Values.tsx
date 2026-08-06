import { ShieldCheck, Handshake, Sparkles, Gauge } from 'lucide-react'
import { Reveal } from '@/components/motion/Reveal'
import { getContent } from '@/lib/content'

const ICONS = [ShieldCheck, Handshake, Sparkles, Gauge]

/** Por qué elegirnos: valores (banda oscura). */
export async function Values () {
  const { about } = await getContent()
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-cta/20 blur-3xl" />
      </div>
      <div className="container relative py-16">
        <Reveal className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{about.valuesTitle}</h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {about.values.map(({ title, desc }, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <Reveal key={title} delay={i * 0.08} className="flex flex-col items-center gap-3 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-primary-foreground backdrop-blur">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-primary-foreground/70">{desc}</p>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
