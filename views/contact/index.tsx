import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import { Navbar, Footer, LeadForm, WhatsAppButton, PageHeader } from '@/components/common'
import { Reveal } from '@/components/motion/Reveal'
import { getContent } from '@/lib/content'
import { getBusiness } from '@/lib/business'

/** Vista "Contacto": formulario de leads + datos de contacto + mapa. */
export async function Contact () {
  const { contact, headerImage } = await getContent()
  const business = await getBusiness()
  const info = [
    { icon: Phone, label: 'Teléfono', value: business.phone },
    { icon: Mail, label: 'Correo', value: business.email },
    { icon: MapPin, label: 'Dirección', value: business.address },
    { icon: Clock, label: 'Horario', value: business.hours }
  ]

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar overlay />
      <main className="flex-1">
        <PageHeader title={contact.title} subtitle={contact.subtitle} image={headerImage || undefined} />

        <div className="container grid grid-cols-1 gap-10 py-10 lg:grid-cols-2">
          {/* Info + mapa */}
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {info.map(({ icon: Icon, label, value }, i) => (
                <Reveal key={label} delay={i * 0.06}>
                  <div className="flex items-start gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium">{value}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.2}>
              <WhatsAppButton
                phone={business.whatsapp}
                message="Hola, tengo una pregunta"
                className="w-full sm:w-auto"
              >
                Escríbenos por WhatsApp
              </WhatsAppButton>
            </Reveal>

            {/* Mapa (placeholder). TODO(impl): embeber Google Maps del dealer. */}
            <Reveal delay={0.26}>
              <div className="flex aspect-[16/10] w-full items-center justify-center rounded-xl border bg-muted text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <MapPin className="h-8 w-8" />
                  <span className="text-sm">{business.address}</span>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Formulario */}
          <Reveal delay={0.12}>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">{contact.formTitle}</h2>
              <LeadForm />
            </div>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  )
}
