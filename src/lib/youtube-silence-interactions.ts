/**
 * Coloca interacciones en los huecos largos sin subtítulos (aprox. “silencio”
 * o música sin voz según los captions de YouTube).
 */

/** Umbral mínimo entre fin de un subtítulo e inicio del siguiente (segundos). */
export const MIN_SILENCE_GAP_SEC = 5

/** Solo se consideran huecos “largos” por encima de esto para priorizar. */
export const LONG_SILENCE_GAP_SEC = 10

/** Máximo de puntos de interacción por video. */
export const MAX_INTERACTION_TIMESTAMPS = 6

/** Evita dos interacciones demasiado seguidas (segundos). */
export const MIN_SPACING_BETWEEN_INTERACTIONS_SEC = 22

export interface RawSegment {
  offset: number
  duration: number
}

export interface SpeechRange {
  startSec: number
  endSec: number
}

/**
 * YouTube devuelve offset/duration en segundos o ms según el formato XML.
 * Si el mayor offset es muy grande, tratamos todo como milisegundos.
 */
export function transcriptSegmentsToSpeechRanges(segments: RawSegment[]): SpeechRange[] {
  if (segments.length === 0) return []
  const maxOffset = Math.max(...segments.map(s => s.offset))
  const scale = maxOffset > 20_000 ? 0.001 : 1

  return segments
    .map(s => {
      const start = s.offset * scale
      const dur = s.duration * scale
      return { startSec: start, endSec: start + Math.max(0, dur) }
    })
    .sort((a, b) => a.startSec - b.startSec)
}

export interface SilenceGap {
  /** Centro del hueco (segundos desde el inicio del video). */
  midSec: number
  /** Duración del hueco sin habla según subtítulos. */
  gapSec: number
}

/**
 * Encuentra huecos entre bloques de subtítulo ≥ minGapSec.
 * Prioriza los huecos más largos (más probable pausa o solo instrumental).
 */
export function findSilenceGapsFromSpeechRanges(
  ranges: SpeechRange[],
  minGapSec: number = MIN_SILENCE_GAP_SEC
): SilenceGap[] {
  if (ranges.length === 0) return []
  const gaps: SilenceGap[] = []

  // Silencio inicial (intro sin habla)
  const firstStart = ranges[0].startSec
  if (firstStart >= minGapSec) {
    gaps.push({ midSec: firstStart / 2, gapSec: firstStart })
  }

  for (let i = 0; i < ranges.length - 1; i++) {
    const gapSec = ranges[i + 1].startSec - ranges[i].endSec
    if (gapSec >= minGapSec) {
      gaps.push({
        midSec: ranges[i].endSec + gapSec / 2,
        gapSec,
      })
    }
  }

  return gaps
}

/**
 * Elige marcas de tiempo: primero los huecos más largos, luego espaciado mínimo.
 */
export function pickInteractionTimestamps(
  gaps: SilenceGap[],
  options?: {
    max?: number
    minSpacingSec?: number
    /** Bonus: estos huecos cuentan más (segundos extra al ordenar). */
    longGapBoostAbove?: number
  }
): number[] {
  const max = options?.max ?? MAX_INTERACTION_TIMESTAMPS
  const minSpacing = options?.minSpacingSec ?? MIN_SPACING_BETWEEN_INTERACTIONS_SEC
  const boostAbove = options?.longGapBoostAbove ?? LONG_SILENCE_GAP_SEC

  if (gaps.length === 0) return []

  const scored = gaps.map(g => ({
    ...g,
    score: g.gapSec + (g.gapSec >= boostAbove ? g.gapSec * 0.15 : 0),
  }))
  scored.sort((a, b) => b.score - a.score)

  const times: number[] = []
  for (const g of scored) {
    const t = Math.round(g.midSec)
    if (t < 3) continue
    if (times.some(existing => Math.abs(existing - t) < minSpacing)) continue
    times.push(t)
    if (times.length >= max) break
  }

  times.sort((a, b) => a - b)
  return times
}

/** Timestamps de respaldo si no hay transcript o no hay huecos válidos. */
export function fallbackInteractionTimestamps(): number[] {
  return [48, 132, 210]
}

/**
 * Pipeline completo: segmentos crudos → segundos donde poner interacciones.
 */
export function computeInteractionTimestampsFromTranscriptSegments(
  segments: RawSegment[]
): number[] {
  const ranges = transcriptSegmentsToSpeechRanges(segments)
  if (ranges.length === 0) return []

  let gaps = findSilenceGapsFromSpeechRanges(ranges, MIN_SILENCE_GAP_SEC)
  let times = pickInteractionTimestamps(gaps)

  // Si casi no hay huecos largos, relajar umbral una vez
  if (times.length < 2 && segments.length > 3) {
    gaps = findSilenceGapsFromSpeechRanges(ranges, Math.max(3, MIN_SILENCE_GAP_SEC - 2))
    times = pickInteractionTimestamps(gaps)
  }

  if (times.length === 0) return []
  return times
}
