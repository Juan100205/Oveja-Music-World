import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { calcularNivel } from '@/lib/gamification'
import { PUNTOS_POR_TIPO } from '@/types'

export async function GET(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data } = await db
    .from('completions')
    .select('resource_url')
    .eq('user_id', payload.sub)

  return NextResponse.json({ completed: (data ?? []).map(r => r.resource_url) })
}

export async function POST(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.url || !body?.tipo) {
    return NextResponse.json({ error: 'url y tipo requeridos' }, { status: 400 })
  }

  const db = getSupabaseAdmin()

  // Verificar si ya fue completado
  const { data: existing } = await db
    .from('completions')
    .select('id')
    .eq('user_id', payload.sub)
    .eq('resource_url', body.url)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ ya_completado: true, puntos_ganados: 0 })
  }

  const puntos = PUNTOS_POR_TIPO[body.tipo] ?? 5

  // Registrar completion
  await db.from('completions').insert({
    user_id:      payload.sub,
    resource_url: body.url,
    tipo:         body.tipo,
    puntos,
    completed_at: new Date().toISOString(),
  })

  // Sumar puntos al usuario
  const { data: user } = await db
    .from('users')
    .select('puntos, nivel')
    .eq('id', payload.sub)
    .single()

  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const nuevosPuntos = user.puntos + puntos
  const nuevoNivel = calcularNivel(nuevosPuntos)

  await db
    .from('users')
    .update({ puntos: nuevosPuntos, nivel: nuevoNivel })
    .eq('id', payload.sub)

  return NextResponse.json({
    ya_completado: false,
    puntos_ganados: puntos,
    total_puntos: nuevosPuntos,
    nivel: nuevoNivel,
    subio_nivel: nuevoNivel > user.nivel,
  })
}
