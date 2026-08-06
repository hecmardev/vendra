import { NextRequest, NextResponse } from 'next/server'
import ResolveDealerMiddleware from '@/middlewares/ResolveDealerMiddleware'
import DashboardAuthMiddleware, { isDashboardScope } from '@/middlewares/DashboardAuthMiddleware'
import { DEALER_ID_HEADER, DEALER_DOMAIN_HEADER } from '@/lib/tenant'

function normalizeHost (host: string): string {
  return host.split(':')[0].toLowerCase()
}

/**
 * ¿El host es el dominio de plataforma (vendra.com), no el de un dealer?
 * En dev, `localhost`/`127.0.0.1` = plataforma; `*.localhost` = dealer demo.
 */
function isPlatformHost (host: string): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return host === 'localhost' || host === '127.0.0.1'
  }
  const base = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'vendra.app'
  return host === base || host === `www.${base}`
}

/**
 * Bifurca por dominio:
 *   - Plataforma (vendra.com): reescribe a /plataforma/* (landing marketing) y
 *     deja pasar /admin (superadmin) y /api.
 *   - Dealer (cualquier otro dominio): resuelve el tenant e inyecta headers;
 *     si es /dashboard valida sesión.
 */
export default async function middleware (req: NextRequest) {
  const host = normalizeHost(req.headers.get('host') ?? '')
  const { pathname } = req.nextUrl

  // 1) SITIO DE PLATAFORMA
  if (isPlatformHost(host)) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/api') || pathname.startsWith('/plataforma')) {
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

  // 2) SITIO DE DEALER (storefront)
  const tenant = await new ResolveDealerMiddleware().resolve(req)
  if (!tenant) {
    return NextResponse.rewrite(new URL('/not-available', req.url))
  }

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set(DEALER_ID_HEADER, tenant.dealerId)
  requestHeaders.set(DEALER_DOMAIN_HEADER, tenant.domain)

  if (isDashboardScope(pathname) && pathname !== '/dashboard/login') {
    return new DashboardAuthMiddleware().handle(req, requestHeaders)
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  // Excluye estáticos, imágenes y rutas internas de Next.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
}
