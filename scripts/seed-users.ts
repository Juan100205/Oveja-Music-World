/**
 * Seed de usuarios de prueba — 1 profesor + 1 estudiante por instrumento
 *
 * Uso:
 *   npx tsx scripts/seed-users.ts
 *
 * Contraseña de todos los usuarios: test1234
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('❌  Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(url, key)
const PASSWORD = 'test1234'

const INSTRUMENTOS = [
  { id: 'piano',          claseId: 'piano',        nombre: 'Piano',             emoji: '🎹' },
  { id: 'bateria',        claseId: 'bateria',       nombre: 'Batería',           emoji: '🥁' },
  { id: 'guitarra-adultos', claseId: 'guitarra',    nombre: 'Guitarra',          emoji: '🎸' },
  { id: 'violin',         claseId: 'violin',        nombre: 'Violín',            emoji: '🎻' },
  { id: 'ciudad-musical', claseId: 'introduccion',  nombre: 'Iniciación Musical',emoji: '🎵' },
  { id: 'canto',          claseId: 'canto',         nombre: 'Canto',             emoji: '🎤' },
]

async function seed() {
  console.log('🌱 Creando usuarios de prueba...\n')
  console.log(`🔑 Contraseña para todos: ${PASSWORD}\n`)

  const hash = await bcrypt.hash(PASSWORD, 12)
  let created = 0
  let skipped = 0

  for (const inst of INSTRUMENTOS) {
    const users = [
      {
        email: `profe.${inst.claseId}@oveja.test`,
        nombre: `Profe ${inst.nombre}`,
        role: 'teacher',
        cursos_acceso: [inst.id],
        clases_acceso: [inst.claseId],
      },
      {
        email: `estudiante.${inst.claseId}@oveja.test`,
        nombre: `Estudiante ${inst.nombre}`,
        role: 'student',
        cursos_acceso: [inst.id],
        clases_acceso: [inst.claseId],
      },
    ]

    for (const u of users) {
      // Verificar si ya existe
      const { data: existing } = await db
        .from('users')
        .select('id')
        .eq('email', u.email)
        .maybeSingle()

      if (existing) {
        console.log(`  ⏭  ${u.email} (ya existe)`)
        skipped++
        continue
      }

      const { error } = await db.from('users').insert({
        email: u.email,
        nombre: u.nombre,
        role: u.role,
        password_hash: hash,
        nivel: 1,
        puntos: 0,
        cursos_acceso: u.cursos_acceso,
        clases_acceso: u.clases_acceso,
      })

      if (error) {
        console.error(`  ❌  ${u.email}: ${error.message}`)
      } else {
        const icon = u.role === 'teacher' ? '👨‍🏫' : '🎓'
        console.log(`  ${icon}  ${inst.emoji} ${u.email}`)
        created++
      }
    }
    console.log()
  }

  console.log(`✅ Creados: ${created} | Omitidos: ${skipped}`)
  console.log('\n📋 Resumen de accesos:')
  console.log('─────────────────────────────────────────────')
  for (const inst of INSTRUMENTOS) {
    console.log(`${inst.emoji} ${inst.nombre.padEnd(20)} profe.${inst.claseId}@oveja.test`)
    console.log(`${''.padEnd(22)} estudiante.${inst.claseId}@oveja.test`)
  }
  console.log('─────────────────────────────────────────────')
  console.log(`🔑 Contraseña: ${PASSWORD}`)
}

seed().catch(err => { console.error('❌ Fatal:', err); process.exit(1) })
