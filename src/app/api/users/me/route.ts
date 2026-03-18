import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { calcularNivel, calcularProgreso, calcularPuntosParaSiguienteNivel } from '@/lib/gamification'

export async function GET(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const db = getSupabaseAdmin()

  const { data: user, error } = await db
    .from('users')
    .select('id, email, role, nivel, puntos, nombre, created_at')
    .eq('id', payload.sub)
    .single()

  if (error || !user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  return NextResponse.json({
    user,
    gamification: {
      nivel: calcularNivel(user.puntos),
      progreso: calcularProgreso(user.puntos),
      puntos_para_siguiente: calcularPuntosParaSiguienteNivel(user.puntos),
    },
  })
}

export async function PATCH(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const puntosGanados: number = body?.puntos ?? 0

  if (puntosGanados <= 0) return NextResponse.json({ error: 'Puntos inválidos' }, { status: 400 })

  const db = getSupabaseAdmin()

  const { data: user } = await db
    .from('users')
    .select('puntos')
    .eq('id', payload.sub)
    .single()

  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const nuevosPuntos = user.puntos + puntosGanados
  const nuevoNivel = calcularNivel(nuevosPuntos)

  const { data: updated } = await db
    .from('users')
    .update({ puntos: nuevosPuntos, nivel: nuevoNivel })
    .eq('id', payload.sub)
    .select('id, puntos, nivel')
    .single()

  return NextResponse.json({
    puntos: updated?.puntos,
    nivel: updated?.nivel,
    subio_nivel: nuevoNivel > payload.nivel,
    progreso: calcularProgreso(nuevosPuntos),
  })
}
