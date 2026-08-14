import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
import { loadNivelesConfig } from '@/lib/niveles'

/**
 * GET /api/niveles?instrumento=piano
 * Configuración vigente de niveles (puntos requeridos por nivel).
 * Si se pasa `instrumento`, devuelve la config de ese instrumento
 * (con fallback a la global); si no, la global.
 * Requiere token válido (cualquier rol) — lectura pública de la tabla.
 */
export async function GET(req: NextRequest) {
  const token = extractTokenFromHeader(req.headers.get('authorization') ?? '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const instrumento = req.nextUrl.searchParams.get('instrumento')
  const niveles = await loadNivelesConfig(instrumento)
  return NextResponse.json({ niveles, instrumento })
}
