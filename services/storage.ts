import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'car-photos'
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif'
}

/**
 * Sube una foto de auto y devuelve su URL pública.
 *
 * Usa la service-role key a propósito: la escritura en Storage no se abre por
 * RLS, se autoriza en el server (quien llama ya validó el dealer) y el archivo
 * queda SIEMPRE bajo el prefijo `<dealerId>/`, que es lo que aísla a cada dealer.
 */
export async function uploadCarPhoto (dealerId: string, file: File): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error('Formato no admitido. Usa JPG, PNG, WEBP o AVIF.')
  if (file.size > MAX_BYTES) throw new Error('La foto pesa más de 5 MB.')

  const path = `${dealerId}/${crypto.randomUUID()}.${EXT[file.type]}`
  const supabase = createAdminClient()

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Borra una foto del bucket a partir de su URL pública. Ignora URLs externas
 * (p. ej. las de la demo) y falla en silencio: es limpieza, no debe romper el
 * guardado del auto.
 */
export async function deleteCarPhoto (dealerId: string, publicUrl: string): Promise<void> {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const i = publicUrl.indexOf(marker)
  if (i === -1) return

  const path = publicUrl.slice(i + marker.length)
  if (!path.startsWith(`${dealerId}/`)) return // nunca tocar fotos de otro dealer

  try {
    await createAdminClient().storage.from(BUCKET).remove([path])
  } catch {
    // limpieza best-effort
  }
}
