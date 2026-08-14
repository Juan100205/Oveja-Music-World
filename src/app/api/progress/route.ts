import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { calcularNivel } from '@/lib/gamification'
import { loadNivelesConfig } from '@/lib/niveles'
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

  const TIPOS_VALIDOS = Object.keys(PUNTOS_POR_TIPO)
  if (!TIPOS_VALIDOS.includes(body.tipo)) {
    return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 })
  }

  // Instrumento opcional — si llega, los puntos se acumulan por separado
  // en `puntos_por_instrumento` y el nivel se calcula con la config de
  // ese instrumento. Si no llega, se conserva el comportamiento global.
  const instrumento = typeof body.instrumento === 'string' && body.instrumento.trim()
    ? body.instrumento.trim()
    : null

  const db = getSupabaseAdmin()

  // Validar que la URL corresponde a un recurso real del currículo y leer puntos config
  // Normalizar: trim y decodificar para evitar discrepancias por whitespace/encoding
  let normalizedUrl = body.url.trim()
  try { normalizedUrl = decodeURIComponent(normalizedUrl) } catch { /* ya está en formato plano */ }
  const { data: recurso } = await db
    .from('recursos')
    .select('id, puntos')
    .eq('url', normalizedUrl)
    .maybeSingle()

  const puntos = recurso?.puntos ?? (PUNTOS_POR_TIPO[body.tipo] ?? 5)

  // Registrar completion (permite duplicados — el alumno gana puntos cada vez que practica)
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
    .select('puntos, nivel, puntos_por_instrumento')
    .eq('id', payload.sub)
    .single()

  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const puntosPorInstrumento = (user.puntos_por_instrumento as Record<string, number> | null) ?? {}
  const nuevosPuntos = (user.puntos ?? 0) + puntos

  const configNiveles = await loadNivelesConfig(instrumento)
  const nuevosPuntosInstrumento = instrumento
    ? (puntosPorInstrumento[instrumento] ?? 0) + puntos
    : nuevosPuntos
  const nuevoNivel = calcularNivel(nuevosPuntosInstrumento, configNiveles)

  const nivelAnterior = instrumento
    ? calcularNivel(puntosPorInstrumento[instrumento] ?? 0, configNiveles)
    : user.nivel

  const update = instrumento
    ? {
        puntos: nuevosPuntos,
        nivel:  calcularNivel(nuevosPuntos, await loadNivelesConfig()),
        puntos_por_instrumento: { ...puntosPorInstrumento, [instrumento]: nuevosPuntosInstrumento },
      }
    : { puntos: nuevosPuntos, nivel: nuevoNivel }

  await db
    .from('users')
    .update(update)
    .eq('id', payload.sub)

  return NextResponse.json({
    ya_completado: false,
    puntos_ganados: puntos,
    total_puntos: nuevosPuntos,
    puntos_instrumento: nuevosPuntosInstrumento,
    instrumento,
    nivel: nuevoNivel,
    subio_nivel: nuevoNivel > nivelAnterior,
  })
}
