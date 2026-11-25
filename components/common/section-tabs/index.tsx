'use client'

import { cn } from '@/lib/utils'

/**
 * Pestañas de sección de los editores del panel (Contenido, Ajustes): texto con
 * subrayado en la activa. Solo cambian qué se muestra; el estado de cada editor
 * vive arriba, así que pasar de una pestaña a otra no pierde lo escrito.
 *
 * overflow-y-hidden evita una scrollbar vertical de 1px que provoca el -mb-px de
 * los botones.
 */
export function SectionTabs<K extends string> ({
  tabs,
  value,
  onChange
}: {
  tabs: ReadonlyArray<{ key: K; label: string }>
  value: K
  onChange: (key: K) => void
}) {
  return (
    <div role="tablist" className="flex gap-6 overflow-x-auto overflow-y-hidden border-b">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            '-mb-px whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
            value === t.key
              ? 'border-cta text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
