import { NextRequest, NextResponse } from 'next/server'
import { teacherGuard, canAccess } from '@/lib/teacherGuard'
import { getSupabaseAdmin } from '@/lib/supabase'

async function getCursoIdFromRecurso(db: ReturnType<typeof import('@/lib/supabase').getSupabaseAdmin>, recursoId: string) {
  const { data } = await db
    .from('recursos')
    .select('seccion_id, secciones(modulo_id, modulos(curso_id))')
    .eq('id', recursoId)
    .single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data?.secciones as any)?.modulos?.curso_id as string | undefined
}

// PATCH /api/teacher/content/recursos/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await teacherGuard(req)
  if (!guard) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await params
  const db = getSupabaseAdmin()
  const cursoId = await getCursoIdFromRecurso(db, id)
  if (!cursoId) return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 })
  if (!canAccess(guard.cursosAcceso, cursoId))
    return NextResponse.json({ error: 'Sin permisos para este curso' }, { status: 403 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (body.url   !== undefined) updates.url   = body.url.trim()
  if (body.tipo  !== undefined) updates.tipo  = body.tipo
  if (body.label !== undefined) updates.label = body.label?.trim() || null

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })

  const { data, error } = await db
    .from('recursos').update(updates).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ recurso: data })
}

// DELETE /api/teacher/content/recursos/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await teacherGuard(req)
  if (!guard) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await params
  const db = getSupabaseAdmin()
  const cursoId = await getCursoIdFromRecurso(db, id)
  if (!cursoId) return NextResponse.json({ error: 'Recurso no encontrado' }, { status: 404 })
  if (!canAccess(guard.cursosAcceso, cursoId))
    return NextResponse.json({ error: 'Sin permisos para este curso' }, { status: 403 })

  const { error } = await db.from('recursos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
