import Link from 'next/link'
import {
  Car, Globe, MessageCircle, Users, BarChart3, Palette, Wand2,
  Check, ArrowRight, UserPlus, Settings2, Rocket
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/motion/Reveal'

const FEATURES = [
  { icon: Globe, title: 'Tu propio dominio', desc: 'Tu página en tudominio.com, no un perfil dentro de otro sitio.' },
  { icon: MessageCircle, title: 'WhatsApp integrado', desc: 'Cada auto con botón directo a tu WhatsApp, mensaje prellenado.' },
  { icon: Users, title: 'Leads en un panel', desc: 'Todos los contactos que llegan de tu sitio, ordenados en un solo lugar.' },
  { icon: BarChart3, title: 'Marketing listo', desc: 'Conecta tu Meta Pixel y Google Analytics para medir y anunciar.' },
  { icon: Palette, title: 'Tu marca', desc: 'Tus colores, tu logo y tus textos. Configúralos sin depender de nadie.' },
  { icon: Wand2, title: 'Sin código', desc: 'Subes autos y editas tu sitio desde un panel simple. Nosotros el resto.' }
]

const STEPS = [
  { icon: UserPlus, title: 'Te damos de alta', desc: 'Creamos tu cuenta y conectamos tu dominio.' },
  { icon: Settings2, title: 'Configuras tu marca', desc: 'Colores, textos y tus autos desde tu panel.' },
  { icon: Rocket, title: 'Recibes clientes', desc: 'Tu sitio atrae y captura leads por WhatsApp.' }
]

const PLANS = [
  { name: 'Base', price: '$X', tagline: 'Para empezar a vender en línea', features: ['Sitio con tu dominio', 'Inventario ilimitado', 'Leads + WhatsApp', 'Meta Pixel y GA4'], cta: 'Empezar', highlight: false },
  { name: 'Pro', price: '$XX', tagline: 'Más herramientas para crecer', features: ['Todo lo de Base', 'Sección personalizada', 'Asistente de IA por WhatsApp', 'Soporte prioritario'], cta: 'Quiero Pro', highlight: true }
]

/** Landing de la plataforma (vendra.com.mx): atrae dealers a la plataforma. */
export function Landing () {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Car className="h-5 w-5" />
            </span>
            <span className="text-lg tracking-tight">Vendra</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Los dealers inician sesión en su propio dominio (dealer.com/dashboard),
                no aquí. La landing de plataforma es solo marketing + captación. */}
            <Button asChild variant="cta" size="sm"><Link href="#contacto">Conviértete en dealer</Link></Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-cta/30 blur-3xl" />
            <div className="absolute -right-20 top-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          </div>
          <div className="container relative flex flex-col items-center gap-6 py-24 text-center md:py-32">
            <Reveal>
              <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-primary-foreground/80 backdrop-blur">
                Plataforma para vendedores de autos
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                Tu propia página para vender autos
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="max-w-xl text-lg text-primary-foreground/70">
                Catálogo, WhatsApp, leads y marketing en tu propio dominio. Sin programar, listo en días.
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild variant="cta" size="lg"><Link href="#contacto">Conviértete en dealer</Link></Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                  <Link href="#como-funciona">Cómo funciona</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Features */}
        <section className="container py-16">
          <Reveal className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Todo lo que necesitas para vender</h2>
            <p className="mt-2 text-muted-foreground">Una plataforma pensada para vendedores de autos.</p>
          </Reveal>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 0.06}>
                <div className="h-full rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="relative overflow-hidden bg-primary text-primary-foreground">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-cta/20 blur-3xl" />
          </div>
          <div className="container relative py-16">
            <Reveal className="mb-10 text-center">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Empieza en 3 pasos</h2>
            </Reveal>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, desc }, i) => (
                <Reveal key={title} delay={i * 0.1} className="flex flex-col items-center gap-3 text-center">
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
                    <Icon className="h-6 w-6" />
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-cta text-xs font-bold text-cta-foreground">{i + 1}</span>
                  </span>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="max-w-xs text-sm text-primary-foreground/70">{desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Planes */}
        <section className="container py-16">
          <Reveal className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Planes simples</h2>
            <p className="mt-2 text-muted-foreground">Renta mensual. Cancela cuando quieras.</p>
          </Reveal>
          <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
            {PLANS.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.08}>
                <div className={plan.highlight
                  ? 'relative h-full rounded-2xl border-2 border-cta bg-card p-6 shadow-lg'
                  : 'h-full rounded-2xl border bg-card p-6 shadow-sm'}>
                  {plan.highlight && (
                    <span className="absolute -top-3 left-6 rounded-full bg-cta px-3 py-0.5 text-xs font-bold text-cta-foreground">Popular</span>
                  )}
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                  <p className="mt-4"><span className="text-3xl font-extrabold tracking-tight">{plan.price}</span><span className="text-sm text-muted-foreground">/mes</span></p>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cta/15 text-cta"><Check className="h-3 w-3" /></span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant={plan.highlight ? 'cta' : 'outline'} className="mt-6 w-full"><Link href="#contacto">{plan.cta}</Link></Button>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CTA / contacto */}
        <section id="contacto" className="container py-16">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground">
              <div aria-hidden className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-0 h-40 w-[36rem] -translate-x-1/2 rounded-full bg-cta/20 blur-3xl" />
              </div>
              <div className="relative">
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">¿Listo para tener tu página?</h2>
                <p className="mx-auto mt-2 max-w-md text-primary-foreground/70">Escríbenos y te damos de alta. Sin permanencia.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button asChild variant="cta" size="lg"><a href="mailto:hola@vendra.com.mx">Solicitar acceso <ArrowRight className="h-4 w-4" /></a></Button>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground md:flex-row">
          <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground"><Car className="h-4 w-4" /></span>
            Vendra
          </Link>
          <p>© {new Date().getFullYear()} Vendra. Plataforma para vendedores de autos.</p>
        </div>
      </footer>
    </div>
  )
}
