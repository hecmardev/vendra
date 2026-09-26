import { Check } from 'lucide-react'
import { Reveal } from '@/components/motion/Reveal'
import { cn } from '@/lib/utils'
import { getContent } from '@/lib/content'

/** Historia del negocio + compromisos que dan confianza. */
export async function Story () {
  const { about } = await getContent()
  return (
    <section className={cn('container grid grid-cols-1 gap-10 py-16 md:items-center', about.storyImage && 'md:grid-cols-2')}>
      {/* Sin foto no se pinta el hueco: la historia pasa a ocupar el ancho
          completo, que se lee mejor que una caja gris vacía al lado. */}
      {about.storyImage && (
        <Reveal className="order-2 aspect-[4/3] overflow-hidden rounded-2xl border bg-muted shadow-sm md:order-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={about.storyImage}
            alt="Nuestro negocio"
            className="h-full w-full object-cover"
          />
        </Reveal>
      )}

      <Reveal delay={0.1} className="order-1 space-y-4 md:order-2">
        <span className="text-sm font-bold uppercase tracking-wide text-cta">{about.storyEyebrow}</span>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{about.storyTitle}</h2>
        {about.storyParagraphs.map((p, i) => (
          <p key={i} className="text-muted-foreground">{p}</p>
        ))}

        <ul className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
          {about.commitments.map((c) => (
            <li key={c} className="flex items-center gap-2 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cta/15 text-cta">
                <Check className="h-3 w-3" />
              </span>
              {c}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  )
}
