/**
 * Siembra el ambiente de QA completo y reproducible: admin de plataforma,
 * dealer demo con su usuario, autos con fotos y leads de ejemplo.
 *
 *   node --env-file=.env scripts/seed-qa.mjs            # siembra (idempotente)
 *   node --env-file=.env scripts/seed-qa.mjs --reset    # borra TODO y siembra
 *   node --env-file=.env scripts/seed-qa.mjs --local    # + dealer demo.localhost
 *
 * Idempotente: sin --reset, reemplaza los autos y leads del dealer pero respeta
 * lo demás. Con --reset deja la base como recién migrada.
 *
 * Config por variables de entorno (ver .env.example). Las contraseñas NO se
 * hardcodean aquí: viven en .env, que está fuera de git.
 *
 * Ver docs/entornos-qa-prod.md
 */
import { createClient } from '@supabase/supabase-js'

const FLAGS = ['reset', 'local', 'force']
const has = (f) => process.argv.includes(`--${f}`)

// Una bandera mal escrita no puede pasar desapercibida: este script REEMPLAZA
// los autos y leads del dealer, así que un `--locla` que se ignore en silencio
// se lleva por delante datos de prueba que costó trabajo generar.
// El `--` suelto lo agrega pnpm como separador; no es una bandera.
const desconocidas = process.argv
  .slice(2)
  .filter((a) => a !== '--' && a.startsWith('--') && !FLAGS.includes(a.slice(2)))
if (desconocidas.length) {
  throw new Error(
    `Bandera no reconocida: ${desconocidas.join(', ')}\n` +
    `Las válidas son: ${FLAGS.map((f) => '--' + f).join(', ')}`
  )
}

const RESET = has('reset')
const FORCE = has('force')
const LOCAL = has('local')

const cfg = {
  adminEmail: process.env.QA_ADMIN_EMAIL ?? 'admin@vendra.com.mx',
  adminPassword: process.env.QA_ADMIN_PASSWORD,
  dealerName: process.env.QA_DEALER_NAME ?? 'AutosDemo',
  dealerDomain: process.env.QA_DEALER_DOMAIN ?? 'demo.test.vendra.com.mx',
  dealerEmail: process.env.QA_DEALER_EMAIL ?? 'demo@vendra.com.mx',
  dealerPassword: process.env.QA_DEALER_PASSWORD,
  // Dealer solo para desarrollo local (--local). *.localhost lo resuelve el
  // navegador a 127.0.0.1 sin tocar /etc/hosts.
  localDomain: process.env.QA_LOCAL_DOMAIN ?? 'demo.localhost',
  localEmail: process.env.QA_LOCAL_EMAIL ?? 'local@vendra.com.mx'
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
if (!cfg.adminPassword || !cfg.dealerPassword) {
  throw new Error('Faltan QA_ADMIN_PASSWORD / QA_DEALER_PASSWORD en .env')
}

// Red de seguridad: --reset borra la base entera. Si el dominio del dealer no
// parece de QA, se aborta salvo --force. Evita apuntarle a producción por error.
if (RESET && !cfg.dealerDomain.includes('test') && !FORCE) {
  throw new Error(
    `ABORTADO: --reset sobre "${cfg.dealerDomain}", que no parece un dominio de QA.\n` +
    'Si de verdad es lo que quieres, agrega --force.'
  )
}

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

const LEADS = [
  { name: 'Laura Sandoval', phone: '5551234567', email: 'laura@example.mx', message: '¿Sigue disponible? Me interesa verlo el sábado.', source: 'web_form', status: 'nuevo', carSlug: 'mazda-cx-5-grand-touring-2022' },
  { name: 'Miguel Ortega', phone: '5559876543', email: 'miguel@example.mx', message: 'Quiero saber si aceptan auto a cuenta.', source: 'apartado', status: 'contactado', carSlug: 'ford-ranger-xlt-4x4-2023' },
  { name: 'Paty Ruiz', phone: '5555550000', email: null, message: 'Información de financiamiento por favor.', source: 'web_form', status: 'nuevo', carSlug: null }
]

/** Borra todo: Storage, tablas de negocio y usuarios de Auth. */
async function reset () {
  const { data: buckets } = await admin.storage.listBuckets()
  for (const b of buckets ?? []) {
    const paths = []
    const walk = async (prefix) => {
      const { data } = await admin.storage.from(b.name).list(prefix, { limit: 1000 })
      for (const entry of data ?? []) {
        const full = prefix ? `${prefix}/${entry.name}` : entry.name
        if (entry.id) paths.push(full)
        else await walk(full) // es carpeta
      }
    }
    await walk('')
    if (paths.length) {
      await admin.storage.from(b.name).remove(paths)
      console.log(`  storage/${b.name}: ${paths.length} archivos borrados`)
    }
  }

  for (const t of ['car_images', 'cars', 'leads', 'dealer_features', 'profiles', 'dealers']) {
    const pk = t === 'profiles' ? 'user_id' : t === 'dealer_features' ? 'dealer_id' : 'id'
    const { error } = await admin.from(t).delete().not(pk, 'is', null)
    if (error) throw error
    console.log(`  ${t}: vaciada`)
  }

  const { data: users } = await admin.auth.admin.listUsers()
  for (const u of users.users) await admin.auth.admin.deleteUser(u.id)
  console.log(`  auth.users: ${users.users.length} borrados`)
}

/** Crea el usuario o le resetea la contraseña si ya existe. Devuelve su id. */
async function upsertUser (email, password) {
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (!created.error) return created.data.user.id

  if (!/already|registered|exists/i.test(created.error.message)) throw created.error
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) throw new Error(`No se encontró ${email}`)
  const upd = await admin.auth.admin.updateUserById(user.id, { password })
  if (upd.error) throw upd.error
  return user.id
}

// --- Siembra de un dealer ----------------------------------------------------

/**
 * Deja un dealer completo: fila, usuario dueño, autos con foto y leads. Los
 * autos y leads se reemplazan, así que volver a correrlo no duplica nada.
 */
async function seedDealer ({ name, domain, email, password }) {
  // No se puede upsert por dominio: la migración 0003 cambió el UNIQUE de
  // `domain` por un índice parcial (where is_active) y ON CONFLICT no aplica
  // sobre índices parciales. Se busca primero y se inserta o actualiza.
  const fields = { domain, name, whatsapp_number: '5215555555555' }
  const { data: existing } = await admin
    .from('dealers')
    .select('id')
    .eq('domain', domain)
    .eq('is_active', true)
    .maybeSingle()

  const q = existing
    ? admin.from('dealers').update(fields).eq('id', existing.id)
    : admin.from('dealers').insert(fields)
  const { data: dealer, error: dErr } = await q.select().single()
  if (dErr) throw dErr
  console.log(`✓ Dealer: ${dealer.name} (${dealer.domain})`)

  // Usuario dueño + profile. Se revive el perfil por si el correo venía de un
  // dealer dado de baja: un upsert sin estos campos heredaría record_status
  // 'deleted' y el dueño no podría entrar al panel.
  const userId = await upsertUser(email, password)
  const { error: pErr } = await admin
    .from('profiles')
    .upsert({
      user_id: userId,
      dealer_id: dealer.id,
      role: 'owner',
      is_active: true,
      record_status: 'active',
      deleted_at: null
    })
  if (pErr) throw pErr
  console.log(`✓ Usuario del dealer: ${email}`)

  await admin.from('cars').delete().eq('dealer_id', dealer.id)
  const carsBySlug = {}
  for (const c of CARS) {
    const { img, ...carFields } = c
    const { data: car, error } = await admin
      .from('cars')
      .insert({ dealer_id: dealer.id, ...carFields })
      .select()
      .single()
    if (error) throw error
    carsBySlug[c.slug] = car.id
    const { error: iErr } = await admin
      .from('car_images')
      .insert({ car_id: car.id, dealer_id: dealer.id, storage_path: photo(img), position: 0 })
    if (iErr) throw iErr
  }
  console.log(`✓ ${CARS.length} autos con foto`)

  await admin.from('leads').delete().eq('dealer_id', dealer.id)
  for (const l of LEADS) {
    const { carSlug, ...leadFields } = l
    const { error } = await admin
      .from('leads')
      .insert({ dealer_id: dealer.id, car_id: carSlug ? carsBySlug[carSlug] : null, ...leadFields })
    if (error) throw error
  }
  console.log(`✓ ${LEADS.length} leads`)

  // Módulo de financiamiento prendido, para que la ficha muestre la calculadora.
  const { error: fErr } = await admin
    .from('dealer_features')
    .upsert({ dealer_id: dealer.id, key: 'financiamiento', enabled: true })
  if (fErr) throw fErr

  return dealer
}

// --- Ejecución ---------------------------------------------------------------

console.log(`Supabase: ${url}`)
console.log(`Dealer:   ${cfg.dealerDomain}\n`)

if (RESET) {
  console.log('— Reset —')
  await reset()
  console.log()
}

// Admin de plataforma. Debe estar en PLATFORM_ADMIN_EMAILS para entrar a /admin.
await upsertUser(cfg.adminEmail, cfg.adminPassword)
console.log(`✓ Admin: ${cfg.adminEmail}`)

const allowed = (process.env.PLATFORM_ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
if (!allowed.includes(cfg.adminEmail.toLowerCase())) {
  console.log(`  ⚠ ${cfg.adminEmail} NO está en PLATFORM_ADMIN_EMAILS — /admin lo va a rechazar`)
}

await seedDealer({
  name: cfg.dealerName,
  domain: cfg.dealerDomain,
  email: cfg.dealerEmail,
  password: cfg.dealerPassword
})

// Dealer extra para desarrollo local. Los navegadores resuelven cualquier
// *.localhost a 127.0.0.1 solos, así que no hace falta tocar /etc/hosts ni
// perder acceso al dominio desplegado.
if (LOCAL) {
  console.log()
  await seedDealer({
    name: `${cfg.dealerName} (local)`,
    domain: cfg.localDomain,
    email: cfg.localEmail,
    password: cfg.dealerPassword
  })
}

console.log(`
Listo. Entra con:
  Plataforma  https://${(process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'test.vendra.com.mx')}/admin/login  -> ${cfg.adminEmail}
  Dealer      https://${cfg.dealerDomain}/dashboard/login  -> ${cfg.dealerEmail}` +
(LOCAL ? `
  Local       http://${cfg.localDomain}:3000/dashboard/login  -> ${cfg.localEmail}` : '') + '\n')
