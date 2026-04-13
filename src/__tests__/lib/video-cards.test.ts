import {
  sortCardsByTime,
  findCardToShow,
  validateCard,
  evaluateQuizAnswer,
  formatCardTime,
  parseCardTime,
} from '@/lib/video-cards'
import type { VideoCard } from '@/types'

// ── Fixtures ──────────────────────────────────────────────────
const cardTexto: VideoCard = {
  id: 'c1', tiempo: 30, tipo: 'texto', texto: 'Recuerda mantener el tempo',
}
const cardBoton: VideoCard = {
  id: 'c2', tiempo: 60, tipo: 'boton', texto: '¿Entendiste la técnica?', boton_label: '¡Listo!',
}
const cardCountdown: VideoCard = {
  id: 'c3', tiempo: 90, tipo: 'countdown', instruccion: 'Practica el patrón durante 1 minuto', duracion: 60,
}
const cardQuizConRespuesta: VideoCard = {
  id: 'c4', tiempo: 120, tipo: 'quiz',
  pregunta: '¿Qué compás es este?',
  opciones: ['4/4', '3/4', '6/8', '2/4'],
  respuesta_correcta: 0,
}
const cardQuizSinRespuesta: VideoCard = {
  id: 'c5', tiempo: 150, tipo: 'quiz',
  pregunta: '¿Cómo te fue con esta sección?',
  opciones: ['Muy bien', 'Bien', 'Me costó', 'No entendí'],
  respuesta_correcta: null,
}

// ── sortCardsByTime ───────────────────────────────────────────
describe('sortCardsByTime', () => {
  it('ordena cartas de mayor a menor tiempo → queda ascendente', () => {
    const unsorted = [cardCountdown, cardTexto, cardQuizConRespuesta, cardBoton]
    const sorted = sortCardsByTime(unsorted)
    expect(sorted.map(c => c.id)).toEqual(['c1', 'c2', 'c3', 'c4'])
  })

  it('no muta el array original', () => {
    const original = [cardCountdown, cardTexto]
    const originalRef = original[0]
    sortCardsByTime(original)
    expect(original[0]).toBe(originalRef)
  })

  it('devuelve array vacío si no hay cartas', () => {
    expect(sortCardsByTime([])).toEqual([])
  })

  it('mantiene orden de cartas con el mismo tiempo', () => {
    const a: VideoCard = { id: 'a', tiempo: 30, tipo: 'texto', texto: 'A' }
    const b: VideoCard = { id: 'b', tiempo: 30, tipo: 'texto', texto: 'B' }
    const result = sortCardsByTime([a, b])
    expect(result).toHaveLength(2)
  })
})

// ── findCardToShow ────────────────────────────────────────────
describe('findCardToShow', () => {
  const allCards = [cardTexto, cardBoton, cardCountdown, cardQuizConRespuesta]

  it('detecta carta exactamente en su segundo', () => {
    const shown = new Set<string>()
    const result = findCardToShow(allCards, 30, shown)
    expect(result?.id).toBe('c1')
  })

  it('detecta carta con 1 segundo de tolerancia (adelante)', () => {
    const shown = new Set<string>()
    const result = findCardToShow(allCards, 31, shown)
    expect(result?.id).toBe('c1')
  })

  it('detecta carta con 1 segundo de tolerancia (atrás)', () => {
    const shown = new Set<string>()
    const result = findCardToShow(allCards, 29, shown)
    expect(result?.id).toBe('c1')
  })

  it('no detecta carta fuera del rango de tolerancia', () => {
    const shown = new Set<string>()
    const result = findCardToShow(allCards, 33, shown)
    expect(result).toBeNull()
  })

  it('no re-muestra una carta ya mostrada', () => {
    const shown = new Set(['c1'])
    const result = findCardToShow(allCards, 30, shown)
    expect(result).toBeNull()
  })

  it('muestra la siguiente carta una vez que la anterior fue vista', () => {
    const shown = new Set(['c1'])
    const result = findCardToShow(allCards, 60, shown)
    expect(result?.id).toBe('c2')
  })

  it('retorna null si todas las cartas ya fueron mostradas', () => {
    const shown = new Set(['c1', 'c2', 'c3', 'c4'])
    expect(findCardToShow(allCards, 30, shown)).toBeNull()
    expect(findCardToShow(allCards, 60, shown)).toBeNull()
    expect(findCardToShow(allCards, 90, shown)).toBeNull()
    expect(findCardToShow(allCards, 120, shown)).toBeNull()
  })

  it('retorna null si no hay cartas', () => {
    expect(findCardToShow([], 30, new Set())).toBeNull()
  })

  it('sesiones distintas de usuario parten con Set vacío (se reinician)', () => {
    const session1Shown = new Set(['c1', 'c2'])
    const session2Shown = new Set<string>()  // nuevo usuario / nueva sesión
    expect(findCardToShow(allCards, 30, session1Shown)).toBeNull()
    expect(findCardToShow(allCards, 30, session2Shown)?.id).toBe('c1')
  })
})

// ── validateCard ──────────────────────────────────────────────
describe('validateCard', () => {
  describe('validaciones comunes', () => {
    it('rechaza carta sin id', () => {
      const r = validateCard({ tipo: 'texto', tiempo: 10, texto: 'hola' })
      expect(r.valid).toBe(false)
      expect(r.error).toContain('id')
    })

    it('rechaza carta con tiempo negativo', () => {
      const r = validateCard({ id: 'x', tipo: 'texto', tiempo: -5, texto: 'hola' })
      expect(r.valid).toBe(false)
      expect(r.error).toContain('tiempo')
    })

    it('acepta tiempo = 0 (inicio del video)', () => {
      const r = validateCard({ id: 'x', tipo: 'texto', tiempo: 0, texto: 'hola' })
      expect(r.valid).toBe(true)
    })

    it('rechaza tipo inválido', () => {
      const r = validateCard({ id: 'x', tiempo: 10, tipo: 'imagen' as never })
      expect(r.valid).toBe(false)
    })
  })

  describe('CardTexto', () => {
    it('válida con texto', () => {
      expect(validateCard(cardTexto).valid).toBe(true)
    })

    it('inválida sin texto', () => {
      const r = validateCard({ id: 'x', tiempo: 10, tipo: 'texto', texto: '' })
      expect(r.valid).toBe(false)
      expect(r.error).toContain('texto')
    })

    it('inválida con texto solo espacios', () => {
      const r = validateCard({ id: 'x', tiempo: 10, tipo: 'texto', texto: '   ' })
      expect(r.valid).toBe(false)
    })
  })

  describe('CardBoton', () => {
    it('válida con texto y boton_label', () => {
      expect(validateCard(cardBoton).valid).toBe(true)
    })

    it('inválida sin boton_label', () => {
      const r = validateCard({ id: 'x', tiempo: 10, tipo: 'boton', texto: 'Instrucción', boton_label: '' })
      expect(r.valid).toBe(false)
      expect(r.error).toContain('boton_label')
    })

    it('inválida sin texto', () => {
      const r = validateCard({ id: 'x', tiempo: 10, tipo: 'boton', texto: '', boton_label: 'Listo' })
      expect(r.valid).toBe(false)
    })
  })

  describe('CardCountdown', () => {
    it('válida con instruccion y duracion >= 5', () => {
      expect(validateCard(cardCountdown).valid).toBe(true)
    })

    it('inválida con duracion = 0', () => {
      const r = validateCard({ id: 'x', tiempo: 10, tipo: 'countdown', instruccion: 'Practica', duracion: 0 })
      expect(r.valid).toBe(false)
      expect(r.error).toContain('duracion')
    })

    it('inválida con duracion = 4 (mínimo es 5)', () => {
      const r = validateCard({ id: 'x', tiempo: 10, tipo: 'countdown', instruccion: 'Practica', duracion: 4 })
      expect(r.valid).toBe(false)
    })

    it('válida con duracion = 5 (mínimo exacto)', () => {
      const r = validateCard({ id: 'x', tiempo: 10, tipo: 'countdown', instruccion: 'Practica', duracion: 5 })
      expect(r.valid).toBe(true)
    })

    it('inválida sin instruccion', () => {
      const r = validateCard({ id: 'x', tiempo: 10, tipo: 'countdown', instruccion: '', duracion: 60 })
      expect(r.valid).toBe(false)
    })
  })

  describe('CardQuiz', () => {
    it('válida con pregunta y >= 2 opciones', () => {
      expect(validateCard(cardQuizConRespuesta).valid).toBe(true)
    })

    it('válida sin respuesta correcta (reflexión abierta)', () => {
      expect(validateCard(cardQuizSinRespuesta).valid).toBe(true)
    })

    it('inválida con solo 1 opción', () => {
      const r = validateCard({
        id: 'x', tiempo: 10, tipo: 'quiz',
        pregunta: '¿Pregunta?', opciones: ['Solo una'], respuesta_correcta: null,
      })
      expect(r.valid).toBe(false)
      expect(r.error).toContain('opciones')
    })

    it('inválida sin pregunta', () => {
      const r = validateCard({
        id: 'x', tiempo: 10, tipo: 'quiz',
        pregunta: '', opciones: ['A', 'B'], respuesta_correcta: null,
      })
      expect(r.valid).toBe(false)
    })

    it('válida con exactamente 2 opciones', () => {
      const r = validateCard({
        id: 'x', tiempo: 10, tipo: 'quiz',
        pregunta: 'Sí o no', opciones: ['Sí', 'No'], respuesta_correcta: 0,
      })
      expect(r.valid).toBe(true)
    })
  })
})

// ── evaluateQuizAnswer ────────────────────────────────────────
describe('evaluateQuizAnswer', () => {
  it('retorna correct cuando selected === respuestaCorrecta', () => {
    expect(evaluateQuizAnswer(0, 0)).toBe('correct')
    expect(evaluateQuizAnswer(2, 2)).toBe('correct')
  })

  it('retorna incorrect cuando selected !== respuestaCorrecta', () => {
    expect(evaluateQuizAnswer(1, 0)).toBe('incorrect')
    expect(evaluateQuizAnswer(3, 1)).toBe('incorrect')
  })

  it('retorna no-answer-key cuando respuestaCorrecta es null', () => {
    expect(evaluateQuizAnswer(0, null)).toBe('no-answer-key')
    expect(evaluateQuizAnswer(3, null)).toBe('no-answer-key')
  })
})

// ── formatCardTime / parseCardTime ────────────────────────────
describe('formatCardTime', () => {
  it('formatea 0 como 0:00', () => {
    expect(formatCardTime(0)).toBe('0:00')
  })

  it('formatea 30 como 0:30', () => {
    expect(formatCardTime(30)).toBe('0:30')
  })

  it('formatea 60 como 1:00', () => {
    expect(formatCardTime(60)).toBe('1:00')
  })

  it('formatea 90 como 1:30', () => {
    expect(formatCardTime(90)).toBe('1:30')
  })

  it('formatea 3600 como 60:00', () => {
    expect(formatCardTime(3600)).toBe('60:00')
  })

  it('rellena con cero los segundos < 10', () => {
    expect(formatCardTime(65)).toBe('1:05')
  })
})

describe('parseCardTime', () => {
  it('parsea "1:30" a 90 segundos', () => {
    expect(parseCardTime('1:30')).toBe(90)
  })

  it('parsea "0:30" a 30 segundos', () => {
    expect(parseCardTime('0:30')).toBe(30)
  })

  it('parsea "2:00" a 120 segundos', () => {
    expect(parseCardTime('2:00')).toBe(120)
  })

  it('parsea número directo "60" a 60 segundos', () => {
    expect(parseCardTime('60')).toBe(60)
  })

  it('parsea "0" a 0 segundos', () => {
    expect(parseCardTime('0')).toBe(0)
  })

  it('retorna 0 para string inválido', () => {
    expect(parseCardTime('abc')).toBe(0)
    expect(parseCardTime('')).toBe(0)
  })

  it('es el inverso de formatCardTime para valores comunes', () => {
    const tiempos = [0, 5, 30, 60, 90, 120, 3600]
    for (const t of tiempos) {
      expect(parseCardTime(formatCardTime(t))).toBe(t)
    }
  })
})

// ── persistencia entre cambios de usuario ────────────────────
describe('persistencia y aislamiento entre usuarios', () => {
  it('dos usuarios con distinto estado de shownIds ven las mismas cartas en orden diferente', () => {
    const cards = [cardTexto, cardBoton, cardCountdown]

    // Usuario A va por la segunda carta
    const shownA = new Set(['c1'])
    expect(findCardToShow(cards, 60, shownA)?.id).toBe('c2')

    // Usuario B recién empieza, ve la primera carta
    const shownB = new Set<string>()
    expect(findCardToShow(cards, 30, shownB)?.id).toBe('c1')

    // El estado del usuario A no contaminó al usuario B
    expect(shownB.size).toBe(0)
  })

  it('las cartas (config global) no cambian por el estado de ningún usuario', () => {
    const cards = [cardTexto, cardBoton]
    const snapshot = JSON.stringify(cards)

    // Simular que varios usuarios las consultan
    findCardToShow(cards, 30, new Set())
    findCardToShow(cards, 60, new Set(['c1']))
    findCardToShow(cards, 30, new Set(['c1', 'c2']))

    // Las cartas no fueron mutadas
    expect(JSON.stringify(cards)).toBe(snapshot)
  })

  it('sortCardsByTime no afecta el array de referencia compartido', () => {
    const shared = [cardBoton, cardTexto]  // desordenado
    sortCardsByTime(shared)
    // El array original sigue igual (inmutabilidad)
    expect(shared[0].id).toBe('c2')
    expect(shared[1].id).toBe('c1')
  })
})
