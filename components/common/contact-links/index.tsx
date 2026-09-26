import { cn } from '@/lib/utils'

const base = 'underline-offset-2 transition-colors hover:underline'

/**
 * Enlace a Google Maps para una dirección.
 *
 * Usa la URL universal documentada (`maps/search/?api=1&query=`), no la del
 * iframe del mapa: en un teléfono no abre una página web, le pasa la dirección
 * a la app de Maps con las indicaciones listas. Que es lo que alguien quiere al
 * tocar una dirección — no ver un mapa, sino llegar.
 */
export function AddressLink ({ address, className }: { address: string; className?: string }) {
  const dir = address.trim()
  if (!dir) return <span className={className}>{address}</span>

  return (
    <a
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir)}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Ver en Google Maps"
      className={cn(base, className)}
    >
      {dir}
    </a>
  )
}

/**
 * Teléfono que marca al tocarlo.
 *
 * `tel:` no tolera espacios ni paréntesis, así que se limpia el número para el
 * enlace pero se muestra tal como lo capturó el dealer — "55 1234 5678" se lee
 * mejor que "5512345678". Se conserva el `+` inicial si lo trae, porque es lo
 * que hace funcionar el número desde el extranjero.
 */
export function PhoneLink ({ phone, className }: { phone: string; className?: string }) {
  const tel = phone.trim()
  const digitos = tel.replace(/\D/g, '')
  if (!digitos) return <span className={className}>{phone}</span>

  return (
    <a href={`tel:${tel.startsWith('+') ? '+' : ''}${digitos}`} className={cn(base, className)}>
      {tel}
    </a>
  )
}

/** Correo que abre el cliente de correo al tocarlo. */
export function MailLink ({ email, className }: { email: string; className?: string }) {
  const mail = email.trim()
  if (!mail.includes('@')) return <span className={className}>{email}</span>

  return (
    <a href={`mailto:${mail}`} className={cn(base, className)}>
      {mail}
    </a>
  )
}
