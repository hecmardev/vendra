import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Reveal } from '@/components/motion/Reveal'
import { getContent } from '@/lib/content'

/**
 * Hero enfocado en búsqueda (dark, look híbrido). Usa `primary` como fondo para
 * que herede el branding del dealer. La barra de búsqueda es el CTA principal.
 * Los textos vienen del contenido editable del dealer (getContent).
 */
export async function Hero () {
  const { hero } = await getContent()
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      {/* Fondo: imagen con overlay oscuro. Para usar video, reemplaza el <img> por:
          <video autoPlay muted loop playsInline className="h-full w-full object-cover" src="/hero.mp4" /> */}
      <div aria-hidden className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1600&h=900&fit=crop&q=80"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/80 to-primary/95" />
      </div>

      {/* Glows ambientales (toque tecnológico) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-cta/30 blur-3xl" />
        <div className="absolute -right-20 top-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-40 w-[36rem] -translate-x-1/2 rounded-full bg-cta/10 blur-3xl" />
      </div>

      <div className="container relative flex flex-col items-center gap-6 py-28 text-center md:py-36">
        <Reveal delay={0}>
          <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-primary-foreground/80 backdrop-blur">
            {hero.badge}
          </span>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            {hero.title}
          </h1>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="max-w-xl text-lg text-primary-foreground/70">
            {hero.subtitle}
          </p>
        </Reveal>

        {/* Barra de búsqueda = CTA (claro, contrasta sobre el hero oscuro) */}
        <Reveal delay={0.24} className="w-full max-w-xl">
          <form
            action="/autos"
            className="flex w-full items-center gap-2 rounded-xl border bg-card p-2 text-foreground shadow-lg shadow-black/20"
          >
            <div className="flex flex-1 items-center gap-2 pl-2">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Marca, modelo o palabra clave…"
                className="border-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <Button type="submit" variant="cta" size="lg">Buscar</Button>
          </form>
        </Reveal>

        <Reveal delay={0.32}>
          <p className="text-sm text-primary-foreground/70">
            Populares:{' '}
            {['SUV', 'Pickup', 'Sedán'].map((t, i) => (
              <span key={t}>
                {i > 0 && ' · '}
                <Link href={`/autos?tipo=${t}`} className="font-medium text-primary-foreground underline-offset-2 hover:underline">
                  {t}
                </Link>
              </span>
            ))}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
