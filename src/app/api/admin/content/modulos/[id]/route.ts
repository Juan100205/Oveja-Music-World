import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function adminGuard(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.role === 'admin' ? payload : null
}

// PATCH /api/admin/content/modulos/[id]
// body: { nombre }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await params
  const { nombre } = await req.json()

  if (!nombre?.trim())
    return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('modulos').update({ nombre: nombre.trim() }).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ modulo: data })
}

// DELETE /api/admin/content/modulos/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await params
  const db = getSupabaseAdmin()

  const { error } = await db.from('modulos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
