import { Star, Quote } from 'lucide-react'
import { Reveal } from '@/components/motion/Reveal'
import { getContent } from '@/lib/content'

/** Sección de testimonios de clientes (prueba social). Reutilizable en home y about. */
export default async function Testimonials () {
  const { about } = await getContent()
  return (
    <section className="border-y bg-secondary/40">
      <div className="container py-16">
        <Reveal className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{about.testimonialsTitle}</h2>
          <p className="mt-2 text-muted-foreground">{about.testimonialsSubtitle}</p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {about.testimonials.map((t, i) => (
            <Reveal key={t.name + i} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-xl border bg-card p-6 shadow-sm">
                <Quote className="h-6 w-6 text-cta/60" />
                <blockquote className="mt-3 flex-1 text-sm text-foreground/90">“{t.text}”</blockquote>
                <div className="mt-4 flex items-center gap-0.5">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-cta text-cta" />
                  ))}
                </div>
                <figcaption className="mt-3 border-t pt-3 text-sm">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-muted-foreground"> · {t.location} · {t.car}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
