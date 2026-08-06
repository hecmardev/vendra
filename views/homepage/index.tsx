import { Navbar, Footer, Testimonials } from '@/components/common'
import { Hero } from './components/Hero'
import { Categories } from './components/Categories'
import { Featured } from './components/Featured'
import { HowItWorks } from './components/HowItWorks'

/**
 * Vista home del dealer. Componente raíz: compone las secciones de la página.
 * Patrón doorvel_next: la página (app/page.tsx) es delgada; aquí vive la UI.
 *
 * TODO(impl): envolver en <HomepageProvider value={...}> con datos SSR
 * (dealer, destacados) y pasar dealerName real a Navbar/Footer.
 */
export function Homepage () {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar overlay />
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
