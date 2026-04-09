import { NextRequest } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { JWTPayload } from '@/types'

interface GuardResult {
  payload: JWTPayload
  cursosAcceso: string[] | null // null = admin (acceso a todo)
}

export async function teacherGuard(req: NextRequest): Promise<GuardResult | null> {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload) return null
  if (payload.role !== 'teacher' && payload.role !== 'admin') return null

  if (payload.role === 'admin') {
    return { payload, cursosAcceso: null }
  }

  const db = getSupabaseAdmin()
  const { data: user } = await db
    .from('users')
    .select('cursos_acceso')
    .eq('id', payload.sub)
    .single()

  return { payload, cursosAcceso: (user?.cursos_acceso as string[]) ?? [] }
}

export function canAccess(cursosAcceso: string[] | null, cursoId: string): boolean {
  return cursosAcceso === null || cursosAcceso.includes(cursoId)
}
