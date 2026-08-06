import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CarCard } from '@/components/common'
import { Reveal } from '@/components/motion/Reveal'
import { getContent } from '@/lib/content'
import { getTenant } from '@/lib/tenant'
import { listCars } from '@/services/cars'

/** Autos destacados del dealer (datos reales de Supabase). */
export async function Featured () {
  const { sections } = await getContent()
  const tenant = await getTenant()
  const cars = tenant ? (await listCars(tenant.dealerId)).slice(0, 6) : []
  if (cars.length === 0) return null

  return (
    <section className="container py-14">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-xl font-bold tracking-tight">{sections.featuredTitle}</h2>
        <Link href="/autos" className="inline-flex items-center gap-1 text-sm font-medium text-cta hover:underline">
          Ver todo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {/* Carrusel: scroll horizontal con snap (swipe en móvil, scroll en desktop) */}
      <Reveal>
        <div className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cars.map((car) => (
            <div key={car.id} className="w-[280px] shrink-0 snap-start sm:w-[320px]">
              <CarCard car={car} />
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
