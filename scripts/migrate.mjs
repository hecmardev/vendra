/**
 * Aplica las migraciones SQL contra la base que apunte SUPABASE_DB_URL y lleva
 * registro de lo que ya corrió.
 *
 *   pnpm db:migrate -- --status   # qué está aplicado y qué falta
 *   pnpm db:migrate               # aplica solo las pendientes
 *   pnpm db:migrate -- --all      # reaplica todas (son idempotentes)
 *   pnpm db:migrate -- --only 0005
 *
 * El registro vive en la tabla `migrations.applied`, en un esquema propio y no
 * en `public`, para que PostgREST no la exponga por la API.
 *
 * Cada archivo se guarda con el sha256 de su contenido. Si una migración ya
 * aplicada cambia después, aparece como CAMBIADA en vez de aplicada: editar una
 * migración vieja no la vuelve a correr sola en las bases que ya la tenían.
 *
 * Necesita `psql` (viene con libpq):
 *   brew install libpq
 *   echo 'export PATH="/usr/local/opt/libpq/bin:$PATH"' >> ~/.zshrc
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
 * psql del PATH, o el de libpq si brew no lo enlazó (es keg-only). Se prueban
 * los dos prefijos de Homebrew: /usr/local en Intel, /opt/homebrew en Apple
 * Silicon.
 */
function findPsql () {
  if (spawnSync('psql', ['--version']).status === 0) return 'psql'
  for (const p of ['/usr/local/opt/libpq/bin/psql', '/opt/homebrew/opt/libpq/bin/psql']) {
    if (existsSync(p)) return p
  }
  throw new Error('No se encontró psql. Instálalo con:  brew install libpq')
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

// La cadena trae la contraseña: se muestra solo el host para saber a qué base va.
const host = url.replace(/^.*@/, '').replace(/\/.*$/, '')
console.log(`Base: ${host}\n`)

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

console.log(`\nAplicando ${aCorrer.length}:`)
for (const r of aCorrer) {
  process.stdout.write(`  ${r.f} ... `)
  // ON_ERROR_STOP=1: si una sentencia falla, psql aborta con código != 0 en vez
  // de seguir con las siguientes y dejar la migración a medias.
  const res = spawnSync(psql, ['-v', 'ON_ERROR_STOP=1', '-q', '-f', join(DIR, r.f), url], {
    stdio: ['ignore', 'inherit', 'inherit']
  })
  if (res.status !== 0) {
    console.error(`\n✗ Falló ${r.f}. Se detiene aquí; las anteriores ya quedaron registradas.`)
    process.exit(res.status ?? 1)
  }
  query(`
    insert into migrations.applied (name, checksum)
    values ('${r.f}', '${r.checksum}')
    on conflict (name) do update set checksum = excluded.checksum, applied_at = now();
  `)
  console.log('ok')
}

console.log('\nListo.')
