import { NextRequest, NextResponse } from 'next/server'
import { teacherGuard, canAccess } from '@/lib/teacherGuard'
import { getSupabaseAdmin } from '@/lib/supabase'

// PATCH /api/teacher/content/cursos/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await teacherGuard(req)
  if (!guard) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await params
  if (!canAccess(guard.cursosAcceso, id))
    return NextResponse.json({ error: 'Sin permisos para este curso' }, { status: 403 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (body.nombre !== undefined) updates.nombre = body.nombre.trim()
  if (body.emoji  !== undefined) updates.emoji  = body.emoji.trim()

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('cursos').update(updates).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ curso: data })
}

// DELETE /api/teacher/content/cursos/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await teacherGuard(req)
  if (!guard) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await params
  if (!canAccess(guard.cursosAcceso, id))
    return NextResponse.json({ error: 'Sin permisos para este curso' }, { status: 403 })

  const db = getSupabaseAdmin()
  const { error } = await db.from('cursos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
