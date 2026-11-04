'use client'

import { Input } from '@/components/ui/input'
import type { MetaConfigInput } from '@/lib/metaConfig'

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
 * Campos de Meta: Pixel, verificación del dominio, token de Conversions API y
 * código de prueba. Los mismos en el admin de Vendra y en los Ajustes del dealer.
 *
 * El token va en un input de TEXTO con los caracteres ocultos por CSS, no en
 * type="password": los navegadores autollenan los de contraseña aunque se les
 * pida que no, y una contraseña guardada podía reemplazar el token real.
 */
export function MetaConfigFields ({
  value, onChange, tokenConfigured, domain
}: {
  value: MetaConfigInput
  onChange: (next: MetaConfigInput) => void
  tokenConfigured: boolean
  domain: string
}) {
  const set = (patch: Partial<MetaConfigInput>) => onChange({ ...value, ...patch })

  return (
    <div className="space-y-4">
      <Field
        label="Pixel (ID del conjunto de datos)"
        hint="Administrador de eventos → el conjunto de datos → su identificador. Solo números. Vacío = sin Pixel. Cambiarlo a media campaña deja a Meta sin eventos, y un Pixel nuevo necesita también su propio token."
      >
        <Input value={value.metaPixelId} onChange={(e) => set({ metaPixelId: e.target.value })} inputMode="numeric" placeholder="1234567890123456" />
      </Field>

      <Field
        label="Verificación del dominio"
        hint={`Configuración del negocio → Seguridad de la marca → Dominios → ${domain || 'tu dominio'} → "Etiqueta meta". Pega la etiqueta completa o solo su content.`}
      >
        <Input
          value={value.metaDomainVerification}
          onChange={(e) => set({ metaDomainVerification: e.target.value })}
          placeholder='<meta name="facebook-domain-verification" content="…" />'
        />
      </Field>

      <Field
        label="Token de Conversions API"
        hint="Administrador de eventos → el conjunto de datos → Configuración → API de conversiones → Generar token de acceso. Con él se reportan a Meta los leads, citas y ventas. Se guarda cifrado y no se vuelve a mostrar."
      >
        <Input
          type="text"
          name="meta-capi-key-nofill"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          data-1p-ignore
          data-lpignore="true"
          style={{ WebkitTextSecurity: value.metaCapiToken ? 'disc' : 'none' } as React.CSSProperties}
          value={value.metaCapiToken}
          onChange={(e) => set({ metaCapiToken: e.target.value, clearMetaCapiToken: false })}
          placeholder={tokenConfigured ? 'Token configurado ✓ — escribe aquí solo para reemplazarlo' : 'Sin configurar'}
        />
      </Field>

      {tokenConfigured && (
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input accent-[hsl(var(--cta))]"
            checked={value.clearMetaCapiToken}
            onChange={(e) => set({ clearMetaCapiToken: e.target.checked, metaCapiToken: e.target.checked ? '' : value.metaCapiToken })}
          />
          Quitar el token (deja de reportarle a Meta)
        </label>
      )}

      <Field
        label="Código de eventos de prueba (opcional)"
        hint="Administrador de eventos → Probar eventos. Mientras esté puesto, los eventos del servidor NO cuentan en campañas: bórralo al terminar de probar. Ahí solo se ven los leads; contactado, cita y venta se revisan en Información general, sin código."
      >
        <Input value={value.metaTestEventCode} onChange={(e) => set({ metaTestEventCode: e.target.value })} placeholder="TEST12345" />
      </Field>
    </div>
  )
}
