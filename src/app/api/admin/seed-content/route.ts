/**
 * POST /api/admin/seed-content
 *
 * Sube todo el árbol de contenido estático a Supabase (upsert idempotente).
 * cursos → modulos → secciones → recursos
 *
 * Solo accesible por admin. Seguro de ejecutar múltiples veces.
 * Los IDs de secciones y recursos se generan de forma determinista
 * a partir del módulo para garantizar idempotencia.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { CURSOS } from '@/data/cursos'

/** Genera un UUID v4 determinista a partir de un string (MD5-based). */
function slugUUID(slug: string): string {
  const h = createHash('md5').update(slug).digest('hex')
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-${((parseInt(h[16],16)&0x3)|0x8).toString(16)}${h.slice(17,20)}-${h.slice(20,32)}`
}

function isPracticeModule(nombre: string): boolean {
  const n = nombre.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  return n.includes('practica')
}

function adminGuard(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.role === 'admin' ? payload : null
}

export async function POST(req: NextRequest) {
  if (!adminGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const db = getSupabaseAdmin()

  // ── 1. Cursos ─────────────────────────────────────────────────
  const cursosRows = CURSOS.map((c, i) => ({
    id:     c.id,
    nombre: c.nombre,
    emoji:  c.emoji,
    orden:  i,
  }))

  const { error: eCursos } = await db
    .from('cursos')
    .upsert(cursosRows, { onConflict: 'id' })

  if (eCursos) return NextResponse.json({ error: `cursos: ${eCursos.message}` }, { status: 500 })

  // ── 2. Módulos ────────────────────────────────────────────────
  const modulosRows = CURSOS.flatMap(c =>
    c.modulos.map((m, i) => ({
      id:       slugUUID(m.id),
      nombre:   m.nombre,
      zona:     isPracticeModule(m.nombre) ? 'gym' : 'clase',
      orden:    i,
      curso_id: c.id,
    }))
  )

  const { error: eModulos } = await db
    .from('modulos')
    .upsert(modulosRows, { onConflict: 'id' })

  if (eModulos) return NextResponse.json({ error: `modulos: ${eModulos.message}` }, { status: 500 })

  // Mapa slug → UUID para referencias cruzadas
  const moduloUUID = Object.fromEntries(
    CURSOS.flatMap(c => c.modulos.map(m => [m.id, slugUUID(m.id)]))
  )

  // ── 3. Secciones ──────────────────────────────────────────────
  const seccionesRows = CURSOS.flatMap(c =>
    c.modulos.flatMap(m =>
      m.secciones.map((s, i) => ({
        id:        slugUUID(`${m.id}-sec-${i}`),
        nombre:    s.nombre,
        zona:      s.zona ?? null,
        orden:     i,
        modulo_id: moduloUUID[m.id],
      }))
    )
  )

  const { error: eSecciones } = await db
    .from('secciones')
    .upsert(seccionesRows, { onConflict: 'id' })

  if (eSecciones) return NextResponse.json({ error: `secciones: ${eSecciones.message}` }, { status: 500 })

  // ── 4. Recursos ───────────────────────────────────────────────
  const recursosRows = CURSOS.flatMap(c =>
    c.modulos.flatMap(m =>
      m.secciones.flatMap((s, si) => {
        const secId = slugUUID(`${m.id}-sec-${si}`)
        return s.recursos.map((r, ri) => ({
          id:         slugUUID(`${m.id}-sec-${si}-rec-${ri}`),
          url:        r.url,
          label:      r.label ?? null,
          tipo:       r.tipo,
          orden:      ri,
          seccion_id: secId,
        }))
      })
    )
  )

  const { error: eRecursos } = await db
    .from('recursos')
    .upsert(recursosRows, { onConflict: 'id' })

  if (eRecursos) return NextResponse.json({ error: `recursos: ${eRecursos.message}` }, { status: 500 })

  return NextResponse.json({
    ok:       true,
    cursos:   cursosRows.length,
    modulos:  modulosRows.length,
    secciones: seccionesRows.length,
    recursos:  recursosRows.length,
  })
}
