import type { VideoCard, CardTipo } from '@/types'

/**
 * Ordena las cartas por tiempo ascendente (inmutable).
 */
export function sortCardsByTime(cards: VideoCard[]): VideoCard[] {
  return [...cards].sort((a, b) => a.tiempo - b.tiempo)
}

/**
 * Dado el segundo actual del video y el conjunto de IDs ya mostradas,
 * retorna la primera carta que debe dispararse (±1 s de tolerancia).
 * Retorna null si no hay ninguna pendiente en ese instante.
 */
export function findCardToShow(
  cards: VideoCard[],
  currentSec: number,
  shownIds: Set<string>
): VideoCard | null {
  for (const card of cards) {
    if (!shownIds.has(card.id) && Math.abs(currentSec - card.tiempo) <= 1) {
      return card
    }
  }
  return null
}

/**
 * Valida que una carta tiene todos los campos requeridos según su tipo.
 * Retorna { valid: true } o { valid: false, error: string }.
 */
export function validateCard(
  card: Partial<VideoCard> & { tipo?: CardTipo }
): { valid: boolean; error?: string } {
  if (!card.id?.trim())
    return { valid: false, error: 'id es requerido' }
  if (card.tiempo === undefined || card.tiempo < 0)
    return { valid: false, error: 'tiempo debe ser >= 0' }

  switch (card.tipo) {
    case 'texto':
      if (!('texto' in card) || !(card as { texto?: string }).texto?.trim())
        return { valid: false, error: 'CardTexto: texto es requerido' }
      break
    case 'boton':
      if (!('texto' in card) || !(card as { texto?: string }).texto?.trim())
        return { valid: false, error: 'CardBoton: texto es requerido' }
      if (!('boton_label' in card) || !(card as { boton_label?: string }).boton_label?.trim())
        return { valid: false, error: 'CardBoton: boton_label es requerido' }
      break
    case 'countdown':
      if (!('instruccion' in card) || !(card as { instruccion?: string }).instruccion?.trim())
        return { valid: false, error: 'CardCountdown: instruccion es requerida' }
      if (!('duracion' in card) || ((card as { duracion?: number }).duracion ?? 0) < 5)
        return { valid: false, error: 'CardCountdown: duracion mínima es 5 segundos' }
      break
    case 'quiz':
      if (!('pregunta' in card) || !(card as { pregunta?: string }).pregunta?.trim())
        return { valid: false, error: 'CardQuiz: pregunta es requerida' }
      if (!('opciones' in card) || ((card as { opciones?: string[] }).opciones?.length ?? 0) < 2)
        return { valid: false, error: 'CardQuiz: se requieren al menos 2 opciones' }
      break
    default:
      return { valid: false, error: 'tipo de carta inválido' }
  }

  return { valid: true }
}

/**
 * Dado el índice seleccionado y la respuesta correcta,
 * determina si la respuesta es correcta.
 * Si respuestaCorrecta es null, cualquier respuesta es válida (reflexión abierta).
 */
export function evaluateQuizAnswer(
  selected: number,
  respuestaCorrecta: number | null
): 'correct' | 'incorrect' | 'no-answer-key' {
  if (respuestaCorrecta === null) return 'no-answer-key'
  return selected === respuestaCorrecta ? 'correct' : 'incorrect'
}

/**
 * Formatea segundos a string "m:ss".
 */
export function formatCardTime(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60)
  const s = totalSecs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Parsea "m:ss" o un número como string a segundos.
 */
export function parseCardTime(str: string): number {
  const parts = str.split(':')
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10)
    const s = parseInt(parts[1], 10)
    if (!isNaN(m) && !isNaN(s)) return m * 60 + s
  }
  const direct = parseInt(str, 10)
  return isNaN(direct) ? 0 : direct
}
