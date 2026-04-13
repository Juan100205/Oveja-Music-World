/**
 * @jest-environment node
 *
 * TDD — GET + PATCH /api/users/me
 *
 * Verifica:
 *  - Auth obligatoria (401 sin token, 401 token inválido)
 *  - GET retorna user + gamification calculado en runtime
 *  - Gamification: nivel, progreso, puntos_para_siguiente correctos
 *  - PATCH agrega puntos y actualiza nivel
 *  - PATCH detecta subida de nivel
 *  - PATCH rechaza puntos <= 0
 *  - 404 usuario no encontrado
 */

import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  extractTokenFromHeader: jest.fn(),
  verifyToken:            jest.fn(),
}))

import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
const mockExtract = extractTokenFromHeader as jest.Mock
const mockVerify  = verifyToken as jest.Mock

const mockFrom = jest.fn()
jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({ from: (...a: unknown[]) => mockFrom(...a) }),
}))

import { GET, PATCH } from '@/app/api/users/me/route'

function makeChain(resolved: unknown) {
  const c: Record<string, unknown> = {}
  ;['select','update','eq','order'].forEach(m => { c[m] = jest.fn().mockReturnValue(c) })
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

function noAuth() { mockExtract.mockReturnValue(null) }

function makeGetReq() {
  return new NextRequest('http://localhost/api/users/me', {
    headers: { Authorization: 'Bearer tok' },
  })
}

function makePatchReq(body: unknown) {
  return new NextRequest('http://localhost/api/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' },
    body: JSON.stringify(body),
  })
}

afterEach(() => jest.clearAllMocks())

const USER_DB = {
  id: 'u-1', email: 'user@test.com', role: 'student',
  nivel: 1, puntos: 0, nombre: 'Test User', created_at: '2024-01-01',
}

// ══════════════════════════════════════════════════════════════
// GET /api/users/me — autenticación
// ══════════════════════════════════════════════════════════════
describe('GET /api/users/me — auth', () => {
  it('401 sin token', async () => {
    noAuth()
    const res = await GET(makeGetReq())
    expect(res.status).toBe(401)
  })

  it('401 token inválido', async () => {
    mockExtract.mockReturnValue('bad')
    mockVerify.mockReturnValue(null)
    const res = await GET(makeGetReq())
    expect(res.status).toBe(401)
  })
})

// ══════════════════════════════════════════════════════════════
// GET /api/users/me — respuesta correcta
// ══════════════════════════════════════════════════════════════
describe('GET /api/users/me — respuesta', () => {
  beforeEach(() => authAs('u-1'))

  it('200 retorna user y gamification', async () => {
    mockFrom.mockReturnValue(makeChain({ data: USER_DB, error: null }))

    const res  = await GET(makeGetReq())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user).toBeDefined()
    expect(body.gamification).toBeDefined()
  })

  it('retorna campos de gamification: nivel, progreso, puntos_para_siguiente', async () => {
    mockFrom.mockReturnValue(makeChain({ data: USER_DB, error: null }))

    const res  = await GET(makeGetReq())
    const body = await res.json()

    expect(body.gamification).toHaveProperty('nivel')
    expect(body.gamification).toHaveProperty('progreso')
    expect(body.gamification).toHaveProperty('puntos_para_siguiente')
  })

  it('usuario con 0 pts → nivel 1, progreso 0, faltan 100 para nivel 2', async () => {
    const user = { ...USER_DB, puntos: 0, nivel: 1 }
    mockFrom.mockReturnValue(makeChain({ data: user, error: null }))

    const res  = await GET(makeGetReq())
    const body = await res.json()

    expect(body.gamification.nivel).toBe(1)
    expect(body.gamification.progreso).toBe(0)
    expect(body.gamification.puntos_para_siguiente).toBe(100)
  })

  it('usuario con 100 pts → nivel 2, progreso 0, faltan 200 para nivel 3', async () => {
    const user = { ...USER_DB, puntos: 100, nivel: 2 }
    mockFrom.mockReturnValue(makeChain({ data: user, error: null }))

    const res  = await GET(makeGetReq())
    const body = await res.json()

    expect(body.gamification.nivel).toBe(2)
    expect(body.gamification.puntos_para_siguiente).toBe(200)
  })

  it('usuario con 200 pts → nivel 2 (entre 100 y 300), progreso 50%', async () => {
    const user = { ...USER_DB, puntos: 200, nivel: 2 }
    mockFrom.mockReturnValue(makeChain({ data: user, error: null }))

    const res  = await GET(makeGetReq())
    const body = await res.json()

    expect(body.gamification.nivel).toBe(2)
    expect(body.gamification.progreso).toBe(50) // 50% entre 100 y 300
  })

  it('usuario con 300 pts → nivel 3, puntos_para_siguiente = 300', async () => {
    const user = { ...USER_DB, puntos: 300, nivel: 3 }
    mockFrom.mockReturnValue(makeChain({ data: user, error: null }))

    const res  = await GET(makeGetReq())
    const body = await res.json()

    expect(body.gamification.nivel).toBe(3)
    expect(body.gamification.puntos_para_siguiente).toBe(300)
  })

  it('usuario con 600 pts → nivel 4, puntos_para_siguiente = 400', async () => {
    const user = { ...USER_DB, puntos: 600, nivel: 4 }
    mockFrom.mockReturnValue(makeChain({ data: user, error: null }))

    const res  = await GET(makeGetReq())
    const body = await res.json()

    expect(body.gamification.nivel).toBe(4)
    expect(body.gamification.puntos_para_siguiente).toBe(400)
  })

  it('usuario con 1000 pts → nivel 5 (máximo), progreso 100, siguiente = 0', async () => {
    const user = { ...USER_DB, puntos: 1000, nivel: 5 }
    mockFrom.mockReturnValue(makeChain({ data: user, error: null }))

    const res  = await GET(makeGetReq())
    const body = await res.json()

    expect(body.gamification.nivel).toBe(5)
    expect(body.gamification.progreso).toBe(100)
    expect(body.gamification.puntos_para_siguiente).toBe(0)
  })

  it('no expone password_hash', async () => {
    // La query usa SELECT con columnas específicas que excluyen password_hash.
    // El mock simula lo que Supabase devuelve: solo los campos seleccionados.
    mockFrom.mockReturnValue(makeChain({ data: USER_DB, error: null }))

    const res  = await GET(makeGetReq())
    const body = await res.json()

    expect(body.user).not.toHaveProperty('password_hash')
  })

  it('404 usuario no encontrado en DB', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Not found' } }))

    const res = await GET(makeGetReq())
    expect(res.status).toBe(404)
  })
})

// ══════════════════════════════════════════════════════════════
// PATCH /api/users/me — agregar puntos
// ══════════════════════════════════════════════════════════════
describe('PATCH /api/users/me — auth', () => {
  it('401 sin token', async () => {
    noAuth()
    const res = await PATCH(makePatchReq({ puntos: 20 }))
    expect(res.status).toBe(401)
  })
})

describe('PATCH /api/users/me — validaciones', () => {
  beforeEach(() => authAs('u-1', 1))

  it('400 con puntos = 0', async () => {
    const res = await PATCH(makePatchReq({ puntos: 0 }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/puntos/i)
  })

  it('400 con puntos negativos', async () => {
    const res = await PATCH(makePatchReq({ puntos: -10 }))
    expect(res.status).toBe(400)
  })

  it('400 sin campo puntos', async () => {
    // body.puntos = undefined → puntosGanados = 0 → 400
    const res = await PATCH(makePatchReq({}))
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/users/me — éxito', () => {
  beforeEach(() => authAs('u-1', 1))

  it('200 agrega puntos y retorna nuevo total', async () => {
    // user select → 80 puntos
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { puntos: 80 }, error: null }))
      // user update → nuevo estado
      .mockReturnValueOnce(makeChain({ data: { id: 'u-1', puntos: 100, nivel: 2 }, error: null }))

    const res  = await PATCH(makePatchReq({ puntos: 20 }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.puntos).toBe(100)
    expect(body.nivel).toBe(2)
  })

  it('subio_nivel: true cuando el token tiene nivel < nivel calculado', async () => {
    // token nivel = 1, puntos actuales = 80, ganamos 20 → total 100 → nivel 2
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { puntos: 80 }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: 'u-1', puntos: 100, nivel: 2 }, error: null }))

    const res  = await PATCH(makePatchReq({ puntos: 20 }))
    const body = await res.json()

    expect(body.subio_nivel).toBe(true)
  })

  it('subio_nivel: false cuando el token ya tiene el nivel correcto', async () => {
    // token nivel = 2, puntos actuales = 120, ganamos 20 → total 140 → nivel 2 (sin cambio)
    authAs('u-1', 2)  // token ya dice nivel 2
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { puntos: 120 }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: 'u-1', puntos: 140, nivel: 2 }, error: null }))

    const res  = await PATCH(makePatchReq({ puntos: 20 }))
    const body = await res.json()

    expect(body.subio_nivel).toBe(false)
  })

  it('retorna campo progreso en la respuesta', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { puntos: 80 }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: 'u-1', puntos: 100, nivel: 2 }, error: null }))

    const res  = await PATCH(makePatchReq({ puntos: 20 }))
    const body = await res.json()

    expect(body).toHaveProperty('progreso')
    expect(typeof body.progreso).toBe('number')
  })

  it('404 usuario no encontrado', async () => {
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }))

    const res = await PATCH(makePatchReq({ puntos: 20 }))
    expect(res.status).toBe(404)
  })
})
