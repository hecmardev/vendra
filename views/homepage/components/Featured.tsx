import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CarCard } from '@/components/common'
import { Reveal } from '@/components/motion/Reveal'
import { getContent } from '@/lib/content'
import { getTenant } from '@/lib/tenant'
import { listPublicCars } from '@/services/cars'

/** Autos destacados del dealer (datos reales de Supabase). */
export async function Featured () {
  const { sections } = await getContent()
  const tenant = await getTenant()
  const cars = tenant ? (await listPublicCars(tenant.dealerId)).slice(0, 4) : []
  if (cars.length === 0) return null

  return (
    <section className="container py-14">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-xl font-bold tracking-tight">{sections.featuredTitle}</h2>
        <Link href="/autos" className="inline-flex items-center gap-1 text-sm font-medium text-cta hover:underline">
          Ver todo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {/* Carrusel solo en móvil, donde el swipe es natural y la card cortada se
          lee como "hay más". De sm en adelante es grilla: en desktop el scroll
          horizontal no tiene barra ni flechas, así que la última card cortada
          solo parecía un desborde. En lg son 4 columnas para que los 4 autos
          quepan en una sola fila; el catálogo usa 3 porque ahí las cards son
          el contenido, no un adelanto. */}
      <Reveal>
        <div className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
          {cars.map((car) => (
            <div key={car.id} className="w-[280px] shrink-0 snap-start sm:w-auto">
              <CarCard car={car} />
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
