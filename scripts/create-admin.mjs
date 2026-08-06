/**
 * Crea (o actualiza la contraseña de) un usuario admin de PLATAFORMA.
 * El correo además debe estar en PLATFORM_ADMIN_EMAILS para que el /admin lo deje entrar.
 *
 *   node --env-file=.env scripts/create-admin.mjs --email admin@vendra.mx --password "Secreta123!"
 *
 * Idempotente.
 */
import { createClient } from '@supabase/supabase-js'

const arg = (f) => {
  const i = process.argv.indexOf(`--${f}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

const email = arg('email')
const password = arg('password')
if (!email || !password) {
  console.error('Uso: --email <correo> --password <contraseña>')
  process.exit(1)
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

const created = await admin.auth.admin.createUser({ email, password, email_confirm: true })

if (created.error) {
  if (!/already|registered|exists/i.test(created.error.message)) throw created.error
  // Ya existía: le reseteamos la contraseña para dejarlo utilizable.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) throw new Error(`No se encontró ${email}`)
  const upd = await admin.auth.admin.updateUserById(user.id, { password })
  if (upd.error) throw upd.error
  console.log(`✓ Admin ya existía; contraseña actualizada: ${email}`)
} else {
  console.log(`✓ Admin creado: ${email}`)
}

console.log(`\nAgrega el correo a PLATFORM_ADMIN_EMAILS en .env.local y entra en /admin/login`)
