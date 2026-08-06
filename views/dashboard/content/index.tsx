'use client'

import { useState, useRef, useTransition } from 'react'
import { Plus, Trash2, Eye, Check, Loader2, ImagePlus, X } from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DEFAULT_CONTENT, type SiteContent } from '@/constants/defaultContent'
import { saveContentAction, uploadHeaderImageAction } from '@/app/dashboard/(panel)/contenido/actions'

/* ---------- helpers de UI ---------- */
function Card ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-6">
      <div className="mb-4">
        <h2 className="font-bold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

function Area ({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    />
  )
}

function ItemCard ({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    // pr-12 reserva el hueco de la derecha para que ningún campo quede debajo del botón.
    <div className="relative space-y-3 rounded-lg border bg-background p-4 pr-12">
      <Button variant="ghost" size="icon" onClick={onRemove} className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
      {children}
    </div>
  )
}

function AddButton ({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="gap-1">
      <Plus className="h-4 w-4" /> {label}
    </Button>
  )
}

/* ---------- tabs ---------- */
const TABS = [
  { key: 'marca', label: 'Marca' },
  { key: 'inicio', label: 'Inicio' },
  { key: 'nosotros', label: 'Nosotros' },
  { key: 'contacto', label: 'Contacto' }
] as const
type TabKey = typeof TABS[number]['key']

/* ---------- editor ---------- */
export function ContentView ({ initial }: { initial: SiteContent }) {
  const [c, setC] = useState<SiteContent>(() => structuredClone(initial))
  const [tab, setTab] = useState<TabKey>('marca')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const headerFileRef = useRef<HTMLInputElement>(null)

  /** Aplica una mutación sobre una copia del contenido. */
  const set = (fn: (d: SiteContent) => void) =>
    setC((prev) => { const d = structuredClone(prev); fn(d); return d })

  /** Sube la imagen de cabecera y guarda su URL en el contenido. */
  const onPickHeaderImage = async (file: File | null | undefined) => {
    if (!file) return
    setError('')
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadHeaderImageAction(fd)
    if (res.error) setError(res.error)
    else if (res.url) set((d) => { d.headerImage = res.url! })
    setUploading(false)
    if (headerFileRef.current) headerFileRef.current.value = ''
  }

  const onSave = () => {
    setError('')
    setSaved(false)
    startTransition(async () => {
      const res = await saveContentAction(c)
      if (res?.error) setError(res.error)
      else setSaved(true)
    })
  }

  /** Vuelve al copy por defecto sin perder los datos de contacto de Ajustes. */
  const onReset = () => {
    setSaved(false)
    setC({ ...structuredClone(DEFAULT_CONTENT), business: structuredClone(c.business) })
  }

  return (
    // En desktop ocupa la altura de la pantalla y SOLO el panel de la tab
    // scrollea; header, tabs y barra de guardar quedan fijos. Así una tab corta
    // (Marca, Contacto) no muestra scroll. En móvil fluye normal.
    <div className="flex flex-col gap-6 lg:h-[calc(100dvh-4rem)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contenido del sitio</h1>
          <p className="text-sm text-muted-foreground">Los textos que verán tus clientes. Escríbelos con tu propia voz.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/" target="_blank"><Eye className="h-4 w-4" /> Ver sitio</Link>
        </Button>
      </div>

      {/* Tabs de sección (subrayado en la activa). overflow-y-hidden evita una
          scrollbar vertical de 1px que provoca el -mb-px de los botones. */}
      <div className="flex gap-6 overflow-x-auto overflow-y-hidden border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
              tab === t.key
                ? 'border-cta text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel de la tab activa: único que scrollea (en desktop). La barra de
          scroll se oculta (scrollbar-width/::-webkit-scrollbar) para no ensuciar
          el contenido; sigue scrolleando con rueda/trackpad. */}
      <div className="space-y-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* Marca */}
      {tab === 'marca' && (
        <Card title="Marca" description="Cómo describes tu negocio.">
          <Field label="Descripción para buscadores (Google, al compartir)"><Area value={c.brand.description} onChange={(v) => set((d) => { d.brand.description = v })} /></Field>
          <Field label="Descripción (footer)"><Area value={c.footer.description} onChange={(v) => set((d) => { d.footer.description = v })} /></Field>

          <Field label="Imagen de cabecera (páginas Autos y Contacto)">
            {c.headerImage
              ? (
                <div className="group relative h-32 w-full max-w-md overflow-hidden rounded-lg border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.headerImage} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    title="Quitar imagen"
                    onClick={() => set((d) => { d.headerImage = '' })}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                )
              : (
                <button
                  type="button"
                  onClick={() => headerFileRef.current?.click()}
                  disabled={uploading}
                  className="flex h-32 w-full max-w-md flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground transition-colors hover:border-cta hover:text-cta disabled:opacity-60"
                >
                  {uploading
                    ? <><Loader2 className="h-6 w-6 animate-spin" /><span className="text-xs">Subiendo…</span></>
                    : <><ImagePlus className="h-6 w-6" /><span className="text-xs">Subir imagen</span></>}
                </button>
                )}
            <input
              ref={headerFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              hidden
              onChange={(e) => { void onPickHeaderImage(e.target.files?.[0]) }}
            />
            <p className="text-xs text-muted-foreground">Se ve de fondo en las cabeceras. Ideal horizontal (JPG/PNG/WEBP, máx 5 MB). Recuerda Guardar.</p>
          </Field>
        </Card>
      )}

      {/* Inicio */}
      {tab === 'inicio' && (
        <Card title="Inicio" description="El hero y las secciones de la página principal.">
          <Field label="Etiqueta del hero"><Input value={c.hero.badge} onChange={(e) => set((d) => { d.hero.badge = e.target.value })} /></Field>
          <Field label="Título del hero"><Input value={c.hero.title} onChange={(e) => set((d) => { d.hero.title = e.target.value })} /></Field>
          <Field label="Subtítulo del hero"><Area value={c.hero.subtitle} onChange={(v) => set((d) => { d.hero.subtitle = v })} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Título 'Categorías'"><Input value={c.sections.categoriesTitle} onChange={(e) => set((d) => { d.sections.categoriesTitle = e.target.value })} /></Field>
            <Field label="Título 'Destacados'"><Input value={c.sections.featuredTitle} onChange={(e) => set((d) => { d.sections.featuredTitle = e.target.value })} /></Field>
            <Field label="Título 'Cómo funciona'"><Input value={c.sections.howItWorksTitle} onChange={(e) => set((d) => { d.sections.howItWorksTitle = e.target.value })} /></Field>
          </div>
          <Field label="Pasos (cómo funciona)">
            <div className="space-y-3">
              {c.sections.howItWorksSteps.map((s, i) => (
                <ItemCard key={i} onRemove={() => set((d) => { d.sections.howItWorksSteps.splice(i, 1) })}>
                  <Input value={s.title} onChange={(e) => set((d) => { d.sections.howItWorksSteps[i].title = e.target.value })} placeholder="Título del paso" />
                  <Area value={s.desc} rows={2} onChange={(v) => set((d) => { d.sections.howItWorksSteps[i].desc = v })} />
                </ItemCard>
              ))}
              <AddButton label="Agregar paso" onClick={() => set((d) => { d.sections.howItWorksSteps.push({ title: '', desc: '' }) })} />
            </div>
          </Field>
        </Card>
      )}

      {/* Nosotros */}
      {tab === 'nosotros' && (
        <Card title="Nosotros (Acerca de)" description="Tu historia, trayectoria, valores y testimonios.">
          <Field label="Etiqueta"><Input value={c.about.heroBadge} onChange={(e) => set((d) => { d.about.heroBadge = e.target.value })} /></Field>
          <Field label="Título (usa saltos de línea si quieres)"><Area value={c.about.heroTitle} rows={2} onChange={(v) => set((d) => { d.about.heroTitle = v })} /></Field>
          <Field label="Subtítulo"><Area value={c.about.heroSubtitle} onChange={(v) => set((d) => { d.about.heroSubtitle = v })} /></Field>

          <Field label="Estadísticas">
            <div className="grid gap-3 sm:grid-cols-2">
              {c.about.stats.map((s, i) => (
                <ItemCard key={i} onRemove={() => set((d) => { d.about.stats.splice(i, 1) })}>
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={s.value} onChange={(e) => set((d) => { d.about.stats[i].value = e.target.value })} placeholder="+500" />
                    <Input value={s.label} onChange={(e) => set((d) => { d.about.stats[i].label = e.target.value })} placeholder="Autos entregados" />
                  </div>
                </ItemCard>
              ))}
            </div>
            <div className="mt-3"><AddButton label="Agregar estadística" onClick={() => set((d) => { d.about.stats.push({ value: '', label: '' }) })} /></div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Historia — etiqueta"><Input value={c.about.storyEyebrow} onChange={(e) => set((d) => { d.about.storyEyebrow = e.target.value })} /></Field>
            <Field label="Historia — título"><Input value={c.about.storyTitle} onChange={(e) => set((d) => { d.about.storyTitle = e.target.value })} /></Field>
          </div>
          <Field label="Historia — párrafos">
            <div className="space-y-3">
              {c.about.storyParagraphs.map((p, i) => (
                <ItemCard key={i} onRemove={() => set((d) => { d.about.storyParagraphs.splice(i, 1) })}>
                  <Area value={p} onChange={(v) => set((d) => { d.about.storyParagraphs[i] = v })} />
                </ItemCard>
              ))}
              <AddButton label="Agregar párrafo" onClick={() => set((d) => { d.about.storyParagraphs.push('') })} />
            </div>
          </Field>

          <Field label="Compromisos">
            <div className="grid gap-2 sm:grid-cols-2">
              {c.about.commitments.map((cm, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={cm} onChange={(e) => set((d) => { d.about.commitments[i] = e.target.value })} />
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => set((d) => { d.about.commitments.splice(i, 1) })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
            <div className="mt-3"><AddButton label="Agregar compromiso" onClick={() => set((d) => { d.about.commitments.push('') })} /></div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Trayectoria — etiqueta"><Input value={c.about.timelineEyebrow} onChange={(e) => set((d) => { d.about.timelineEyebrow = e.target.value })} /></Field>
            <Field label="Trayectoria — título"><Input value={c.about.timelineTitle} onChange={(e) => set((d) => { d.about.timelineTitle = e.target.value })} /></Field>
          </div>
          <Field label="Hitos">
            <div className="space-y-3">
              {c.about.milestones.map((m, i) => (
                <ItemCard key={i} onRemove={() => set((d) => { d.about.milestones.splice(i, 1) })}>
                  <div className="grid grid-cols-3 gap-2">
                    <Input value={m.year} onChange={(e) => set((d) => { d.about.milestones[i].year = e.target.value })} placeholder="2020" />
                    <Input className="col-span-2" value={m.title} onChange={(e) => set((d) => { d.about.milestones[i].title = e.target.value })} placeholder="Título del hito" />
                  </div>
                  <Area value={m.desc} rows={2} onChange={(v) => set((d) => { d.about.milestones[i].desc = v })} />
                </ItemCard>
              ))}
              <AddButton label="Agregar hito" onClick={() => set((d) => { d.about.milestones.push({ year: '', title: '', desc: '' }) })} />
            </div>
          </Field>

          <Field label="Título 'Por qué elegirnos'"><Input value={c.about.valuesTitle} onChange={(e) => set((d) => { d.about.valuesTitle = e.target.value })} /></Field>
          <Field label="Valores">
            <div className="grid gap-3 sm:grid-cols-2">
              {c.about.values.map((v, i) => (
                <ItemCard key={i} onRemove={() => set((d) => { d.about.values.splice(i, 1) })}>
                  <Input value={v.title} onChange={(e) => set((d) => { d.about.values[i].title = e.target.value })} placeholder="Confianza" />
                  <Area value={v.desc} rows={2} onChange={(val) => set((d) => { d.about.values[i].desc = val })} />
                </ItemCard>
              ))}
            </div>
            <div className="mt-3"><AddButton label="Agregar valor" onClick={() => set((d) => { d.about.values.push({ title: '', desc: '' }) })} /></div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Testimonios — título"><Input value={c.about.testimonialsTitle} onChange={(e) => set((d) => { d.about.testimonialsTitle = e.target.value })} /></Field>
            <Field label="Testimonios — subtítulo"><Input value={c.about.testimonialsSubtitle} onChange={(e) => set((d) => { d.about.testimonialsSubtitle = e.target.value })} /></Field>
          </div>
          <Field label="Testimonios">
            <div className="space-y-3">
              {c.about.testimonials.map((t, i) => (
                <ItemCard key={i} onRemove={() => set((d) => { d.about.testimonials.splice(i, 1) })}>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Input value={t.name} onChange={(e) => set((d) => { d.about.testimonials[i].name = e.target.value })} placeholder="Nombre" />
                    <Input value={t.location} onChange={(e) => set((d) => { d.about.testimonials[i].location = e.target.value })} placeholder="Ciudad" />
                    <Input value={t.car} onChange={(e) => set((d) => { d.about.testimonials[i].car = e.target.value })} placeholder="Auto" />
                    <Input type="number" min={1} max={5} value={t.rating} onChange={(e) => set((d) => { d.about.testimonials[i].rating = Number(e.target.value) })} placeholder="5" />
                  </div>
                  <Area value={t.text} rows={2} onChange={(v) => set((d) => { d.about.testimonials[i].text = v })} />
                </ItemCard>
              ))}
              <AddButton label="Agregar testimonio" onClick={() => set((d) => { d.about.testimonials.push({ name: '', location: '', car: '', rating: 5, text: '' }) })} />
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CTA — título"><Input value={c.about.ctaTitle} onChange={(e) => set((d) => { d.about.ctaTitle = e.target.value })} /></Field>
            <Field label="CTA — subtítulo"><Input value={c.about.ctaSubtitle} onChange={(e) => set((d) => { d.about.ctaSubtitle = e.target.value })} /></Field>
          </div>
        </Card>
      )}

      {/* Contacto */}
      {tab === 'contacto' && (
        <Card title="Contacto">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Título"><Input value={c.contact.title} onChange={(e) => set((d) => { d.contact.title = e.target.value })} /></Field>
            <Field label="Subtítulo"><Input value={c.contact.subtitle} onChange={(e) => set((d) => { d.contact.subtitle = e.target.value })} /></Field>
            <Field label="Título del formulario"><Input value={c.contact.formTitle} onChange={(e) => set((d) => { d.contact.formTitle = e.target.value })} /></Field>
          </div>
        </Card>
      )}
      </div>

      {/* Barra de guardar (fija abajo del panel) */}
      <div className="flex items-center justify-end gap-3 rounded-xl border bg-card p-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && !error && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600">
            <Check className="h-4 w-4" /> Contenido guardado
          </p>
        )}
        <Button variant="ghost" onClick={onReset} disabled={pending}>Restablecer</Button>
        <Button variant="cta" size="lg" onClick={onSave} disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}
