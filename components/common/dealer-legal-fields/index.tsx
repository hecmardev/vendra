'use client'

import { Input } from '@/components/ui/input'
import type { DealerLegalInput } from '@/lib/dealerLegal'

function Field ({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

/**
 * Datos del aviso de privacidad del dealer. Los mismos en el admin de Vendra y en
 * los Ajustes del dealer. Se publican en su sitio.
 */
export function DealerLegalFields ({
  value, onChange
}: {
  value: DealerLegalInput
  onChange: (next: DealerLegalInput) => void
}) {
  const set = (patch: Partial<DealerLegalInput>) => onChange({ ...value, ...patch })

  return (
    <div className="space-y-4">
      <Field label="Nombre completo o razón social" hint="Si no hay empresa, el nombre completo de quien vende. Es el responsable de los datos de sus clientes.">
        <Input value={value.legalName} onChange={(e) => set({ legalName: e.target.value })} autoComplete="off" placeholder="Juan Pérez López" />
      </Field>
      <Field label="Domicilio" hint="Donde pueda recibir notificaciones. Se publica: puede ser un domicilio de trabajo.">
        <Input value={value.legalAddress} onChange={(e) => set({ legalAddress: e.target.value })} autoComplete="off" placeholder="Calle, número, colonia, C.P., ciudad, estado" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Correo de privacidad" hint="Un correo que sí se revise: aquí llegan las solicitudes de los clientes.">
          <Input value={value.privacyEmail} onChange={(e) => set({ privacyEmail: e.target.value })} type="email" autoComplete="off" placeholder="privacidad@tunegocio.mx" />
        </Field>
        <Field label="Teléfono de privacidad (opcional)" hint="Si lo dejas vacío, se usa el teléfono del negocio.">
          <Input value={value.privacyPhone} onChange={(e) => set({ privacyPhone: e.target.value })} type="tel" autoComplete="off" placeholder="81 1234 5678" />
        </Field>
      </div>
    </div>
  )
}
