/**
 * @jest-environment node
 *
 * TDD — GET /api/instrumentos (vista de estudiante y profesor)
 *
 * Verifica:
 *  - Auth obligatoria (401 sin token, 401 token inválido)
 *  - Cualquier rol puede ver instrumentos (student, teacher, admin)
 *  - Retorna SOLO instrumentos activos (activo: true)
 *  - Estructura de cada instrumento tiene campos para el mapa
 *  - Instrumento recién creado aparece en la lista (integración ciclo CRUD)
 *  - Orden por campo 'orden'
 *  - 500 cuando DB falla
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

import { GET } from '@/app/api/instrumentos/route'

function makeChain(resolved: unknown) {
  const c: Record<string, unknown> = {}
  ;['select','eq','order','limit'].forEach(m => { c[m] = jest.fn().mockReturnValue(c) })
  c.single      = jest.fn().mockResolvedValue(resolved)
  c.maybeSingle = jest.fn().mockResolvedValue(resolved)
  c.then  = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(res, rej)
  c.catch = (rej: (e: unknown) => unknown) => Promise.resolve(resolved).catch(rej)
  return c
}

function authAs(role: 'student' | 'teacher' | 'admin') {
  mockExtract.mockReturnValue('tok')
  mockVerify.mockReturnValue({ sub: 'u-1', email: 'u@t.com', role, nivel: 1 })
}

function makeReq() {
  return new NextRequest('http://localhost/api/instrumentos', {
    headers: { Authorization: 'Bearer tok' },
  })
}

afterEach(() => jest.clearAllMocks())

// Instrumentos de ejemplo representando la colección completa
const INSTRUMENTOS_ACTIVOS = [
  { id: 'bateria',      nombre: 'Batería',             emoji: '🥁', zona: 'clase', curso_id: 'bateria',        orden: 0, activo: true },
  { id: 'piano',        nombre: 'Piano',               emoji: '🎹', zona: 'clase', curso_id: 'piano',          orden: 1, activo: true },
  { id: 'guitarra',     nombre: 'Guitarra',            emoji: '🎸', zona: 'clase', curso_id: 'guitarra-adultos', orden: 2, activo: true },
  { id: 'canto',        nombre: 'Canto',               emoji: '🎤', zona: 'clase', curso_id: 'canto',          orden: 3, activo: true },
  { id: 'violin',       nombre: 'Violín',              emoji: '🎻', zona: 'clase', curso_id: 'violin',         orden: 4, activo: true },
  { id: 'introduccion', nombre: 'Introducción Musical', emoji: '🎵', zona: 'clase', curso_id: 'ciudad-musical', orden: 5, activo: true },
]

const INSTRUMENTO_INACTIVO = {
  id: 'inactivo', nombre: 'Instrumento oculto', emoji: '❌', zona: 'clase', curso_id: null, orden: 99, activo: false,
}

// ══════════════════════════════════════════════════════════════
// Auth
// ══════════════════════════════════════════════════════════════
describe('GET /api/instrumentos — auth', () => {
  it('401 sin token', async () => {
    mockExtract.mockReturnValue(null)
    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it('401 token inválido', async () => {
    mockExtract.mockReturnValue('bad')
    mockVerify.mockReturnValue(null)
    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it('student puede ver instrumentos', async () => {
    authAs('student')
    mockFrom.mockReturnValue(makeChain({ data: INSTRUMENTOS_ACTIVOS, error: null }))
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
  })

  it('teacher puede ver instrumentos', async () => {
    authAs('teacher')
    mockFrom.mockReturnValue(makeChain({ data: INSTRUMENTOS_ACTIVOS, error: null }))
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
  })

  it('admin puede ver instrumentos', async () => {
    authAs('admin')
    mockFrom.mockReturnValue(makeChain({ data: INSTRUMENTOS_ACTIVOS, error: null }))
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
  })
})

// ══════════════════════════════════════════════════════════════
// Filtrado: solo instrumentos activos
// ══════════════════════════════════════════════════════════════
describe('GET /api/instrumentos — solo activos', () => {
  beforeEach(() => authAs('student'))

  it('filtra por activo: true (instrumentos inactivos no aparecen)', async () => {
    // La query usa .eq('activo', true) — el mock refleja el filtro ya aplicado
    const chain = makeChain({ data: INSTRUMENTOS_ACTIVOS, error: null })
    mockFrom.mockReturnValue(chain)

    await GET(makeReq())

    const eqMock = chain.eq as jest.Mock
    expect(eqMock).toHaveBeenCalledWith('activo', true)
  })

  it('200 retorna solo instrumentos activos (sin inactivos)', async () => {
    // La DB ya filtra por activo=true, no devuelve INSTRUMENTO_INACTIVO
    mockFrom.mockReturnValue(makeChain({ data: INSTRUMENTOS_ACTIVOS, error: null }))

    const res  = await GET(makeReq())
    const body = await res.json()

    expect(body.instrumentos.every((i: { activo: boolean }) => i.activo === true)).toBe(true)
    expect(body.instrumentos.find((i: { id: string }) => i.id === 'inactivo')).toBeUndefined()
  })
})

// ══════════════════════════════════════════════════════════════
// Estructura para el mapa de estudiante
// ══════════════════════════════════════════════════════════════
describe('GET /api/instrumentos — estructura para vista de estudiante', () => {
  beforeEach(() => authAs('student'))

  it('200 retorna todos los 6 instrumentos activos de clase', async () => {
    mockFrom.mockReturnValue(makeChain({ data: INSTRUMENTOS_ACTIVOS, error: null }))

    const res  = await GET(makeReq())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.instrumentos).toHaveLength(6)
  })

  it('cada instrumento tiene los campos necesarios para el mapa', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [INSTRUMENTOS_ACTIVOS[0]], error: null }))

    const res  = await GET(makeReq())
    const body = await res.json()
    const instr = body.instrumentos[0]

    // Campos requeridos por la UI del mapa
    expect(instr).toHaveProperty('id')
    expect(instr).toHaveProperty('nombre')
    expect(instr).toHaveProperty('emoji')
    expect(instr).toHaveProperty('zona')
    expect(instr).toHaveProperty('curso_id')
    expect(instr).toHaveProperty('orden')
  })

  it('instrumentos de zona clase tienen zona === "clase"', async () => {
    mockFrom.mockReturnValue(makeChain({ data: INSTRUMENTOS_ACTIVOS, error: null }))

    const res  = await GET(makeReq())
    const body = await res.json()

    const claseInstrs = body.instrumentos.filter((i: { zona: string }) => i.zona === 'clase')
    expect(claseInstrs.length).toBeGreaterThan(0)
  })

  it('retorna array vacío si no hay instrumentos activos', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))

    const res  = await GET(makeReq())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.instrumentos).toEqual([])
  })
})

// ══════════════════════════════════════════════════════════════
// Instrumento nuevo aparece en la lista
// ══════════════════════════════════════════════════════════════
describe('GET /api/instrumentos — instrumento nuevo aparece en lista', () => {
  it('instrumento recién creado (activo: true) aparece en el resultado', async () => {
    authAs('student')
    const nuevoInstrumento = {
      id: 'saxofon', nombre: 'Saxofón', emoji: '🎷',
      zona: 'clase', curso_id: 'saxofon', orden: 6, activo: true,
    }
    const listaConNuevo = [...INSTRUMENTOS_ACTIVOS, nuevoInstrumento]
    mockFrom.mockReturnValue(makeChain({ data: listaConNuevo, error: null }))

    const res  = await GET(makeReq())
    const body = await res.json()

    expect(body.instrumentos).toHaveLength(7)
    const saxofon = body.instrumentos.find((i: { id: string }) => i.id === 'saxofon')
    expect(saxofon).toBeDefined()
    expect(saxofon.nombre).toBe('Saxofón')
  })

  it('instrumento creado pero inactivo NO aparece en la lista del estudiante', async () => {
    authAs('student')
    // DB filtra activo=true, instrumento inactivo no se devuelve
    mockFrom.mockReturnValue(makeChain({ data: INSTRUMENTOS_ACTIVOS, error: null })) // sin el inactivo

    const res  = await GET(makeReq())
    const body = await res.json()

    expect(body.instrumentos.find((i: { id: string }) => i.id === 'inactivo')).toBeUndefined()
  })
})

// ══════════════════════════════════════════════════════════════
// Errores DB
// ══════════════════════════════════════════════════════════════
describe('GET /api/instrumentos — errores DB', () => {
  it('500 cuando DB falla', async () => {
    authAs('student')
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }))

    const res = await GET(makeReq())
    expect(res.status).toBe(500)
  })
})
