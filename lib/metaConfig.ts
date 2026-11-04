/**
 * Configuración de Meta de un dealer: Pixel, verificación del dominio, token de
 * Conversions API y código de prueba. La capturan el admin de Vendra o el propio
 * dealer (cualquiera que maneje sus campañas, como una agencia); las reglas son
 * las mismas y viven aquí.
 *
 * Sin dependencias de servidor: los tipos también los usa el formulario.
 */

export interface MetaConfigInput {
  metaPixelId: string
  /** Código de la etiqueta facebook-domain-verification, o la etiqueta completa. */
  metaDomainVerification: string
  /** Token de Conversions API. Vacío = dejar el que está. */
  metaCapiToken: string
  /** Quitar el token: deja de reportarle a Meta. */
  clearMetaCapiToken: boolean
  /** Código de "Probar eventos". Vacío en producción: con él no cuenta en campañas. */
  metaTestEventCode: string
}

export interface ParsedMetaConfig {
  pixelId: string | null
  domainVerification: string | null
  /** null = no tocar el token. */
  token: string | null
  clearToken: boolean
  testEventCode: string | null
}

/**
 * Valida TODO antes de que se guarde nada. Lanza con un mensaje para mostrar.
 * Mismas reglas que los CHECK de la 0018: aquí con un error legible.
 */
export function parseMetaConfig (input: MetaConfigInput): ParsedMetaConfig {
  const pixel = input.metaPixelId.trim()
  if (pixel && !/^[0-9]{6,20}$/.test(pixel)) {
    throw new Error('El Pixel de Meta son solo números (Administrador de eventos → el ID del conjunto de datos).')
  }

  // Acepta el código solo o la etiqueta completa que da Meta para pegar.
  const rawVerification = input.metaDomainVerification.trim()
  const verification = rawVerification.match(/content=["']([^"']+)["']/i)?.[1] ?? rawVerification
  if (verification && !/^[A-Za-z0-9_-]{10,100}$/.test(verification)) {
    throw new Error('El código de verificación del dominio no es válido. Pega la etiqueta que da Meta o solo su "content".')
  }

  const token = input.metaCapiToken.trim()
  if (token && !/^[A-Za-z0-9_-]{20,}$/.test(token)) {
    throw new Error('El token de Conversions API no es válido: debe ser el texto largo que genera el Administrador de eventos, sin espacios.')
  }
  if (token && !pixel) {
    throw new Error('Para usar el token de Conversions API primero captura el Pixel.')
  }

  const testCode = input.metaTestEventCode.trim()
  if (testCode && !/^[A-Za-z0-9_-]{1,40}$/.test(testCode)) {
    throw new Error('El código de eventos de prueba no es válido: se copia de la pestaña Probar eventos, por ejemplo TEST12345.')
  }

  return {
    pixelId: pixel || null,
    domainVerification: verification || null,
    token: token || null,
    clearToken: Boolean(input.clearMetaCapiToken) && !token,
    testEventCode: testCode || null
  }
}
