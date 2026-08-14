/**
 * @jest-environment node
 *
 * TDD — Flujo completo de progreso + subida de nivel
 *
 * Verifica el ciclo de vida completo:
 *   1. Video visto → POST /api/progress → puntos otorgados
 *   2. Puntos acumulados → calcularNivel → nivel actualizado en DB
 *   3. subio_nivel: true cuando se cruza umbral
 *   4. Todos los umbrales: L1→L2 (100pts), L2→L3 (300pts), L3→L4 (600pts), L4→L5 (1000pts)
 *   5. No sube más allá de nivel 5
 *   6. Recursos duplicados también generan puntos (repetición permitida)
 *   7. Distintos tipos de recursos generan distintos puntos
 */

import { NextRequest } from 'next/server'

// ── Auth mock ──────────────────────────────────────────────────
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  extractTokenFromHeader: jest.fn(),
  verifyToken:            jest.fn(),
}))

import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
const mockExtract = extractTokenFromHeader as jest.Mock
const mockVerify  = verifyToken as jest.Mock

// ── Supabase mock ──────────────────────────────────────────────
const mockFrom = jest.fn()
jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({ from: (...a: unknown[]) => mockFrom(...a) }),
}))

import { POST as postProgress, GET as getProgress } from '@/app/api/progress/route'

// ── Helpers ────────────────────────────────────────────────────
function makeChain(resolved: unknown) {
  const c: Record<string, unknown> = {}
  ;['select','insert','update','delete','eq','order','limit','is'].forEach(m => {
    c[m] = jest.fn().mockReturnValue(c)
  })
  c.single      = jest.fn().mockResolvedValue(resolved)
  c.maybeSingle = jest.fn().mockResolvedValue(resolved)
  c.then  = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(res, rej)
  c.catch = (rej: (e: unknown) => unknown) => Promise.resolve(resolved).catch(rej)
  return c
}

function authAs(sub: string, nivel = 1) {
  mockExtract.mockReturnValue('tok')
  mockVerify.mockReturnValue({ sub, email: `${sub}@test.com`, role: 'student', nivel })
}

function makeReq(body?: unknown) {
  return new NextRequest('http://localhost/api/progress', {
    method:  body !== undefined ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
}

/**
 * Configura mocks para una sesión POST /progress exitosa.
 * Simula (la ruta siempre ejecuta todos los pasos, incluso en repeticiones):
 *   1. recursos lookup (maybeSingle) → resource found
 *   2. completions insert
 *   3. users select (puntos, nivel) → userData
 *   4. config_niveles select → vacío → fallback a LEVEL_CONFIG estático
 *   5. users update
 */
function setupProgressMock(opts: {
  userPuntos: number            // puntos actuales del usuario
  userNivel:  number            // nivel actual del usuario
}) {
  const { userPuntos, userNivel } = opts

  mockFrom
    .mockReturnValueOnce(makeChain({ data: { id: 'r-1', puntos: null }, error: null })) // recursos lookup
    .mockReturnValueOnce(makeChain({ data: null, error: null }))                             // insert completion
    .mockReturnValueOnce(makeChain({ data: { puntos: userPuntos, nivel: userNivel }, error: null })) // user select
    .mockReturnValueOnce(makeChain({ data: [], error: null }))                                // config_niveles (vacío → fallback estático)
    .mockReturnValueOnce(makeChain({ data: null, error: null }))                             // user update
}

afterEach(() => jest.resetAllMocks())

// ══════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════
describe('POST /api/progress — auth', () => {
  it('401 sin token', async () => {
    mockExtract.mockReturnValue(null)
    const res = await postProgress(makeReq({ url: 'https://yt.com', tipo: 'video' }))
    expect(res.status).toBe(401)
  })

  it('401 token inválido', async () => {
    mockExtract.mockReturnValue('bad')
    mockVerify.mockReturnValue(null)
    const res = await postProgress(makeReq({ url: 'https://yt.com', tipo: 'video' }))
    expect(res.status).toBe(401)
  })
})

// ══════════════════════════════════════════════════════════════
// VALIDACIONES
// ══════════════════════════════════════════════════════════════
describe('POST /api/progress — validaciones', () => {
  beforeEach(() => authAs('u-1'))

  it('400 sin url', async () => {
    const res = await postProgress(makeReq({ tipo: 'video' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/url/i)
  })

  it('400 sin tipo', async () => {
    const res = await postProgress(makeReq({ url: 'https://yt.com' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/tipo/i)
  })

  it('400 body nulo', async () => {
    mockExtract.mockReturnValue('tok')
    mockVerify.mockReturnValue({ sub: 'u-1', role: 'student', nivel: 1 })
    const res = await postProgress(new NextRequest('http://localhost/api/progress', {
      method: 'POST', body: 'NOT_JSON{{', headers: { Authorization: 'Bearer tok' },
    }))
    expect(res.status).toBe(400)
  })
})

// ══════════════════════════════════════════════════════════════
// PUNTOS POR TIPO DE RECURSO
// ══════════════════════════════════════════════════════════════
describe('POST /api/progress — puntos por tipo', () => {
  beforeEach(() => authAs('u-1'))

  const casos: Array<{ tipo: string; puntos: number }> = [
    { tipo: 'video',       puntos: 20 },
    { tipo: 'juego',       puntos: 10 },
    { tipo: 'drive',       puntos: 5  },
    { tipo: 'pdf',         puntos: 5  },
    { tipo: 'imagen',      puntos: 5  },
    { tipo: 'herramienta', puntos: 5  },
    { tipo: 'otro',        puntos: 5  },
  ]

  casos.forEach(({ tipo, puntos }) => {
    it(`tipo "${tipo}" otorga ${puntos} puntos`, async () => {
      setupProgressMock({ userPuntos: 0, userNivel: 1 })

      const res  = await postProgress(makeReq({ url: `https://test.com/${tipo}`, tipo }))
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.puntos_ganados).toBe(puntos)
      expect(body.ya_completado).toBe(false)
    })
  })

  it('tipo desconocido retorna 400', async () => {
    setupProgressMock({ userPuntos: 0, userNivel: 1 })

    const res  = await postProgress(makeReq({ url: 'https://test.com/raro', tipo: 'raro' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toMatch(/tipo/i)
  })
})

// ══════════════════════════════════════════════════════════════
// DUPLICADOS — no genera puntos al ver 2 veces
// ══════════════════════════════════════════════════════════════
describe('POST /api/progress — duplicados (se permiten repeticiones con puntos)', () => {
  beforeEach(() => authAs('u-1'))

  it('otorga puntos aunque el recurso ya se haya completado antes', async () => {
    setupProgressMock({ userPuntos: 80, userNivel: 1 })

    const res  = await postProgress(makeReq({ url: 'https://yt.com/visto', tipo: 'video' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ya_completado).toBe(false)
    expect(body.puntos_ganados).toBe(20)
    expect(body.total_puntos).toBe(100)
  })

  it('otorga 20 pts en primera vez (comportamiento normal)', async () => {
    setupProgressMock({ userPuntos: 0, userNivel: 1 })

    const res  = await postProgress(makeReq({ url: 'https://yt.com/nuevo', tipo: 'video' }))
    const body = await res.json()

    expect(body.ya_completado).toBe(false)
    expect(body.puntos_ganados).toBe(20)
  })
})

// ══════════════════════════════════════════════════════════════
// SUBIDA DE NIVEL — L1 → L2 (umbral: 100 pts)
// ══════════════════════════════════════════════════════════════
describe('POST /api/progress — subida de nivel L1 → L2', () => {
  beforeEach(() => authAs('u-1', 1))

  it('subio_nivel: false cuando todavía no llega a 100pts', async () => {
    // 3 videos completados = 60 pts, gana 1 más → 80 pts (< 100, no sube)
    setupProgressMock({ userPuntos: 60, userNivel: 1 })

    const res  = await postProgress(makeReq({ url: 'https://yt.com/v4', tipo: 'video' }))
    const body = await res.json()

    expect(body.subio_nivel).toBe(false)
    expect(body.total_puntos).toBe(80)  // 60 + 20
  })

  it('subio_nivel: true exactamente al llegar a 100pts (5to video)', async () => {
    // Usuario tiene 80 pts (nivel 1). Al completar video gana 20 → 100 pts → nivel 2
    setupProgressMock({ userPuntos: 80, userNivel: 1 })

    const res  = await postProgress(makeReq({ url: 'https://yt.com/v5', tipo: 'video' }))
    const body = await res.json()

    expect(body.subio_nivel).toBe(true)
    expect(body.nivel).toBe(2)
    expect(body.total_puntos).toBe(100)
  })

  it('nivel reportado es 2 después de cruzar el umbral de 100pts', async () => {
    setupProgressMock({ userPuntos: 80, userNivel: 1 })

    const res  = await postProgress(makeReq({ url: 'https://yt.com/v', tipo: 'video' }))
    const body = await res.json()

    expect(body.nivel).toBe(2)
  })

  it('con juego (10pts): al llegar exactamente a 100 → sube de nivel', async () => {
    // 90 pts + juego (10pts) = 100 pts → nivel 2
    setupProgressMock({ userPuntos: 90, userNivel: 1 })

    const res  = await postProgress(makeReq({ url: 'https://juego.com/game', tipo: 'juego' }))
    const body = await res.json()

    expect(body.subio_nivel).toBe(true)
    expect(body.nivel).toBe(2)
    expect(body.total_puntos).toBe(100)
  })
})

// ══════════════════════════════════════════════════════════════
// SUBIDA DE NIVEL — L2 → L3 (umbral: 300 pts)
// ══════════════════════════════════════════════════════════════
describe('POST /api/progress — subida de nivel L2 → L3', () => {
  beforeEach(() => authAs('u-1', 2))

  it('subio_nivel: false cuando en 280pts (no llega a 300)', async () => {
    setupProgressMock({ userPuntos: 260, userNivel: 2 })

    const res  = await postProgress(makeReq({ url: 'https://yt.com/v', tipo: 'video' }))
    const body = await res.json()

    expect(body.subio_nivel).toBe(false)
    expect(body.nivel).toBe(2)          // sigue en nivel 2
    expect(body.total_puntos).toBe(280) // 260 + 20
  })

  it('subio_nivel: true al llegar exactamente a 300pts', async () => {
    // 280 pts + video (20) = 300 → nivel 3
    setupProgressMock({ userPuntos: 280, userNivel: 2 })

    const res  = await postProgress(makeReq({ url: 'https://yt.com/v', tipo: 'video' }))
    const body = await res.json()

    expect(body.subio_nivel).toBe(true)
    expect(body.nivel).toBe(3)
    expect(body.total_puntos).toBe(300)
  })

  it('subio_nivel: true al superar 300pts (no tiene que ser exacto)', async () => {
    // 291 pts + video (20) = 311 → nivel 3
    setupProgressMock({ userPuntos: 291, userNivel: 2 })

    const res  = await postProgress(makeReq({ url: 'https://yt.com/v', tipo: 'video' }))
    const body = await res.json()

    expect(body.subio_nivel).toBe(true)
    expect(body.nivel).toBe(3)
    expect(body.total_puntos).toBe(311)
  })
})

// ══════════════════════════════════════════════════════════════
// SUBIDA DE NIVEL — L3 → L4 (umbral: 600 pts)
// ══════════════════════════════════════════════════════════════
describe('POST /api/progress — subida de nivel L3 → L4', () => {
  beforeEach(() => authAs('u-1', 3))

  it('subio_nivel: true al cruzar los 600pts', async () => {
    // 585 pts + video (20) = 605 → nivel 4
    setupProgressMock({ userPuntos: 585, userNivel: 3 })

    const res  = await postProgress(makeReq({ url: 'https://yt.com/v', tipo: 'video' }))
    const body = await res.json()

    expect(body.subio_nivel).toBe(true)
    expect(body.nivel).toBe(4)
    expect(body.total_puntos).toBe(605)
  })

  it('subio_nivel: false con 590pts (falta llegar a 600)', async () => {
    // 575 pts + video (20) = 595 → todavía nivel 3
    setupProgressMock({ userPuntos: 575, userNivel: 3 })

    const res  = await postProgress(makeReq({ url: 'https://yt.com/v', tipo: 'video' }))
    const body = await res.json()

    expect(body.subio_nivel).toBe(false)
    expect(body.nivel).toBe(3)
  })
})

// ══════════════════════════════════════════════════════════════
// SUBIDA DE NIVEL — L4 → L5 (umbral: 1000 pts)
// ══════════════════════════════════════════════════════════════
describe('POST /api/progress — subida de nivel L4 → L5', () => {
  beforeEach(() => authAs('u-1', 4))

  it('subio_nivel: true al cruzar los 1000pts', async () => {
    // 990 pts + video (20) = 1010 → nivel 5
    setupProgressMock({ userPuntos: 990, userNivel: 4 })

    const res  = await postProgress(makeReq({ url: 'https://yt.com/v', tipo: 'video' }))
    const body = await res.json()

    expect(body.subio_nivel).toBe(true)
    expect(body.nivel).toBe(5)
    expect(body.total_puntos).toBe(1010)
  })
})

// ══════════════════════════════════════════════════════════════
// NIVEL MÁXIMO — no sube más allá de nivel 5
// ══════════════════════════════════════════════════════════════
describe('POST /api/progress — nivel máximo (5)', () => {
  beforeEach(() => authAs('u-1', 5))

  it('subio_nivel: false en nivel 5 (máximo)', async () => {
    setupProgressMock({ userPuntos: 1200, userNivel: 5 })

    const res  = await postProgress(makeReq({ url: 'https://yt.com/bonus', tipo: 'video' }))
    const body = await res.json()

    expect(body.subio_nivel).toBe(false)
    expect(body.nivel).toBe(5)            // permanece en 5
    expect(body.total_puntos).toBe(1220)  // sigue acumulando puntos aunque nivel no sube
  })

  it('puntos siguen acumulándose en nivel 5', async () => {
    setupProgressMock({ userPuntos: 1500, userNivel: 5 })

    const res  = await postProgress(makeReq({ url: 'https://yt.com/extra', tipo: 'video' }))
    const body = await res.json()

    expect(body.puntos_ganados).toBe(20)
    expect(body.total_puntos).toBe(1520)
  })
})

// ══════════════════════════════════════════════════════════════
// RESPUESTA COMPLETA — estructura del body
// ══════════════════════════════════════════════════════════════
describe('POST /api/progress — estructura de respuesta', () => {
  beforeEach(() => authAs('u-1'))

  it('respuesta tiene todos los campos requeridos', async () => {
    setupProgressMock({ userPuntos: 0, userNivel: 1 })

    const res  = await postProgress(makeReq({ url: 'https://yt.com/v', tipo: 'video' }))
    const body = await res.json()

    expect(body).toHaveProperty('ya_completado')
    expect(body).toHaveProperty('puntos_ganados')
    expect(body).toHaveProperty('total_puntos')
    expect(body).toHaveProperty('nivel')
    expect(body).toHaveProperty('subio_nivel')
  })

  it('ya_completado siempre es boolean', async () => {
    setupProgressMock({ userPuntos: 50, userNivel: 1 })

    const res  = await postProgress(makeReq({ url: 'https://yt.com/v', tipo: 'video' }))
    const body = await res.json()

    expect(typeof body.ya_completado).toBe('boolean')
  })

  it('puntos_ganados siempre es número', async () => {
    setupProgressMock({ userPuntos: 50, userNivel: 1 })

    const res  = await postProgress(makeReq({ url: 'https://yt.com/v', tipo: 'video' }))
    const body = await res.json()

    expect(typeof body.puntos_ganados).toBe('number')
  })
})

// ══════════════════════════════════════════════════════════════
// GET /api/progress — lista de completados
// ══════════════════════════════════════════════════════════════
describe('GET /api/progress', () => {
  it('401 sin token', async () => {
    mockExtract.mockReturnValue(null)
    const res = await getProgress(new NextRequest('http://localhost/api/progress', {
      headers: { Authorization: '' },
    }))
    expect(res.status).toBe(401)
  })

  it('200 retorna array de URLs completadas', async () => {
    authAs('u-1')
    const completions = [
      { resource_url: 'https://yt.com/v1' },
      { resource_url: 'https://yt.com/v2' },
    ]
    mockFrom.mockReturnValue(makeChain({ data: completions, error: null }))

    const res  = await getProgress(new NextRequest('http://localhost/api/progress', {
      headers: { Authorization: 'Bearer tok' },
    }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.completed).toEqual(['https://yt.com/v1', 'https://yt.com/v2'])
  })

  it('200 retorna array vacío si no hay completados', async () => {
    authAs('u-1')
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))

    const res  = await getProgress(new NextRequest('http://localhost/api/progress', {
      headers: { Authorization: 'Bearer tok' },
    }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.completed).toEqual([])
  })
})
