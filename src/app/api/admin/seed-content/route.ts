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
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { CURSOS } from '@/data/cursos'

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
      id:       m.id,
      nombre:   m.nombre,
      orden:    i,
      curso_id: c.id,
    }))
  )

  const { error: eModulos } = await db
    .from('modulos')
    .upsert(modulosRows, { onConflict: 'id' })

  if (eModulos) return NextResponse.json({ error: `modulos: ${eModulos.message}` }, { status: 500 })

  // ── 3. Secciones ──────────────────────────────────────────────
  const seccionesRows = CURSOS.flatMap(c =>
    c.modulos.flatMap(m =>
      m.secciones.map((s, i) => ({
        id:        `${m.id}-sec-${i}`,
        nombre:    s.nombre,
        zona:      s.zona ?? 'ambos',
        orden:     i,
        modulo_id: m.id,
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
        const secId = `${m.id}-sec-${si}`
        return s.recursos.map((r, ri) => ({
          id:         `${secId}-rec-${ri}`,
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
