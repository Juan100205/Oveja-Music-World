import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function adminGuard(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.role === 'admin' ? payload : null
}

// POST /api/admin/content/recursos
// body: { seccion_id, url, tipo, label? }
export async function POST(req: NextRequest) {
  if (!adminGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json()
  const { seccion_id, url, tipo, label } = body

  if (!seccion_id || !url?.trim() || !tipo)
    return NextResponse.json({ error: 'seccion_id, url y tipo son requeridos' }, { status: 400 })

  const db = getSupabaseAdmin()

  const { count } = await db
    .from('recursos').select('*', { count: 'exact', head: true }).eq('seccion_id', seccion_id)

  const { data, error } = await db
    .from('recursos')
    .insert({
      seccion_id,
      url: url.trim(),
      tipo,
      label: label?.trim() || null,
      orden: count ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ recurso: data }, { status: 201 })
}
