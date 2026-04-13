import { NextRequest, NextResponse } from 'next/server'
import { fetchTranscript } from 'youtube-transcript'
import { extractYoutubeId } from '@/lib/youtube'
import {
  computeInteractionTimestampsFromTranscriptSegments,
  fallbackInteractionTimestamps,
} from '@/lib/youtube-silence-interactions'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { InteractionPoint, InteractionTipo } from '@/types'

function adminGuard(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.role === 'admin' ? payload : null
}

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url)
}

const MENSAJES: Record<InteractionTipo, string[]> = {
  practica: [
    '¡Pausa! Ahora practica lo que acabas de ver 🎵',
    '¡Momento de práctica! Repite el ejercicio 3 veces ✨',
    '¡Para! Toca lo que aprendiste ahora mismo 🎶',
    '¡Practica este fragmento antes de continuar! 💪',
  ],
  reflexion: [
    '¿Entendiste el concepto? Si no, vuelve a ver esta parte 🔄',
    'Tómate un momento para asimilar esto 🧘',
    '¿Tienes alguna duda? ¡Anótala antes de seguir! 📝',
    'Reflexiona: ¿puedes explicar esto con tus propias palabras? 🤔',
  ],
  reto: [
    '🔥 Reto: ¿Puedes hacerlo sin ver el video?',
    '💪 Desafío: practica durante 2 minutos sin parar',
    '🚀 ¡Reto activado! Toca esto a tu máxima velocidad',
    '⚡ Desafío: 5 repeticiones perfectas antes de continuar',
  ],
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function mapTimesToInteractions(timestamps: number[]): InteractionPoint[] {
  const tipos: InteractionTipo[] = ['practica', 'reflexion', 'reto']
  return timestamps.map((at_seconds, i) => ({
    id:         crypto.randomUUID(),
    at_seconds,
    tipo:       tipos[i % tipos.length],
    mensaje:    pickRandom(MENSAJES[tipos[i % tipos.length]]),
  }))
}

/**
 * Usa subtítulos de YouTube: los huecos largos entre líneas ≈ pausas / silencio / solo música.
 */
async function buildInteraccionesForVideoUrl(url: string): Promise<InteractionPoint[]> {
  const vid = extractYoutubeId(url)
  if (!vid) {
    return mapTimesToInteractions(fallbackInteractionTimestamps())
  }

  let segments: Array<{ offset: number; duration: number }> | null = null
  try {
    segments = await fetchTranscript(vid, { lang: 'es' })
  } catch {
    try {
      segments = await fetchTranscript(vid)
    } catch {
      segments = null
    }
  }

  if (!segments?.length) {
    return mapTimesToInteractions(fallbackInteractionTimestamps())
  }

  const times = computeInteractionTimestampsFromTranscriptSegments(segments)
  if (times.length === 0) {
    return mapTimesToInteractions(fallbackInteractionTimestamps())
  }

  return mapTimesToInteractions(times)
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

// POST /api/admin/content/recursos/auto-interact
// Rellena interacciones en videos YouTube sin interacciones, usando huecos largos en subtítulos.
export async function POST(req: NextRequest) {
  if (!adminGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const db = getSupabaseAdmin()

  const { data: recursos, error } = await db
    .from('recursos')
    .select('id, url, interacciones')
    .eq('tipo', 'video')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const targets = (recursos ?? []).filter(r => {
    const isEmpty =
      !r.interacciones ||
      (Array.isArray(r.interacciones) && r.interacciones.length === 0)
    return isEmpty && isYouTubeUrl(r.url)
  })

  if (targets.length === 0) {
    return NextResponse.json({ updated: 0, skipped: (recursos ?? []).length })
  }

  let updated = 0
  for (let i = 0; i < targets.length; i++) {
    const recurso = targets[i]
    try {
      const interacciones = await buildInteraccionesForVideoUrl(recurso.url)
      const { error: upErr } = await db
        .from('recursos')
        .update({ interacciones })
        .eq('id', recurso.id)
      if (!upErr) updated++
    } catch {
      // siguiente recurso
    }
    if (i < targets.length - 1) await delay(120)
  }

  return NextResponse.json({
    updated,
    skipped: (recursos ?? []).length - targets.length,
  })
}
