/**
 * Onboarding de un dealer (MVP, sin panel /admin).
 * En una corrida: crea la fila en `dealers`, el usuario de Supabase Auth y el
 * `profiles` que lo liga. Idempotente por `domain` y `email`.
 *
 * Uso:
 *   pnpm dealer:create -- --name "AutosMX" --domain autosmx.com --email dueno@autosmx.com
 *   (agrega --password "Secreta123!" para dejarlo listo; si no, se envía invitación)
 *
 * Lee las llaves de .env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
 */
import { createClient } from '@supabase/supabase-js'

function arg (flag: string): string | undefined {
  const i = process.argv.indexOf(`--${flag}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

async function main () {
  const name = arg('name')
  const domain = arg('domain')
  const email = arg('email')
  const password = arg('password') // opcional: si falta, se envía invitación

  if (!name || !domain || !email) {
    throw new Error('Faltan args: --name --domain --email [--password]')
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // 1) Dealer. Rechaza si el dominio ya lo usa un dealer activo (el unique de
  //    domain ahora es un índice parcial where is_active, así que no hay upsert).
  const { data: clash } = await admin.from('dealers').select('id').eq('domain', domain).eq('is_active', true).maybeSingle()
  if (clash) throw new Error(`El dominio ${domain} ya está en uso por otro dealer.`)

  const { data: dealer, error: dErr } = await admin
    .from('dealers')
    .insert({ name, domain })
    .select()
    .single()
  if (dErr) throw dErr

  // 2) Usuario Auth. Con --password queda listo para entrar; sin él se invita.
  //    Si el correo ya existe, se recupera su id en vez de fallar (idempotencia).
  let userId: string | undefined
  let invited = false

  if (password) {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
    if (error && !/already|registered|exists/i.test(error.message)) throw error
    userId = data?.user?.id
  } else {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email)
    if (error && !/already|registered|exists/i.test(error.message)) throw error
    userId = data?.user?.id
    invited = Boolean(userId)
  }

  if (!userId) {
    // Ya existía: lo buscamos por correo.
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (error) throw error
    userId = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id
  }
  if (!userId) throw new Error(`No se pudo crear ni encontrar el usuario ${email}`)

  // 3) Profile que liga user -> dealer.
  const { error: pErr } = await admin
    .from('profiles')
    .upsert({ user_id: userId, dealer_id: dealer.id, role: 'owner' })
  if (pErr) throw pErr

  console.log(`✓ Dealer "${name}" (${domain})`)
  console.log(`  dealer_id: ${dealer.id}`)
  console.log(`  acceso:    ${email}${password ? ` / ${password}` : invited ? ' (invitación enviada)' : ' (usuario ya existente)'}`)
  console.log('\nFalta fuera del código: apuntar el dominio a Vercel (CNAME).')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
