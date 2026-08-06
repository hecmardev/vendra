import { createClient } from '@/lib/supabase/server'
import type { Car } from '@/interfaces/car'

export interface CatalogFilters {
  brand?: string
  minPrice?: number
  maxPrice?: number
  year?: number
  bodyType?: string
}

/** Patch de baja lógica reutilizado en cars y car_images. */
const softDeletePatch = () => ({
  is_active: false,
  record_status: 'deleted',
  deleted_at: new Date().toISOString()
})

/** Mapea una fila de `cars` (+ car_images) al modelo `Car` de la UI. */
function rowToCar (row: any): Car {
  const images = (row.car_images ?? [])
    .filter((i: any) => i.is_active !== false) // el dealer autenticado ve también las dadas de baja
    .slice()
    .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
    .map((i: any) => i.storage_path as string)
  return {
    id: row.id,
    slug: row.slug,
    brand: row.brand,
    model: row.model,
    year: row.year,
    price: Number(row.price),
    mileage: row.mileage ?? 0,
    transmission: row.transmission,
    fuel: row.fuel,
    color: row.color,
    bodyType: row.body_type,
    location: row.location,
    status: row.status,
    description: row.description ?? undefined,
    images
  }
}

/**
 * Catálogo público de un dealer. SIEMPRE se filtra por dealer_id (aislamiento
 * por query). La RLS pública solo expone autos `disponible` con la anon key.
 */
export async function listCars (dealerId: string, filters: CatalogFilters = {}): Promise<Car[]> {
  const supabase = await createClient()
  let query = supabase
    .from('cars')
    .select('*, car_images(*)')
    .eq('dealer_id', dealerId)
    .eq('is_active', true) // oculta los dados de baja (record_status='deleted')

  if (filters.brand) query = query.eq('brand', filters.brand)
  if (filters.year) query = query.eq('year', filters.year)
  if (filters.bodyType) query = query.eq('body_type', filters.bodyType)
  if (filters.minPrice) query = query.gte('price', filters.minPrice)
  if (filters.maxPrice) query = query.lte('price', filters.maxPrice)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(rowToCar)
}

/** Un auto por id, siempre acotado al dealer (lo usa la edición del panel). */
export async function getCarById (dealerId: string, carId: string): Promise<Car | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cars')
    .select('*, car_images(*)')
    .eq('dealer_id', dealerId)
    .eq('id', carId)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data ? rowToCar(data) : null
}

export async function getCarBySlug (dealerId: string, slug: string): Promise<Car | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cars')
    .select('*, car_images(*)')
    .eq('dealer_id', dealerId)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data ? rowToCar(data) : null
}

/* ---------- Escritura (dealer autenticado; RLS owner) ---------- */

export interface CarInput {
  brand: string
  model: string
  year: number
  price: number
  mileage: number
  transmission: string
  fuel: string
  color: string
  bodyType: string
  location: string
  status: string
  description?: string | null
  /** URLs públicas de las fotos, en el orden en que se muestran. */
  images?: string[]
}

function slugify (s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita acentos
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Genera un slug único por dealer (base + sufijo si ya existe). */
async function uniqueSlug (supabase: any, dealerId: string, input: CarInput): Promise<string> {
  const base = slugify(`${input.brand}-${input.model}-${input.year}`) || 'auto'
  // Solo colisiona con autos activos: el índice único parcial libera el slug de los dados de baja.
  const { data } = await supabase.from('cars').select('slug').eq('dealer_id', dealerId).eq('is_active', true).like('slug', `${base}%`)
  const taken = new Set((data ?? []).map((r: any) => r.slug))
  if (!taken.has(base)) return base
  let i = 2
  while (taken.has(`${base}-${i}`)) i++
  return `${base}-${i}`
}

function toRow (input: CarInput) {
  return {
    brand: input.brand,
    model: input.model,
    year: input.year,
    price: input.price,
    mileage: input.mileage,
    transmission: input.transmission,
    fuel: input.fuel,
    color: input.color,
    body_type: input.bodyType,
    location: input.location,
    status: input.status,
    description: input.description ?? null
  }
}

/**
 * Deja `car_images` igual a `images` (mismo orden) mediante diff, sin borrar
 * filas físicamente: reutiliza/actualiza las que siguen, inserta las nuevas y
 * da de baja (soft) las que ya no están. `storage_path` identifica cada foto
 * (es único por la UUID del archivo).
 */
async function syncCarImages (supabase: any, dealerId: string, carId: string, images: string[]): Promise<void> {
  const { data: existing, error: exErr } = await supabase
    .from('car_images')
    .select('id, storage_path, is_active')
    .eq('car_id', carId)
    .eq('dealer_id', dealerId)
  if (exErr) throw exErr

  const byPath = new Map<string, any>((existing ?? []).map((r: any) => [r.storage_path, r]))
  const keep = new Set(images)

  // Reactivar/actualizar posición de las que siguen; insertar las nuevas.
  for (let position = 0; position < images.length; position++) {
    const path = images[position]
    const row = byPath.get(path)
    if (row) {
      const { error } = await supabase
        .from('car_images')
        .update({ position, is_active: true, record_status: 'active', deleted_at: null })
        .eq('id', row.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('car_images')
        .insert({ car_id: carId, dealer_id: dealerId, storage_path: path, position })
      if (error) throw error
    }
  }

  // Dar de baja (soft) las activas que ya no están en la lista.
  const toRemove = (existing ?? []).filter((r: any) => r.is_active && !keep.has(r.storage_path)).map((r: any) => r.id)
  if (toRemove.length > 0) {
    const { error } = await supabase.from('car_images').update(softDeletePatch()).in('id', toRemove)
    if (error) throw error
  }
}

/** Relee el auto con sus imágenes ya sincronizadas. */
async function reloadCar (supabase: any, dealerId: string, carId: string): Promise<Car> {
  const { data, error } = await supabase
    .from('cars')
    .select('*, car_images(*)')
    .eq('id', carId)
    .eq('dealer_id', dealerId)
    .single()
  if (error) throw error
  return rowToCar(data)
}

export async function createCar (dealerId: string, input: CarInput): Promise<Car> {
  const supabase = await createClient()
  const slug = await uniqueSlug(supabase, dealerId, input)
  const { data, error } = await supabase
    .from('cars')
    .insert({ dealer_id: dealerId, slug, ...toRow(input) })
    .select('id')
    .single()
  if (error) throw error

  await syncCarImages(supabase, dealerId, data.id, input.images ?? [])
  return reloadCar(supabase, dealerId, data.id)
}

export async function updateCar (dealerId: string, carId: string, input: CarInput): Promise<Car> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cars')
    .update(toRow(input))
    .eq('id', carId)
    .eq('dealer_id', dealerId)
  if (error) throw error

  await syncCarImages(supabase, dealerId, carId, input.images ?? [])
  return reloadCar(supabase, dealerId, carId)
}

/**
 * Baja lógica del auto (no se borra la fila). Marca el auto y sus fotos como
 * inactivos; el storage NO se toca (los archivos se conservan). El slug queda
 * libre para reusarse gracias al índice único parcial.
 */
export async function deleteCar (dealerId: string, carId: string): Promise<void> {
  const supabase = await createClient()
  const patch = softDeletePatch()

  const { error } = await supabase.from('cars').update(patch).eq('id', carId).eq('dealer_id', dealerId)
  if (error) throw error

  const { error: imgErr } = await supabase
    .from('car_images')
    .update(patch)
    .eq('car_id', carId)
    .eq('dealer_id', dealerId)
    .eq('is_active', true)
  if (imgErr) throw imgErr
}

export async function setCarStatus (dealerId: string, carId: string, status: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('cars').update({ status }).eq('id', carId).eq('dealer_id', dealerId)
  if (error) throw error
}
