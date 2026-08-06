import { Calendar, Gauge, Cog, Fuel, Palette, MapPin, Car as CarIcon, Check } from 'lucide-react'
import { formatMileage } from '@/helpers/format'
import { SPEC_CATEGORIES } from '@/constants/carDetailMock'
import type { Car } from '@/interfaces/car'

/** Ficha técnica + equipamiento por categoría. */
export function Specs ({ car }: { car: Car }) {
  const items = [
    { icon: Calendar, label: 'Año', value: car.year },
    { icon: Gauge, label: 'Kilometraje', value: formatMileage(car.mileage) },
    { icon: Cog, label: 'Transmisión', value: car.transmission },
    { icon: Fuel, label: 'Combustible', value: car.fuel },
    { icon: CarIcon, label: 'Carrocería', value: car.bodyType },
    { icon: Palette, label: 'Color', value: car.color },
    { icon: MapPin, label: 'Ubicación', value: car.location }
  ]

  return (
    <div className="space-y-8">
      {/* Ficha técnica */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">Ficha técnica</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {items.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="truncate text-sm font-medium">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* Equipamiento por categoría */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">Equipamiento</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SPEC_CATEGORIES.map((cat) => (
            <div key={cat.title} className="rounded-xl border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{cat.title}</h3>
              <ul className="space-y-2">
                {cat.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cta/15 text-cta">
                      <Check className="h-3 w-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
