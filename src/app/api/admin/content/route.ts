import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function adminGuard(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload || payload.role !== 'admin') return null
  return payload
}

// GET /api/admin/content          → lista de cursos
// GET /api/admin/content?id=piano → curso completo con árbol
export async function GET(req: NextRequest) {
  if (!adminGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const db = getSupabaseAdmin()
  const cursoId = req.nextUrl.searchParams.get('id')

  if (!cursoId) {
    const { data, error } = await db
      .from('cursos')
      .select('id, nombre, emoji, orden')
      .order('orden')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ cursos: data ?? [] })
  }

  // Árbol completo para un curso
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
