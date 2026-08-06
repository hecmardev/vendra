'use client'

import { useMemo, useState, useRef, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, MoreHorizontal, Car as CarIcon, CheckCircle2, RotateCcw, Trash2,
  Search, X, ChevronLeft, ChevronRight, ExternalLink, Calendar, Gauge, Cog, Fuel, Palette, MapPin
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatPrice, formatMileage } from '@/helpers/format'
import { deleteCarAction, setCarStatusAction } from '@/app/dashboard/(panel)/inventario/actions'
import type { Car, CarStatus } from '@/interfaces/car'

const STATUS_VARIANT: Record<CarStatus, 'secondary' | 'cta' | 'outline'> = {
  disponible: 'secondary',
  apartado: 'cta',
  vendido: 'outline'
}
const FILTERS: Array<{ key: 'todos' | CarStatus; label: string }> = [
  { key: 'todos', label: 'Todos' },
  { key: 'disponible', label: 'Disponibles' },
  { key: 'apartado', label: 'Apartados' },
  { key: 'vendido', label: 'Vendidos' }
]
const PAGE_SIZE = 8

interface MenuItem { label: string; icon: React.ReactNode; onClick?: () => void; href?: string; danger?: boolean }

/**
 * Menú de acciones (•••) renderizado en un PORTAL con posición fija, para que
 * no lo recorten los contenedores con overflow (tabla redondeada, scroll-x).
 * Se posiciona respecto al botón y se cierra al click fuera o al hacer scroll.
 */
const MENU_WIDTH = 208 // w-52 (13rem)

function RowActionsMenu ({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (open) { setOpen(false); return }
    const r = btnRef.current!.getBoundingClientRect()
    // Alinea el borde derecho del menú con el del botón (por left, para no
    // depender de innerWidth que incluye la scrollbar).
    setPos({ top: r.bottom + 6, left: Math.max(8, r.right - MENU_WIDTH) })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return
      setOpen(false)
    }
    const onScroll = () => setOpen(false)
    document.addEventListener('pointerdown', onDown, true)
    window.addEventListener('resize', onScroll)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  return (
    <>
      <Button ref={btnRef} variant="ghost" size="icon" className="h-8 w-8" onClick={toggle}>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {mounted && open && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left }}
          className="z-[70] w-52 overflow-hidden rounded-md border bg-popover text-sm shadow-md"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((it, i) => it.href
            ? (
              <Link key={i} href={it.href} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent">
                {it.icon} {it.label}
              </Link>
              )
            : (
              <button
                key={i}
                onClick={() => { setOpen(false); it.onClick?.() }}
                className={cn('flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent', it.danger && 'text-destructive')}
              >
                {it.icon} {it.label}
              </button>
              ))}
        </div>,
        document.body
      )}
    </>
  )
}

/** Inventario del dealer: buscador + filtros + paginado + drawer de detalle. */
export function InventoryView ({ cars: initialCars }: { cars: Car[] }) {
  const [cars, setCars] = useState<Car[]>(initialCars)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'todos' | CarStatus>('todos')
  const [page, setPage] = useState(1)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [, startTransition] = useTransition()

  const detail = cars.find((c) => c.id === detailId) ?? null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cars.filter((c) => {
      if (status !== 'todos' && c.status !== status) return false
      if (q && !`${c.brand} ${c.model} ${c.color} ${c.location}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [cars, query, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const resetPage = () => setPage(1)

  const toggleSold = (id: string) => {
    const c = cars.find((x) => x.id === id)
    const next: CarStatus = c?.status === 'vendido' ? 'disponible' : 'vendido'
    setCars((cs) => cs.map((x) => (x.id === id ? { ...x, status: next } : x)))
    startTransition(() => setCarStatusAction(id, next))
  }
  const remove = (id: string) => {
    setCars((cs) => cs.filter((x) => x.id !== id))
    setConfirmId(null)
    setDetailId(null)
    startTransition(() => deleteCarAction(id))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
          <p className="text-sm text-muted-foreground">{cars.length} autos publicados</p>
        </div>
        <Button asChild variant="cta" className="gap-2">
          <Link href="/dashboard/inventario/nuevo"><Plus className="h-4 w-4" /> Agregar auto</Link>
        </Button>
      </div>

      {/* Toolbar: buscador + filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); resetPage() }}
            placeholder="Buscar marca, modelo, color…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setStatus(f.key); resetPage() }}
              className={cn(
                'h-8 rounded-md border px-3 text-sm transition-colors',
                status === f.key ? 'border-cta bg-cta text-cta-foreground' : 'hover:bg-accent'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: tabla */}
      <div className="hidden overflow-hidden rounded-xl border bg-card sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-secondary/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Auto</th>
                <th className="px-4 py-3 font-medium">Año</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Km</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pageItems.map((car) => (
                <tr key={car.id} onClick={() => setDetailId(car.id)} className="cursor-pointer hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                        {car.images[0]
                          ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={car.images[0]} alt="" className="h-full w-full object-cover" />
                            )
                          : <CarIcon className="h-4 w-4 text-muted-foreground" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{car.brand} {car.model}</p>
                        <p className="text-xs text-muted-foreground">{car.bodyType} · {car.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{car.year}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{formatMileage(car.mileage)}</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(car.price)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[car.status]} className="capitalize">{car.status}</Badge>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/dashboard/inventario/${car.id}`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                      <RowActionsMenu items={[
                        {
                          label: car.status === 'vendido' ? 'Marcar disponible' : 'Marcar como vendido',
                          icon: car.status === 'vendido' ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />,
                          onClick: () => toggleSold(car.id)
                        },
                        { label: 'Eliminar', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => setConfirmId(car.id) }
                      ]} />
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Sin resultados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: cards */}
      <div className="space-y-3 sm:hidden">
        {pageItems.length === 0 && (
          <p className="rounded-xl border bg-card py-12 text-center text-sm text-muted-foreground">Sin resultados.</p>
        )}
        {pageItems.map((car) => (
          <div key={car.id} onClick={() => setDetailId(car.id)} className="flex gap-3 rounded-xl border bg-card p-3">
            <span className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {car.images[0]
                ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={car.images[0]} alt="" className="h-full w-full object-cover" />
                  )
                : <CarIcon className="h-6 w-6 text-muted-foreground" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-medium">{car.brand} {car.model}</p>
                <div className="-mt-1 -mr-1" onClick={(e) => e.stopPropagation()}>
                  <RowActionsMenu items={[
                    { label: 'Editar', icon: <Pencil className="h-4 w-4" />, href: `/dashboard/inventario/${car.id}` },
                    {
                      label: car.status === 'vendido' ? 'Marcar disponible' : 'Marcar vendido',
                      icon: car.status === 'vendido' ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />,
                      onClick: () => toggleSold(car.id)
                    },
                    { label: 'Eliminar', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => setConfirmId(car.id) }
                  ]} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{car.year} · {car.bodyType} · {formatMileage(car.mileage)}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="font-bold">{formatPrice(car.price)}</p>
                <Badge variant={STATUS_VARIANT[car.status]} className="capitalize">{car.status}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginado (compartido) */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, filtered.length)} de {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={current <= 1} onClick={() => setPage(current - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-muted-foreground">{current} / {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={current >= totalPages} onClick={() => setPage(current + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Drawer de detalle (derecha -> izquierda). En portal a <body> para que el
          `fixed` sea relativo al viewport (no a ancestros que descolocan). */}
      {mounted && createPortal(
      <AnimatePresence>
        {detail && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40" onClick={() => setDetailId(null)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-card shadow-xl"
            >
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="font-bold">Detalle del auto</h2>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailId(null)}><X className="h-4 w-4" /></Button>
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-4">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border bg-muted">
                  {detail.images[0]
                    ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={detail.images[0]} alt="" className="h-full w-full object-cover" />
                      )
                    : <div className="flex h-full items-center justify-center text-muted-foreground/40"><CarIcon className="h-12 w-12" strokeWidth={1.25} /></div>}
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold leading-tight">{detail.brand} {detail.model}</h3>
                    <p className="text-sm text-muted-foreground">{detail.year} · {detail.location}</p>
                  </div>
                  <Badge variant={STATUS_VARIANT[detail.status]} className="capitalize">{detail.status}</Badge>
                </div>

                <p className="text-2xl font-extrabold tracking-tight">{formatPrice(detail.price)}</p>

                <dl className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Calendar, label: 'Año', value: detail.year },
                    { icon: Gauge, label: 'Kilometraje', value: formatMileage(detail.mileage) },
                    { icon: Cog, label: 'Transmisión', value: detail.transmission },
                    { icon: Fuel, label: 'Combustible', value: detail.fuel },
                    { icon: Palette, label: 'Color', value: detail.color },
                    { icon: MapPin, label: 'Ubicación', value: detail.location }
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-2 rounded-lg border bg-background p-3">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <dt className="text-xs text-muted-foreground">{label}</dt>
                        <dd className="truncate text-sm font-medium">{value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>

                {detail.description && (
                  <div>
                    <p className="mb-1 text-sm font-medium">Descripción</p>
                    <p className="text-sm text-muted-foreground">{detail.description}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2 border-t p-4">
                <div className="flex gap-2">
                  <Button asChild variant="cta" className="flex-1">
                    <Link href={`/dashboard/inventario/${detail.id}`}><Pencil className="h-4 w-4" /> Editar</Link>
                  </Button>
                  {detail.status === 'disponible' && (
                    <Button asChild variant="outline">
                      <Link href={`/autos/${detail.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /> Ver en el sitio</Link>
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => toggleSold(detail.id)}>
                    {detail.status === 'vendido' ? 'Marcar disponible' : 'Marcar como vendido'}
                  </Button>
                  <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmId(detail.id)}>
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}

      {/* Confirmación de borrado */}
      {confirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmId(null)}>
          <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold">¿Eliminar este auto?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirmId(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => remove(confirmId)}>Eliminar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
