'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Car, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/autos', label: 'Autos' },
  { href: '/acerca-de', label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' }
]

/**
 * Navbar del sitio público del dealer.
 * - overlay=true (home): fijo y transparente sobre el hero; al hacer scroll se
 *   vuelve glass sólido.
 * - overlay=false (resto): sticky y sólido desde el inicio.
 * Incluye menú móvil (hamburguesa).
 */
export default function Navbar ({
  overlay = false,
  dealerName = 'Vendra'
}: {
  overlay?: boolean
  dealerName?: string
}) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Menú abierto => fondo sólido aunque sea overlay sin scroll (legibilidad).
  const transparent = overlay && !scrolled && !open

  return (
    <header
      className={cn(
        'z-40 w-full transition-colors duration-300',
        overlay ? 'fixed top-0' : 'sticky top-0',
        transparent ? 'border-b border-transparent bg-transparent' : 'border-b bg-background/80 backdrop-blur'
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" onClick={() => setOpen(false)} className={cn('flex items-center gap-2 font-bold', transparent && 'text-white')}>
          <span
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md',
              transparent ? 'border border-white/20 bg-white/10 backdrop-blur' : 'bg-primary text-primary-foreground'
            )}
          >
            <Car className="h-5 w-5" />
          </span>
          <span className="text-lg tracking-tight">{dealerName}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm font-medium transition-colors',
                transparent ? 'text-white/80 hover:text-white' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="cta">
            <Link href="/autos">Ver autos</Link>
          </Button>
          {/* Botón menú (móvil) */}
          <button
            type="button"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md md:hidden',
              transparent ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-accent'
            )}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Panel móvil */}
      {open && (
        <nav className="border-t bg-background md:hidden">
          <div className="container flex flex-col py-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-3 text-sm font-medium text-foreground hover:bg-accent"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
