import { LEVEL_CONFIG, PUNTOS_POR_VIDEO } from '@/types'

export { PUNTOS_POR_VIDEO }

/** Retorna el nivel correspondiente a los puntos dados */
export function calcularNivel(puntos: number): number {
  let nivel = 1
  for (const config of LEVEL_CONFIG) {
    if (puntos >= config.puntos_requeridos) {
      nivel = config.nivel
    }
  }
  return nivel
}

/** Puntos que faltan para alcanzar el siguiente nivel. 0 si ya es nivel máximo */
export function calcularPuntosParaSiguienteNivel(puntos: number): number {
  const nivelActual = calcularNivel(puntos)
  const maxNivel = LEVEL_CONFIG[LEVEL_CONFIG.length - 1].nivel

  if (nivelActual >= maxNivel) return 0

  const siguiente = LEVEL_CONFIG.find(c => c.nivel === nivelActual + 1)
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
export function calcularProgreso(puntos: number): number {
  const nivelActual = calcularNivel(puntos)
  const maxNivel = LEVEL_CONFIG[LEVEL_CONFIG.length - 1].nivel

  if (nivelActual >= maxNivel) return 100

  const configActual = LEVEL_CONFIG.find(c => c.nivel === nivelActual)!
  const configSiguiente = LEVEL_CONFIG.find(c => c.nivel === nivelActual + 1)!

  const rango = configSiguiente.puntos_requeridos - configActual.puntos_requeridos
  const avance = puntos - configActual.puntos_requeridos

  return Math.round((avance / rango) * 100)
}
