import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function adminGuard(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.role === 'admin' ? payload : null
}

// PATCH /api/admin/content/recursos/[id]
// body: { url?, tipo?, label? }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const updates: Record<string, unknown> = {}
  if (body.url          !== undefined) updates.url          = body.url.trim()
  if (body.tipo         !== undefined) updates.tipo         = body.tipo
  if (body.label        !== undefined) updates.label        = body.label?.trim() || null
  if (body.interacciones !== undefined) updates.interacciones = Array.isArray(body.interacciones)
    ? body.interacciones
    : []

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('recursos').update(updates).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ recurso: data })
}

// DELETE /api/admin/content/recursos/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await params
  const db = getSupabaseAdmin()

  const { error } = await db.from('recursos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
