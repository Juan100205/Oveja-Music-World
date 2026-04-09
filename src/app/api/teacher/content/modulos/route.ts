import { NextRequest, NextResponse } from 'next/server'
import { teacherGuard, canAccess } from '@/lib/teacherGuard'
import { getSupabaseAdmin } from '@/lib/supabase'

// POST /api/teacher/content/modulos
// body: { curso_id, nombre }
export async function POST(req: NextRequest) {
  const guard = await teacherGuard(req)
  if (!guard) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json()
  const { curso_id, nombre } = body

  if (!curso_id || !nombre?.trim())
    return NextResponse.json({ error: 'curso_id y nombre son requeridos' }, { status: 400 })

  if (!canAccess(guard.cursosAcceso, curso_id))
    return NextResponse.json({ error: 'Sin permisos para este curso' }, { status: 403 })

  const db = getSupabaseAdmin()
  const { count } = await db
    .from('modulos').select('*', { count: 'exact', head: true }).eq('curso_id', curso_id)

  const id = `${curso_id}-modulo-${Date.now()}`
  const { data, error } = await db
    .from('modulos')
    .insert({ id, curso_id, nombre: nombre.trim(), orden: count ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ modulo: { ...data, secciones: [] } }, { status: 201 })
}
