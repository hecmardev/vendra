'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, Home, LayoutGrid, Users, Settings, FileText, ExternalLink, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/app/dashboard/login/actions'

const NAV = [
  { href: '/dashboard', label: 'Inicio', icon: Home, exact: true },
  { href: '/dashboard/inventario', label: 'Autos', icon: LayoutGrid },
  { href: '/dashboard/leads', label: 'Leads', icon: Users },
  { href: '/dashboard/contenido', label: 'Contenido', icon: FileText },
  { href: '/dashboard/ajustes', label: 'Ajustes', icon: Settings }
]

const iconBtn =
  'flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground'

/**
 * Navegación del panel. Dos formas según el ancho:
 *
 *   Móvil      barra superior fija: marca y acciones arriba, pestañas abajo con
 *              el icono sobre la etiqueta.
 *   Escritorio columna lateral de siempre, con las acciones al pie.
 *
 * Las pestañas apilan icono y texto en vez de ponerlos en fila: con cinco
 * enlaces en fila a 375 px, "Contenido" no cabía y se salía del contenedor.
 * Se conserva la etiqueta a propósito — un dealer entra a su panel una o dos
 * veces por semana y cinco iconos sueltos son un acertijo.
 */
export function Sidebar ({ dealerName }: { dealerName?: string }) {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 z-40 flex w-full shrink-0 flex-col gap-1 border-b bg-card p-3 lg:static lg:h-dvh lg:w-60 lg:overflow-y-auto lg:border-b-0 lg:border-r">
      {/* Encabezado. En móvil aloja las acciones porque no hay pie donde
          ponerlas; antes eran `hidden lg:flex` y el dealer no tenía forma de
          cerrar sesión desde el teléfono. */}
      <div className="mb-2 flex items-center justify-between gap-2 lg:mb-4">
        {/* El negocio del dealer manda; Vendra queda debajo en chico. El sitio
            público es su marca, pero el panel es el producto que renta — y es
            el nombre que va a mencionar cuando lo recomiende. */}
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2 px-2 py-1">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Car className="h-5 w-5" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-bold">{dealerName ?? 'Mi negocio'}</span>
            <span className="block text-[11px] font-medium text-muted-foreground">Vendra</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 lg:hidden">
          <Link href="/" target="_blank" aria-label="Ver mi sitio" title="Ver mi sitio" className={iconBtn}>
            <ExternalLink className="h-5 w-5" />
          </Link>
          <form action={logoutAction}>
            <button type="submit" aria-label="Cerrar sesión" title="Cerrar sesión" className={iconBtn}>
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      <nav className="flex gap-1 lg:flex-col">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md px-1 py-2 text-[11px] font-medium leading-tight transition-colors',
                'lg:flex-none lg:flex-row lg:gap-2 lg:px-3 lg:text-sm',
                active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0 lg:h-4 lg:w-4" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* En escritorio las acciones van al pie, con su texto completo. */}
      <div className="mt-auto hidden flex-col gap-1 lg:flex">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" /> Ver mi sitio
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}
