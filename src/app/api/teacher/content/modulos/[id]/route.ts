import { NextRequest, NextResponse } from 'next/server'
import { teacherGuard, canAccess } from '@/lib/teacherGuard'
import { getSupabaseAdmin } from '@/lib/supabase'

async function getCursoIdFromModulo(db: ReturnType<typeof import('@/lib/supabase').getSupabaseAdmin>, moduloId: string) {
  const { data } = await db.from('modulos').select('curso_id').eq('id', moduloId).single()
  return data?.curso_id as string | undefined
}

// PATCH /api/teacher/content/modulos/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await teacherGuard(req)
  if (!guard) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await params
  const db = getSupabaseAdmin()
  const cursoId = await getCursoIdFromModulo(db, id)
  if (!cursoId) return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 })
  if (!canAccess(guard.cursosAcceso, cursoId))
    return NextResponse.json({ error: 'Sin permisos para este curso' }, { status: 403 })

  const { nombre } = await req.json()
  if (!nombre?.trim())
    return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })

  const { data, error } = await db
    .from('modulos').update({ nombre: nombre.trim() }).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ modulo: data })
}

// DELETE /api/teacher/content/modulos/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await teacherGuard(req)
  if (!guard) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await params
  const db = getSupabaseAdmin()
  const cursoId = await getCursoIdFromModulo(db, id)
  if (!cursoId) return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 })
  if (!canAccess(guard.cursosAcceso, cursoId))
    return NextResponse.json({ error: 'Sin permisos para este curso' }, { status: 403 })

  const { error } = await db.from('modulos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
