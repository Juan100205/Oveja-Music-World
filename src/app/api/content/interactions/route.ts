import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET /api/content/interactions?url=<encoded_url>
// Public — no auth required (curriculum content, not sensitive)
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ interacciones: [] })

  const db = getSupabaseAdmin()
  const { data } = await db
    .from('recursos')
    .select('interacciones')
    .eq('url', url)
    .maybeSingle()

  return NextResponse.json({
    interacciones: data?.interacciones ?? [],
  })
}
