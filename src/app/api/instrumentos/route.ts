import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/instrumentos
 * Devuelve los instrumentos activos de la tabla `instrumentos`.
 * Requiere token (cualquier rol).
 */
export async function GET(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('instrumentos')
    .select('id, nombre, emoji, descripcion, color, glow, zona, curso_id, orden')
    .eq('activo', true)
    .order('orden')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ instrumentos: data ?? [] })
}
