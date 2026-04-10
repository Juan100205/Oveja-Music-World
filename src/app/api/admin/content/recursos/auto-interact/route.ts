import { NextRequest, NextResponse } from 'next/server'
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

// Pool of messages per type
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

function generateInteracciones(): InteractionPoint[] {
  const tipos: InteractionTipo[] = ['practica', 'reflexion', 'reto']
  const tiempos = [55, 150]   // ~1 min y ~2.5 min — seguros para videos cortos

  return tiempos.map((at_seconds, i) => ({
    id:         crypto.randomUUID(),
    at_seconds,
    tipo:       tipos[i % tipos.length],
    mensaje:    pickRandom(MENSAJES[tipos[i % tipos.length]]),
  }))
}

// POST /api/admin/content/recursos/auto-interact
// Assigns random interactions to all YouTube videos that have none yet.
export async function POST(req: NextRequest) {
  if (!adminGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const db = getSupabaseAdmin()

  // Fetch all video-type recursos with empty/null interacciones
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

  // Bulk update — one by one (Supabase doesn't support bulk JSONB update easily)
  let updated = 0
  for (const recurso of targets) {
    const { error: upErr } = await db
      .from('recursos')
      .update({ interacciones: generateInteracciones() })
      .eq('id', recurso.id)

    if (!upErr) updated++
  }

  return NextResponse.json({
    updated,
    skipped: (recursos ?? []).length - targets.length,
  })
}
