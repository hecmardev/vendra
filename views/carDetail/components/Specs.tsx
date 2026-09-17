import { Calendar, Gauge, Cog, Fuel, Palette, MapPin, Car as CarIcon } from 'lucide-react'
import { formatMileage } from '@/helpers/format'
import type { Car } from '@/interfaces/car'

/**
 * Ficha técnica del auto, con los datos que el dealer captura por unidad.
 *
 * Aquí vivía también un bloque "Equipamiento" (rines, quemacocos, asientos de
 * piel...) que salía de SPEC_CATEGORIES, una constante de maqueta: pintaba las
 * mismas 16 características para TODOS los autos de TODOS los dealers. Se quitó
 * porque afirmaba cosas falsas sobre la mercancía en la ficha donde el
 * comprador decide, y firmadas con el nombre del dealer.
 *
 * Para volver a mostrarlo hace falta que el equipamiento sea dato del auto: un
 * campo en `cars` y casillas en el formulario de inventario. El catálogo de
 * opciones por categoría quedó en `constants/carDetailMock.ts` como referencia.
 */
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
  )
}
