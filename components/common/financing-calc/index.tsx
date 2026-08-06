'use client'

import { useState } from 'react'
import { Calculator } from 'lucide-react'
import { formatPrice } from '@/helpers/format'
import { cn } from '@/lib/utils'

const PLAZOS = [12, 24, 36, 48, 60, 72]

/** Pago mensual estimado con amortización simple. */
function monthlyPayment (principal: number, annualRatePct: number, months: number): number {
  const r = annualRatePct / 100 / 12
  if (r === 0) return Math.round(principal / months)
  return Math.round((principal * r) / (1 - Math.pow(1 + r, -months)))
}

/**
 * Calculadora de financiamiento (simulador). Solo referencia, sin integración
 * bancaria — estima la mensualidad para orientar al cliente y generar el lead.
 */
export function FinancingCalc ({ price }: { price: number }) {
  const [downPct, setDownPct] = useState(20)
  const [months, setMonths] = useState(48)
  const [rate, setRate] = useState(13)

  const down = Math.round((price * downPct) / 100)
  const principal = price - down
  const monthly = monthlyPayment(principal, rate, months)

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-cta" />
        <h2 className="text-lg font-bold tracking-tight">Calcula tu mensualidad</h2>
      </div>

      <div className="grid gap-5 rounded-xl border bg-card p-5 md:grid-cols-2">
        {/* Controles */}
        <div className="space-y-5">
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">Enganche</span>
              <span className="text-muted-foreground">{downPct}% · {formatPrice(down)}</span>
            </div>
            <input
              type="range" min={0} max={60} step={5}
              value={downPct} onChange={(e) => setDownPct(Number(e.target.value))}
              className="w-full accent-[hsl(var(--cta))]"
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium">Plazo</p>
            <div className="flex flex-wrap gap-2">
              {PLAZOS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMonths(m)}
                  className={cn(
                    'h-8 rounded-md border px-3 text-sm transition-colors',
                    m === months ? 'border-cta bg-cta text-cta-foreground' : 'hover:bg-accent'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">meses</p>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">Tasa anual</span>
              <span className="text-muted-foreground">{rate}%</span>
            </div>
            <input
              type="range" min={5} max={25} step={0.5}
              value={rate} onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-[hsl(var(--cta))]"
            />
          </div>
        </div>

        {/* Resultado */}
        <div className="flex flex-col justify-center rounded-lg bg-secondary/60 p-5 text-center">
          <p className="text-xs text-muted-foreground">Pago mensual estimado</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-cta">{formatPrice(monthly)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {months} meses · enganche {formatPrice(down)}
          </p>
          <p className="mt-3 text-[11px] leading-tight text-muted-foreground">
            Cálculo de referencia, no es una oferta de crédito.
          </p>
        </div>
      </div>
    </section>
  )
}
