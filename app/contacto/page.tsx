import type { Metadata } from 'next'
import { Contact } from 'views/contact'
import { getBusiness } from '@/lib/business'

export async function generateMetadata (): Promise<Metadata> {
  const { name, address } = await getBusiness()
  return {
    title: `Contacto — ${name}`,
    description: `Contáctanos por WhatsApp, teléfono o el formulario. ${address}.`
  }
}

export default function Page () {
  return <Contact />
}
