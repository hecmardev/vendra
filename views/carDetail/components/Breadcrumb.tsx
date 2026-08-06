import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { Car } from '@/interfaces/car'

interface Crumb { name: string; href: string | null }

/**
 * Breadcrumb SEO de la ficha: Autos › Marca › Modelo › Año › [auto].
 * Cada nivel enlaza al catálogo pre-filtrado (?marca/?modelo/?anio) y emite
 * datos estructurados `BreadcrumbList` (JSON-LD) para que Google muestre el
 * rastro en los resultados. `baseUrl` es el origen del dealer (para URLs
 * absolutas del JSON-LD).
 */
export function Breadcrumb ({ car, baseUrl }: { car: Car; baseUrl: string }) {
  const marca = encodeURIComponent(car.brand)
  const modelo = encodeURIComponent(car.model)

  const crumbs: Crumb[] = [
    { name: 'Autos', href: '/autos' },
    { name: car.brand, href: `/autos?marca=${marca}` },
    { name: car.model, href: `/autos?marca=${marca}&modelo=${modelo}` },
    { name: String(car.year), href: `/autos?marca=${marca}&modelo=${modelo}&anio=${car.year}` },
    { name: `${car.brand} ${car.model}`, href: null } // página actual
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.href ? { item: `${baseUrl}${c.href}` } : {})
    }))
  }

  return (
    <>
      <nav aria-label="Ruta de navegación" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {crumbs.map((c, i) => (
            <li key={i} className="flex items-center gap-1">
              {c.href
                ? <Link href={c.href} className="transition-colors hover:text-foreground">{c.name}</Link>
                : <span className="font-medium text-foreground" aria-current="page">{c.name}</span>}
              {i < crumbs.length - 1 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />}
            </li>
          ))}
        </ol>
      </nav>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  )
}
