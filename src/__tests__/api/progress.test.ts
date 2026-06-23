/**
 * @jest-environment node
 *
 * Tests for POST /api/progress
 * Verifies the full points ecosystem:
 * - awarding points on first completion
 * - preventing duplicate points
 * - correct gamification calculations
 */

import { NextRequest } from 'next/server'

// ── Auth mock ─────────────────────────────────────────────────────
const mockVerifyToken             = jest.fn()
const mockExtractTokenFromHeader  = jest.fn()
jest.mock('@/lib/auth', () => ({
  extractTokenFromHeader: (...a: unknown[]) => mockExtractTokenFromHeader(...a),
  verifyToken:            (...a: unknown[]) => mockVerifyToken(...a),
}))

// ── Supabase mock factory ─────────────────────────────────────────
// Returns a fluent chain where terminal operations are jest.fn()
// configured per test via the `db` object exposed below.

interface DbSetup {
  existingCompletion: unknown   // result of maybySingle (completions check)
  recursoResult:     unknown   // result of maybySingle (recursos lookup)
  userData:           unknown   // result of single (users select)
  insertResult:       unknown   // result of insert
  updateResult:       unknown   // result of update chain
}

let dbSetup: DbSetup = {
  existingCompletion: { data: null, error: null },
  recursoResult:     { data: { id: 'r-1', puntos: null }, error: null },
  userData:           { data: { puntos: 0, nivel: 1 }, error: null },
  insertResult:       { data: null, error: null },
  updateResult:       { data: null, error: null },
}

function buildSupabaseChain() {
  let currentTable = ''
  let afterUpdate  = false
  let maybeSingleCall = 0

  const chain: Record<string, jest.Mock> = {
    from: jest.fn().mockImplementation((table: string) => {
      currentTable = table
      afterUpdate  = false
      return chain
    }),
    select: jest.fn().mockImplementation(() => chain),
    eq: jest.fn().mockImplementation(() => {
      if (afterUpdate) return Promise.resolve(dbSetup.updateResult)
      return chain
    }),
    insert: jest.fn().mockImplementation(() => Promise.resolve(dbSetup.insertResult)),
    update: jest.fn().mockImplementation(() => {
      afterUpdate = true
      return chain
    }),
    maybySingle: jest.fn(), // alias guard
    maybeSingle: jest.fn().mockImplementation(() => {
      maybeSingleCall++
      // First maybeSingle is for recursos lookup
      if (maybeSingleCall === 1) {
        return Promise.resolve(dbSetup.recursoResult)
      }
      // Subsequent maybeSingle calls are for completions check
      return Promise.resolve(dbSetup.existingCompletion)
    }),
    single: jest.fn().mockImplementation(() => {
      if (currentTable === 'users') return Promise.resolve(dbSetup.userData)
      return Promise.resolve({ data: null, error: null })
    }),
  }
  return chain
}

jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => buildSupabaseChain(),
}))

// ── Helpers ───────────────────────────────────────────────────────

function makeRequest(body: unknown, authHeader = 'Bearer valid-token') {
  return new NextRequest('http://localhost/api/progress', {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  authHeader,
    },
    body: JSON.stringify(body),
  })
}

const VALID_PAYLOAD = { sub: 'user-123', email: 'test@test.com', role: 'student', nivel: 1 }

// ── Suite: POST /api/progress ─────────────────────────────────────

describe('POST /api/progress — ecosistema de puntos', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let POST: (req: NextRequest) => Promise<any>

  beforeAll(async () => {
    const mod = await import('@/app/api/progress/route')
    POST = mod.POST
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockExtractTokenFromHeader.mockReturnValue('valid-token')
    mockVerifyToken.mockReturnValue(VALID_PAYLOAD)
    dbSetup = {
      existingCompletion: { data: null,                      error: null },
      recursoResult:      { data: { id: 'r-1', puntos: null }, error: null },
      userData:           { data: { puntos: 0, nivel: 1 }, error: null },
      insertResult:       { data: null,                      error: null },
      updateResult:       { data: null,                      error: null },
    }
  })

  // ── Auth & validation ─────────────────────────────────────────
  it('retorna 401 si no hay token', async () => {
    mockExtractTokenFromHeader.mockReturnValue('')
    const res = await POST(makeRequest({ url: 'https://youtu.be/x', tipo: 'video' }, ''))
    expect(res.status).toBe(401)
  })

  it('retorna 401 si el token es inválido', async () => {
    mockVerifyToken.mockReturnValue(null)
    const res = await POST(makeRequest({ url: 'https://youtu.be/x', tipo: 'video' }))
    expect(res.status).toBe(401)
  })

  it('retorna 400 si falta url', async () => {
    const res = await POST(makeRequest({ tipo: 'video' }))
    expect(res.status).toBe(400)
  })

  it('retorna 400 si falta tipo', async () => {
    const res = await POST(makeRequest({ url: 'https://youtu.be/x' }))
    expect(res.status).toBe(400)
  })

  // ── Duplicate prevention ──────────────────────────────────────
  it('retorna ya_completado=true y 0 puntos si el recurso ya fue completado', async () => {
    dbSetup.existingCompletion = { data: { id: 'comp-1' }, error: null }

    const res  = await POST(makeRequest({ url: 'https://youtu.be/abc', tipo: 'video' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ya_completado).toBe(true)
    expect(body.puntos_ganados).toBe(0)
  })

  // ── First completion - video ──────────────────────────────────
  it('otorga 20 puntos por video completado por primera vez', async () => {
    dbSetup.userData = { data: { puntos: 0, nivel: 1 }, error: null }

    const res  = await POST(makeRequest({ url: 'https://youtu.be/abc', tipo: 'video' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ya_completado).toBe(false)
    expect(body.puntos_ganados).toBe(20)
    expect(body.total_puntos).toBe(20)
    expect(body.nivel).toBe(1)
    expect(body.subio_nivel).toBe(false)
  })

  it('otorga 10 puntos por juego completado por primera vez', async () => {
    dbSetup.userData = { data: { puntos: 0, nivel: 1 }, error: null }

    const res  = await POST(makeRequest({ url: 'https://juego.com/x', tipo: 'juego' }))
    const body = await res.json()

    expect(body.puntos_ganados).toBe(10)
    expect(body.total_puntos).toBe(10)
  })

  it('otorga 5 puntos por drive completado', async () => {
    dbSetup.userData = { data: { puntos: 0, nivel: 1 }, error: null }

    const res  = await POST(makeRequest({ url: 'https://drive.google.com/file/x', tipo: 'drive' }))
    const body = await res.json()

    expect(body.puntos_ganados).toBe(5)
  })

  it('acumula puntos correctamente (usuario con 50pts previos + video = 70pts)', async () => {
    dbSetup.userData = { data: { puntos: 50, nivel: 1 }, error: null }

    const res  = await POST(makeRequest({ url: 'https://youtu.be/second', tipo: 'video' }))
    const body = await res.json()

    expect(body.total_puntos).toBe(70)
    expect(body.nivel).toBe(1) // still level 1 (need 100)
    expect(body.subio_nivel).toBe(false)
  })

  // ── Level-up detection ────────────────────────────────────────
  it('detecta subida a nivel 2 al cruzar el umbral de 100 puntos', async () => {
    dbSetup.userData = { data: { puntos: 90, nivel: 1 }, error: null }

    const res  = await POST(makeRequest({ url: 'https://youtu.be/levelup', tipo: 'video' }))
    const body = await res.json()

    // 90 + 20 = 110 → nivel 2
    expect(body.total_puntos).toBe(110)
    expect(body.nivel).toBe(2)
    expect(body.subio_nivel).toBe(true)
  })

  it('detecta subida a nivel 3 al cruzar 300 puntos', async () => {
    dbSetup.userData = { data: { puntos: 295, nivel: 2 }, error: null }

    const res  = await POST(makeRequest({ url: 'https://youtu.be/nivel3', tipo: 'video' }))
    const body = await res.json()

    // 295 + 20 = 315 → nivel 3
    expect(body.total_puntos).toBe(315)
    expect(body.nivel).toBe(3)
    expect(body.subio_nivel).toBe(true)
  })

  it('no sube de nivel 5 (nivel máximo, Maestro)', async () => {
    dbSetup.userData = { data: { puntos: 1000, nivel: 5 }, error: null }

    const res  = await POST(makeRequest({ url: 'https://youtu.be/maestro', tipo: 'video' }))
    const body = await res.json()

    expect(body.nivel).toBe(5)
    expect(body.subio_nivel).toBe(false)
  })

  // ── Error cases ───────────────────────────────────────────────
  it('retorna 404 si el usuario no existe en la DB', async () => {
    dbSetup.userData = { data: null, error: { message: 'not found' } }

    const res = await POST(makeRequest({ url: 'https://youtu.be/ghost', tipo: 'video' }))
    expect(res.status).toBe(404)
  })
})

// ── Suite: YouTube postMessage parsing ────────────────────────────

describe('YouTube postMessage — detección de fin de video (info === 0)', () => {
  /**
   * Replicates the exact logic in the component's message handler.
   * Tests the parsing WITHOUT React to isolate this specific concern.
   */
  function parseYTMessage(eventData: unknown): { isVideoEnd: boolean } {
    try {
      const data = typeof eventData === 'string'
        ? JSON.parse(eventData)
        : eventData
      const isVideoEnd = data != null &&
        data.event === 'onStateChange' &&
        data.info === 0          // strict equality: number 0, not string '0'
      return { isVideoEnd }
    } catch {
      return { isVideoEnd: false }
    }
  }

  it('✅ detecta fin de video — JSON string con info=0', () => {
    expect(parseYTMessage(JSON.stringify({ event: 'onStateChange', info: 0 }))).toEqual({ isVideoEnd: true })
  })

  it('✅ detecta fin de video — objeto directo (no string)', () => {
    // Some browsers / YouTube versions send the object directly
    expect(parseYTMessage({ event: 'onStateChange', info: 0 })).toEqual({ isVideoEnd: true })
  })

  it('❌ NO detecta fin — video playing (info=1)', () => {
    expect(parseYTMessage(JSON.stringify({ event: 'onStateChange', info: 1 }))).toEqual({ isVideoEnd: false })
  })

  it('❌ NO detecta fin — video paused (info=2)', () => {
    expect(parseYTMessage(JSON.stringify({ event: 'onStateChange', info: 2 }))).toEqual({ isVideoEnd: false })
  })

  it('❌ NO detecta fin — evento onReady', () => {
    expect(parseYTMessage(JSON.stringify({ event: 'onReady' }))).toEqual({ isVideoEnd: false })
  })

  it('❌ NO detecta fin — string no-JSON', () => {
    expect(parseYTMessage('not-valid-json')).toEqual({ isVideoEnd: false })
  })

  it('❌ NO detecta fin — null / undefined', () => {
    expect(parseYTMessage(null)).toEqual({ isVideoEnd: false })
    expect(parseYTMessage(undefined)).toEqual({ isVideoEnd: false })
  })

  it('❌ NO detecta fin — info como string "0" en lugar de number 0 (strict equality)', () => {
    // YouTube sends a number; if parsing breaks and returns string, must not fire
    expect(parseYTMessage(JSON.stringify({ event: 'onStateChange', info: '0' }))).toEqual({ isVideoEnd: false })
  })

  it('❌ NO detecta fin — data vacía {}', () => {
    expect(parseYTMessage(JSON.stringify({}))).toEqual({ isVideoEnd: false })
  })
})

// ── Suite: PUNTOS_POR_TIPO ────────────────────────────────────────

describe('PUNTOS_POR_TIPO — valores correctos por tipo de recurso', () => {
  let PUNTOS_POR_TIPO: Record<string, number>

  beforeAll(async () => {
    const mod = await import('@/types')
    PUNTOS_POR_TIPO = mod.PUNTOS_POR_TIPO
  })

  const expected: Record<string, number> = {
    video:       20,
    juego:       10,
    drive:        5,
    pdf:          5,
    imagen:       5,
    herramienta:  5,
    otro:         5,
  }

  Object.entries(expected).forEach(([tipo, pts]) => {
    it(`${tipo} = ${pts} puntos`, () => {
      expect(PUNTOS_POR_TIPO[tipo]).toBe(pts)
    })
  })

  it('todos los tipos tienen puntos > 0 (ningún tipo da 0 puntos)', () => {
    Object.entries(PUNTOS_POR_TIPO).forEach(([tipo, pts]) => {
      expect(pts).toBeGreaterThan(0), `Tipo "${tipo}" tiene 0 pts`
    })
  })

  it('video tiene el mayor puntaje (mayor incentivo a ver videos completos)', () => {
    const max = Math.max(...Object.values(PUNTOS_POR_TIPO))
    expect(PUNTOS_POR_TIPO.video).toBe(max)
  })
})
