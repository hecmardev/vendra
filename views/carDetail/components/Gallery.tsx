'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Expand } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Galería de la ficha: imagen grande + miniaturas + lightbox a pantalla completa. */
export function Gallery ({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(false)

  if (images.length === 0) {
    return <div className="aspect-[4/3] w-full rounded-xl bg-muted" />
  }

  const go = (dir: number) => setActive((i) => (i + dir + images.length) % images.length)

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl border bg-muted"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={alt} className="h-full w-full object-cover" />
        <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Expand className="h-3.5 w-3.5" /> Ampliar
        </span>
      </button>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              onClick={() => setActive(i)}
              className={cn(
                'aspect-[4/3] overflow-hidden rounded-lg border-2 transition',
                i === active ? 'border-cta' : 'border-transparent opacity-70 hover:opacity-100'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${alt} ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setOpen(false)}>
          <button className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <button className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); go(-1) }}>
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); go(1) }}>
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[active]}
            alt={alt}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="absolute bottom-4 rounded-md bg-white/10 px-3 py-1 text-sm text-white">{active + 1} / {images.length}</span>
        </div>
      )}
    </div>
  )
}
