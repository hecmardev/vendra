import Link from 'next/link'
import { Car, Phone, Mail, MapPin, Clock, MessageCircle, LogIn } from 'lucide-react'
import { getContent } from '@/lib/content'
import { getBusiness } from '@/lib/business'
import { getTenant } from '@/lib/tenant'
import { listCars } from '@/services/cars'
import { formatPrice } from '@/helpers/format'

const CATEGORIES = ['SUV', 'Sedán', 'Pickup', 'Hatchback']

/**
 * Footer del sitio público del dealer: marca, contacto, categorías y últimos autos.
 */
export default async function Footer ({ dealerName }: { dealerName?: string }) {
  const { footer } = await getContent()
  const business = await getBusiness()
  const tenant = await getTenant()
  const latest = tenant ? (await listCars(tenant.dealerId)).slice(0, 4) : []
  const name = dealerName ?? business.name
  const wa = `https://wa.me/${business.whatsapp.replace(/[^\d]/g, '')}`

  return (
    <footer className="relative overflow-hidden bg-primary text-primary-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-cta/15 blur-3xl" />
      </div>

      <div className="container relative py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Marca */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/10 backdrop-blur">
                <Car className="h-5 w-5" />
              </span>
              {name}
            </Link>
            <p className="text-sm text-primary-foreground/70">{footer.description}</p>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-white/20"
            >
              <MessageCircle className="h-4 w-4" /> Escríbenos por WhatsApp
            </a>
          </div>

          {/* Contacto */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/60">Contacto</h3>
            <ul className="space-y-2.5 text-sm text-primary-foreground/80">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" />{business.phone}</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" />{business.email}</li>
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 shrink-0 translate-y-0.5" />{business.address}</li>
              <li className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" />{business.hours}</li>
            </ul>
          </div>

          {/* Categorías */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/60">Categorías</h3>
            <ul className="space-y-2.5 text-sm text-primary-foreground/80">
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link href={`/autos?tipo=${c}`} className="transition-colors hover:text-primary-foreground">{c}</Link>
                </li>
              ))}
              <li>
                <Link href="/autos" className="font-medium text-cta transition-colors hover:underline">Ver todos los autos →</Link>
              </li>
            </ul>
          </div>

          {/* Últimos autos */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/60">Últimos autos</h3>
            <ul className="space-y-2.5 text-sm">
              {latest.map((car) => (
                <li key={car.id}>
                  <Link href={`/autos/${car.slug}`} className="group flex items-center justify-between gap-3">
                    <span className="truncate text-primary-foreground/80 transition-colors group-hover:text-primary-foreground">
                      {car.brand} {car.model}
                    </span>
                    <span className="shrink-0 text-xs font-medium text-primary-foreground/60">{formatPrice(car.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-primary-foreground/60 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {name}. Todos los derechos reservados.</p>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/autos" className="hover:text-primary-foreground">Autos</Link>
            <Link href="/acerca-de" className="hover:text-primary-foreground">Nosotros</Link>
            <Link href="/contacto" className="hover:text-primary-foreground">Contacto</Link>
            <Link href="/dashboard" className="inline-flex items-center gap-1 hover:text-primary-foreground">
              <LogIn className="h-3.5 w-3.5" /> Panel
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
