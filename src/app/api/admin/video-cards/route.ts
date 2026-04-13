import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function authGuard(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.role === 'admin' || payload?.role === 'teacher' ? payload : null
}

// GET /api/admin/video-cards?url=<recurso_url>
export async function GET(req: NextRequest) {
  if (!authGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

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

// POST /api/admin/video-cards
// body: { recurso_url: string, cards: VideoCard[] }
export async function POST(req: NextRequest) {
  if (!authGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json()
  const { recurso_url, cards } = body

  if (!recurso_url?.trim())
    return NextResponse.json({ error: 'recurso_url es requerido' }, { status: 400 })

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('video_cards')
    .upsert(
      { recurso_url: recurso_url.trim(), cards: cards ?? [], updated_at: new Date().toISOString() },
      { onConflict: 'recurso_url' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
