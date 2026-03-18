import { NextRequest, NextResponse } from 'next/server'
import { validateLoginCredentials, verifyPassword, signToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body) {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const validation = validateLoginCredentials(body)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { email, password } = body
  const db = getSupabaseAdmin()

  const { data: user, error } = await db
    .from('users')
    .select('id, email, role, nivel, puntos, nombre, password_hash, created_at')
    .eq('email', email.toLowerCase())
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  }

  const passwordOk = await verifyPassword(password, user.password_hash)
  if (!passwordOk) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role, nivel: user.nivel })
  const { password_hash, ...userSafe } = user

  return NextResponse.json({ token, user: userSafe })
}
