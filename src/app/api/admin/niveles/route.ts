/**
 * /api/admin/niveles?instrumento=piano
 *
 * Configuración de niveles (puntos requeridos + nombre) por instrumento.
 * El admin puede editar la config de cada instrumento (o la global si no
 * pasa `instrumento`).
 *
 * Tabla Supabase necesaria — ver supabase/migrations/004_niveles.sql y
 * 005_niveles_instrumento.sql.
 */
import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { loadNivelesConfig, validateNiveles } from '@/lib/niveles'
import type { LevelConfig } from '@/types'

function adminGuard(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.role === 'admin' ? payload : null
}

// GET /api/admin/niveles — devuelve la configuración vigente (del instrumento si se indica)
export async function GET(req: NextRequest) {
  if (!adminGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const instrumento = req.nextUrl.searchParams.get('instrumento')
  const niveles = await loadNivelesConfig(instrumento)
  return NextResponse.json({ niveles, instrumento })
}

/**
 * PUT /api/admin/niveles?instrumento=piano — reemplaza la configuración
 * del instrumento (o la global si no se pasa `instrumento`).
 * body: { niveles: LevelConfig[] }
 */
export async function PUT(req: NextRequest) {
  if (!adminGuard(req)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const niveles: LevelConfig[] = body?.niveles

  const validated = validateNiveles(niveles)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  const instrumento = req.nextUrl.searchParams.get('instrumento')
  const db = getSupabaseAdmin()

  const scope = instrumento
    ? { instrumento_id: instrumento }
    : { instrumento_id: null }

  const base = db.from('config_niveles')
  const del = instrumento
    ? await base.delete().eq('instrumento_id', instrumento)
    : await base.delete().is('instrumento_id', null)

  if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 })

  const clean = validated.sorted.map(l => ({ ...scope, ...l }))
  const { error } = await db.from('config_niveles').insert(clean)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ niveles: validated.sorted, instrumento })
}
