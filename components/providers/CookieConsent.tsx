'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  CONSENT_CHANGED_EVENT, CONSENT_COOKIE, CONSENT_MAX_AGE, ENGAGED_EVENT, OPEN_CONSENT_EVENT,
  readConsentCookie, type Consent
} from '@/lib/consent'
import { isStorefrontPage } from '@/lib/storefront'

/** Tras abrir la primera ficha: deja ver el auto antes de pedir permiso. */
const AFTER_ENGAGED_MS = 4000
/** Si navega sin abrir fichas (portada, catálogo), igual aparece a este tiempo. */
const FALLBACK_MS = 15000

/**
 * Aviso de cookies del sitio público del dealer (lib/consent.ts).
 *
 * No aparece al entrar: espera a que el visitante muestre interés (unos
 * segundos después de abrir la primera ficha) o a que lleve un rato navegando,
 * lo que pase primero. Pedir permiso cuando la persona ya vio que el sitio le
 * sirve se acepta más que en el primer segundo. Mientras tanto la medición
 * propia sí corre (sin decisión no es un rechazo); solo el Pixel espera.
 *
 * Tampoco presiona: "Aceptar" es el botón principal y "Rechazar" está a la vista
 * y a un clic. No bloquea la página, no se repite en cada página una vez
 * decidido, y "Preferencias de cookies" en el pie lo reabre cuando quiera.
 */
export function CookieConsent () {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Consent | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isStorefrontPage()) return
    const c = readConsentCookie()
    setCurrent(c)

    const reopen = () => { setCurrent(readConsentCookie()); setOpen(true) }
    window.addEventListener(OPEN_CONSENT_EVENT, reopen)

    // Sin decisión todavía: programar la primera aparición.
    const timers: number[] = []
    const show = () => { if (!readConsentCookie()) setOpen(true) }
    const onEngaged = () => timers.push(window.setTimeout(show, AFTER_ENGAGED_MS))
    if (!c) {
      timers.push(window.setTimeout(show, FALLBACK_MS))
      window.addEventListener(ENGAGED_EVENT, onEngaged, { once: true })
    }

    return () => {
      window.removeEventListener(OPEN_CONSENT_EVENT, reopen)
      window.removeEventListener(ENGAGED_EVENT, onEngaged)
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  const decide = async (decision: Consent) => {
    setSaving(true)
    try {
      // Por el servidor: al rechazar hay que borrar las cookies httpOnly de medición.
      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      })
      if (!res.ok) throw new Error()
    } catch {
      // Si el servidor falla, al menos se recuerda la decisión en el navegador.
      document.cookie = `${CONSENT_COOKIE}=${decision}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
    }
    setSaving(false)
    setCurrent(decision)
    setOpen(false)
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: decision }))
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-xl border bg-card p-4 shadow-xl sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2"
    >
      {/* Corto y con el beneficio para el visitante: se lee completo. Lo demás
          (Meta, medición de anuncios, cómo cambiarlo) está en el aviso de
          privacidad y en "Preferencias de cookies". */}
      <p className="text-sm font-semibold">¿Te mostramos autos a tu medida?</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Usamos cookies para recordar qué autos te interesan, mostrarte opciones parecidas y medir
        nuestros anuncios. Tú decides.
      </p>
      {current && (
        <p className="mt-2 text-xs text-muted-foreground">
          Elegiste: <span className="font-medium text-foreground">{current === 'accepted' ? 'aceptar' : 'rechazar la medición'}</span>.
        </p>
      )}
      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" size="sm" disabled={saving} onClick={() => decide('rejected')}>
          Rechazar medición
        </Button>
        <Button variant="cta" size="sm" disabled={saving} onClick={() => decide('accepted')}>
          Aceptar
        </Button>
      </div>
    </div>
  )
}

/** Enlace del pie de página que reabre el aviso. */
export function CookiePreferencesLink ({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
      className={className}
    >
      Preferencias de cookies
    </button>
  )
}
