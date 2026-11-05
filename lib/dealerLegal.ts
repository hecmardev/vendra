/**
 * Datos legales del dealer (0020): con ellos se genera su aviso de privacidad. Los
 * capturan Vendra o el propio dealer; las reglas son las mismas y viven aquí.
 *
 * Sin dependencias de servidor: los tipos también los usa el formulario.
 */

export interface DealerLegalInput {
  /** Razón social, o nombre completo si es persona física. */
  legalName: string
  legalAddress: string
  privacyEmail: string
  /** Vacío = se usa el teléfono del negocio. */
  privacyPhone: string
}

export interface ParsedDealerLegal {
  legal_name: string | null
  legal_address: string | null
  privacy_email: string | null
  privacy_phone: string | null
}

/** Lo que se publica en el aviso. Null en DealerLegalInfo = aún no se puede publicar. */
export interface DealerLegalInfo {
  commercialName: string
  responsible: string
  address: string
  email: string
  phone: string
  site: string
}

interface DealerRow {
  name?: string | null
  domain?: string | null
  legal_name?: string | null
  legal_address?: string | null
  privacy_email?: string | null
  privacy_phone?: string | null
  content?: unknown
}

/** Valida antes de escribir. Lanza con un mensaje para mostrar. */
export function parseDealerLegal (input: DealerLegalInput): ParsedDealerLegal {
  const email = input.privacyEmail.trim().toLowerCase()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('El correo de privacidad no es válido.')
  }
  return {
    legal_name: input.legalName.trim() || null,
    legal_address: input.legalAddress.trim() || null,
    privacy_email: email || null,
    privacy_phone: input.privacyPhone.trim() || null
  }
}

/**
 * El teléfono del negocio tal como se guardó. Sale de `content` y no de
 * mergeContent, para no tomar como dato legal el teléfono de ejemplo de la plantilla.
 */
function businessPhone (content: unknown): string {
  const phone = (content as { business?: { phone?: unknown } } | null)?.business?.phone
  return typeof phone === 'string' ? phone.trim() : ''
}

/** Datos para publicar el aviso, o null si falta alguno. */
export function getDealerLegalInfo (dealer: DealerRow | null | undefined): DealerLegalInfo | null {
  if (!dealer) return null
  const responsible = dealer.legal_name?.trim()
  const address = dealer.legal_address?.trim()
  const email = dealer.privacy_email?.trim()
  const phone = dealer.privacy_phone?.trim() || businessPhone(dealer.content)
  if (!responsible || !address || !email || !phone) return null
  return {
    commercialName: dealer.name?.trim() || responsible,
    responsible,
    address,
    email,
    phone,
    site: dealer.domain ?? ''
  }
}

/** Sin aviso publicado, ningún dealer puede mandarle datos a Meta. */
export function assertLegalForMeta (
  legal: ParsedDealerLegal,
  content: unknown,
  meta: { pixelId: string | null, token: string | null }
): void {
  if (!meta.pixelId && !meta.token) return
  if (!getDealerLegalInfo({ ...legal, content })) {
    throw new Error('Para activar el Pixel o el token de Meta primero completa los datos del aviso de privacidad: nombre o razón social, domicilio, correo y teléfono.')
  }
}
