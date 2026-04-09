import { NextRequest, NextResponse } from 'next/server'
import { teacherGuard, canAccess } from '@/lib/teacherGuard'
import { getSupabaseAdmin } from '@/lib/supabase'

// POST /api/teacher/content/secciones
// body: { modulo_id, nombre, zona? }
export async function POST(req: NextRequest) {
  const guard = await teacherGuard(req)
  if (!guard) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json()
  const { modulo_id, nombre, zona } = body

  if (!modulo_id || !nombre?.trim())
    return NextResponse.json({ error: 'modulo_id y nombre son requeridos' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data: modulo } = await db.from('modulos').select('curso_id').eq('id', modulo_id).single()
  if (!modulo) return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 })
  if (!canAccess(guard.cursosAcceso, modulo.curso_id))
    return NextResponse.json({ error: 'Sin permisos para este curso' }, { status: 403 })

  const { count } = await db
    .from('secciones').select('*', { count: 'exact', head: true }).eq('modulo_id', modulo_id)

  const { data, error } = await db
    .from('secciones')
    .insert({ modulo_id, nombre: nombre.trim(), zona: zona ?? null, orden: count ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ seccion: { ...data, recursos: [] } }, { status: 201 })
}
