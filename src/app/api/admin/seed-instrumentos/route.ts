/**
 * POST /api/admin/seed-instrumentos
 *
 * Carga los 6 instrumentos estándar en Supabase (upsert idempotente).
 * Solo accesible por admin. Seguro de ejecutar múltiples veces.
 *
 * También garantiza que los cursos shell existan en la tabla `cursos`
 * para que el ContentManager pueda editarlos de inmediato.
 */
import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function adminGuard(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.role === 'admin' ? payload : null
}

export const SEED_INSTRUMENTOS: {
  id: string; nombre: string; emoji: string; descripcion: string
  color: string; glow: string; zona: string; curso_id: string; orden: number; activo: boolean
}[] = []

export const SEED_CURSOS: { id: string; nombre: string; emoji: string; orden: number }[] = []

export async function POST(req: NextRequest) {
  if (!adminGuard(req)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const db = getSupabaseAdmin()

  // 1. Cursos shell (idempotente)
  const { error: cursosError } = await db
    .from('cursos')
    .upsert(SEED_CURSOS, { onConflict: 'id' })

  if (cursosError) {
    return NextResponse.json({ error: `Error en cursos: ${cursosError.message}` }, { status: 500 })
  }

  // 2. Instrumentos (idempotente)
  const { data, error: instrError } = await db
    .from('instrumentos')
    .upsert(SEED_INSTRUMENTOS, { onConflict: 'id' })
    .select('id, nombre, zona')

  if (instrError) {
    return NextResponse.json({ error: `Error en instrumentos: ${instrError.message}` }, { status: 500 })
  }

  return NextResponse.json({
    ok:       true,
    seeded:   SEED_INSTRUMENTOS.length,
    results:  data ?? [],
  })
}
