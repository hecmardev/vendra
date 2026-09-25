'use client'

import { useState, useRef, useTransition } from 'react'
import Link from 'next/link'
import { ChevronLeft, ImagePlus, X, Loader2, Star, Check, ChevronsUpDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { saveCarAction, uploadCarPhotoAction } from '@/app/dashboard/(panel)/inventario/actions'
import type { Car } from '@/interfaces/car'

const TRANSMISSIONS = ['Automática', 'Manual', 'CVT']
const FUELS = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico']
// Ordenadas por lo que más se mueve en el mercado mexicano: el dealer captura
// decenas de unidades y lo común debe quedar arriba, sin scroll.
const BODY_TYPES = [
  'Sedán', 'SUV', 'Hatchback', 'Pickup', 'Camioneta', 'Doble cabina',
  'Van', 'Minivan', 'Coupé', 'Deportivo', 'Convertible', 'Wagon',
  'Targa', 'Scooter', 'Lado de caída'
]

/**
 * Marcas que se venden en México, por volumen. NO es una lista cerrada: la
 * marca se captura en un input con `datalist`, así que sugiere estas y deja
 * escribir cualquier otra. Un lote con un Alfa Romeo tiene que poder darlo de
 * alta sin esperar a que alguien toque el código.
 *
 * Su trabajo real es que nadie escriba "VW" un día y "Volkswagen" al otro: los
 * filtros del catálogo se arman con los valores capturados (`new Set`), así que
 * cada variante se vuelve una opción más y parte el inventario en dos.
 */
const BRANDS = [
  'Nissan', 'Chevrolet', 'Volkswagen', 'Toyota', 'KIA', 'Mazda', 'Hyundai',
  'Ford', 'Honda', 'Suzuki', 'MG', 'Chirey', 'Renault', 'SEAT', 'Jeep', 'RAM',
  'Mitsubishi', 'BMW', 'Mercedes-Benz', 'Audi', 'GMC', 'Peugeot', 'Fiat',
  'Dodge', 'Chrysler', 'Buick', 'Subaru', 'Volvo', 'BYD', 'JAC', 'Changan',
  'Great Wall', 'Jetour', 'Omoda', 'Land Rover', 'Porsche', 'Lincoln', 'Acura',
  'Infiniti', 'Cupra'
]

/**
 * Deja el valor en su forma canónica antes de guardarlo. Si lo escrito coincide
 * con algo del catálogo sin importar mayúsculas ni espacios de más, se guarda
 * como está en el catálogo; si no, se respeta tal cual, solo limpio.
 *
 * Hace falta porque el combobox permite capturar fuera de lista: sin esto,
 * "kia", "KIA " y "Kia" entran como tres marcas distintas al filtro del
 * catálogo, que se arma con los valores capturados.
 */
function canonical (raw: string, catalogo: string[]): string {
  const v = raw.trim().replace(/\s+/g, ' ')
  return catalogo.find((o) => o.toLowerCase() === v.toLowerCase()) ?? v
}
const STATUSES = ['borrador', 'disponible', 'apartado', 'vendido']

function Field ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

/**
 * Combobox con búsqueda (shadcn: Popover + Command). Escribir filtra la lista,
 * que se queda acotada en alto en vez de crecer con el catálogo completo — un
 * <select> nativo no admite ni filtro ni límite de alto, porque ese popup lo
 * dibuja el navegador.
 *
 * No es una lista cerrada: si lo buscado no existe, ofrece capturarlo tal cual.
 * Un lote recibe lo que le llega a consignación, y quedarse sin poder dar de
 * alta un Alfa Romeo hasta que alguien toque el código no es opción.
 */
function Combo ({ value, onChange, options, placeholder, buscar, capitalizar }: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
  /**
   * Texto del buscador. Su presencia decide el tipo de lista: CON buscador se
   * filtra y se admite capturar algo fuera de catálogo; SIN buscador es una
   * lista cerrada. Se omite en listas de tres o cuatro opciones, donde buscar
   * estorba, y en las que no pueden aceptar un valor libre — `status` es un
   * enum en la base y un valor inventado reventaría el insert.
   */
  buscar?: string
  /** Para valores que se guardan en minúsculas (los estatus) y se muestran capitalizados. */
  capitalizar?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const libre = query.trim()

  const pick = (b: string) => {
    onChange(b)
    setQuery('')
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <span className={cn(capitalizar && 'capitalize', !value && 'text-muted-foreground')}>{value || placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          {buscar && <CommandInput placeholder={buscar} value={query} onValueChange={setQuery} />}
          <CommandList className="max-h-56">
            {buscar && (
              <CommandEmpty className="p-1">
                {libre && (
                  <button
                    type="button"
                    onClick={() => pick(libre)}
                    className="w-full rounded px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    Usar <span className="font-semibold">{libre}</span>
                  </button>
                )}
              </CommandEmpty>
            )}
            <CommandGroup>
              {options.map((b) => (
                // onSelect sin argumento a propósito: cmdk lo entrega en
                // minúsculas y guardaría "kia" en vez de "KIA".
                <CommandItem key={b} value={b} onSelect={() => pick(b)} className={cn(capitalizar && 'capitalize')}>
                  <Check className={cn('mr-2 h-4 w-4', b === value ? 'opacity-100' : 'opacity-0')} />
                  {b}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/** Formulario de alta/edición de auto, con subida real de fotos a Storage. */
export function CarForm ({ car }: { car?: Car }) {
  const isEdit = Boolean(car)
  const [form, setForm] = useState<Partial<Car>>(
    // Un auto nuevo nace en borrador: no sale al sitio hasta que el dealer lo
    // publique, para que no se vea a medio llenar mientras lo captura.
    car ?? { status: 'borrador', transmission: 'Automática', fuel: 'Gasolina' }
  )
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(0)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const set = (k: keyof Car, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  /** Sube las fotos elegidas una por una y las agrega al final de la galería. */
  const onPickFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setError('')
    const picked = Array.from(files)
    setUploading(picked.length)

    for (const file of picked) {
      const fd = new FormData()
      fd.append('file', file)
      const res = await uploadCarPhotoAction(fd)
      if (res.error) setError(res.error)
      else if (res.url) setForm((f) => ({ ...f, images: [...(f.images ?? []), res.url!] }))
      setUploading((n) => n - 1)
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  /** Mueve una foto al inicio: la primera es la portada del auto. */
  const makeCover = (i: number) =>
    setForm((f) => {
      const imgs = [...(f.images ?? [])]
      const [pick] = imgs.splice(i, 1)
      return { ...f, images: [pick, ...imgs] }
    })

  const onSave = () => {
    setError('')
    if (!form.brand || !form.model || !form.year || !form.price || !form.bodyType) {
      setError('Completa marca, modelo, año, precio y carrocería.')
      return
    }
    startTransition(async () => {
      const res = await saveCarAction(car?.id ?? null, {
        brand: canonical(form.brand!, BRANDS), model: form.model!.trim(), year: Number(form.year), price: Number(form.price),
        mileage: Number(form.mileage ?? 0), transmission: form.transmission ?? 'Automática',
        fuel: form.fuel ?? 'Gasolina', color: form.color ?? '', bodyType: canonical(form.bodyType!, BODY_TYPES),
        location: form.location ?? '', status: form.status ?? 'disponible', description: form.description ?? null,
        images: form.images ?? []
      })
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/inventario" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Volver al inventario
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{isEdit ? 'Editar auto' : 'Agregar auto'}</h1>
      </div>

      {/* Fotos */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-bold">Fotos</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(form.images ?? []).map((src, i) => (
            <div key={`${src}-${i}`} className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />

              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Portada
                </span>
              )}

              <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {i > 0 && (
                  <button
                    type="button"
                    title="Usar como portada"
                    onClick={() => makeCover(i)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  title="Quitar foto"
                  onClick={() => set('images', (form.images ?? []).filter((_, j) => j !== i))}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {uploading > 0 && (
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">Subiendo {uploading}…</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition-colors hover:border-cta hover:text-cta"
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">Subir foto</span>
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => { void onPickFiles(e.target.files) }}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          JPG, PNG, WEBP o AVIF, hasta 5 MB por foto. La primera es la portada del auto.
        </p>
      </section>

      {/* Datos */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-bold">Datos del auto</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Marca"><Combo value={form.brand ?? ''} onChange={(v) => set('brand', v)} options={BRANDS} placeholder="Elige una marca" buscar="Buscar marca…" /></Field>
          <Field label="Modelo"><Input value={form.model ?? ''} onChange={(e) => set('model', e.target.value)} placeholder="CX-5 Grand Touring" /></Field>
          <Field label="Año"><Input type="number" value={form.year ?? ''} onChange={(e) => set('year', Number(e.target.value))} placeholder="2022" /></Field>
          <Field label="Precio (MXN)"><Input type="number" value={form.price ?? ''} onChange={(e) => set('price', Number(e.target.value))} placeholder="449900" /></Field>
          <Field label="Kilometraje"><Input type="number" value={form.mileage ?? ''} onChange={(e) => set('mileage', Number(e.target.value))} placeholder="38000" /></Field>
          <Field label="Color"><Input value={form.color ?? ''} onChange={(e) => set('color', e.target.value)} placeholder="Gris" /></Field>
          <Field label="Transmisión"><Combo value={form.transmission ?? 'Automática'} onChange={(v) => set('transmission', v)} options={TRANSMISSIONS} placeholder="Elige transmisión" /></Field>
          <Field label="Combustible"><Combo value={form.fuel ?? 'Gasolina'} onChange={(v) => set('fuel', v)} options={FUELS} placeholder="Elige combustible" /></Field>
          <Field label="Carrocería"><Combo value={form.bodyType ?? ''} onChange={(v) => set('bodyType', v)} options={BODY_TYPES} placeholder="Elige una carrocería" buscar="Buscar carrocería…" /></Field>
          <Field label="Ubicación"><Input value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} placeholder="CDMX" /></Field>
          <Field label="Estado"><Combo value={form.status ?? 'disponible'} onChange={(v) => set('status', v as Car['status'])} options={STATUSES} placeholder="Elige estado" capitalizar /></Field>
        </div>
        <Field label="Descripción" className="mt-4">
          <textarea
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            placeholder="Cuéntale al comprador los detalles y el estado del auto…"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </Field>
      </section>

      {error && <p className="text-right text-sm text-destructive">{error}</p>}
      <div className="flex items-center justify-end gap-3">
        <Button asChild variant="ghost"><Link href="/dashboard/inventario">Cancelar</Link></Button>
        <Button variant="cta" size="lg" onClick={onSave} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Guardar cambios' : 'Publicar auto'}
        </Button>
      </div>
    </div>
  )
}
