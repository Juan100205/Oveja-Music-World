import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function adminGuard(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.role === 'admin' ? payload : null
}

// POST /api/admin/content/modulos
// body: { curso_id, nombre }
export async function POST(req: NextRequest) {
  if (!adminGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json()
  const { curso_id, nombre, zona } = body

  if (!curso_id || !nombre?.trim())
    return NextResponse.json({ error: 'curso_id y nombre son requeridos' }, { status: 400 })

  if (zona && !['clase', 'gym'].includes(zona))
    return NextResponse.json({ error: 'zona debe ser clase, gym o null' }, { status: 400 })

  const db = getSupabaseAdmin()

  const { count, error: countError } = await db
    .from('modulos').select('*', { count: 'exact', head: true }).eq('curso_id', curso_id)

  if (countError)
    return NextResponse.json({ error: 'Error al calcular el orden del módulo' }, { status: 500 })

  const id = crypto.randomUUID()

  const { data, error } = await db
    .from('modulos')
    .insert({ id, curso_id, nombre: nombre.trim(), zona: zona ?? null, orden: count ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ modulo: { ...data, secciones: [] } }, { status: 201 })
}
