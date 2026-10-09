'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Lead } from '@/interfaces/lead'

/** Un auto que se puede elegir como "el que compró". */
export interface SaleOption {
  id: string
  label: string
  price: number
}

export interface SaleInput {
  /** '' = un auto que no está en el inventario. */
  soldCarId: string
  saleAmount: number
  markCarSold: boolean
}

const NOT_IN_INVENTORY = ''

/**
 * Captura de la venta al marcar un lead como vendido (o al corregirla).
 *
 * Arranca con el auto por el que preguntó, que es el caso común, y su precio
 * publicado como monto: el vendedor solo corrige si hubo descuento o si el
 * cliente se llevó otro. Elegir otro auto cambia el monto sugerido, salvo que
 * el vendedor ya lo haya escrito a mano.
 */
export function SaleForm ({
  lead, options, pending, onCancel, onConfirm
}: {
  lead: Lead
  options: SaleOption[]
  pending: boolean
  onCancel: () => void
  onConfirm: (input: SaleInput) => void
}) {
  // El auto de interés va primero y marcado, aunque ya no esté en la lista
  // (por ejemplo, porque se vendió a otro cliente). Lo mismo el auto vendido
  // de una venta que se está corrigiendo.
  const list: SaleOption[] = []
  if (lead.carId && lead.carLabel) {
    list.push({ id: lead.carId, label: `${lead.carLabel} (por el que preguntó)`, price: lead.carPrice ?? 0 })
  }
  if (lead.soldCarId && lead.soldCarLabel && lead.soldCarId !== lead.carId) {
    const known = options.find((o) => o.id === lead.soldCarId)
    list.push({ id: lead.soldCarId, label: lead.soldCarLabel, price: known?.price ?? 0 })
  }
  for (const o of options) if (!list.some((x) => x.id === o.id)) list.push(o)

  const editing = lead.status === 'vendido'
  const initialCar = editing ? (lead.soldCarId ?? NOT_IN_INVENTORY) : (lead.carId ?? NOT_IN_INVENTORY)
  const priceOf = (id: string) => list.find((o) => o.id === id)?.price

  const [soldCarId, setSoldCarId] = useState(initialCar)
  const [amount, setAmount] = useState<string>(
    String((editing ? lead.saleAmount : null) ?? priceOf(initialCar) ?? '')
  )
  const [amountTouched, setAmountTouched] = useState(editing)
  const [markCarSold, setMarkCarSold] = useState(true)
  const [error, setError] = useState('')

  const pickCar = (id: string) => {
    setSoldCarId(id)
    if (!amountTouched) setAmount(String(priceOf(id) ?? ''))
  }

  const confirm = () => {
    const n = Number(amount)
    if (amount.trim() === '' || !Number.isFinite(n) || n < 0) {
      setError('Escribe el monto de la venta.')
      return
    }
    setError('')
    onConfirm({ soldCarId, saleAmount: n, markCarSold: markCarSold && soldCarId !== NOT_IN_INVENTORY })
  }

  return (
    <div className="space-y-3 rounded-lg border bg-background p-3">
      <p className="text-sm font-medium">{editing ? 'Corregir la venta' : 'Registrar la venta'}</p>

      <div className="space-y-1.5">
        <label htmlFor="sold-car" className="text-xs text-muted-foreground">¿Qué auto compró?</label>
        <select
          id="sold-car"
          value={soldCarId}
          onChange={(e) => pickCar(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {list.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          <option value={NOT_IN_INVENTORY}>Un auto que no está en el inventario</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="sale-amount" className="text-xs text-muted-foreground">Monto de la venta (MXN)</label>
        <Input
          id="sale-amount"
          type="number"
          min={0}
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setAmountTouched(true) }}
          placeholder="449900"
        />
      </div>

      {soldCarId !== NOT_IN_INVENTORY && (
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--cta))]"
            checked={markCarSold}
            onChange={(e) => setMarkCarSold(e.target.checked)}
          />
          Marcar ese auto como vendido en el inventario
        </label>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <Button variant="cta" size="sm" onClick={confirm} disabled={pending}>
          {editing ? 'Guardar cambios' : 'Confirmar venta'}
        </Button>
      </div>
    </div>
  )
}
