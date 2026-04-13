import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET /api/video-cards?url=<recurso_url>
// Público — estudiantes consultan las cartas de un video
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ cards: [] })

  const db = getSupabaseAdmin()
  const { data } = await db
    .from('video_cards')
    .select('cards')
    .eq('recurso_url', url)
    .maybeSingle()

  return NextResponse.json({ cards: data?.cards ?? [] })
}
