import { Navbar, Footer, Testimonials } from '@/components/common'
import { Hero } from './components/Hero'
import { Categories } from './components/Categories'
import { Featured } from './components/Featured'
import { HowItWorks } from './components/HowItWorks'
import { getBusiness } from '@/lib/business'

/**
 * Vista home del dealer. Componente raíz: compone las secciones de la página.
 * Patrón doorvel_next: la página (app/page.tsx) es delgada; aquí vive la UI.
 *
 * TODO(impl): envolver en <HomepageProvider value={...}> con datos SSR
 * (dealer, destacados). El nombre del dealer ya llega a Navbar y Footer.
 */
export async function Homepage () {
  const { name: businessName } = await getBusiness()

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar overlay dealerName={businessName} />
      <main className="flex-1">
        <Hero />
        <Categories />
        <Featured />
        <HowItWorks />
        <Testimonials />
      </main>
      <Footer />
    </div>
  )
}
