'use client'

import { SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle
} from '@/components/ui/sheet'
import { Combo } from '@/components/common/combo'
import { useCatalog, useFiltersDraft, matches, SORT_OPTIONS, type SortKey } from '../states/CatalogProvider'
import { Filters } from './Filters'

/**
 * Barra de filtros de MÓVIL. Se queda pegada bajo el navbar (que mide h-16 y en
 * esta vista es `fixed top-0` con z-40, de ahí el `top-16` y el z-30).
 *
 * Vive FUERA de los `Reveal` de CatalogBody a propósito: framer-motion aplica un
 * transform, y un ancestro con transform se vuelve el bloque contenedor de sus
 * descendientes, así que un `position: sticky` adentro deja de pegarse al
 * viewport. Con la clase sola no habría bastado.
 */
export function MobileFilterBar () {
  const { control, drawerOpen, setDrawerOpen, sort, setSort } = useCatalog()

  return (
    <>
      <div className="sticky top-16 z-30 border-b bg-background/95 backdrop-blur lg:hidden">
        <div className="container flex items-center gap-2 py-3">
          <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)} className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {control.activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cta px-1.5 text-xs font-medium text-cta-foreground">
                {control.activeCount}
              </span>
            )}
          </Button>

          {control.activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={control.reset} className="gap-1 px-2 text-xs">
              <X className="h-3.5 w-3.5" /> Limpiar
            </Button>
          )}

          <Combo
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={SORT_OPTIONS}
            placeholder="Ordenar"
            className="ml-auto h-9 w-auto max-w-[52%] shrink"
          />
        </div>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="bottom" className="flex h-[100dvh] flex-col gap-0 p-0">
          {/* El cuerpo solo se monta con el cajón abierto, que es lo que hace que
              el borrador nazca copiando los filtros vigentes en cada apertura. */}
          <DrawerBody onClose={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}

/** Contenido del cajón: trabaja sobre un borrador y no toca la grilla hasta "Aplicar". */
function DrawerBody ({ onClose }: { onClose: () => void }) {
  const { all, control, applyFilters } = useCatalog()
  const draft = useFiltersDraft(control.filters)

  // Cuántos autos quedarían con el borrador puesto. Es la única señal de lo que
  // va a pasar, porque la grilla de atrás no se mueve hasta aplicar.
  const count = all.filter((c) => matches(c, draft.filters)).length

  return (
    <>
      <SheetHeader className="border-b px-5 py-4 text-left">
        <div className="flex items-center justify-between pr-8">
          <SheetTitle>Filtros</SheetTitle>
          {draft.activeCount > 0 && (
            <Button variant="ghost" size="sm" onClick={draft.reset} className="h-7 gap-1 text-xs">
              <X className="h-3.5 w-3.5" /> Limpiar
            </Button>
          )}
        </div>
        <SheetDescription className="sr-only">
          Elige filtros y confirma con el botón de abajo para aplicarlos al catálogo.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <Filters control={draft} collapsed showHeader={false} />
      </div>

      <div className="border-t p-4">
        <Button
          variant="cta"
          size="lg"
          className="w-full"
          onClick={() => { applyFilters(draft.filters); onClose() }}
        >
          Ver {count} {count === 1 ? 'auto' : 'autos'}
        </Button>
      </div>
    </>
  )
}
