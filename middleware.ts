import { NextRequest, NextResponse } from 'next/server'
import ResolveDealerMiddleware, { isSuspendedDealerDomain } from '@/middlewares/ResolveDealerMiddleware'
import DashboardAuthMiddleware, { isDashboardScope } from '@/middlewares/DashboardAuthMiddleware'
import AttributionMiddleware from '@/middlewares/AttributionMiddleware'
import { DEALER_ID_HEADER, DEALER_DOMAIN_HEADER, type TenantContext } from '@/lib/tenant'
import { canIndexDealer, canIndexPlatform } from '@/lib/seo'

function normalizeHost (host: string): string {
  return host.split(':')[0].toLowerCase()
}

/**
 * ¿El host es el dominio de plataforma (vendra.com.mx), no el de un dealer?
 * En dev, `localhost`/`127.0.0.1` = plataforma; `*.localhost` = dealer demo.
 */
function isPlatformHost (host: string): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return host === 'localhost' || host === '127.0.0.1'
  }
  // En Vercel, cualquier host *.vercel.app es la PLATAFORMA: los dealers siempre
  // usan su dominio propio (nunca un subdominio de vercel.app). Esto evita depender
  // del match exacto contra una de las varias URLs que Vercel genera por deploy.
  if (host.endsWith('.vercel.app')) return true
  const base = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'vendra.com.mx'
  return host === base || host === `www.${base}`
}

/**
 * Bifurca por dominio:
 *   - Plataforma (vendra.com.mx): reescribe a /plataforma/* (landing marketing) y
 *     deja pasar /admin (superadmin) y /api.
 *   - Dealer (cualquier otro dominio): resuelve el tenant e inyecta headers;
 *     si es /dashboard valida sesión.
 */
export default async function middleware (req: NextRequest) {
  const { res, indexable } = await route(req)
  // robots.txt pide no rastrear; esta cabecera pide además no indexar, que es lo
  // que saca de los buscadores lo que ya hubieran alcanzado a guardar. Se decide
  // por sitio (lib/seo.ts): Vendra y cada dealer tienen su propio interruptor.
  if (!indexable) res.headers.set('x-robots-tag', 'noindex, nofollow')
  return res
}

async function route (req: NextRequest): Promise<{ res: NextResponse; indexable: boolean }> {
  const host = normalizeHost(req.headers.get('host') ?? '')
  const { pathname } = req.nextUrl

  // 1) SITIO DE PLATAFORMA
  if (isPlatformHost(host)) {
    return { res: platformRoute(req, pathname), indexable: canIndexPlatform(host) }
  }

  // 2) SITIO DE DEALER (storefront)
  const tenant = await new ResolveDealerMiddleware().resolve(req)
  if (!tenant) return { res: await unavailableRoute(req, host), indexable: false }
  return { res: await dealerRoute(req, pathname, host, tenant), indexable: canIndexDealer(host, tenant.allowIndexing) }
}

/**
 * Dominio sin dealer activo. Distingue dos casos que antes respondían 200:
 *   - Dealer suspendido -> 503 + Retry-After: es temporal; Google conserva lo
 *     indexado y vuelve después, en vez de reemplazar sus fichas.
 *   - Dominio que no es de nadie -> 404.
 * La misma página explica cada caso (?motivo=).
 */
async function unavailableRoute (req: NextRequest, host: string): Promise<NextResponse> {
  const suspended = await isSuspendedDealerDomain(host)
  const url = new URL('/not-available', req.url)
  if (suspended) url.searchParams.set('motivo', 'suspendido')
  const res = NextResponse.rewrite(url, { status: suspended ? 503 : 404 })
  if (suspended) res.headers.set('retry-after', '86400')
  return res
}

/** vendra.com.mx: reescribe a /plataforma/* y deja pasar /admin y /api. */
function platformRoute (req: NextRequest, pathname: string): NextResponse {
  // /icon es el favicon (app/icon.tsx), compartido por todos los sitios.
  if (pathname.startsWith('/admin') || pathname.startsWith('/api') || pathname.startsWith('/plataforma') || pathname === '/icon') {
    return NextResponse.next()
  }
  // El panel del dealer NO vive en el host de plataforma; cada dealer entra
  // desde su propio dominio. Si alguien llega a /dashboard aquí, lo mandamos a
  // la landing en vez de un 404 confuso.
  if (isDashboardScope(pathname)) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
  const url = req.nextUrl.clone()
  url.pathname = `/plataforma${pathname === '/' ? '' : pathname}`
  return NextResponse.rewrite(url)
}

/** Sitio de un dealer: inyecta los headers de tenant y valida la sesión del panel. */
async function dealerRoute (req: NextRequest, pathname: string, host: string, tenant: TenantContext): Promise<NextResponse> {
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set(DEALER_ID_HEADER, tenant.dealerId)
  requestHeaders.set(DEALER_DOMAIN_HEADER, tenant.domain)

  if (isDashboardScope(pathname) && pathname !== '/dashboard/login') {
    return new DashboardAuthMiddleware().handle(req, requestHeaders)
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } })
  // Solo el storefront: el panel del dealer no es una visita de un cliente.
  if (!isDashboardScope(pathname)) new AttributionMiddleware().apply(req, res, host)
  return res
}

export const config = {
  // Excluye estáticos, imágenes y rutas internas de Next.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
}
