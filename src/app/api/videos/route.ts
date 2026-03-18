import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { filtrarVideos } from '@/lib/videos'
import { puedeAccederZona } from '@/lib/gamification'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Video } from '@/types'

const DEV_MODE = process.env.NODE_ENV === 'development'

// ── Mock videos por zona usando YouTube ──
const DEV_VIDEOS: Video[] = [
  // Piano (nivel 1)
  {
    id: 'yt-piano-1',
    titulo: 'Introducción al Piano — Postura y Primeras Notas',
    url: 'https://www.youtube.com/watch?v=YFiuHTnwJw4',
    nivel_requerido: 1,
    zona_id: 'piano',
    duracion_segundos: 600,
    puntos_al_completar: 20,
  },
  {
    id: 'yt-piano-2',
    titulo: 'Escalas Mayores para Principiantes',
    url: 'https://www.youtube.com/watch?v=YFiuHTnwJw4',
    nivel_requerido: 1,
    zona_id: 'piano',
    duracion_segundos: 480,
    puntos_al_completar: 20,
  },
  // Percusión (nivel 1)
  {
    id: 'yt-percusion-1',
    titulo: 'Ritmos Básicos de Batería',
    url: 'https://www.youtube.com/watch?v=YFiuHTnwJw4',
    nivel_requerido: 1,
    zona_id: 'percusion',
    duracion_segundos: 540,
    puntos_al_completar: 20,
  },
  {
    id: 'yt-percusion-2',
    titulo: 'Coordinación de Manos y Pies',
    url: 'https://www.youtube.com/watch?v=YFiuHTnwJw4',
    nivel_requerido: 1,
    zona_id: 'percusion',
    duracion_segundos: 420,
    puntos_al_completar: 20,
  },
  // Jazz (nivel 3)
  {
    id: 'yt-jazz-1',
    titulo: 'Armonía Jazz — Acordes de 7ma',
    url: 'https://www.youtube.com/watch?v=YFiuHTnwJw4',
    nivel_requerido: 3,
    zona_id: 'jazz',
    duracion_segundos: 720,
    puntos_al_completar: 20,
  },
  {
    id: 'yt-jazz-2',
    titulo: 'Improvisación sobre Blues en Fa',
    url: 'https://www.youtube.com/watch?v=YFiuHTnwJw4',
    nivel_requerido: 3,
    zona_id: 'jazz',
    duracion_segundos: 660,
    puntos_al_completar: 20,
  },
  // Producción (nivel 5)
  {
    id: 'yt-prod-1',
    titulo: 'Mezcla y Masterización Básica',
    url: 'https://www.youtube.com/watch?v=YFiuHTnwJw4',
    nivel_requerido: 5,
    zona_id: 'produccion',
    duracion_segundos: 900,
    puntos_al_completar: 20,
  },
  {
    id: 'yt-prod-2',
    titulo: 'Creación de Beats desde Cero',
    url: 'https://www.youtube.com/watch?v=YFiuHTnwJw4',
    nivel_requerido: 5,
    zona_id: 'produccion',
    duracion_segundos: 780,
    puntos_al_completar: 20,
  },
]

export async function GET(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const zonaId = req.nextUrl.searchParams.get('zona')
  if (!zonaId) return NextResponse.json({ error: 'Parámetro zona requerido' }, { status: 400 })

  // ── Dev mode: retorna mock videos ──
  if (DEV_MODE) {
    // Nivel requerido por zona
    const ZONA_NIVELES: Record<string, number> = {
      piano: 1, percusion: 1, jazz: 3, produccion: 5,
    }
    const nivelZona = ZONA_NIVELES[zonaId] ?? 1

    if (!puedeAccederZona(payload.nivel, nivelZona)) {
      return NextResponse.json(
        { error: `Necesitas nivel ${nivelZona} para acceder a esta zona` },
        { status: 403 }
      )
    }

    const videos = filtrarVideos(DEV_VIDEOS, zonaId, payload.nivel)
    return NextResponse.json({ videos })
  }

  // ── Producción: Supabase ──
  const db = getSupabaseAdmin()

  const { data: zona } = await db
    .from('zones')
    .select('id, nivel_requerido')
    .eq('id', zonaId)
    .single()

  if (!zona) return NextResponse.json({ error: 'Zona no encontrada' }, { status: 404 })

  if (!puedeAccederZona(payload.nivel, zona.nivel_requerido)) {
    return NextResponse.json(
      { error: `Necesitas nivel ${zona.nivel_requerido} para acceder a esta zona` },
      { status: 403 }
    )
  }

  const { data: videos, error } = await db
    .from('videos')
    .select('id, titulo, url, nivel_requerido, zona_id, duracion_segundos, puntos_al_completar')
    .eq('zona_id', zonaId)
    .order('nivel_requerido', { ascending: true })

  if (error) return NextResponse.json({ error: 'Error al obtener videos' }, { status: 500 })

  return NextResponse.json({ videos: filtrarVideos(videos ?? [], zonaId, payload.nivel) })
}
