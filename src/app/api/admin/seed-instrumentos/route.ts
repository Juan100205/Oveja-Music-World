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

export const SEED_INSTRUMENTOS = [
  {
    id:          'bateria',
    nombre:      'Batería',
    emoji:       '🥁',
    descripcion: 'Ritmo, técnica y coordinación percusiva',
    color:       'linear-gradient(135deg, #3db8fa, #6dd5ff)',
    glow:        'rgba(61,184,250,0.45)',
    zona:        'ambos',
    curso_id:    'bateria',
    orden:       0,
    activo:      true,
  },
  {
    id:          'piano',
    nombre:      'Piano',
    emoji:       '🎹',
    descripcion: 'Teoría aplicada, lectura y repertorio',
    color:       'linear-gradient(135deg, #ec488a, #ff7eb3)',
    glow:        'rgba(236,72,138,0.45)',
    zona:        'ambos',
    curso_id:    'piano',
    orden:       1,
    activo:      true,
  },
  {
    id:          'guitarra',
    nombre:      'Guitarra',
    emoji:       '🎸',
    descripcion: 'Acordes, ritmo y canciones progresivas',
    color:       'linear-gradient(135deg, #ffa737, #ffcc80)',
    glow:        'rgba(255,167,55,0.45)',
    zona:        'ambos',
    curso_id:    'guitarra-adultos',
    orden:       2,
    activo:      true,
  },
  {
    id:          'canto',
    nombre:      'Canto',
    emoji:       '🎤',
    descripcion: 'Técnica vocal, respiración y repertorio',
    color:       'linear-gradient(135deg, #9b54f9, #c084ff)',
    glow:        'rgba(155,84,249,0.45)',
    zona:        'ambos',
    curso_id:    'canto',
    orden:       3,
    activo:      true,
  },
  {
    id:          'violin',
    nombre:      'Violín',
    emoji:       '🎻',
    descripcion: 'Postura, arco y técnica de cuerdas',
    color:       'linear-gradient(135deg, #ec488a, #ffa737)',
    glow:        'rgba(236,72,138,0.45)',
    zona:        'ambos',
    curso_id:    'violin',
    orden:       4,
    activo:      true,
  },
  {
    id:          'introduccion',
    nombre:      'Introducción Musical',
    emoji:       '🎵',
    descripcion: 'Fundamentos del lenguaje musical',
    color:       'linear-gradient(135deg, #3db8fa, #9b54f9)',
    glow:        'rgba(100,150,255,0.45)',
    zona:        'ambos',
    curso_id:    'ciudad-musical',
    orden:       5,
    activo:      true,
  },
]

export const SEED_CURSOS = [
  { id: 'bateria',          nombre: 'Batería',             emoji: '🥁', orden: 0 },
  { id: 'piano',            nombre: 'Piano',               emoji: '🎹', orden: 1 },
  { id: 'guitarra-adultos', nombre: 'Guitarra',            emoji: '🎸', orden: 2 },
  { id: 'canto',            nombre: 'Canto',               emoji: '🎤', orden: 3 },
  { id: 'violin',           nombre: 'Violín',              emoji: '🎻', orden: 4 },
  { id: 'ciudad-musical',   nombre: 'Introducción Musical', emoji: '🎵', orden: 5 },
]

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
