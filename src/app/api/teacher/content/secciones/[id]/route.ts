import { NextRequest, NextResponse } from 'next/server'
import { teacherGuard, canAccess } from '@/lib/teacherGuard'
import { getSupabaseAdmin } from '@/lib/supabase'

async function getCursoIdFromSeccion(db: ReturnType<typeof import('@/lib/supabase').getSupabaseAdmin>, seccionId: string) {
  const { data } = await db
    .from('secciones')
    .select('modulo_id, modulos(curso_id)')
    .eq('id', seccionId)
    .single()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data?.modulos as any)?.curso_id as string | undefined
}

// PATCH /api/teacher/content/secciones/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await teacherGuard(req)
  if (!guard) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await params
  const db = getSupabaseAdmin()
  const cursoId = await getCursoIdFromSeccion(db, id)
  if (!cursoId) return NextResponse.json({ error: 'Sección no encontrada' }, { status: 404 })
  if (!canAccess(guard.cursosAcceso, cursoId))
    return NextResponse.json({ error: 'Sin permisos para este curso' }, { status: 403 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (body.nombre !== undefined) updates.nombre = body.nombre.trim()
  if (body.zona   !== undefined) updates.zona   = body.zona || null

  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })

  const { data, error } = await db
    .from('secciones').update(updates).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ seccion: data })
}

// DELETE /api/teacher/content/secciones/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await teacherGuard(req)
  if (!guard) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { id } = await params
  const db = getSupabaseAdmin()
  const cursoId = await getCursoIdFromSeccion(db, id)
  if (!cursoId) return NextResponse.json({ error: 'Sección no encontrada' }, { status: 404 })
  if (!canAccess(guard.cursosAcceso, cursoId))
    return NextResponse.json({ error: 'Sin permisos para este curso' }, { status: 403 })

  const { error } = await db.from('secciones').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
