'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'

/** Opción: una cadena cuando el valor y la etiqueta son lo mismo, o el par cuando no. */
export type ComboOption = string | { value: string; label: string }

const valueOf = (o: ComboOption) => (typeof o === 'string' ? o : o.value)
const labelOf = (o: ComboOption) => (typeof o === 'string' ? o : o.label)

/**
 *
 * Dos modos, y los distingue la presencia de `buscar`:
 *
 *   CON buscador  la lista se filtra al escribir y admite capturar algo que no
 *                 esté en el catálogo. Para listas largas y abiertas (marca).
 *   SIN buscador  lista cerrada. Para tres o cuatro opciones, donde buscar
 *                 estorba, y para valores que no pueden ser libres: `status` es
 *                 un enum en Postgres y un valor inventado reventaría el insert.
 */
export function Combo ({
  value, onChange, options, placeholder, buscar, capitalizar, className
}: {
  value: string
  onChange: (v: string) => void
  options: ComboOption[]
  placeholder: string
  buscar?: string
  /** Para valores que se guardan en minúsculas (los estatus) y se muestran capitalizados. */
  capitalizar?: boolean
  /** Se aplica al disparador, para ajustarle el ancho donde haga falta. */
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const libre = query.trim()

  const actual = options.find((o) => valueOf(o) === value)
  const texto = actual ? labelOf(actual) : value

  const pick = (v: string) => {
    onChange(v)
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
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            className
          )}
        >
          <span className={cn('truncate', capitalizar && 'capitalize', !texto && 'text-muted-foreground')}>
            {texto || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-56 p-0">
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
              {options.map((o) => {
                const v = valueOf(o)
                return (
                  // onSelect sin argumento a propósito: cmdk lo entrega en
                  // minúsculas y guardaría "kia" en vez de "KIA".
                  <CommandItem key={v} value={labelOf(o)} onSelect={() => pick(v)} className={cn(capitalizar && 'capitalize')}>
                    <Check className={cn('mr-2 h-4 w-4 shrink-0', v === value ? 'opacity-100' : 'opacity-0')} />
                    {labelOf(o)}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
