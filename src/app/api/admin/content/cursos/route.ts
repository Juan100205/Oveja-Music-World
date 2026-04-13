import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function adminGuard(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.role === 'admin' ? payload : null
}

// POST /api/admin/content/cursos
// body: { nombre, emoji, id? } — id opcional = slug estable (ej. saxofon-ninos); si no, slug(nombre)-timestamp
export async function POST(req: NextRequest) {
  if (!adminGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json()
  const { nombre, emoji, id: idPreferido } = body

  if (!nombre?.trim())
    return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })

  const db = getSupabaseAdmin()

  const { count } = await db
    .from('cursos').select('*', { count: 'exact', head: true })

  let id: string
  if (typeof idPreferido === 'string' && idPreferido.trim()) {
    id = slugify(idPreferido.trim())
    const { data: existe } = await db.from('cursos').select('id').eq('id', id).maybeSingle()
    if (existe) {
      return NextResponse.json({ error: 'Ya existe un curso con ese id. Elige otro slug.' }, { status: 409 })
    }
  } else {
    id = `${slugify(nombre.trim())}-${Date.now()}`
  }

  const { data, error } = await db
    .from('cursos')
    .insert({ id, nombre: nombre.trim(), emoji: emoji?.trim() || '🎵', orden: count ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ curso: data }, { status: 201 })
}
