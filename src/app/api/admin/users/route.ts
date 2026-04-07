import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken, hashPassword } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function requireAdmin(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload || payload.role !== 'admin') return null
  return payload
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('users')
    .select('id, email, nombre, role, nivel, puntos, cursos_acceso, clases_acceso, created_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data ?? [] })
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: 'email y password son requeridos' }, { status: 400 })
  }

  if (body.password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
  }

  const db = getSupabaseAdmin()

  // Verificar que no exista
  const { data: existing } = await db
    .from('users')
    .select('id')
    .eq('email', body.email.toLowerCase().trim())
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
  }

  const password_hash = await hashPassword(body.password)

  const { data, error } = await db
    .from('users')
    .insert({
      email:         body.email.toLowerCase().trim(),
      nombre:        body.nombre?.trim() || null,
      password_hash,
      role:          body.role ?? 'student',
      nivel:         1,
      puntos:        0,
      cursos_acceso: body.cursos_acceso ?? [],
      clases_acceso: body.clases_acceso ?? [],
    })
    .select('id, email, nombre, role, nivel, puntos, cursos_acceso, clases_acceso, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ user: data }, { status: 201 })
}
