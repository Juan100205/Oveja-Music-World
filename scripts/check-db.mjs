/**
 * check-db.mjs
 * Inspecciona la tabla users en Supabase: columnas existentes y usuarios actuales.
 *
 * Uso:
 *   node scripts/check-db.mjs
 *
 * Requiere que el archivo .env.local esté configurado con:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Cargar .env.local manualmente ─────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
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
  console.error('❌ No se encontró .env.local — asegúrate de estar en la raíz del proyecto')
  process.exit(1)
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables en .env.local:')
  if (!SUPABASE_URL) console.error('   NEXT_PUBLIC_SUPABASE_URL')
  if (!SERVICE_ROLE_KEY) console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

console.log('\n🔍 Conectando a Supabase...')
console.log(`   URL: ${SUPABASE_URL}\n`)

// ── 1. Columnas de la tabla users ─────────────────────────────
console.log('═══════════════════════════════════════')
console.log('  COLUMNAS DE LA TABLA users')
console.log('═══════════════════════════════════════')

const { data: columns, error: colErr } = await db
  .rpc('get_columns_info')
  .select('*')

// Si no existe la función RPC, usamos information_schema directamente
const { data: colInfo, error: colInfoErr } = await db
  .from('information_schema.columns')
  .select('column_name, data_type, is_nullable, column_default')
  .eq('table_name', 'users')
  .eq('table_schema', 'public')
  .order('ordinal_position')

if (colInfoErr) {
  // Fallback: traer un registro y ver las keys
  console.log('ℹ️  No se pudo leer information_schema — usando fallback\n')
  const { data: sample, error: sErr } = await db
    .from('users')
    .select('*')
    .limit(1)

  if (sErr) {
    console.error('❌ Error al acceder a users:', sErr.message)
  } else if (sample?.length > 0) {
    console.log('Columnas detectadas (via sample):')
    Object.keys(sample[0]).forEach(k => console.log(`   • ${k}`))
  } else {
    console.log('⚠️  Tabla users vacía — no se puede detectar columnas por sample')
    console.log('   Columnas esperadas: id, email, nombre, password_hash, role, nivel, puntos, created_at')
  }
} else {
  console.table(colInfo?.map(c => ({
    columna: c.column_name,
    tipo: c.data_type,
    nullable: c.is_nullable,
    default: c.column_default,
  })))
}

// ── 2. Usuarios actuales ───────────────────────────────────────
console.log('\n═══════════════════════════════════════')
console.log('  USUARIOS ACTUALES')
console.log('═══════════════════════════════════════')

const { data: users, error: usersErr } = await db
  .from('users')
  .select('id, email, nombre, role, nivel, puntos, created_at')
  .order('created_at', { ascending: true })

if (usersErr) {
  console.error('❌ Error:', usersErr.message)
} else if (!users?.length) {
  console.log('⚠️  No hay usuarios en la tabla')
} else {
  console.log(`Total: ${users.length} usuario(s)\n`)
  console.table(users.map(u => ({
    email: u.email,
    nombre: u.nombre ?? '—',
    role: u.role,
    nivel: u.nivel,
    puntos: u.puntos,
  })))
}

// ── 3. Verificar si existe columna cursos_acceso ───────────────
console.log('\n═══════════════════════════════════════')
console.log('  ¿EXISTE cursos_acceso EN users?')
console.log('═══════════════════════════════════════')

const { data: checkCol, error: checkErr } = await db
  .from('users')
  .select('cursos_acceso')
  .limit(1)

if (checkErr) {
  console.log('❌ La columna cursos_acceso NO existe todavía')
  console.log('   → Se necesita crear con: ALTER TABLE users ADD COLUMN cursos_acceso text[] DEFAULT \'{}\';')
} else {
  console.log('✅ La columna cursos_acceso YA existe')
  const sample = checkCol?.[0]
  if (sample !== undefined) {
    console.log('   Valor en primer registro:', JSON.stringify(sample.cursos_acceso))
  }
}

console.log('\n✅ Inspección completada\n')
