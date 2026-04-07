/**
 * inspect-db.mjs
 * Muestra el estado completo de la base de datos Supabase.
 *
 * Uso:
 *   node scripts/inspect-db.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Cargar .env.local ──────────────────────────────────────────
const envPath = resolve(__dirname, '../.env.local')
let SUPABASE_URL, SERVICE_ROLE_KEY

try {
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const k = trimmed.slice(0, eqIdx).trim()
    const v = trimmed.slice(eqIdx + 1).trim()
    if (k === 'NEXT_PUBLIC_SUPABASE_URL')  SUPABASE_URL     = v
    if (k === 'SUPABASE_SERVICE_ROLE_KEY') SERVICE_ROLE_KEY = v
  }
} catch {
  console.error('❌  No se encontró .env.local')
  process.exit(1)
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Faltan variables en .env.local')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const sep  = '═'.repeat(60)
const sep2 = '─'.repeat(60)

console.log('\n' + sep)
console.log('  INSPECT DB — Oveja Music World')
console.log('  ' + SUPABASE_URL)
console.log(sep + '\n')

// ── Helper: detectar columnas de una tabla ─────────────────────
async function getColumns(table) {
  const { data, error } = await db.from(table).select('*').limit(1)
  if (error) return null
  if (!data || data.length === 0) {
    // Tabla vacía — intentar insert vacío para ver el schema (no lo hacemos)
    return []
  }
  return Object.keys(data[0])
}

// ── 1. Usuarios ────────────────────────────────────────────────
console.log('👤  USUARIOS')
console.log(sep2)

const { data: users, error: usersErr } = await db
  .from('users')
  .select('id, email, nombre, role, nivel, puntos, cursos_acceso, clases_acceso, created_at')
  .order('created_at', { ascending: true })

if (usersErr) {
  // Intentar sin las columnas nuevas
  const { data: usersBasic, error: basicErr } = await db
    .from('users')
    .select('id, email, nombre, role, nivel, puntos, created_at')
    .order('created_at', { ascending: true })

  if (basicErr) {
    console.log('  ❌  Error al leer usuarios: ' + basicErr.message)
  } else {
    console.log(`  ⚠️  cursos_acceso/clases_acceso no existen todavía`)
    console.log(`  Total: ${usersBasic?.length ?? 0} usuario(s)\n`)
    printUsers(usersBasic, false)
  }
} else {
  const hasCursos = users?.[0] !== undefined
  console.log(`  Total: ${users?.length ?? 0} usuario(s)\n`)
  printUsers(users, true)
}

function printUsers(list, hasCursos) {
  if (!list?.length) { console.log('  (sin usuarios)\n'); return }
  list.forEach((u, i) => {
    const fecha = u.created_at
      ? new Date(u.created_at).toLocaleString('es-CL', { timeZone: 'America/Santiago' })
      : '—'
    console.log(`  [${i + 1}] ${u.nombre ?? '(sin nombre)'}`)
    console.log(`      Email  : ${u.email}`)
    console.log(`      ID     : ${u.id}`)
    console.log(`      Rol    : ${u.role ?? '—'}`)
    console.log(`      Nivel  : ${u.nivel ?? 0}   Puntos: ${u.puntos ?? 0}`)
    if (hasCursos) {
      const cursos = u.cursos_acceso?.length ? u.cursos_acceso.join(', ') : '(ninguno)'
      const clases = u.clases_acceso?.length ? u.clases_acceso.join(', ') : '(ninguno)'
      console.log(`      Cursos : ${cursos}`)
      console.log(`      Clases : ${clases}`)
    }
    console.log(`      Creado : ${fecha}`)
    console.log()
  })
}

// ── 2. Columnas detectadas en users ───────────────────────────
console.log(sep2)
console.log('📐  COLUMNAS DETECTADAS EN users')
console.log(sep2)

const userCols = await getColumns('users')
if (userCols === null) {
  console.log('  ❌  No se pudo leer la tabla users')
} else if (userCols.length === 0) {
  console.log('  ⚠️  Tabla vacía — no se pueden detectar columnas')
} else {
  const required = ['id','email','nombre','password_hash','role','nivel','puntos','cursos_acceso','clases_acceso','created_at']
  userCols.forEach(c => console.log(`  ✅  ${c}`))
  const missing = required.filter(r => !userCols.includes(r))
  if (missing.length) {
    console.log('\n  ❌  FALTANTES: ' + missing.join(', '))
  } else {
    console.log('\n  ✅  Todas las columnas requeridas existen')
  }
}

// ── 3. Completions ─────────────────────────────────────────────
console.log('\n' + sep)
console.log('✅  COMPLETIONS')
console.log(sep)

const { data: compSample, error: compSampleErr } = await db
  .from('completions')
  .select('*')
  .limit(1)

if (compSampleErr) {
  console.log('  ❌  Error al leer completions: ' + compSampleErr.message)
} else {
  const compCols = compSample?.length ? Object.keys(compSample[0]) : []
  console.log('  Columnas: ' + (compCols.length ? compCols.join(', ') : '(tabla vacía — no se pueden detectar)'))

  // Traer todas las completions con las columnas que existen
  const selectComp = compCols.length ? compCols.join(', ') : '*'
  const orderCol   = compCols.includes('created_at') ? 'created_at' : compCols[0]

  const { data: completions, error: compErr } = await db
    .from('completions')
    .select(selectComp)
    .order(orderCol, { ascending: false })

  if (compErr) {
    console.log('  ❌  ' + compErr.message)
  } else if (!completions?.length) {
    console.log('\n  Sin completions registradas')
  } else {
    const userMap = Object.fromEntries((users ?? []).map(u => [u.id, u.email]))
    const byUser  = {}
    for (const c of completions) {
      const uid = c.user_id ?? c.userId ?? '?'
      if (!byUser[uid]) byUser[uid] = []
      byUser[uid].push(c)
    }

    console.log(`\n  Total: ${completions.length} completion(s)\n`)
    for (const [uid, comps] of Object.entries(byUser)) {
      const email = userMap[uid] ?? uid
      const pts   = comps.reduce((s, c) => s + (c.puntos ?? 0), 0)
      console.log(`  ${email}  →  ${comps.length} completions, ${pts} pts`)
      comps.slice(0, 3).forEach(c => {
        const url = (c.resource_url ?? c.url ?? '?').slice(0, 55)
        console.log(`    • [${(c.tipo ?? '?').padEnd(10)}] ${url}`)
      })
      if (comps.length > 3) console.log(`    ... y ${comps.length - 3} más`)
    }
  }
}

// ── 4. Otras tablas ────────────────────────────────────────────
console.log('\n' + sep)
console.log('📋  OTRAS TABLAS')
console.log(sep)

for (const table of ['zones', 'videos', 'user_progress']) {
  const { data, error } = await db.from(table).select('*').limit(3)
  if (error) {
    console.log(`\n  ${table}: ❌ ${error.message}`)
  } else {
    const cols = data?.length ? Object.keys(data[0]) : []
    console.log(`\n  ${table}:  ${data?.length ?? 0} registro(s) (muestra)`)
    if (cols.length) console.log(`    Columnas: ${cols.join(', ')}`)
    if (data?.length) {
      data.forEach(row => console.log('    ' + JSON.stringify(row).slice(0, 100)))
    }
  }
}

console.log('\n' + sep)
console.log('  Inspección completada')
console.log(sep + '\n')
