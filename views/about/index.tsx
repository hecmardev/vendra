import Link from 'next/link'
import { Navbar, Footer, Testimonials } from '@/components/common'
import { Reveal } from '@/components/motion/Reveal'
import { Button } from '@/components/ui/button'
import { getContent } from '@/lib/content'
import { AboutHero } from './components/AboutHero'
import { Story } from './components/Story'
import { Timeline } from './components/Timeline'
import { Values } from './components/Values'

/**
 * Vista "Acerca de": la carta de presentación del vendedor (historia,
 * trayectoria, valores y testimonios). Textos editables vía getContent.
 */
export async function About () {
  const { about } = await getContent()
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar overlay />
      <main className="flex-1">
        <AboutHero />
        <Story />
        <Timeline />
        <Values />
        <Testimonials />

        {/* CTA */}
        <section className="container py-16 text-center">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{about.ctaTitle}</h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">{about.ctaSubtitle}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild variant="cta" size="lg"><Link href="/autos">Ver autos</Link></Button>
              <Button asChild variant="outline" size="lg"><Link href="/contacto">Contáctanos</Link></Button>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </div>
  )
}
