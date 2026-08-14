/**
 * /api/teacher/niveles?instrumento=piano
 *
 * El profesor del instrumento puede leer y editar los puntos por nivel
 * de los instrumentos que imparte (cursos_acceso). Admin también puede.
 */
import { NextRequest, NextResponse } from 'next/server'
import { teacherGuard, canAccess } from '@/lib/teacherGuard'
import { getSupabaseAdmin } from '@/lib/supabase'
import { loadNivelesConfig, validateNiveles } from '@/lib/niveles'
import type { LevelConfig } from '@/types'

// GET /api/teacher/niveles?instrumento=piano — config del instrumento
export async function GET(req: NextRequest) {
  const guard = await teacherGuard(req)
  if (!guard) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const instrumento = req.nextUrl.searchParams.get('instrumento')
  if (!instrumento) return NextResponse.json({ error: 'instrumento requerido' }, { status: 400 })

  if (!canAccess(guard.cursosAcceso, instrumento)) {
    return NextResponse.json({ error: 'No tienes acceso a este instrumento' }, { status: 403 })
  }

  const niveles = await loadNivelesConfig(instrumento)
  return NextResponse.json({ niveles, instrumento })
}

// PUT /api/teacher/niveles?instrumento=piano — reemplaza la config del instrumento
export async function PUT(req: NextRequest) {
  const guard = await teacherGuard(req)
  if (!guard) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const instrumento = req.nextUrl.searchParams.get('instrumento')
  if (!instrumento) return NextResponse.json({ error: 'instrumento requerido' }, { status: 400 })

  if (!canAccess(guard.cursosAcceso, instrumento)) {
    return NextResponse.json({ error: 'No tienes acceso a este instrumento' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const validated = validateNiveles(body?.niveles as LevelConfig[])
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  const db = getSupabaseAdmin()

  const { error: delError } = await db
    .from('config_niveles')
    .delete()
    .eq('instrumento_id', instrumento)

  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })

  const clean = validated.sorted.map(l => ({ instrumento_id: instrumento, ...l }))
  const { error } = await db.from('config_niveles').insert(clean)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ niveles: validated.sorted, instrumento })
}
