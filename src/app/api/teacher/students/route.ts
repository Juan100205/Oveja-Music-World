import { NextRequest, NextResponse } from 'next/server'
import { teacherGuard } from '@/lib/teacherGuard'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET /api/teacher/students
// Devuelve los estudiantes que tienen acceso a alguno de los cursos del docente
export async function GET(req: NextRequest) {
  const guard = await teacherGuard(req)
  if (!guard) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const db = getSupabaseAdmin()

  let query = db
    .from('users')
    .select('id, email, nombre, nivel, puntos, cursos_acceso, created_at')
    .eq('role', 'student')
    .order('nombre')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const students = guard.cursosAcceso === null
    ? (data ?? [])
    : (data ?? []).filter(u =>
        (u.cursos_acceso as string[] ?? []).some(c => guard.cursosAcceso!.includes(c))
      )

  return NextResponse.json({ students })
}
