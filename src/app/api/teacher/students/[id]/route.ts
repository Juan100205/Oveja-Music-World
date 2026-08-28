import { NextRequest, NextResponse } from 'next/server'
import { teacherGuard } from '@/lib/teacherGuard'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * PATCH /api/teacher/students/[id]
 *
 * Permite a un profesor (o admin) actualizar:
 *   - nivel      (entero 1–5)
 *
 * Solo el administrador puede actualizar:
 *   - puntos         (entero >= 0)
 *   - clases_acceso  (string[])
 *
 * Seguridad:
 *   - Requiere rol teacher o admin (teacherGuard)
 *   - Un profesor solo puede editar alumnos que tengan
 *     al menos un curso en común con sus cursos_acceso
 *   - Un admin puede editar cualquier alumno (cursosAcceso = null)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── 1. Auth ──────────────────────────────────────────────────
  const guard = await teacherGuard(req)
  if (!guard) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { id } = await params
  const db = getSupabaseAdmin()

  // ── 2. Cargar alumno ─────────────────────────────────────────
  const { data: student, error: fetchError } = await db
    .from('users')
    .select('id, email, nombre, nivel, puntos, cursos_acceso, clases_acceso')
    .eq('id', id)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }
  if (!student) {
    return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
  }

  // ── 3. Verificar que el alumno pertenece al scope del profesor ─
  if (guard.cursosAcceso !== null) {
    const studentCursos: string[] = (student.cursos_acceso as string[]) ?? []
    const hasOverlap = studentCursos.some(c => guard.cursosAcceso!.includes(c))
    if (!hasOverlap) {
      return NextResponse.json(
        { error: 'Sin permisos para editar este alumno' },
        { status: 403 }
      )
    }
  }

  // ── 4. Parsear y validar body ────────────────────────────────
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  // Solo el admin puede tocar puntos y asignación de cursos.
  const isAdmin = guard.payload.role === 'admin'
  if (!isAdmin) {
    const forbidden = ['puntos', 'clases_acceso'].filter(f => f in body)
    if (forbidden.length > 0) {
      return NextResponse.json(
        { error: 'Solo el administrador puede modificar puntos y asignar cursos' },
        { status: 403 }
      )
    }
  }

  const updates: Record<string, unknown> = {}

  if ('nivel' in body) {
    const nivel = body.nivel
    if (!Number.isInteger(nivel) || nivel < 1 || nivel > 5) {
      return NextResponse.json(
        { error: 'nivel debe ser un entero entre 1 y 5' },
        { status: 400 }
      )
    }
    updates.nivel = nivel
  }

  if (isAdmin && 'puntos' in body) {
    const puntos = body.puntos
    if (!Number.isInteger(puntos) || puntos < 0) {
      return NextResponse.json(
        { error: 'puntos debe ser un entero >= 0' },
        { status: 400 }
      )
    }
    updates.puntos = puntos
  }

  if (isAdmin && 'clases_acceso' in body) {
    const clases = body.clases_acceso
    if (!Array.isArray(clases) || clases.some(c => typeof c !== 'string')) {
      return NextResponse.json(
        { error: 'clases_acceso debe ser un array de strings' },
        { status: 400 }
      )
    }
    updates.clases_acceso = clases
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'No hay campos válidos para actualizar' },
      { status: 400 }
    )
  }

  // ── 5. Actualizar en DB ──────────────────────────────────────
  const { data: updated, error: updateError } = await db
    .from('users')
    .update(updates)
    .eq('id', id)
    .select('id, email, nombre, nivel, puntos, cursos_acceso, clases_acceso')
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ student: updated })
}
