import { NextRequest, NextResponse } from 'next/server'
import { teacherGuard } from '@/lib/teacherGuard'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET /api/teacher/content          → cursos del docente
// GET /api/teacher/content?id=piano → árbol completo del curso
export async function GET(req: NextRequest) {
  const guard = await teacherGuard(req)
  if (!guard) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const db = getSupabaseAdmin()
  const cursoId = req.nextUrl.searchParams.get('id')

  if (!cursoId) {
    const query = db.from('cursos').select('id, nombre, emoji, orden').order('orden')
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const cursos = guard.cursosAcceso === null
      ? (data ?? [])
      : (data ?? []).filter(c => guard.cursosAcceso!.includes(c.id))

    return NextResponse.json({ cursos })
  }

  // Verificar acceso al curso solicitado
  if (guard.cursosAcceso !== null && !guard.cursosAcceso.includes(cursoId)) {
    return NextResponse.json({ error: 'Sin permisos para este curso' }, { status: 403 })
  }

  const { data: curso, error: ce } = await db
    .from('cursos').select('*').eq('id', cursoId).single()
  if (ce || !curso) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })

  const { data: modulos } = await db
    .from('modulos').select('*').eq('curso_id', cursoId).order('orden')

  const modulosConSecciones = await Promise.all(
    (modulos ?? []).map(async (m) => {
      const { data: secciones } = await db
        .from('secciones').select('*').eq('modulo_id', m.id).order('orden')

      const seccionesConRecursos = await Promise.all(
        (secciones ?? []).map(async (s) => {
          const { data: recursos } = await db
            .from('recursos').select('*').eq('seccion_id', s.id).order('orden')
          return { ...s, recursos: recursos ?? [] }
        })
      )
      return { ...m, secciones: seccionesConRecursos }
    })
  )

  return NextResponse.json({ curso: { ...curso, modulos: modulosConSecciones } })
}
