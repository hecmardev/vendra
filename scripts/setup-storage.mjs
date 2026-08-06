/**
 * Crea el bucket de fotos de autos en Supabase Storage. Idempotente.
 *
 * Lectura pública (el catálogo es público); la ESCRITURA no se abre por RLS de
 * storage: pasa siempre por un server action que valida el dealer y sube con la
 * service-role key bajo el prefijo `<dealer_id>/`.
 *
 *   node --env-file=.env scripts/setup-storage.mjs
 */
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'car-photos'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const { data: buckets, error: listErr } = await supabase.storage.listBuckets()
if (listErr) {
  console.error('No se pudieron listar los buckets:', listErr.message)
  process.exit(1)
}

if (buckets.some((b) => b.name === BUCKET)) {
  console.log(`✓ El bucket "${BUCKET}" ya existe.`)
  process.exit(0)
}

const { error } = await supabase.storage.createBucket(BUCKET, {
  public: true,
  fileSizeLimit: 5 * 1024 * 1024, // 5 MB por foto
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
})

if (error) {
  console.error('No se pudo crear el bucket:', error.message)
  process.exit(1)
}

console.log(`✓ Bucket "${BUCKET}" creado (lectura pública, máx 5 MB por foto).`)
