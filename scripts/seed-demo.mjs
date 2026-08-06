/**
 * Siembra un dealer demo + autos para desarrollo.
 * Correr:  node --env-file=.env scripts/seed-demo.mjs
 * Idempotente: upsert del dealer por dominio y reemplaza sus autos.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

const photo = (id) => `https://images.unsplash.com/photo-${id}?w=640&h=480&fit=crop&q=80`

const CARS = [
  { slug: 'mazda-cx-5-grand-touring-2022', brand: 'Mazda', model: 'CX-5 Grand Touring', year: 2022, price: 449900, mileage: 38000, transmission: 'Automática', fuel: 'Gasolina', color: 'Gris Meteoro', body_type: 'SUV', location: 'CDMX', status: 'disponible', img: '1552519507-da3b142c6e3d' },
  { slug: 'toyota-corolla-le-2021', brand: 'Toyota', model: 'Corolla LE', year: 2021, price: 329900, mileage: 52000, transmission: 'CVT', fuel: 'Gasolina', color: 'Blanco', body_type: 'Sedán', location: 'CDMX', status: 'disponible', img: '1494976388531-d1058494cdd8' },
  { slug: 'ford-ranger-xlt-4x4-2023', brand: 'Ford', model: 'Ranger XLT 4x4', year: 2023, price: 689900, mileage: 21000, transmission: 'Automática', fuel: 'Diésel', color: 'Azul', body_type: 'Pickup', location: 'Estado de México', status: 'disponible', img: '1533473359331-0135ef1b58bf' },
  { slug: 'honda-civic-turbo-2020', brand: 'Honda', model: 'Civic Turbo', year: 2020, price: 358000, mileage: 61000, transmission: 'Automática', fuel: 'Gasolina', color: 'Rojo', body_type: 'Sedán', location: 'CDMX', status: 'apartado', img: '1550355291-bbee04a92027' },
  { slug: 'nissan-kicks-advance-2022', brand: 'Nissan', model: 'Kicks Advance', year: 2022, price: 379900, mileage: 29000, transmission: 'CVT', fuel: 'Gasolina', color: 'Naranja', body_type: 'SUV', location: 'CDMX', status: 'disponible', img: '1502877338535-766e1452684a' },
  { slug: 'volkswagen-jetta-highline-2021', brand: 'Volkswagen', model: 'Jetta Highline', year: 2021, price: 399000, mileage: 44000, transmission: 'Automática', fuel: 'Gasolina', color: 'Plata', body_type: 'Sedán', location: 'Puebla', status: 'disponible', img: '1503376780353-7e6692767b70' }
]

// 1) Dealer (upsert por dominio) — demo.localhost para verlo en dev.
const { data: dealer, error: dErr } = await admin
  .from('dealers')
  .upsert({ domain: 'demo.localhost', name: 'AutosDemo', whatsapp_number: '5215555555555' }, { onConflict: 'domain' })
  .select()
  .single()
if (dErr) throw dErr
console.log('✓ Dealer:', dealer.id, dealer.domain)

// 2) Reemplazar sus autos (idempotente)
await admin.from('cars').delete().eq('dealer_id', dealer.id)

for (const c of CARS) {
  const { data: car, error: cErr } = await admin
    .from('cars')
    .insert({
      dealer_id: dealer.id, slug: c.slug, brand: c.brand, model: c.model, year: c.year,
      price: c.price, mileage: c.mileage, transmission: c.transmission, fuel: c.fuel,
      color: c.color, body_type: c.body_type, location: c.location, status: c.status
    })
    .select()
    .single()
  if (cErr) throw cErr
  const { error: iErr } = await admin
    .from('car_images')
    .insert({ car_id: car.id, dealer_id: dealer.id, storage_path: photo(c.img), position: 0 })
  if (iErr) throw iErr
}
console.log(`✓ ${CARS.length} autos sembrados`)
console.log('\nDEV_DEALER_ID (opcional) =', dealer.id)
