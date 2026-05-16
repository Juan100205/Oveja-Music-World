/**
 * Genera supabase-seed.sql a partir de los datos estáticos del proyecto.
 * Uso: node scripts/generate-seed.mjs
 *
 * Requiere compilar primero o usar un loader. Aquí parseamos el TS manualmente
 * usando eval después de quitar tipos — funciona porque la estructura es JSON-like.
 */
import { readFileSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// ── UUID determinista (igual que seed-content/route.ts) ───────
function slugUUID(slug) {
  const h = createHash('md5').update(slug).digest('hex')
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-${((parseInt(h[16],16)&0x3)|0x8).toString(16)}${h.slice(17,20)}-${h.slice(20,32)}`
}

// ── SQL helpers ────────────────────────────────────────────────
function sq(v) {
  if (v === null || v === undefined) return 'NULL'
  return `'${String(v).replace(/'/g, "''")}'`
}

// ── Leer y evaluar datos estáticos ────────────────────────────
function loadTS(relPath) {
  let src = readFileSync(join(root, relPath), 'utf8')
  // Quitar exports, tipos e interfaces para poder evaluar con eval()
  src = src
    .replace(/^export\s+type\s+\w+[^;]*;/gm, '')
    .replace(/^export\s+interface\s+\w+[\s\S]*?\n\}/gm, '')
    .replace(/^export\s+const\s+/gm, 'const ')
    .replace(/:\s*Curso\[\]/g, '')
    .replace(/:\s*ClaseConfig\[\]/g, '')
    .replace(/:\s*GymInstrumento\[\]/g, '')
    .replace(/:\s*string/g, '')
    .replace(/:\s*TipoRecurso/g, '')
    .replace(/:\s*'clase'\s*\|\s*'gym'/g, '')
    .replace(/\?\s*:/g, ':')
    .replace(/^import\s+.*$/gm, '')
    .replace(/^export\s+function\s+/gm, 'function ')
    .replace(/^export\s+\{[^}]*\}/gm, '')
  return src
}

// Cargar cursos
let CURSOS, GYM_INSTRUMENTOS, CLASES_CONFIG, SEED_INSTRUMENTOS

{
  const src = loadTS('src/data/cursos.ts')
  const fn = new Function(src + '\nreturn CURSOS')
  CURSOS = fn()
}

// SEED_INSTRUMENTOS desde route.ts
{
  let src = readFileSync(join(root, 'src/app/api/admin/seed-instrumentos/route.ts'), 'utf8')
  src = src
    .replace(/^import\s+.*$/gm, '')
    .replace(/^export\s+/gm, '')
    .replace(/function\s+adminGuard[\s\S]*?^}/gm, '')
    .replace(/^async\s+function\s+POST[\s\S]*/gm, '')
  const fn = new Function(src + '\nreturn { SEED_INSTRUMENTOS, SEED_CURSOS }')
  try {
    const r = fn()
    SEED_INSTRUMENTOS = r.SEED_INSTRUMENTOS
  } catch(e) {
    console.error('Error cargando instrumentos:', e.message)
    SEED_INSTRUMENTOS = []
  }
}

// Gym (necesitamos getModulos que depende de CURSOS)
{
  const src = loadTS('src/data/gym.ts')
  const fn = new Function('CURSOS', src + '\nreturn GYM_INSTRUMENTOS')
  GYM_INSTRUMENTOS = fn(CURSOS)
}

// Clases
{
  const src = loadTS('src/data/clases.ts')
  const fn = new Function(src + '\nreturn CLASES_CONFIG')
  CLASES_CONFIG = fn()
}

// ── Generar SQL ────────────────────────────────────────────────
const lines = []

lines.push('-- ════════════════════════════════════════════════════════')
lines.push('-- OVEJA MUSIC WORLD — Seed completo de Supabase')
lines.push(`-- Generado: ${new Date().toISOString()}`)
lines.push('-- Uso: pegar en Supabase SQL Editor y ejecutar')
lines.push('-- ADVERTENCIA: trunca todas las tablas de contenido')
lines.push('-- ════════════════════════════════════════════════════════')
lines.push('')
lines.push('-- 1. Limpiar tablas (orden: hijos primero)')
lines.push('TRUNCATE recursos, secciones, modulos, cursos, instrumentos RESTART IDENTITY CASCADE;')
lines.push('')

// ── Cursos ────────────────────────────────────────────────────
lines.push('-- 2. Cursos')
lines.push('INSERT INTO cursos (id, nombre, emoji, orden) VALUES')
const cursosRows = CURSOS.map((c, i) =>
  `  (${sq(c.id)}, ${sq(c.nombre)}, ${sq(c.emoji)}, ${i})`
)
lines.push(cursosRows.join(',\n') + ';')
lines.push('')

// ── Instrumentos ─────────────────────────────────────────────
if (SEED_INSTRUMENTOS && SEED_INSTRUMENTOS.length > 0) {
  lines.push('-- 3. Instrumentos')
  lines.push('INSERT INTO instrumentos (id, nombre, emoji, descripcion, color, glow, zona, curso_id, orden, activo) VALUES')
  const instrRows = SEED_INSTRUMENTOS.map(i =>
    `  (${sq(i.id)}, ${sq(i.nombre)}, ${sq(i.emoji)}, ${sq(i.descripcion)}, ${sq(i.color)}, ${sq(i.glow)}, ${sq(i.zona)}, ${sq(i.curso_id)}, ${i.orden}, ${i.activo})`
  )
  lines.push(instrRows.join(',\n') + ';')
  lines.push('')
}

// ── Módulos ───────────────────────────────────────────────────
lines.push('-- 4. Módulos')
lines.push('INSERT INTO modulos (id, nombre, orden, curso_id) VALUES')
const modulosRows = []
const moduloUUID = {}
CURSOS.forEach(c => {
  c.modulos.forEach((m, i) => {
    const uuid = slugUUID(m.id)
    moduloUUID[m.id] = uuid
    modulosRows.push(`  (${sq(uuid)}, ${sq(m.nombre)}, ${i}, ${sq(c.id)})`)
  })
})
lines.push(modulosRows.join(',\n') + ';')
lines.push('')

// ── Secciones ─────────────────────────────────────────────────
lines.push('-- 5. Secciones')
lines.push('INSERT INTO secciones (id, nombre, zona, orden, modulo_id) VALUES')
const seccionesRows = []
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
lines.push('-- 6. Recursos')
lines.push('INSERT INTO recursos (id, url, label, tipo, orden, seccion_id) VALUES')
const recursosRows = []
CURSOS.forEach(c => {
  c.modulos.forEach(m => {
    m.secciones.forEach((s, si) => {
      const secId = slugUUID(`${m.id}-sec-${si}`)
      s.recursos.forEach((r, ri) => {
        const uuid = slugUUID(`${m.id}-sec-${si}-rec-${ri}`)
        recursosRows.push(`  (${sq(uuid)}, ${sq(r.url)}, ${sq(r.label ?? null)}, ${sq(r.tipo)}, ${ri}, ${sq(secId)})`)
      })
    })
  })
})
lines.push(recursosRows.join(',\n') + ';')
lines.push('')

lines.push('-- ════════════════════════════════════════════════════════')
lines.push(`-- Total: ${CURSOS.length} cursos, ${modulosRows.length} módulos, ${seccionesRows.length} secciones, ${recursosRows.length} recursos`)
lines.push('-- ════════════════════════════════════════════════════════')

const sql = lines.join('\n')
writeFileSync(join(root, 'supabase-seed.sql'), sql, 'utf8')

console.log('✅ supabase-seed.sql generado:')
console.log(`   ${CURSOS.length} cursos`)
console.log(`   ${modulosRows.length} módulos`)
console.log(`   ${seccionesRows.length} secciones`)
console.log(`   ${recursosRows.length} recursos`)
if (SEED_INSTRUMENTOS) console.log(`   ${SEED_INSTRUMENTOS.length} instrumentos`)
