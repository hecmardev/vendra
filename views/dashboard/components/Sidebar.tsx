'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, Home, LayoutGrid, Users, Settings, FileText, ExternalLink, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/app/dashboard/login/actions'

const NAV = [
  { href: '/dashboard', label: 'Inicio', icon: Home, exact: true },
  { href: '/dashboard/inventario', label: 'Inventario', icon: LayoutGrid },
  { href: '/dashboard/leads', label: 'Leads', icon: Users },
  { href: '/dashboard/contenido', label: 'Contenido', icon: FileText },
  { href: '/dashboard/ajustes', label: 'Ajustes', icon: Settings }
]

/** Navegación lateral del panel del dealer. */
export function Sidebar () {
  const pathname = usePathname()

  return (
    <aside className="flex w-full shrink-0 flex-col gap-1 border-b bg-card p-3 lg:h-dvh lg:w-60 lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <Link href="/dashboard" className="mb-4 hidden items-center gap-2 px-2 py-1 font-bold lg:flex">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Car className="h-5 w-5" />
        </span>
        Vendra
      </Link>

      <nav className="flex gap-1 lg:flex-col">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors lg:flex-none',
                active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>

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
