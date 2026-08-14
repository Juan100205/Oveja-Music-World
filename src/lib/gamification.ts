import { LEVEL_CONFIG, PUNTOS_POR_VIDEO, type LevelConfig } from '@/types'

export { PUNTOS_POR_VIDEO }

/** Retorna el nivel correspondiente a los puntos dados */
export function calcularNivel(puntos: number, config: LevelConfig[] = LEVEL_CONFIG): number {
  let nivel = 1
  for (const c of config) {
    if (puntos >= c.puntos_requeridos) {
      nivel = c.nivel
    }
  }
  return nivel
}

/** Puntos que faltan para alcanzar el siguiente nivel. 0 si ya es nivel máximo */
export function calcularPuntosParaSiguienteNivel(puntos: number, config: LevelConfig[] = LEVEL_CONFIG): number {
  const nivelActual = calcularNivel(puntos, config)
  const maxNivel = config[config.length - 1]?.nivel ?? 1

  if (nivelActual >= maxNivel) return 0

  const siguiente = config.find(c => c.nivel === nivelActual + 1)
  if (!siguiente) return 0

  return siguiente.puntos_requeridos - puntos
}

/** Retorna true si el usuario puede acceder a la zona */
export function puedeAccederZona(nivelUsuario: number, nivelRequerido: number): boolean {
  return nivelUsuario >= nivelRequerido
}

/**
 * Progreso porcentual (0–100) dentro del nivel actual.
 * Al llegar al nivel máximo retorna 100.
 */
export function calcularProgreso(puntos: number, config: LevelConfig[] = LEVEL_CONFIG): number {
  const nivelActual = calcularNivel(puntos, config)
  const maxNivel = config[config.length - 1]?.nivel ?? 1

  if (nivelActual >= maxNivel) return 100

  const configActual = config.find(c => c.nivel === nivelActual)
  const configSiguiente = config.find(c => c.nivel === nivelActual + 1)
  if (!configActual || !configSiguiente) return 0

  const rango = configSiguiente.puntos_requeridos - configActual.puntos_requeridos
  const avance = puntos - configActual.puntos_requeridos

  if (rango <= 0) return 100
  return Math.min(100, Math.max(0, Math.round((avance / rango) * 100)))
}
