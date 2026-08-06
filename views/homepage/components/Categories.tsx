import Link from 'next/link'
import { Car, Truck, Caravan, CarFront } from 'lucide-react'
import { Reveal } from '@/components/motion/Reveal'
import { getContent } from '@/lib/content'

const CATEGORIES = [
  { label: 'SUV', icon: Car },
  { label: 'Sedán', icon: CarFront },
  { label: 'Pickup', icon: Truck },
  { label: 'Hatchback', icon: Caravan }
]

/** Accesos rápidos por tipo de auto. */
export async function Categories () {
  const { sections } = await getContent()
  return (
    <section className="container py-14">
      <h2 className="mb-6 text-xl font-bold tracking-tight">{sections.categoriesTitle}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {CATEGORIES.map(({ label, icon: Icon }, i) => (
          <Reveal key={label} delay={i * 0.06}>
            <Link
              href={`/autos?tipo=${label}`}
              className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
                <Icon className="h-6 w-6" />
              </span>
              <span className="font-medium">{label}</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
