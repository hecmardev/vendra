/**
 * ID de medición de Google Analytics 4 (G-XXXXXXX). Vacío = sin GA4. Lanza con un
 * mensaje para mostrar: sin esta validación el campo aceptó un correo autollenado
 * por el navegador. Para el admin y para los Ajustes del dealer.
 *
 * Sin uso mientras GA4 no se active: el campo se ocultó para no prometer algo que no
 * funciona, y regresa con esta validación (docs/pendientes.md § 0).
 */
export function parseGa4Id (raw: string): string | null {
  const id = raw.trim().toUpperCase()
  if (!id) return null
  if (!/^G-[A-Z0-9]{4,20}$/.test(id)) {
    throw new Error('El ID de GA4 no es válido: debe verse como G-XXXXXXX. Si no usas Google Analytics, déjalo vacío.')
  }
  return id
}
