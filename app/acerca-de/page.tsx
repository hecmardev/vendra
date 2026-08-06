import type { Metadata } from 'next'
import { About } from 'views/about'
import { getBusiness } from '@/lib/business'

export async function generateMetadata (): Promise<Metadata> {
  const { name } = await getBusiness()
  return {
    title: `Nosotros — ${name}`,
    description: `Conoce nuestra historia, trayectoria y por qué comprar tu auto con ${name}.`
  }
}

export default function Page () {
  return <About />
}
