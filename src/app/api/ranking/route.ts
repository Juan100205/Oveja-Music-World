import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/ranking
 *
 * Devuelve el top de usuarios ordenados por puntos DESC.
 * Solo estudiantes (excluye admin y teacher del ranking).
 * El campo `es_yo` marca al usuario autenticado.
 * Máximo 50 posiciones.
 */
export async function GET(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const db = getSupabaseAdmin()

  const { data, error } = await db
    .from('users')
    .select('id, nombre, email, puntos, nivel')
    .eq('role', 'student')
    .order('puntos', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const ranking = (data ?? []).map((u, i) => ({
    posicion: i + 1,
    id:       u.id,
    nombre:   u.nombre ?? u.email?.split('@')[0] ?? '—',
    puntos:   u.puntos ?? 0,
    nivel:    u.nivel  ?? 1,
    es_yo:    u.id === payload.sub,
  }))

  return NextResponse.json({ ranking })
}
