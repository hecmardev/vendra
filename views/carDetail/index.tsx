import Link from 'next/link'
import { Navbar, Footer, CarCard, WhatsAppButton, WhatsAppFloat, FinancingCalc } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, estimateMonthly } from '@/helpers/format'
import { getTenant } from '@/lib/tenant'
import { getCarBySlug, listCars } from '@/services/cars'
import { DEMO_DEALER } from '@/constants/dealer'
import type { Car } from '@/interfaces/car'
import { Breadcrumb } from './components/Breadcrumb'
import { ReserveDialog } from './components/ReserveDialog'
import { Gallery } from './components/Gallery'
import { Specs } from './components/Specs'
import { Faq } from './components/Faq'

/** Origen público del dealer (para URLs absolutas del JSON-LD). */
function dealerOrigin (domain: string): string {
  return process.env.NODE_ENV === 'production' ? `https://${domain}` : `http://${domain}:3000`
}

/** Datos estructurados schema.org/Car para rich results de producto. */
function vehicleJsonLd (car: Car, baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: `${car.brand} ${car.model} ${car.year}`,
    brand: { '@type': 'Brand', name: car.brand },
    model: car.model,
    vehicleModelDate: String(car.year),
    ...(car.mileage ? { mileageFromOdometer: { '@type': 'QuantitativeValue', value: car.mileage, unitCode: 'KMT' } } : {}),
    ...(car.color ? { color: car.color } : {}),
    ...(car.fuel ? { fuelType: car.fuel } : {}),
    ...(car.transmission ? { vehicleTransmission: car.transmission } : {}),
    ...(car.images.length ? { image: car.images } : {}),
    ...(car.description ? { description: car.description } : {}),
    offers: {
      '@type': 'Offer',
      price: car.price,
      priceCurrency: 'MXN',
      availability: car.status === 'disponible' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      url: `${baseUrl}/autos/${car.slug}`
    }
  }
}

/** Ficha de auto (datos reales de Supabase). SSR para SEO. */
export async function CarDetail ({ slug }: { slug: string }) {
  const tenant = await getTenant()
  const car = tenant ? await getCarBySlug(tenant.dealerId, slug) : null

  if (!car) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Navbar />
        <main className="container flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Auto no encontrado</h1>
          <Button asChild variant="cta"><Link href="/autos">Ver autos</Link></Button>
        </main>
        <Footer />
      </div>
    )
  }

  const monthly = estimateMonthly(car.price)
  const gallery = car.images.length ? car.images : []
  const others = tenant ? await listCars(tenant.dealerId) : []
  const similar = others
    .filter((c) => c.id !== car.id && c.bodyType === car.bodyType)
    .concat(others.filter((c) => c.id !== car.id && c.bodyType !== car.bodyType))
    .slice(0, 3)
  const waMessage = `Hola, me interesa el ${car.brand} ${car.model} ${car.year}`
  const baseUrl = tenant ? dealerOrigin(tenant.domain) : ''

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="container py-6">
          <Breadcrumb car={car} baseUrl={baseUrl} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleJsonLd(car, baseUrl)) }}
          />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
            {/* Columna principal */}
            <div className="space-y-8">
              <Gallery images={gallery} alt={`${car.brand} ${car.model}`} />
              {car.description && (
                <section className="space-y-3">
                  <h2 className="text-lg font-bold tracking-tight">Descripción</h2>
                  <p className="text-sm text-muted-foreground">{car.description}</p>
                </section>
              )}
              <Specs car={car} />
              <FinancingCalc price={car.price} />
              <Faq />
            </div>

            {/* Panel de conversión (sticky) */}
            <aside className="lg:sticky lg:top-20 lg:h-fit">
              <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
                <div className="space-y-1">
                  <Badge variant="secondary">{car.bodyType}</Badge>
                  <h1 className="text-xl font-bold leading-tight">{car.brand} {car.model}</h1>
                  <p className="text-sm text-muted-foreground">{car.year} · {car.location}</p>
                </div>

                <div className="flex items-end justify-between border-y py-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Precio de contado</p>
                    <p className="text-2xl font-extrabold tracking-tight">{formatPrice(car.price)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Desde</p>
                    <p className="font-semibold">
                      {formatPrice(monthly)}
                      <span className="text-xs font-normal text-muted-foreground">/mes</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <ReserveDialog carId={car.id} carLabel={`${car.brand} ${car.model} ${car.year}`} />
                  <WhatsAppButton phone={DEMO_DEALER.whatsapp} message={waMessage} className="w-full">
                    Preguntar por WhatsApp
                  </WhatsAppButton>
                </div>
              </div>
            </aside>
          </div>

          {/* Similares */}
          {similar.length > 0 && (
            <section className="mt-14 space-y-5">
              <h2 className="text-lg font-bold tracking-tight">Autos similares</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map((c) => <CarCard key={c.id} car={c} />)}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppFloat phone={DEMO_DEALER.whatsapp} message={waMessage} />
    </div>
  )
}
