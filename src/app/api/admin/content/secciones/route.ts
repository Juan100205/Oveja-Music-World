import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function adminGuard(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.role === 'admin' ? payload : null
}

// POST /api/admin/content/secciones
// body: { modulo_id, nombre, zona? }
export async function POST(req: NextRequest) {
  if (!adminGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json()
  const { modulo_id, nombre, zona } = body

  if (!modulo_id || !nombre?.trim())
    return NextResponse.json({ error: 'modulo_id y nombre son requeridos' }, { status: 400 })

  const db = getSupabaseAdmin()

  const { count } = await db
    .from('secciones').select('*', { count: 'exact', head: true }).eq('modulo_id', modulo_id)

  const { data, error } = await db
    .from('secciones')
    .insert({
      modulo_id,
      nombre: nombre.trim(),
      zona: zona ?? null,
      orden: count ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ seccion: { ...data, recursos: [] } }, { status: 201 })
}
