import { NextRequest } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import type { JWTPayload } from '@/types'

/** Verifica que la request lleva un token de admin válido. Retorna null si no. */
export function adminGuard(req: NextRequest): JWTPayload | null {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.role === 'admin' ? payload : null
}
