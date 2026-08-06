import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const WA_GREEN = '#25D366'

function buildHref (phone: string, message: string) {
  const clean = phone.replace(/[^\d]/g, '')
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

/** Botón de WhatsApp en línea (ficha de auto, contacto). */
export function WhatsAppButton ({
  phone,
  message,
  className,
  children = 'WhatsApp'
}: {
  phone: string
  message: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <a
      href={buildHref(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      style={{ backgroundColor: WA_GREEN }}
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90',
        className
      )}
    >
      <MessageCircle className="h-5 w-5" />
      {children}
    </a>
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
      <MessageCircle className="h-7 w-7" />
    </a>
  )
}
