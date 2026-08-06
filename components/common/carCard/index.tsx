import Link from 'next/link'
import { Car as CarIcon, Gauge, Fuel, Cog } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatPrice, formatMileage, estimateMonthly } from '@/helpers/format'
import type { Car } from '@/interfaces/car'

/** Tarjeta de auto para el catálogo y destacados. Enlaza a la ficha /autos/[slug]. */
export default function CarCard ({ car }: { car: Car }) {
  const monthly = estimateMonthly(car.price)
  const sold = car.status !== 'disponible'

  return (
    <Link href={`/autos/${car.slug}`} className="group block">
      <Card className="overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
        {/* Foto (placeholder mientras no hay imagen real) */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-muted to-secondary">
          {car.images[0]
            ? (
            // eslint-disable-next-line @next/next/no-img-element
              <img
                src={car.images[0]}
                alt={`${car.brand} ${car.model}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              )
            : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                <CarIcon className="h-14 w-14" strokeWidth={1.25} />
              </div>
              )}

          <span className="absolute left-3 top-3">
            <Badge variant="secondary" className="shadow-sm">{car.bodyType}</Badge>
          </span>
          {sold && (
            <span className="absolute right-3 top-3">
              <Badge variant="cta" className="capitalize shadow-sm">{car.status}</Badge>
            </span>
          )}
        </div>

        <CardContent className="space-y-3 p-4">
          <div>
            <h3 className="truncate font-semibold leading-tight">
              {car.brand} {car.model}
            </h3>
            <p className="text-sm text-muted-foreground">{car.year} · {car.location}</p>
          </div>

          {/* Specs */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Gauge className="h-3.5 w-3.5" />{formatMileage(car.mileage)}</span>
            <span className="inline-flex items-center gap-1"><Cog className="h-3.5 w-3.5" />{car.transmission}</span>
            <span className="inline-flex items-center gap-1"><Fuel className="h-3.5 w-3.5" />{car.fuel}</span>
          </div>

          {/* Precio */}
          <div className={cn('flex items-end justify-between border-t pt-3', sold && 'opacity-70')}>
            <div>
              <p className="text-lg font-bold tracking-tight">{formatPrice(car.price)}</p>
              <p className="text-xs text-muted-foreground">
                desde <span className="font-medium text-foreground">{formatPrice(monthly)}</span>/mes
              </p>
            </div>
            <span className="text-sm font-medium text-cta group-hover:underline">Ver</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
