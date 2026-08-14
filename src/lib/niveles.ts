import { getSupabaseAdmin } from '@/lib/supabase'
import { LEVEL_CONFIG, type LevelConfig } from '@/types'

/**
 * Valida un arreglo de niveles y lo devuelve ordenado por `nivel`.
 * Retorna `{ ok: false, error }` si no cumple las reglas.
 */
export function validateNiveles(
  niveles: LevelConfig[]
): { ok: true; sorted: LevelConfig[] } | { ok: false; error: string } {
  if (!Array.isArray(niveles) || niveles.length < 2) {
    return { ok: false, error: 'niveles debe ser un arreglo con al menos 2 niveles' }
  }

  const sorted = [...niveles].sort((a, b) => a.nivel - b.nivel)

  for (let i = 0; i < sorted.length; i++) {
    const l = sorted[i]

    if (!Number.isInteger(l.nivel) || l.nivel !== i + 1) {
      return { ok: false, error: `Los niveles deben ser contiguos desde 1 (error en la posición ${i + 1})` }
    }
    if (!Number.isInteger(l.puntos_requeridos) || l.puntos_requeridos < 0) {
      return { ok: false, error: `puntos_requeridos inválido en nivel ${l.nivel}` }
    }
    if (l.nivel === 1 && l.puntos_requeridos !== 0) {
      return { ok: false, error: 'El nivel 1 siempre requiere 0 puntos' }
    }
    if (typeof l.nombre !== 'string' || !l.nombre.trim()) {
      return { ok: false, error: `El nivel ${l.nivel} necesita un nombre` }
    }
    if (i > 0 && l.puntos_requeridos <= sorted[i - 1].puntos_requeridos) {
      return { ok: false, error: 'Los puntos requeridos deben ser estrictamente crecientes entre niveles' }
    }
  }

  return {
    ok: true,
    sorted: sorted.map(l => ({
      nivel:             l.nivel,
      puntos_requeridos: l.puntos_requeridos,
      nombre:            l.nombre.trim(),
    })),
  }
}

interface NivelesRow extends LevelConfig {
  instrumento_id?: string | null
}

function toLevelConfig(data: unknown): LevelConfig[] | null {
  if (!Array.isArray(data) || data.length === 0) return null

  const rows = (data as NivelesRow[]).sort((a, b) => a.nivel - b.nivel)

  const valid = rows.every(r =>
    Number.isInteger(r.nivel) &&
    Number.isInteger(r.puntos_requeridos) &&
    typeof r.nombre === 'string' &&
    r.nombre.trim().length > 0
  )
  if (!valid) return null

  return rows.map(r => ({
    nivel:             r.nivel,
    puntos_requeridos: r.puntos_requeridos,
    nombre:            r.nombre,
  }))
}

/**
 * Carga la configuración de niveles vigente para un instrumento.
 *
 * Prioridad:
 *  1. Filas del instrumento (`instrumento_id = X`)
 *  2. Filas globales (`instrumento_id IS NULL`) — si el instrumento
 *     no tiene configuración propia
 *  3. LEVEL_CONFIG (estático) — si no hay nada en la tabla
 *
 * Si `instrumentoId` no se pasa, solo se consideran las filas globales.
 *
 * SÓLO usar en server / API routes.
 */
export async function loadNivelesConfig(instrumentoId?: string | null): Promise<LevelConfig[]> {
  try {
    const db = getSupabaseAdmin()

    if (instrumentoId) {
      const { data, error } = await db
        .from('config_niveles')
        .select('*')
        .eq('instrumento_id', instrumentoId)

      if (!error) {
        const config = toLevelConfig(data)
        if (config) return config
      }
    }

    const { data, error } = await db
      .from('config_niveles')
      .select('*')
      .is('instrumento_id', null)

    if (error) return LEVEL_CONFIG

    return toLevelConfig(data) ?? LEVEL_CONFIG
  } catch {
    return LEVEL_CONFIG
  }
}
