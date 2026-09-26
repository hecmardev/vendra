import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import { Navbar, Footer, LeadForm, WhatsAppButton, PageHeader, AddressLink, PhoneLink, MailLink } from '@/components/common'
import { Reveal } from '@/components/motion/Reveal'
import { getContent } from '@/lib/content'
import { getBusiness } from '@/lib/business'
import { MapEmbed } from './components/MapEmbed'

/** Vista "Contacto": formulario de leads + datos de contacto + mapa. */
export async function Contact () {
  const { contact, headerImage } = await getContent()
  const business = await getBusiness()
  const info = [
    { icon: Phone, label: 'Teléfono', value: business.phone, link: <PhoneLink phone={business.phone} /> },
    { icon: Mail, label: 'Correo', value: business.email, link: <MailLink email={business.email} /> },
    { icon: MapPin, label: 'Dirección', value: business.address, link: <AddressLink address={business.address} /> },
    { icon: Clock, label: 'Horario', value: business.hours }
  ]

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar overlay dealerName={business.name} />
      <main className="flex-1">
        <PageHeader title={contact.title} subtitle={contact.subtitle} image={headerImage || undefined} />

        <div className="container grid grid-cols-1 gap-10 py-10 lg:grid-cols-2">
          {/* Info + mapa */}
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {info.map(({ icon: Icon, label, value, link }, i) => (
                <Reveal key={label} delay={i * 0.06}>
                  <div className="flex items-start gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium">
                        {link ?? value}
                      </p>
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

            <Reveal delay={0.26}>
              <MapEmbed address={business.address} />
            </Reveal>
          </div>

          {/* Formulario */}
          <Reveal delay={0.12}>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">{contact.formTitle}</h2>
              <LeadForm source="web_form" />
            </div>
          </Reveal>
        </div>
      </main>
      <Footer />
    </div>
  )
}
