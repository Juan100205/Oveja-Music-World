import {
  transcriptSegmentsToSpeechRanges,
  findSilenceGapsFromSpeechRanges,
  pickInteractionTimestamps,
  computeInteractionTimestampsFromTranscriptSegments,
} from '@/lib/youtube-silence-interactions'

describe('transcriptSegmentsToSpeechRanges', () => {
  it('trata offsets grandes como milisegundos', () => {
    const ranges = transcriptSegmentsToSpeechRanges([
      { offset: 0, duration: 5000 },
      { offset: 25000, duration: 4000 },
    ])
    expect(ranges[0].startSec).toBeCloseTo(0, 5)
    expect(ranges[0].endSec).toBeCloseTo(5, 5)
    expect(ranges[1].startSec).toBeCloseTo(25, 5)
  })

  it('deja segundos si los valores son pequeños', () => {
    const ranges = transcriptSegmentsToSpeechRanges([
      { offset: 0, duration: 2 },
      { offset: 10, duration: 3 },
    ])
    expect(ranges[0].endSec).toBeCloseTo(2, 5)
    expect(ranges[1].startSec).toBeCloseTo(10, 5)
  })
})

describe('findSilenceGapsFromSpeechRanges', () => {
  it('detecta hueco largo entre bloques de habla', () => {
    const gaps = findSilenceGapsFromSpeechRanges(
      [
        { startSec: 0, endSec: 5 },
        { startSec: 25, endSec: 30 },
      ],
      5
    )
    const big = gaps.find(g => g.gapSec >= 15)
    expect(big).toBeDefined()
    expect(big!.midSec).toBeCloseTo(15, 1)
  })
})

describe('computeInteractionTimestampsFromTranscriptSegments', () => {
  it('coloca marcas en el centro de huecos largos', () => {
    const times = computeInteractionTimestampsFromTranscriptSegments([
      { offset: 0, duration: 4 },
      { offset: 20, duration: 4 },
      { offset: 50, duration: 5 },
    ])
    expect(times.length).toBeGreaterThan(0)
    expect(times.every(t => t >= 3)).toBe(true)
  })
})

describe('pickInteractionTimestamps', () => {
  it('respeta espaciado mínimo', () => {
    const gaps = [
      { midSec: 30, gapSec: 20 },
      { midSec: 35, gapSec: 25 },
      { midSec: 100, gapSec: 30 },
    ]
    const t = pickInteractionTimestamps(gaps, { max: 5, minSpacingSec: 25 })
    for (let i = 1; i < t.length; i++) {
      expect(t[i] - t[i - 1]).toBeGreaterThanOrEqual(25)
    }
  })
})
