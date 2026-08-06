import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

/** ¿La ruta pertenece al panel del dealer? */
export function isDashboardScope (pathname: string): boolean {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/')
}

/**
 * Protege el scope /dashboard (panel del DEALER) validando la sesión de
 * Supabase Auth y refrescándola (patrón @supabase/ssr). Preserva los headers
 * del tenant ya resueltos (`requestHeaders`). La comprobación de que el usuario
 * pertenece al dealer del dominio se hace vía RLS + profile en las páginas.
 */
export default class DashboardAuthMiddleware {
  async handle (req: NextRequest, requestHeaders: Headers): Promise<NextResponse> {
    const response = NextResponse.next({ request: { headers: requestHeaders } })

    // Bypass en desarrollo (para trabajar el panel sin login). Se desactiva con
    // DEV_AUTH_BYPASS=false. En producción SIEMPRE se valida la sesión.
    if (process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_BYPASS !== 'false') {
      return response
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll () {
            return req.cookies.getAll()
          },
          setAll (cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const url = req.nextUrl.clone()
      url.pathname = '/dashboard/login'
      return NextResponse.redirect(url)
    }

    return response
  }
}
