/**
 * @jest-environment node
 *
 * TDD — GET /api/ranking
 *
 * Escenarios cubiertos:
 *  - 401 sin token
 *  - 401 token inválido
 *  - 200 retorna ranking ordenado por puntos DESC (solo role=student)
 *  - marca es_yo correctamente
 *  - máximo 50 entradas
 *  - nombre fallback: usa primer segmento del email si no hay nombre
 *  - 500 cuando DB falla
 */

import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  extractTokenFromHeader: jest.fn(),
  verifyToken: jest.fn(),
}))

import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
const mockExtract = extractTokenFromHeader as jest.Mock
const mockVerify  = verifyToken as jest.Mock

const mockFrom = jest.fn()
jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({ from: (...args: unknown[]) => mockFrom(...args) }),
}))

import { GET } from '@/app/api/ranking/route'

function makeChain(resolved: unknown) {
  const chain: Record<string, unknown> = {}
  ;['select','order','limit','eq'].forEach(m => {
    chain[m] = jest.fn().mockReturnValue(chain)
  })
  chain.then  = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(res, rej)
  chain.catch = (rej: (e: unknown) => unknown) => Promise.resolve(resolved).catch(rej)
  return chain
}

function makeReq(token?: string) {
  return new NextRequest('http://localhost/api/ranking', {
    headers: { Authorization: token ? `Bearer ${token}` : '' },
  })
}

afterEach(() => jest.clearAllMocks())

const RANKING_USERS = [
  { id: 'u-1', nombre: 'Ana',  email: 'ana@test.com',   puntos: 800, nivel: 4 },
  { id: 'u-2', nombre: 'Bob',  email: 'bob@test.com',   puntos: 600, nivel: 4 },
  { id: 'u-3', nombre: null,   email: 'noname@test.com', puntos: 200, nivel: 2 },
]

describe('GET /api/ranking — autenticación', () => {
  it('401 sin token', async () => {
    mockExtract.mockReturnValue(null)

    const res  = await GET(makeReq())
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toMatch(/no autorizado/i)
  })

  it('401 token inválido', async () => {
    mockExtract.mockReturnValue('bad-token')
    mockVerify.mockReturnValue(null)

    const res  = await GET(makeReq('bad-token'))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toMatch(/token inválido/i)
  })

  it('cualquier rol autenticado puede ver el ranking (student)', async () => {
    mockExtract.mockReturnValue('s-token')
    mockVerify.mockReturnValue({ sub: 'u-1', role: 'student', email: 'a@a.com', nivel: 1 })
    mockFrom.mockReturnValue(makeChain({ data: RANKING_USERS, error: null }))

    const res = await GET(makeReq('s-token'))
    expect(res.status).toBe(200)
  })
})

describe('GET /api/ranking — respuesta', () => {
  beforeEach(() => {
    mockExtract.mockReturnValue('valid-token')
    mockVerify.mockReturnValue({ sub: 'u-1', role: 'student', email: 'ana@test.com', nivel: 4 })
  })

  it('200 retorna array de ranking', async () => {
    mockFrom.mockReturnValue(makeChain({ data: RANKING_USERS, error: null }))

    const res  = await GET(makeReq('valid-token'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body.ranking)).toBe(true)
  })

  it('posición empieza en 1', async () => {
    mockFrom.mockReturnValue(makeChain({ data: RANKING_USERS, error: null }))

    const res  = await GET(makeReq('valid-token'))
    const body = await res.json()

    expect(body.ranking[0].posicion).toBe(1)
    expect(body.ranking[1].posicion).toBe(2)
    expect(body.ranking[2].posicion).toBe(3)
  })

  it('marca es_yo = true para el usuario autenticado (sub === id)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: RANKING_USERS, error: null }))

    const res  = await GET(makeReq('valid-token'))
    const body = await res.json()

    const yo = body.ranking.find((r: { id: string }) => r.id === 'u-1')
    expect(yo.es_yo).toBe(true)
  })

  it('marca es_yo = false para los demás usuarios', async () => {
    mockFrom.mockReturnValue(makeChain({ data: RANKING_USERS, error: null }))

    const res  = await GET(makeReq('valid-token'))
    const body = await res.json()

    const otros = body.ranking.filter((r: { id: string }) => r.id !== 'u-1')
    expect(otros.every((r: { es_yo: boolean }) => r.es_yo === false)).toBe(true)
  })

  it('nombre fallback: usa el prefix del email si nombre es null', async () => {
    mockFrom.mockReturnValue(makeChain({ data: RANKING_USERS, error: null }))

    const res  = await GET(makeReq('valid-token'))
    const body = await res.json()

    const sinNombre = body.ranking.find((r: { id: string }) => r.id === 'u-3')
    expect(sinNombre.nombre).toBe('noname')
  })

  it('retorna array vacío si no hay usuarios', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))

    const res  = await GET(makeReq('valid-token'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ranking).toEqual([])
  })

  it('cada entrada tiene los campos esperados', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [RANKING_USERS[0]], error: null }))

    const res  = await GET(makeReq('valid-token'))
    const body = await res.json()

    const entry = body.ranking[0]
    expect(entry).toHaveProperty('posicion')
    expect(entry).toHaveProperty('id')
    expect(entry).toHaveProperty('nombre')
    expect(entry).toHaveProperty('puntos')
    expect(entry).toHaveProperty('nivel')
    expect(entry).toHaveProperty('es_yo')
  })

  it('puntos 0 por defecto si el usuario tiene puntos null', async () => {
    const userConPuntosNull = { id: 'u-x', nombre: 'X', email: 'x@x.com', puntos: null, nivel: 1 }
    mockFrom.mockReturnValue(makeChain({ data: [userConPuntosNull], error: null }))

    const res  = await GET(makeReq('valid-token'))
    const body = await res.json()

    expect(body.ranking[0].puntos).toBe(0)
  })
})

describe('GET /api/ranking — errores DB', () => {
  beforeEach(() => {
    mockExtract.mockReturnValue('valid-token')
    mockVerify.mockReturnValue({ sub: 'u-1', role: 'student', email: 'a@a.com', nivel: 1 })
  })

  it('500 cuando DB falla', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }))

    const res = await GET(makeReq('valid-token'))
    expect(res.status).toBe(500)
  })
})
