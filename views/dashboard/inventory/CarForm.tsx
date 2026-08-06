'use client'

import { useState, useRef, useTransition } from 'react'
import Link from 'next/link'
import { ChevronLeft, ImagePlus, X, Loader2, Star } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { saveCarAction, uploadCarPhotoAction } from '@/app/dashboard/(panel)/inventario/actions'
import type { Car } from '@/interfaces/car'

const TRANSMISSIONS = ['Automática', 'Manual', 'CVT']
const FUELS = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico']
const BODY_TYPES = ['SUV', 'Sedán', 'Pickup', 'Hatchback', 'Coupé']
const STATUSES = ['disponible', 'apartado', 'vendido']

function Field ({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

function Select ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

/** Formulario de alta/edición de auto, con subida real de fotos a Storage. */
export function CarForm ({ car }: { car?: Car }) {
  const isEdit = Boolean(car)
  const [form, setForm] = useState<Partial<Car>>(
    car ?? { status: 'disponible', transmission: 'Automática', fuel: 'Gasolina', bodyType: 'SUV' }
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
    if (!form.brand || !form.model || !form.year || !form.price) {
      setError('Completa marca, modelo, año y precio.')
      return
    }
    startTransition(async () => {
      const res = await saveCarAction(car?.id ?? null, {
        brand: form.brand!, model: form.model!, year: Number(form.year), price: Number(form.price),
        mileage: Number(form.mileage ?? 0), transmission: form.transmission ?? 'Automática',
        fuel: form.fuel ?? 'Gasolina', color: form.color ?? '', bodyType: form.bodyType ?? 'SUV',
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
          <Field label="Marca"><Input value={form.brand ?? ''} onChange={(e) => set('brand', e.target.value)} placeholder="Mazda" /></Field>
          <Field label="Modelo"><Input value={form.model ?? ''} onChange={(e) => set('model', e.target.value)} placeholder="CX-5 Grand Touring" /></Field>
          <Field label="Año"><Input type="number" value={form.year ?? ''} onChange={(e) => set('year', Number(e.target.value))} placeholder="2022" /></Field>
          <Field label="Precio (MXN)"><Input type="number" value={form.price ?? ''} onChange={(e) => set('price', Number(e.target.value))} placeholder="449900" /></Field>
          <Field label="Kilometraje"><Input type="number" value={form.mileage ?? ''} onChange={(e) => set('mileage', Number(e.target.value))} placeholder="38000" /></Field>
          <Field label="Color"><Input value={form.color ?? ''} onChange={(e) => set('color', e.target.value)} placeholder="Gris" /></Field>
          <Field label="Transmisión"><Select value={form.transmission ?? 'Automática'} onChange={(v) => set('transmission', v)} options={TRANSMISSIONS} /></Field>
          <Field label="Combustible"><Select value={form.fuel ?? 'Gasolina'} onChange={(v) => set('fuel', v)} options={FUELS} /></Field>
          <Field label="Carrocería"><Select value={form.bodyType ?? 'SUV'} onChange={(v) => set('bodyType', v)} options={BODY_TYPES} /></Field>
          <Field label="Ubicación"><Input value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} placeholder="CDMX" /></Field>
          <Field label="Estado"><Select value={form.status ?? 'disponible'} onChange={(v) => set('status', v)} options={STATUSES} /></Field>
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
