/**
 * Crea el usuario de acceso del dealer demo + lo liga (profiles) + siembra leads.
 * Correr:  node --env-file=.env scripts/create-user.mjs
 * Idempotente.
 */
import { createClient } from '@supabase/supabase-js'

const EMAIL = 'dealer@demo.mx'
const PASSWORD = 'Vendra1234!'
const DOMAIN = 'demo.localhost'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

// 1) Dealer
const { data: dealer, error: dErr } = await admin.from('dealers').select('id').eq('domain', DOMAIN).maybeSingle()
if (dErr) throw dErr
if (!dealer) throw new Error(`No existe el dealer ${DOMAIN}. Corre primero seed-demo.mjs`)

// 2) Usuario (crear o recuperar si ya existe)
let userId
const created = await admin.auth.admin.createUser({ email: EMAIL, password: PASSWORD, email_confirm: true })
if (created.error) {
  if (!/already/i.test(created.error.message)) throw created.error
  const list = await admin.auth.admin.listUsers()
  userId = list.data.users.find((u) => u.email === EMAIL)?.id
} else {
  userId = created.data.user.id
}
if (!userId) throw new Error('No se obtuvo user id')

// 3) Profile (liga user -> dealer)
const { error: pErr } = await admin.from('profiles').upsert({ user_id: userId, dealer_id: dealer.id, role: 'owner' })
if (pErr) throw pErr
console.log('✓ Usuario ligado:', EMAIL, '->', dealer.id)

// 4) Leads de ejemplo (idempotente: borra y re-inserta)
const { data: cars } = await admin.from('cars').select('id, brand, model').eq('dealer_id', dealer.id).limit(3)
await admin.from('leads').delete().eq('dealer_id', dealer.id)
const LEADS = [
  { name: 'Ana Ramírez', phone: '55 1234 5678', email: 'ana@correo.com', status: 'nuevo', car_id: cars?.[0]?.id ?? null },
  { name: 'Carlos Méndez', phone: '55 8765 4321', email: 'carlos@correo.com', status: 'nuevo', car_id: cars?.[1]?.id ?? null },
  { name: 'Laura Torres', phone: '55 2222 3333', email: null, status: 'contactado', car_id: cars?.[2]?.id ?? null }
]
const { error: lErr } = await admin.from('leads').insert(LEADS.map((l) => ({ ...l, dealer_id: dealer.id, source: 'web_form' })))
if (lErr) throw lErr
console.log('✓ 3 leads sembrados')

console.log(`\n=== Credenciales de acceso ===\nCorreo:      ${EMAIL}\nContraseña:  ${PASSWORD}`)
