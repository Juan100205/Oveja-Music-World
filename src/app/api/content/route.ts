import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/content?id={cursoId}
 *
 * Returns the full course tree (modules → sections → resources) from Supabase.
 * Accessible to any authenticated role (student, teacher, admin).
 *
 * Response shape is compatible with the static Modulo[] type:
 *   { modulos: Array<{ id, nombre, secciones: Array<{ nombre, zona, recursos }> }> }
 *
 * Resources use `label` (not `nombre`) to match the static Recurso interface.
 */
export async function GET(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const cursoId = req.nextUrl.searchParams.get('id')
  if (!cursoId) return NextResponse.json({ error: 'Parámetro id requerido' }, { status: 400 })

  const db = getSupabaseAdmin()

  const { data: modulos, error: me } = await db
    .from('modulos')
    .select('id, nombre, zona, orden')
    .eq('curso_id', cursoId)
    .order('orden')

  if (me) return NextResponse.json({ error: me.message }, { status: 500 })
  if (!modulos || modulos.length === 0) {
    return NextResponse.json({ modulos: [] })
  }

  const modulosConSecciones = await Promise.all(
    modulos.map(async (m) => {
      const { data: secciones } = await db
        .from('secciones')
        .select('id, nombre, zona, orden')
        .eq('modulo_id', m.id)
        .order('orden')

      const seccionesConRecursos = await Promise.all(
        (secciones ?? []).map(async (s) => {
          const { data: recursos } = await db
            .from('recursos')
            .select('id, url, tipo, label, orden')
            .eq('seccion_id', s.id)
            .order('orden')

          return {
            nombre: s.nombre,
            zona:   s.zona ?? undefined,
            recursos: (recursos ?? []).map(r => ({
              url:   r.url,
              tipo:  r.tipo,
              label: r.label ?? undefined,
            })),
          }
        })
      )

      return {
        id:       m.id,
        nombre:   m.nombre,
        zona:     (m as { zona?: string }).zona ?? undefined,
        secciones: seccionesConRecursos,
      }
    })
  )

  return NextResponse.json({ modulos: modulosConSecciones })
}
