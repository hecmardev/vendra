import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Operaciones de PLATAFORMA (superadmin). Usan la service-role key porque el
 * admin necesita ver y escribir datos de TODOS los dealers, cosa que la RLS
 * (pensada para aislar dealers entre sí) bloquea a propósito.
 *
 * Por eso toda función de escritura exige `requirePlatformAdmin()` primero.
 * Quién es admin se define hoy con PLATFORM_ADMIN_EMAILS; para escalar a varios
 * admins conviene mover eso a una tabla `platform_admins` y consultarla aquí,
 * sin tocar el resto de la app.
 */

export interface PlatformAdmin {
  id: string
  email: string
}

function allowedEmails (): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/** Admin de plataforma de la sesión actual, o null si no lo es. */
export async function getPlatformAdmin (): Promise<PlatformAdmin | null> {
  const allowed = allowedEmails()
  if (allowed.length === 0) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email?.toLowerCase()
  if (!user || !email || !allowed.includes(email)) return null

  return { id: user.id, email }
}

/** Igual que getPlatformAdmin pero lanza. Úsalo antes de cualquier escritura. */
async function requirePlatformAdmin (): Promise<PlatformAdmin> {
  const admin = await getPlatformAdmin()
  if (!admin) throw new Error('No autorizado')
  return admin
}

/* ---------- Lectura ---------- */

export interface DealerStats {
  id: string
  name: string
  domain: string
  whatsappNumber: string | null
  metaPixelId: string | null
  ga4MeasurementId: string | null
  createdAt: string
  isActive: boolean
  recordStatus: string
  cars: number
  carsAvailable: number
  leads: number
}

/** Todos los dealers con sus contadores de autos y leads. */
export async function listDealersWithStats (): Promise<DealerStats[]> {
  await requirePlatformAdmin()
  const supabase = createAdminClient()

  // Se listan activos y suspendidos (no los eliminados). Los contadores solo
  // cuentan registros activos (autos/leads dados de baja no suman).
  const [dealersRes, carsRes, leadsRes] = await Promise.all([
    supabase.from('dealers').select('*').neq('record_status', 'deleted').order('created_at', { ascending: false }),
    supabase.from('cars').select('dealer_id, status').eq('is_active', true),
    supabase.from('leads').select('dealer_id').eq('is_active', true)
  ])
  if (dealersRes.error) throw dealersRes.error
  if (carsRes.error) throw carsRes.error
  if (leadsRes.error) throw leadsRes.error

  const cars = carsRes.data ?? []
  const leads = leadsRes.data ?? []

  return (dealersRes.data ?? []).map((d: any) => ({
    id: d.id,
    name: d.name,
    domain: d.domain,
    whatsappNumber: d.whatsapp_number ?? null,
    metaPixelId: d.meta_pixel_id ?? null,
    ga4MeasurementId: d.ga4_measurement_id ?? null,
    createdAt: d.created_at,
    isActive: d.is_active,
    recordStatus: d.record_status,
    cars: cars.filter((c: any) => c.dealer_id === d.id).length,
    carsAvailable: cars.filter((c: any) => c.dealer_id === d.id && c.status === 'disponible').length,
    leads: leads.filter((l: any) => l.dealer_id === d.id).length
  }))
}

/** Un dealer por id, con sus contadores. */
export async function getDealerStats (dealerId: string): Promise<DealerStats | null> {
  const all = await listDealersWithStats()
  return all.find((d) => d.id === dealerId) ?? null
}

/* ---------- Escritura ---------- */

export interface NewDealerInput {
  name: string
  domain: string
  email: string
  password: string
}

/**
 * Alta completa de un dealer: fila en `dealers`, usuario de Auth y `profiles`
 * que los liga. Rechaza si el dominio ya lo usa un dealer ACTIVO (evita
 * secuestrar un cliente existente por un typo). Un dominio que quedó libre por
 * baja lógica sí se puede reusar.
 */
export async function createDealerAccount (input: NewDealerInput): Promise<{ dealerId: string }> {
  await requirePlatformAdmin()
  const supabase = createAdminClient()

  const domain = input.domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
  const email = input.email.trim().toLowerCase()

  const { data: clash, error: clashErr } = await supabase
    .from('dealers')
    .select('id')
    .eq('domain', domain)
    .eq('is_active', true)
    .maybeSingle()
  if (clashErr) throw clashErr
  if (clash) throw new Error(`El dominio ${domain} ya está en uso por otro dealer.`)

  const { data: dealer, error: dErr } = await supabase
    .from('dealers')
    .insert({ name: input.name.trim(), domain })
    .select()
    .single()
  if (dErr) throw dErr

  let userId: string | undefined
  const created = await supabase.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true
  })
  if (created.error && !/already|registered|exists/i.test(created.error.message)) throw created.error
  userId = created.data?.user?.id

  if (!userId) {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (error) throw error
    userId = data.users.find((u) => u.email?.toLowerCase() === email)?.id
  }
  if (!userId) throw new Error(`No se pudo crear ni encontrar el usuario ${email}`)

  const { error: pErr } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, dealer_id: dealer.id, role: 'owner' })
  if (pErr) throw pErr

  return { dealerId: dealer.id }
}

export interface DealerAdminPatch {
  name: string
  domain: string
  whatsappNumber: string
  metaPixelId: string
  ga4MeasurementId: string
}

/** Edita los datos de cualquier dealer desde el panel de plataforma. */
export async function updateDealerAsAdmin (dealerId: string, patch: DealerAdminPatch): Promise<void> {
  await requirePlatformAdmin()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('dealers')
    .update({
      name: patch.name.trim(),
      domain: patch.domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, ''),
      whatsapp_number: patch.whatsappNumber.trim() || null,
      meta_pixel_id: patch.metaPixelId.trim() || null,
      ga4_measurement_id: patch.ga4MeasurementId.trim() || null
    })
    .eq('id', dealerId)
  if (error) throw error
}

/**
 * Baja lógica de un dealer y todo lo suyo. Como ya no hay ON DELETE CASCADE
 * (nada se borra), la baja se PROPAGA a mano a cars, car_images, leads y
 * profiles. El usuario de Auth queda (sin profile activo ya no puede entrar) y
 * el dominio queda libre para reusarse. No se puede deshacer desde el panel.
 */
export async function deleteDealerAccount (dealerId: string): Promise<void> {
  await requirePlatformAdmin()
  const supabase = createAdminClient()
  const patch = { is_active: false, record_status: 'deleted', deleted_at: new Date().toISOString() }

  // Hijos primero: si algo falla, el dealer sigue visible y se puede reintentar.
  for (const table of ['cars', 'car_images', 'leads', 'profiles']) {
    const { error } = await supabase.from(table).update(patch).eq('dealer_id', dealerId).eq('is_active', true)
    if (error) throw error
  }

  const { error } = await supabase.from('dealers').update(patch).eq('id', dealerId)
  if (error) throw error
}

/**
 * Suspende o reactiva un dealer (impago / reactivación). A diferencia de la
 * baja, NO toca a los hijos: solo apaga/enciende el dealer, así el estado de
 * cada auto y lead se conserva intacto al reactivar. La RLS y getCurrentDealer
 * ya cortan el acceso mientras esté suspendido.
 */
export async function setDealerActive (dealerId: string, active: boolean): Promise<void> {
  await requirePlatformAdmin()
  const supabase = createAdminClient()
  const patch = active
    ? { is_active: true, record_status: 'active', deleted_at: null }
    : { is_active: false, record_status: 'suspended', deleted_at: new Date().toISOString() }

  const { error } = await supabase.from('dealers').update(patch).eq('id', dealerId)
  if (error) throw error
}

/**
 * Restablece la contraseña del usuario dueño (owner) de un dealer. Lo usa el
 * admin cuando un dealer pierde su acceso: fija una contraseña temporal que
 * luego se le comparte. Requiere la service-role key (Auth Admin API).
 */
export async function resetDealerPassword (dealerId: string, newPassword: string): Promise<{ email: string }> {
  await requirePlatformAdmin()
  if (newPassword.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.')

  const supabase = createAdminClient()
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('dealer_id', dealerId)
    .eq('role', 'owner')
    .eq('is_active', true)
    .maybeSingle()
  if (pErr) throw pErr
  if (!profile) throw new Error('Este dealer no tiene un usuario dueño activo.')

  const { data, error } = await supabase.auth.admin.updateUserById(profile.user_id, { password: newPassword })
  if (error) throw error
  return { email: data.user?.email ?? '' }
}
