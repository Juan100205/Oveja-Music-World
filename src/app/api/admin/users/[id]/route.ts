import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function requireAdmin(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload || payload.role !== 'admin') return null
  return payload
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

  const allowed = ['cursos_acceso', 'clases_acceso', 'role', 'nombre']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, email, nombre, role, nivel, puntos, cursos_acceso, clases_acceso')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ user: data })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminPayload = requireAdmin(req)
  if (!adminPayload) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params

  // No permitir que el admin se elimine a sí mismo
  if (adminPayload.sub === id) {
    return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const { error } = await db.from('users').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
