/**
 * Genera supabase-seed.sql a partir de los datos estáticos del proyecto.
 * Uso: npx tsx scripts/generate-seed.ts
 */
import { writeFileSync } from 'fs'
import { createHash } from 'crypto'
import { join } from 'path'
import { CURSOS } from '../src/data/cursos'
import { SEED_INSTRUMENTOS } from '../src/app/api/admin/seed-instrumentos/route'

const root = join(__dirname, '..')

// ── UUID determinista (igual que seed-content/route.ts) ───────
function slugUUID(slug: string): string {
  const h = createHash('md5').update(slug).digest('hex')
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-${((parseInt(h[16],16)&0x3)|0x8).toString(16)}${h.slice(17,20)}-${h.slice(20,32)}`
}

function sq(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return String(v)
  return `'${String(v).replace(/'/g, "''")}'`
}

const lines: string[] = []

lines.push('-- ════════════════════════════════════════════════════════')
lines.push('-- OVEJA MUSIC WORLD — Seed completo de Supabase')
lines.push(`-- Generado: ${new Date().toISOString()}`)
lines.push('-- Pegar en Supabase SQL Editor y ejecutar')
lines.push('-- ════════════════════════════════════════════════════════')
lines.push('')
lines.push('-- Limpiar tablas (hijos primero)')
lines.push('TRUNCATE recursos, secciones, modulos, cursos, instrumentos RESTART IDENTITY CASCADE;')
lines.push('')

// ── Cursos ────────────────────────────────────────────────────
lines.push('-- Cursos')
lines.push('INSERT INTO cursos (id, nombre, emoji, orden) VALUES')
lines.push(CURSOS.map((c, i) => `  (${sq(c.id)}, ${sq(c.nombre)}, ${sq(c.emoji)}, ${i})`).join(',\n') + ';')
lines.push('')

// ── Instrumentos ─────────────────────────────────────────────
lines.push('-- Instrumentos')
lines.push('INSERT INTO instrumentos (id, nombre, emoji, descripcion, color, glow, zona, curso_id, orden, activo) VALUES')
lines.push(SEED_INSTRUMENTOS.map(i =>
  `  (${sq(i.id)}, ${sq(i.nombre)}, ${sq(i.emoji)}, ${sq(i.descripcion)}, ${sq(i.color)}, ${sq(i.glow)}, ${sq(i.zona)}, ${sq(i.curso_id)}, ${i.orden}, ${i.activo})`
).join(',\n') + ';')
lines.push('')

function isPracticeModule(nombre: string): boolean {
  const n = nombre.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  return n.includes('practica')
}

// ── Módulos ───────────────────────────────────────────────────
const moduloUUID: Record<string, string> = {}
CURSOS.forEach(c => c.modulos.forEach(m => { moduloUUID[m.id] = slugUUID(m.id) }))

lines.push('-- Módulos')
lines.push('INSERT INTO modulos (id, nombre, zona, orden, curso_id) VALUES')
const modulosRows: string[] = []
CURSOS.forEach(c => {
  c.modulos.forEach((m, i) => {
    const zona = isPracticeModule(m.nombre) ? 'gym' : 'clase'
    modulosRows.push(`  (${sq(moduloUUID[m.id])}, ${sq(m.nombre)}, ${sq(zona)}, ${i}, ${sq(c.id)})`)
  })
})
lines.push(modulosRows.join(',\n') + ';')
lines.push('')

// ── Secciones ─────────────────────────────────────────────────
lines.push('-- Secciones')
lines.push('INSERT INTO secciones (id, nombre, zona, orden, modulo_id) VALUES')
const seccionesRows: string[] = []
CURSOS.forEach(c => {
  c.modulos.forEach(m => {
    m.secciones.forEach((s, i) => {
      const uuid = slugUUID(`${m.id}-sec-${i}`)
      seccionesRows.push(`  (${sq(uuid)}, ${sq(s.nombre)}, ${sq(s.zona ?? null)}, ${i}, ${sq(moduloUUID[m.id])})`)
    })
  })
})
lines.push(seccionesRows.join(',\n') + ';')
lines.push('')

// ── Recursos ──────────────────────────────────────────────────
lines.push('-- Recursos')
lines.push('INSERT INTO recursos (id, url, label, tipo, orden, seccion_id) VALUES')
const recursosRows: string[] = []
CURSOS.forEach(c => {
  c.modulos.forEach(m => {
    m.secciones.forEach((s, si) => {
      const secId = slugUUID(`${m.id}-sec-${si}`)
      s.recursos.forEach((r, ri) => {
        recursosRows.push(`  (${sq(slugUUID(`${m.id}-sec-${si}-rec-${ri}`))}, ${sq(r.url)}, ${sq(r.label ?? null)}, ${sq(r.tipo)}, ${ri}, ${sq(secId)})`)
      })
    })
  })
})
lines.push(recursosRows.join(',\n') + ';')
lines.push('')

lines.push('-- ════════════════════════════════════════════════════════')
lines.push(`-- Total: ${CURSOS.length} cursos | ${modulosRows.length} módulos | ${seccionesRows.length} secciones | ${recursosRows.length} recursos | ${SEED_INSTRUMENTOS.length} instrumentos`)
lines.push('-- ════════════════════════════════════════════════════════')

const outPath = join(root, 'supabase-seed.sql')
writeFileSync(outPath, lines.join('\n'), 'utf8')

console.log('✅ supabase-seed.sql generado:')
console.log(`   ${CURSOS.length} cursos`)
console.log(`   ${modulosRows.length} módulos`)
console.log(`   ${seccionesRows.length} secciones`)
console.log(`   ${recursosRows.length} recursos`)
console.log(`   ${SEED_INSTRUMENTOS.length} instrumentos`)
console.log(`   → ${outPath}`)
