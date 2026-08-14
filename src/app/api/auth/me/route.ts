import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data: user, error } = await db
    .from('users')
    .select('id, email, role, nivel, puntos, puntos_por_instrumento, nombre, created_at, cursos_acceso, clases_acceso')
    .eq('id', payload.sub)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    user: {
      ...user,
      puntos_por_instrumento: (user.puntos_por_instrumento as Record<string, number> | null) ?? {},
    },
  })
}
