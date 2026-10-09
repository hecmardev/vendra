import type { Metadata } from 'next'
import { Catalog } from 'views/catalog'
import { getBusiness } from '@/lib/business'

export async function generateMetadata (): Promise<Metadata> {
  const { name } = await getBusiness()
  return {
    title: `Autos — ${name}`,
    // Sin "seminuevos": desde la 0009 un lote puede vender también nuevos y demos.
    description: `Autos disponibles en ${name}. Filtra por marca, precio, año y tipo.`
  }
}

/**
 * Listado de autos (antes /catalogo). SSR para SEO. Lee filtros de la URL:
 *   ?q=          búsqueda del hero
 *   ?condicion=  nuevo / seminuevo / demo (links de campañas por condición)
 *   ?marca=      / ?modelo= / ?anio=   drill-down del breadcrumb de la ficha
 *   ?tipo=       categorías del footer
 */
export default async function Page ({
  searchParams
}: {
  searchParams: Promise<{ q?: string; condicion?: string; marca?: string; modelo?: string; anio?: string; tipo?: string }>
}) {
  const sp = await searchParams
  const year = sp.anio ? Number(sp.anio) : null
  const initial = {
    q: sp.q ?? '',
    conditions: sp.condicion ? [sp.condicion] : [],
    brands: sp.marca ? [sp.marca] : [],
    bodyTypes: sp.tipo ? [sp.tipo] : [],
    model: sp.modelo ?? '',
    year: Number.isFinite(year) ? year : null
  }
  return <Catalog initial={initial} />
}
