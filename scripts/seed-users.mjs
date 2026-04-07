/**
 * seed-users.mjs
 * Crea usuarios de prueba, uno por instrumento, con acceso restringido a su curso.
 *
 * Uso:
 *   node scripts/seed-users.mjs
 *
 * Opciones:
 *   --dry-run   Solo muestra lo que haría, sin insertar
 *   --reset     Elimina los usuarios de prueba existentes antes de crear
 *
 * Requiere .env.local con:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const RESET   = args.includes('--reset')

// ── Cargar .env.local ──────────────────────────────────────────
const envPath = resolve(__dirname, '../.env.local')
let SUPABASE_URL, SERVICE_ROLE_KEY

try {
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split('\n')) {
    const [k, ...rest] = line.split('=')
    const v = rest.join('=').trim()
    if (k?.trim() === 'NEXT_PUBLIC_SUPABASE_URL') SUPABASE_URL = v
    if (k?.trim() === 'SUPABASE_SERVICE_ROLE_KEY') SERVICE_ROLE_KEY = v
  }
} catch {
  console.error('❌ No se encontró .env.local')
  process.exit(1)
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables en .env.local')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ── Usuarios a crear ───────────────────────────────────────────
// cursos_acceso → IDs del array CURSOS en src/data/cursos.ts
// clases_acceso → IDs del array CLASES_CONFIG en src/data/clases.ts
const TEST_USERS = [
  {
    email: 'test.piano@ovejamusic.com',
    nombre: 'Test Piano',
    cursos_acceso: ['piano'],
    clases_acceso: ['piano'],
  },
  {
    email: 'test.bateria@ovejamusic.com',
    nombre: 'Test Batería',
    cursos_acceso: ['bateria'],
    clases_acceso: ['bateria'],
  },
  {
    email: 'test.guitarra@ovejamusic.com',
    nombre: 'Test Guitarra',
    cursos_acceso: ['guitarra-adultos'],
    clases_acceso: ['guitarra'],
  },
  {
    email: 'test.violin@ovejamusic.com',
    nombre: 'Test Violín',
    cursos_acceso: ['violin'],
    clases_acceso: ['violin'],
  },
  {
    email: 'test.iniciacion@ovejamusic.com',
    nombre: 'Test Iniciación',
    cursos_acceso: ['ciudad-musical'],
    clases_acceso: ['introduccion'],
  },
  {
    email: 'test.canto@ovejamusic.com',
    nombre: 'Test Canto',
    cursos_acceso: ['canto'],
    clases_acceso: ['canto'],
  },
]

const PASSWORD = 'test123'
const SALT_ROUNDS = 12

// ── Main ───────────────────────────────────────────────────────
console.log('\n🎵 Seed de usuarios de prueba — Oveja Music World')
console.log(`   Contraseña: ${PASSWORD}`)
if (DRY_RUN) console.log('   ⚠️  DRY RUN — no se escribirá nada\n')
if (RESET)   console.log('   🗑️  RESET — se eliminarán users de prueba existentes\n')

console.log('─'.repeat(50))

// ── Hash de contraseña (una sola vez) ─────────────────────────
console.log('\n🔐 Generando hash de contraseña...')
const password_hash = await bcrypt.hash(PASSWORD, SALT_ROUNDS)
console.log('   ✅ Hash generado\n')

// ── Reset opcional ─────────────────────────────────────────────
if (RESET && !DRY_RUN) {
  const emails = TEST_USERS.map(u => u.email)
  const { error } = await db.from('users').delete().in('email', emails)
  if (error) {
    console.error('❌ Error al eliminar usuarios existentes:', error.message)
  } else {
    console.log('🗑️  Usuarios de prueba anteriores eliminados\n')
  }
}

// ── Verificar si existe columna cursos_acceso ──────────────────
const { error: colCheck } = await db.from('users').select('cursos_acceso').limit(1)
const hasCursosAcceso = !colCheck

if (!hasCursosAcceso) {
  console.log('⚠️  ATENCIÓN: La columna cursos_acceso NO existe en la tabla users')
  console.log('   Ejecuta este SQL en Supabase antes de continuar:\n')
  console.log('   ALTER TABLE public.users')
  console.log('     ADD COLUMN IF NOT EXISTS cursos_acceso text[] DEFAULT \'{}\',')
  console.log('     ADD COLUMN IF NOT EXISTS clases_acceso text[] DEFAULT \'{}\';\n')
  console.log('   Luego vuelve a ejecutar este script.\n')

  if (!DRY_RUN) process.exit(1)
}

// ── Insertar usuarios ──────────────────────────────────────────
console.log('👤 Procesando usuarios:\n')

let created = 0
let skipped = 0
let errors  = 0

for (const u of TEST_USERS) {
  const record = {
    email: u.email,
    nombre: u.nombre,
    password_hash,
    role: 'student',
    nivel: 1,
    puntos: 0,
    ...(hasCursosAcceso ? { cursos_acceso: u.cursos_acceso, clases_acceso: u.clases_acceso } : {}),
  }

  if (DRY_RUN) {
    console.log(`   🔵 [DRY RUN] ${u.nombre} <${u.email}>`)
    console.log(`      cursos_acceso: ${JSON.stringify(u.cursos_acceso)}`)
    console.log(`      clases_acceso: ${JSON.stringify(u.clases_acceso)}\n`)
    continue
  }

  // Verificar si ya existe
  const { data: existing } = await db
    .from('users')
    .select('id, email')
    .eq('email', u.email)
    .maybeSingle()

  if (existing && !RESET) {
    console.log(`   ⏭️  YA EXISTE: ${u.email} — usa --reset para recrear`)
    skipped++
    continue
  }

  const { data, error } = await db
    .from('users')
    .upsert(record, { onConflict: 'email' })
    .select('id, email')
    .single()

  if (error) {
    console.log(`   ❌ ERROR: ${u.email}`)
    console.log(`      ${error.message}`)
    errors++
  } else {
    console.log(`   ✅ ${u.nombre} <${u.email}>`)
    console.log(`      ID: ${data.id}`)
    console.log(`      cursos: ${JSON.stringify(u.cursos_acceso)}`)
    console.log(`      clases: ${JSON.stringify(u.clases_acceso)}\n`)
    created++
  }
}

// ── Resumen ────────────────────────────────────────────────────
console.log('─'.repeat(50))
if (!DRY_RUN) {
  console.log(`\n📊 Resultado:`)
  console.log(`   ✅ Creados/actualizados: ${created}`)
  console.log(`   ⏭️  Saltados (ya existen): ${skipped}`)
  console.log(`   ❌ Errores: ${errors}`)
}

console.log('\n🔑 Credenciales de prueba:')
console.log('─'.repeat(50))
for (const u of TEST_USERS) {
  console.log(`   ${u.nombre.padEnd(20)} | ${u.email.padEnd(32)} | ${PASSWORD}`)
}
console.log('─'.repeat(50))
console.log('\n✅ Listo\n')
