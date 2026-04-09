import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function adminGuard(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.role === 'admin' ? payload : null
}

// POST /api/admin/content/cursos
// body: { nombre, emoji }
export async function POST(req: NextRequest) {
  if (!adminGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json()
  const { nombre, emoji } = body

  if (!nombre?.trim())
    return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })

  const db = getSupabaseAdmin()

  const { count } = await db
    .from('cursos').select('*', { count: 'exact', head: true })

  // Generar id desde el nombre (slug)
  const id = nombre.trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // quitar acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now()

  const { data, error } = await db
    .from('cursos')
    .insert({ id, nombre: nombre.trim(), emoji: emoji?.trim() || '🎵', orden: count ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ curso: data }, { status: 201 })
}
