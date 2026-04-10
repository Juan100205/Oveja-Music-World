import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, signToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body) {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { email, password, nombre } = body

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
  }

  const db = getSupabaseAdmin()

  const { data: existing } = await db
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (existing) {
    return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
  }

  const password_hash = await hashPassword(password)

  const { data: user, error } = await db
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash,
      nombre: nombre ?? null,
      puntos: 0,
      nivel: 1,
      role: 'student',
    })
    .select('id, email, role, nivel, puntos, nombre, created_at')
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'Error al crear el usuario' }, { status: 500 })
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role, nivel: user.nivel })

  return NextResponse.json({ token, user }, { status: 201 })
}
