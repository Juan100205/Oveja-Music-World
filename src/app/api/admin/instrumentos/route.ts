/**
 * /api/admin/instrumentos
 *
 * Tabla Supabase necesaria — ejecutar una vez:
 *
 * CREATE TABLE instrumentos (
 *   id          TEXT PRIMARY KEY,
 *   nombre      TEXT NOT NULL,
 *   emoji       TEXT NOT NULL DEFAULT '🎵',
 *   descripcion TEXT,
 *   color       TEXT NOT NULL DEFAULT '#3db8fa',
 *   glow        TEXT NOT NULL DEFAULT 'rgba(61,184,250,0.4)',
 *   zona        TEXT NOT NULL DEFAULT 'clase',
 *   curso_id    TEXT,
 *   orden       INTEGER NOT NULL DEFAULT 0,
 *   activo      BOOLEAN NOT NULL DEFAULT true,
 *   created_at  TIMESTAMPTZ DEFAULT NOW()
 * );
 */
import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function adminGuard(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.role === 'admin' ? payload : null
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// GET /api/admin/instrumentos
export async function GET(req: NextRequest) {
  if (!adminGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('instrumentos')
    .select('*')
    .order('orden')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ instrumentos: data ?? [] })
}

// POST /api/admin/instrumentos
// body: { nombre, emoji, descripcion?, color, glow, zona, curso_id?, crear_curso_vacio? }
// Si crear_curso_vacio !== false: crea fila en `cursos` (vacío) y vincula curso_id para poder editar módulos en Contenido.
export async function POST(req: NextRequest) {
  if (!adminGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const { nombre, emoji, descripcion, color, glow, zona, curso_id, crear_curso_vacio } = body

  if (!nombre?.trim()) return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })
  if (!color)          return NextResponse.json({ error: 'color es requerido'  }, { status: 400 })
  if (!zona)           return NextResponse.json({ error: 'zona es requerida'   }, { status: 400 })

  const db = getSupabaseAdmin()

  const crearCurso = crear_curso_vacio !== false
  let finalCursoId: string | null =
    typeof curso_id === 'string' && curso_id.trim() ? curso_id.trim() : null

  if (crearCurso) {
    const slug = slugify(nombre.trim())
    finalCursoId = finalCursoId || slug

    const { data: cursoExistente } = await db.from('cursos').select('id').eq('id', finalCursoId).maybeSingle()
    if (!cursoExistente) {
      const { count: nCursos } = await db.from('cursos').select('*', { count: 'exact', head: true })
      const { error: ce } = await db.from('cursos').insert({
        id:     finalCursoId,
        nombre: nombre.trim(),
        emoji:  emoji?.trim() || '🎵',
        orden:  nCursos ?? 0,
      })
      if (ce) return NextResponse.json({ error: `No se pudo crear el curso: ${ce.message}` }, { status: 500 })
    } else {
      await db.from('cursos').update({
        nombre: nombre.trim(),
        emoji:  emoji?.trim() || '🎵',
      }).eq('id', finalCursoId)
    }
  }

  // Generar id único (tabla instrumentos)
  const baseId = slugify(nombre.trim())
  let id = baseId
  const { data: existing } = await db.from('instrumentos').select('id').eq('id', id).maybeSingle()
  if (existing) id = `${baseId}-${Date.now()}`

  // Orden = count actual
  const { count } = await db.from('instrumentos').select('*', { count: 'exact', head: true })

  const { data, error } = await db
    .from('instrumentos')
    .insert({
      id,
      nombre:      nombre.trim(),
      emoji:       emoji?.trim()       || '🎵',
      descripcion: descripcion?.trim() || null,
      color,
      glow:        glow || `${color}66`,
      zona:        zona || 'clase',
      curso_id:    finalCursoId,
      orden:       count ?? 0,
      activo:      true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ instrumento: data }, { status: 201 })
}
