/**
 * @jest-environment node
 *
 * TDD — POST /api/progress con `instrumento`
 *
 * Verifica que cuando el payload incluye `instrumento`:
 *  - los puntos se acumulan por separado en `puntos_por_instrumento`
 *  - el nivel se calcula con la config de niveles de ESE instrumento
 *  - la respuesta expone `puntos_instrumento` e `instrumento`
 *  - los buckets de cada instrumento no se mezclan
 *  - cae a la config global si el instrumento no tiene filas propias
 *  - sin `instrumento` conserva el comportamiento global backward-compatible
 */

import { NextRequest } from 'next/server'

// ── Auth mock ─────────────────────────────────────────────────────
jest.mock('@/lib/auth', () => ({
  extractTokenFromHeader: jest.fn(),
  verifyToken:            jest.fn(),
}))
import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
const mockExtract = extractTokenFromHeader as jest.Mock
const mockVerify  = verifyToken as jest.Mock

// ── Supabase mock por secuencia ───────────────────────────────────
const mockFrom = jest.fn()
jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({ from: (...a: unknown[]) => mockFrom(...a) }),
}))

import { POST } from '@/app/api/progress/route'

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

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/progress', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer valid-token' },
    body:    JSON.stringify(body),
  })
}

const VALID_PAYLOAD = { sub: 'user-1', email: 'u@t.com', role: 'student', nivel: 1 }

// Config por instrumento (umbrales distintos a los globales)
const INSTR_DB = [
  { nivel: 1, puntos_requeridos: 0,   nombre: 'A' },
  { nivel: 2, puntos_requeridos: 50,  nombre: 'B' },
  { nivel: 3, puntos_requeridos: 100, nombre: 'C' },
]
// Config global (LEVEL_CONFIG)
const GLOBAL_DB = [
  { nivel: 1, puntos_requeridos: 0,    nombre: 'Principiante' },
  { nivel: 2, puntos_requeridos: 100,  nombre: 'Aprendiz' },
  { nivel: 3, puntos_requeridos: 300,  nombre: 'Intermedio' },
  { nivel: 4, puntos_requeridos: 600,  nombre: 'Avanzado' },
  { nivel: 5, puntos_requeridos: 1000, nombre: 'Maestro' },
]

function defaultUser(puntosPorInstrumento: Record<string, number> = {}) {
  return { data: { puntos: 0, nivel: 1, puntos_por_instrumento: puntosPorInstrumento }, error: null }
}

afterEach(() => jest.clearAllMocks())

describe('POST /api/progress — con instrumento', () => {
  beforeEach(() => {
    mockExtract.mockReturnValue('valid-token')
    mockVerify.mockReturnValue(VALID_PAYLOAD)
  })

  it('acumula puntos en el bucket del instrumento y responde puntos_instrumento', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { id: 'r-1', puntos: null }, error: null })) // recursos
      .mockReturnValueOnce(makeChain({ data: null, error: null }))                         // completions
      .mockReturnValueOnce(makeChain(defaultUser()))                                        // users select
      .mockReturnValueOnce(makeChain({ data: INSTR_DB, error: null }))                     // config instrumento
      .mockReturnValueOnce(makeChain({ data: GLOBAL_DB, error: null }))                    // config global (update)
      .mockReturnValueOnce(makeChain({ data: null, error: null }))                         // users update

    const res  = await POST(makeRequest({ url: 'https://youtu.be/x', tipo: 'video', instrumento: 'piano' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.instrumento).toBe('piano')
    expect(body.puntos_instrumento).toBe(20)
    expect(body.total_puntos).toBe(20)
    expect(body.nivel).toBe(1) // INSTR_DB: 20 < 50 → nivel 1
    expect(body.subio_nivel).toBe(false)

    const update = mockFrom.mock.results[5].value.update
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      puntos_por_instrumento: { piano: 20 },
    }))
  })

  it('los buckets de cada instrumento NO se mezclan', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { id: 'r-1', puntos: null }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null }))
      .mockReturnValueOnce(makeChain({ data: { puntos: 90, nivel: 1, puntos_por_instrumento: { piano: 90 } }, error: null }))
      .mockReturnValueOnce(makeChain({ data: INSTR_DB, error: null }))
      .mockReturnValueOnce(makeChain({ data: GLOBAL_DB, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null }))

    const res  = await POST(makeRequest({ url: 'https://youtu.be/x', tipo: 'video', instrumento: 'guitarra' }))
    const body = await res.json()

    expect(body.puntos_instrumento).toBe(20)   // guitarra empieza en 0
    expect(body.total_puntos).toBe(110)        // 90 (piano) + 20
    expect(body.nivel).toBe(1)                 // guitarra: 20 < 50 → nivel 1

    const update = mockFrom.mock.results[5].value.update
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      puntos_por_instrumento: { piano: 90, guitarra: 20 },
    }))
  })

  it('usa la config del instrumento (sube de nivel antes que con la global)', async () => {
    // piano=45 → con INSTR_DB (umbral 50) el video lo lleva a nivel 2
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { id: 'r-1', puntos: null }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null }))
      .mockReturnValueOnce(makeChain(defaultUser({ piano: 45 })))
      .mockReturnValueOnce(makeChain({ data: INSTR_DB, error: null }))
      .mockReturnValueOnce(makeChain({ data: GLOBAL_DB, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null }))

    const res  = await POST(makeRequest({ url: 'https://youtu.be/x', tipo: 'video', instrumento: 'piano' }))
    const body = await res.json()

    expect(body.nivel).toBe(2)        // 65 pts con umbral 50
    expect(body.subio_nivel).toBe(true)
    expect(body.puntos_instrumento).toBe(65)
  })

  it('detecta subio_nivel comparando contra el nivel anterior del instrumento', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { id: 'r-1', puntos: null }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null }))
      .mockReturnValueOnce(makeChain(defaultUser({ piano: 90 })))
      .mockReturnValueOnce(makeChain({ data: INSTR_DB, error: null }))
      .mockReturnValueOnce(makeChain({ data: GLOBAL_DB, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null }))

    const res  = await POST(makeRequest({ url: 'https://youtu.be/x', tipo: 'video', instrumento: 'piano' }))
    const body = await res.json()

    // piano 90 → nivel 2; +20 = 110 → nivel 3
    expect(body.nivel).toBe(3)
    expect(body.subio_nivel).toBe(true)
  })

  it('cae a la config global cuando el instrumento no tiene filas propias', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { id: 'r-1', puntos: null }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null }))
      .mockReturnValueOnce(makeChain(defaultUser()))
      .mockReturnValueOnce(makeChain({ data: [], error: null }))       // instrumento → vacío
      .mockReturnValueOnce(makeChain({ data: GLOBAL_DB, error: null })) // fallback global
      .mockReturnValueOnce(makeChain({ data: GLOBAL_DB, error: null })) // global (update users.nivel)
      .mockReturnValueOnce(makeChain({ data: null, error: null }))

    const res  = await POST(makeRequest({ url: 'https://youtu.be/x', tipo: 'video', instrumento: 'flauta' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.puntos_instrumento).toBe(20)
    expect(body.nivel).toBe(1) // global: 20 < 100 → nivel 1
  })
})

describe('POST /api/progress — sin instrumento (backward compatible)', () => {
  beforeEach(() => {
    mockExtract.mockReturnValue('valid-token')
    mockVerify.mockReturnValue(VALID_PAYLOAD)
  })

  it('responde instrumento null y puntos_instrumento = total_puntos', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { id: 'r-1', puntos: null }, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null }))
      .mockReturnValueOnce(makeChain(defaultUser()))
      .mockReturnValueOnce(makeChain({ data: GLOBAL_DB, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null }))

    const res  = await POST(makeRequest({ url: 'https://youtu.be/x', tipo: 'video' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.instrumento).toBeNull()
    expect(body.puntos_instrumento).toBe(body.total_puntos)
    expect(body.nivel).toBe(1)
  })
})
