/** Fecha del texto de los avisos. Se actualiza al cambiarlo (docs/legal/). */
export const LEGAL_LAST_UPDATED = '5 de noviembre de 2026'

export interface VendraLegal {
  responsible: string
  address: string
  email: string
}

/**
 * Datos de Vendra como responsable. Van en variables de entorno y no en el código
 * porque, mientras Vendra opere como persona física, son datos personales de su
 * titular. Null si falta alguno: el aviso de Vendra no se publica con huecos.
 */
export function getVendraLegal (): VendraLegal | null {
  const responsible = process.env.LEGAL_VENDRA_NAME?.trim()
  const address = process.env.LEGAL_VENDRA_ADDRESS?.trim()
  const email = process.env.LEGAL_VENDRA_EMAIL?.trim()
  if (!responsible || !address || !email) return null
  return { responsible, address, email }
}
