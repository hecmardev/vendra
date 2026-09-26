import { cn } from '@/lib/utils'
import { WhatsAppIcon } from './icon'

const WA_GREEN = '#25D366'

/** Apariencia compartida por el enlace y el disparador. */
const WA_CLASSES =
  'inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90'

function buildHref (phone: string, message: string) {
  const clean = phone.replace(/[^\d]/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

/** Botón de WhatsApp en línea (ficha de auto, contacto). */
export function WhatsAppButton ({
  phone,
  message,
  className,
  onClick,
  children = 'WhatsApp'
}: {
  phone: string
  message: string
  className?: string
  /**
   * Corre DENTRO del clic, antes de que el navegador siga el enlace. Es donde
   * se dispara el guardado del lead: si se esperara su respuesta para abrir
   * WhatsApp después, se perdería el gesto del usuario y Safari bloquearía la
   * apertura. Puede cancelar la navegación con preventDefault.
   */
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  children?: React.ReactNode
}) {
  return (
    <a
      href={buildHref(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      style={{ backgroundColor: WA_GREEN }}
      className={cn(WA_CLASSES, className)}
    >
      <WhatsAppIcon className="h-5 w-5" />
      {children}
    </a>
  )
}

/**
 * Mismo aspecto que WhatsAppButton pero como <button>: no navega, abre algo.
 * Lo usa la ficha para pedir los datos antes de mandar al chat.
 */
export function WhatsAppAction ({
  onClick,
  className,
  children
}: {
  onClick: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ backgroundColor: WA_GREEN }}
      className={cn(WA_CLASSES, className)}
    >
      <WhatsAppIcon className="h-5 w-5" />
      {children}
    </button>
  )
}

/** Botón flotante de WhatsApp (fijo, esquina inferior derecha). */
export function WhatsAppFloat ({ phone, message }: { phone: string; message: string }) {
  return (
    <a
      href={buildHref(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      style={{ backgroundColor: WA_GREEN }}
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  )
}
