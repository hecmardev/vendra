import Link from 'next/link'
import { Car, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Sitio no disponible — Vendra' }

/**
 * Página mostrada cuando el hostname no corresponde a ningún dealer activo
 * (dominio no configurado, o dealer suspendido/dado de baja). El middleware
 * reescribe aquí en vez de heredar otro tenant.
 *
 * Ofrece salida a la página principal de Vendra (host de plataforma) para que
 * el visitante pueda informarse o contactar. En dev el host de plataforma es
 * localhost:3000; en prod, NEXT_PUBLIC_BASE_DOMAIN.
 */
export default function NotAvailable () {
  const base = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'vendra.com.mx'
  const vendraUrl = process.env.NODE_ENV === 'production'
    ? `https://${base}`
    : 'http://localhost:3000'

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background p-6 text-center">
      {/* Fondo decorativo sutil */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-cta/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Marca */}
        <Link
          href={vendraUrl}
          className="mb-8 inline-flex items-center gap-2 text-lg font-bold tracking-tight text-foreground"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Car className="h-5 w-5" />
          </span>
          Vendra
        </Link>

        <div className="rounded-2xl border bg-card p-8 shadow-sm">
          <p className="mb-3 text-6xl font-black leading-none tracking-tighter text-muted-foreground/30">404</p>
          <h1 className="mb-2 text-2xl font-bold tracking-tight">Sitio no disponible</h1>
          <p className="mb-7 text-sm text-muted-foreground">
            Este sitio no está disponible en este momento. Si buscas comprar o vender autos,
            entra a Vendra y con gusto te ayudamos.
          </p>

          <Link
            href={vendraUrl}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-cta px-5 py-3 text-sm font-semibold text-cta-foreground shadow-sm transition-colors hover:bg-cta/90"
          >
            Ir a Vendra <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          ¿Eres vendedor y este es tu dominio?{' '}
          <Link href={`${vendraUrl}/#contacto`} className="font-medium text-foreground underline-offset-4 hover:underline">
            Contáctanos
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
