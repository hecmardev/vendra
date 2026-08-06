'use client'

import { useState } from 'react'
import { CalendarCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
// Import directo (no del barrel) para no arrastrar componentes server al cliente.
import { LeadForm } from '@/components/common/lead-form'

/**
 * Botón "Apartar o agendar visita" + modal con el formulario de lead.
 * El lead queda ligado al auto (carId) y con source `apartado` para que el
 * dealer lo distinga de un contacto general.
 */
export function ReserveDialog ({ carId, carLabel }: { carId: string; carLabel: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="cta" size="lg" className="w-full gap-2" onClick={() => setOpen(true)}>
        <CalendarCheck className="h-5 w-5" /> Apartar o agendar visita
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Aparta este auto</h2>
                <p className="text-sm text-muted-foreground">
                  Déjanos tus datos y te contactamos para apartarlo o agendar una visita.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <LeadForm carId={carId} carLabel={carLabel} source="apartado" />
          </div>
        </div>
      )}
    </>
  )
}
