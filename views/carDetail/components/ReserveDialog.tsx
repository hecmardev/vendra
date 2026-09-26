'use client'

import { useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
// Import directo (no del barrel) para no arrastrar componentes server al cliente.
import { LeadForm } from '@/components/common/lead-form'
import { Modal } from './Modal'

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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Aparta este auto"
        description="Déjanos tus datos y te contactamos para apartarlo o agendar una visita."
      >
        <LeadForm carId={carId} carLabel={carLabel} source="apartado" />
      </Modal>
    </>
  )
}
