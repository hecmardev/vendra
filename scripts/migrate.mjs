/**
 * Aplica las migraciones SQL contra la base que apunte SUPABASE_DB_URL y lleva
 * registro de lo que ya corrió.
 *
 *   pnpm db:migrate -- --status   # qué está aplicado y qué falta
 *   pnpm db:migrate               # aplica solo las pendientes
 *   pnpm db:migrate -- --all      # reaplica todas (son idempotentes)
 *   pnpm db:migrate -- --only 0005
 *
 * Producción (lee .env.prod.local y exige --prod para escribir):
 *   node --env-file=.env.prod.local scripts/migrate.mjs --status
 *   node --env-file=.env.prod.local scripts/migrate.mjs --prod
 *
 * Cada migración corre en UNA transacción junto con su registro: si falla,
 * no queda nada a medias ni registrada como aplicada. La excepción son las que
 * agregan un valor a un enum (`alter type … add value`), porque Postgres no
 * deja usar ese valor dentro de la misma transacción que lo crea.
 *
 * El registro vive en la tabla `migrations.applied`, en un esquema propio y no
 * en `public`, para que PostgREST no la exponga por la API.
 *
 * Cada archivo se guarda con el sha256 de su contenido. Si una migración ya
 * aplicada cambia después, aparece como CAMBIADA en vez de aplicada: editar una
 * migración vieja no la vuelve a correr sola en las bases que ya la tenían.
 *
 * Necesita `psql`:
 *   Ubuntu / WSL:  apt install postgresql-client
 *   macOS:         brew install libpq
 *                  echo 'export PATH="/usr/local/opt/libpq/bin:$PATH"' >> ~/.zshrc
 *
 * La cadena de conexión sale del dashboard de Supabase → Connect → Session
 * pooler. Va en .env como SUPABASE_DB_URL y NUNCA se commitea.
 *
 * Ver docs/entornos-qa-prod.md
 */
import { readdirSync, existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

const DIR = 'supabase/migrations'
const arg = (f) => {
  const i = process.argv.indexOf(`--${f}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const has = (f) => process.argv.includes(`--${f}`)

const url = process.env.SUPABASE_DB_URL
if (!url) {
  throw new Error(
    'Falta SUPABASE_DB_URL en .env.\n' +
    'Sácala del dashboard de Supabase → Connect → Session pooler.'
  )
}

/**
 * Red de seguridad: la cadena de Postgres y la URL de la API tienen que apuntar
 * al MISMO proyecto. Así no se migra producción teniendo el .env de QA (ni al
 * revés) por haber copiado una cadena de otro lado. `--force` lo salta.
 */
const refApi = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').match(/https:\/\/([^.]+)\./)?.[1]
const refDb = url.match(/:\/\/postgres\.([^:]+):/)?.[1]
if (refApi && refDb && refApi !== refDb && !has('force')) {
  throw new Error(
    'ABORTADO: la base y la API son proyectos distintos.\n' +
    `  SUPABASE_DB_URL          -> ${refDb}\n` +
    `  NEXT_PUBLIC_SUPABASE_URL -> ${refApi}\n` +
    'Revisa el .env. Si de verdad es lo que quieres, agrega --force.'
  )
}

/**
 * Qué ambiente es. El host del pooler no sirve para saberlo: QA y producción
 * están en la misma región y comparten host. Lo que los distingue es el dominio
 * de plataforma de cada .env (ver docs/entornos-qa-prod.md).
 */
const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? ''
const ENV = baseDomain === 'vendra.com.mx'
  ? 'PRODUCCIÓN'
  : baseDomain.includes('test') ? 'QA' : `otro (${baseDomain || 'sin NEXT_PUBLIC_BASE_DOMAIN'})`
const IS_PROD = ENV === 'PRODUCCIÓN'
const envFile = process.execArgv.find((a) => a.startsWith('--env-file'))?.split('=')[1] ?? '?'

/**
 * psql del PATH, o el de libpq si brew no lo enlazó (es keg-only). Se prueban
 * los dos prefijos de Homebrew: /usr/local en Intel, /opt/homebrew en Apple
 * Silicon.
 */
function findPsql () {
  if (spawnSync('psql', ['--version']).status === 0) return 'psql'
  for (const p of ['/usr/local/opt/libpq/bin/psql', '/opt/homebrew/opt/libpq/bin/psql']) {
    if (existsSync(p)) return p
  }
  throw new Error(
    'No se encontró psql. Instálalo con:\n' +
    '  Ubuntu / WSL:  apt install postgresql-client\n' +
    '  macOS:         brew install libpq'
  )
}

const psql = findPsql()

/** Corre SQL y devuelve stdout en crudo. Lanza si psql falla. */
function query (sql) {
  const res = spawnSync(psql, ['-v', 'ON_ERROR_STOP=1', '-t', '-A', '-F', '\t', '-c', sql, url], {
    encoding: 'utf8'
  })
  if (res.status !== 0) throw new Error(res.stderr?.trim() || 'psql falló')
  return res.stdout.trim()
}

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16)

// --- Estado ------------------------------------------------------------------

query(`
  create schema if not exists migrations;
  create table if not exists migrations.applied (
    name       text primary key,
    checksum   text not null,
    applied_at timestamptz not null default now()
  );
`)

const applied = new Map(
  query('select name, checksum, applied_at from migrations.applied order by name')
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const [name, checksum, at] = l.split('\t')
      return [name, { checksum, at }]
    })
)

const only = arg('only')
const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.sql'))
  .filter((f) => !only || f.startsWith(only))
  .sort()

const rows = files.map((f) => {
  const checksum = sha(readFileSync(join(DIR, f), 'utf8'))
  const prev = applied.get(f)
  const state = !prev ? 'PENDIENTE' : prev.checksum !== checksum ? 'CAMBIADA' : 'aplicada'
  return { f, checksum, state, at: prev?.at }
})

// La cadena trae la contraseña: se muestra solo el host y el proyecto.
const host = url.replace(/^.*@/, '').replace(/\/.*$/, '')
console.log(`Base:     ${host}`)
console.log(`Proyecto: ${refDb ?? '?'}  ·  ${ENV}  ·  ${envFile}`)
if (IS_PROD) console.log('\n  ⚠  ESTO ES PRODUCCIÓN')
console.log()

for (const r of rows) {
  const when = r.at ? r.at.slice(0, 16).replace('T', ' ') : ''
  console.log(`  ${r.state.padEnd(10)} ${r.f.padEnd(38)} ${when}`)
}

const pendientes = rows.filter((r) => r.state !== 'aplicada')

if (has('status')) {
  console.log(pendientes.length
    ? `\n${pendientes.length} sin aplicar.`
    : '\nTodo al día.')
  process.exit(0)
}

// Todo lo que sigue escribe en la base. En producción se pide decirlo
// explícitamente: un `pnpm db:migrate` con el .env equivocado no debe bastar.
if (IS_PROD && !has('prod')) {
  console.error(
    '\nABORTADO: esta base es PRODUCCIÓN y no se pasó --prod.\n' +
    'Revisa el --status de arriba y, si es lo que quieres, vuelve a correrlo con --prod.'
  )
  process.exit(1)
}

// --- Baseline ----------------------------------------------------------------

/**
 * Marca como aplicadas, SIN ejecutarlas, todas las migraciones hasta la que se
 * indique. Es para adoptar el registro en una base que ya venía migrada a mano:
 * la 0001 y la 0002 crean políticas sin borrarlas antes, así que reaplicarlas
 * fallaría con "policy already exists".
 *
 *   pnpm db:migrate -- --baseline 0004
 *
 * En una base nueva NO se usa: ahí todo se aplica de verdad.
 */
const baseline = arg('baseline')
if (baseline) {
  const hasta = rows.filter((r) => r.f.slice(0, baseline.length) <= baseline)
  if (hasta.length === 0) {
    console.log(`\nNinguna migración llega hasta "${baseline}".`)
    process.exit(1)
  }
  console.log(`\nMarcando como aplicadas (sin ejecutar):`)
  for (const r of hasta) {
    query(`
      insert into migrations.applied (name, checksum)
      values ('${r.f}', '${r.checksum}')
      on conflict (name) do update set checksum = excluded.checksum;
    `)
    console.log(`  ${r.f}`)
  }
  console.log('\nListo. Corre `pnpm db:migrate -- --status` para ver cómo quedó.')
  process.exit(0)
}

// --- Aplicación --------------------------------------------------------------

const aCorrer = has('all') ? rows : pendientes
if (aCorrer.length === 0) {
  console.log('\nNada que aplicar.')
  process.exit(0)
}

// `alter type … add value` no puede ir en la misma transacción que use el valor
// nuevo (la 0007 lo agrega y lo pone de default). Esas corren sin transacción,
// como antes. Se detecta por el contenido para no tener que marcar los archivos:
// editar una migración ya aplicada la dejaría como CAMBIADA.
const ENUM_ADD = /alter\s+type\s+\S+\s+add\s+value/i

console.log(`\nAplicando ${aCorrer.length}:`)
for (const r of aCorrer) {
  process.stdout.write(`  ${r.f} ... `)
  const atomic = !ENUM_ADD.test(readFileSync(join(DIR, r.f), 'utf8'))
  const record = `
    insert into migrations.applied (name, checksum)
    values ('${r.f}', '${r.checksum}')
    on conflict (name) do update set checksum = excluded.checksum, applied_at = now();
  `
  // ON_ERROR_STOP=1: psql aborta en la primera sentencia que falle.
  // --single-transaction: el archivo Y su registro van juntos en una
  // transacción, así que un fallo deshace todo y la migración sigue PENDIENTE.
  const args = atomic
    ? ['-v', 'ON_ERROR_STOP=1', '-q', '--single-transaction', '-f', join(DIR, r.f), '-c', record, url]
    : ['-v', 'ON_ERROR_STOP=1', '-q', '-f', join(DIR, r.f), url]
  const res = spawnSync(psql, args, { stdio: ['ignore', 'inherit', 'inherit'] })
  if (res.status !== 0) {
    console.error(atomic
      ? `\n✗ Falló ${r.f}. Se deshizo completa y sigue PENDIENTE; las anteriores ya quedaron aplicadas.`
      : `\n✗ Falló ${r.f} (corre sin transacción: puede haber quedado a medias). Las anteriores ya quedaron aplicadas.`)
    process.exit(res.status ?? 1)
  }
  if (!atomic) query(record)
  console.log(atomic ? 'ok' : 'ok (sin transacción: agrega un valor a un enum)')
}

console.log('\nListo.')
