/**
 * @jest-environment node
 *
 * TDD — Admin Niveles (configuración de puntos por nivel)
 *
 * Rutas cubiertas:
 *  GET  /api/admin/niveles   → devuelve configuración vigente
 *  PUT  /api/admin/niveles   → reemplaza configuración (con validación)
 *
 * Casos clave:
 *  - Auth: 403 sin token, 403 student/teacher
 *  - GET: devuelve la config de la DB
 *  - PUT: valida contiguidad desde 1, nivel 1 = 0 pts, puntos estrictamente
 *         crecientes, nombres no vacíos
 *  - PUT: upsert en config_niveles y responde la config limpia
 *  - PUT: 500 cuando DB falla
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

import { GET as getNiveles, PUT as putNiveles } from '@/app/api/admin/niveles/route'

function makeChain(resolved: unknown) {
  const c: Record<string, unknown> = {}
  ;['select','insert','update','delete','upsert','eq','order','limit','is'].forEach(m => {
    c[m] = jest.fn().mockReturnValue(c)
  })
  c.single      = jest.fn().mockResolvedValue(resolved)
  c.maybeSingle = jest.fn().mockResolvedValue(resolved)
  c.then  = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(res, rej)
  c.catch = (rej: (e: unknown) => unknown) => Promise.resolve(resolved).catch(rej)
  return c
}

function adminAuth() {
  mockExtract.mockReturnValue('tok')
  mockVerify.mockReturnValue({ sub: 'a-1', role: 'admin', email: 'admin@test.com', nivel: 5 })
}
function noAuth()    { mockExtract.mockReturnValue(null) }
function studentAuth() {
  mockExtract.mockReturnValue('tok')
  mockVerify.mockReturnValue({ sub: 's-1', role: 'student', email: 's@t.com', nivel: 1 })
}
function teacherAuth() {
  mockExtract.mockReturnValue('tok')
  mockVerify.mockReturnValue({ sub: 't-1', role: 'teacher', email: 't@t.com', nivel: 2 })
}

function makeReq(url: string, opts?: { method?: string; body?: unknown }) {
  return new NextRequest(url, {
    method: opts?.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' },
    ...(opts?.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  })
}

const NIVELES_DB = [
  { nivel: 1, puntos_requeridos: 0,    nombre: 'Principiante' },
  { nivel: 2, puntos_requeridos: 100,  nombre: 'Aprendiz' },
  { nivel: 3, puntos_requeridos: 300,  nombre: 'Intermedio' },
  { nivel: 4, puntos_requeridos: 600,  nombre: 'Avanzado' },
  { nivel: 5, puntos_requeridos: 1000, nombre: 'Maestro' },
]

afterEach(() => jest.clearAllMocks())

// ══════════════════════════════════════════════════════════════
// GET /api/admin/niveles
// ══════════════════════════════════════════════════════════════
describe('GET /api/admin/niveles', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await getNiveles(makeReq('http://localhost/api/admin/niveles'))
    expect(res.status).toBe(403)
  })

  it('403 con token student', async () => {
    studentAuth()
    const res = await getNiveles(makeReq('http://localhost/api/admin/niveles'))
    expect(res.status).toBe(403)
  })

  it('403 con token teacher', async () => {
    teacherAuth()
    const res = await getNiveles(makeReq('http://localhost/api/admin/niveles'))
    expect(res.status).toBe(403)
  })

  it('200 retorna la configuración de la DB ordenada', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: [...NIVELES_DB].reverse(), error: null }))

    const res  = await getNiveles(makeReq('http://localhost/api/admin/niveles'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.niveles).toHaveLength(5)
    expect(body.niveles[0].nivel).toBe(1)
    expect(body.niveles[4].nivel).toBe(5)
  })

  it('200 cae al estático si la tabla está vacía', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))

    const res  = await getNiveles(makeReq('http://localhost/api/admin/niveles'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.niveles).toHaveLength(5)
    expect(body.niveles[1].puntos_requeridos).toBe(100)
  })
})

// ══════════════════════════════════════════════════════════════
// PUT /api/admin/niveles — auth y body inválido
// ══════════════════════════════════════════════════════════════
describe('PUT /api/admin/niveles — auth y body', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await putNiveles(makeReq('http://localhost/api/admin/niveles', { method: 'PUT', body: { niveles: NIVELES_DB } }))
    expect(res.status).toBe(403)
  })

  it('400 con menos de 2 niveles', async () => {
    adminAuth()
    const res = await putNiveles(makeReq('http://localhost/api/admin/niveles', {
      method: 'PUT', body: { niveles: [NIVELES_DB[0]] },
    }))
    expect(res.status).toBe(400)
  })

  it('400 sin campo niveles', async () => {
    adminAuth()
    const res = await putNiveles(makeReq('http://localhost/api/admin/niveles', { method: 'PUT', body: {} }))
    expect(res.status).toBe(400)
  })
})

// ══════════════════════════════════════════════════════════════
// PUT /api/admin/niveles — validaciones
// ══════════════════════════════════════════════════════════════
describe('PUT /api/admin/niveles — validaciones', () => {
  beforeEach(() => adminAuth())

  it('400 si los niveles no son contiguos desde 1', async () => {
    const mal = [NIVELES_DB[0], { nivel: 3, puntos_requeridos: 200, nombre: 'Salto' }]
    const res = await putNiveles(makeReq('http://localhost/api/admin/niveles', { method: 'PUT', body: { niveles: mal } }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/contiguos/i)
  })

  it('400 si hay niveles duplicados', async () => {
    const mal = [NIVELES_DB[0], NIVELES_DB[1], { nivel: 2, puntos_requeridos: 250, nombre: 'Dup' }]
    const res = await putNiveles(makeReq('http://localhost/api/admin/niveles', { method: 'PUT', body: { niveles: mal } }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/contiguos/i)
  })

  it('400 si nivel 1 no requiere 0 puntos', async () => {
    const mal = [{ nivel: 1, puntos_requeridos: 50, nombre: 'X' }, NIVELES_DB[1]]
    const res = await putNiveles(makeReq('http://localhost/api/admin/niveles', { method: 'PUT', body: { niveles: mal } }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/nivel 1/i)
  })

  it('400 si los puntos no son estrictamente crecientes', async () => {
    const mal = [
      { nivel: 1, puntos_requeridos: 0,   nombre: 'A' },
      { nivel: 2, puntos_requeridos: 100, nombre: 'B' },
      { nivel: 3, puntos_requeridos: 50,  nombre: 'C' },
    ]
    const res = await putNiveles(makeReq('http://localhost/api/admin/niveles', { method: 'PUT', body: { niveles: mal } }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/crecientes/i)
  })

  it('400 con puntos negativos', async () => {
    const mal = [
      { nivel: 1, puntos_requeridos: 0,  nombre: 'A' },
      { nivel: 2, puntos_requeridos: -5, nombre: 'B' },
    ]
    const res = await putNiveles(makeReq('http://localhost/api/admin/niveles', { method: 'PUT', body: { niveles: mal } }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/puntos_requeridos/i)
  })

  it('400 si un nombre está vacío', async () => {
    const mal = [
      { nivel: 1, puntos_requeridos: 0,  nombre: 'A' },
      { nivel: 2, puntos_requeridos: 100, nombre: '   ' },
    ]
    const res = await putNiveles(makeReq('http://localhost/api/admin/niveles', { method: 'PUT', body: { niveles: mal } }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/nombre/i)
  })
})

// ══════════════════════════════════════════════════════════════
// PUT /api/admin/niveles — éxito
// ══════════════════════════════════════════════════════════════
describe('PUT /api/admin/niveles — éxito', () => {
  beforeEach(() => adminAuth())

  it('200 upsert y devuelve la config limpia (ordenada)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))

    const res  = await putNiveles(makeReq('http://localhost/api/admin/niveles', {
      method: 'PUT', body: { niveles: [...NIVELES_DB].reverse() },
    }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.niveles[0].nivel).toBe(1)
    expect(body.niveles[4].nivel).toBe(5)
    expect(mockFrom).toHaveBeenCalledWith('config_niveles')
  })

  it('200 con umbrales personalizados (admin ajusta los puntos)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))

    const personalizados = [
      { nivel: 1, puntos_requeridos: 0,   nombre: 'Iniciado' },
      { nivel: 2, puntos_requeridos: 50,  nombre: 'Intermedio' },
      { nivel: 3, puntos_requeridos: 200, nombre: 'Maestro' },
    ]

    const res  = await putNiveles(makeReq('http://localhost/api/admin/niveles', {
      method: 'PUT', body: { niveles: personalizados },
    }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.niveles).toHaveLength(3)
    expect(body.niveles[1].puntos_requeridos).toBe(50)
    expect(body.niveles[1].nombre).toBe('Intermedio')
  })

  it('500 cuando DB falla', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Upsert failed' } }))

    const res = await putNiveles(makeReq('http://localhost/api/admin/niveles', {
      method: 'PUT', body: { niveles: NIVELES_DB },
    }))
    expect(res.status).toBe(500)
  })
})

// ══════════════════════════════════════════════════════════════
// GET /api/admin/niveles — por instrumento
// ══════════════════════════════════════════════════════════════
describe('GET /api/admin/niveles — por instrumento', () => {
  beforeEach(() => adminAuth())

  it('200 devuelve la config del instrumento cuando ?instrumento= present', async () => {
    const instrumento = [
      { nivel: 1, puntos_requeridos: 0,  nombre: 'Bajo 1' },
      { nivel: 2, puntos_requeridos: 25, nombre: 'Bajo 2' },
    ]
    mockFrom.mockReturnValue(makeChain({ data: instrumento, error: null }))

    const res  = await getNiveles(makeReq('http://localhost/api/admin/niveles?instrumento=bajo'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.instrumento).toBe('bajo')
    expect(body.niveles).toHaveLength(2)
    expect(body.niveles[1].puntos_requeridos).toBe(25)
  })

  it('200 filtra con eq(instrumento_id) y cae a global si no hay filas', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: [], error: null }))     // instrumento → vacío
      .mockReturnValueOnce(makeChain({ data: NIVELES_DB, error: null })) // global

    const res  = await getNiveles(makeReq('http://localhost/api/admin/niveles?instrumento=flauta'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.instrumento).toBe('flauta')
    expect(body.niveles).toHaveLength(5)
  })
})

// ══════════════════════════════════════════════════════════════
// PUT /api/admin/niveles — por instrumento
// ══════════════════════════════════════════════════════════════
describe('PUT /api/admin/niveles — por instrumento', () => {
  beforeEach(() => adminAuth())

  it('200 reemplaza la config del instrumento (delete + insert)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))

    const personalizados = [
      { nivel: 1, puntos_requeridos: 0,   nombre: 'Iniciado' },
      { nivel: 2, puntos_requeridos: 50,  nombre: 'Intermedio' },
      { nivel: 3, puntos_requeridos: 200, nombre: 'Maestro' },
    ]

    const res  = await putNiveles(makeReq('http://localhost/api/admin/niveles?instrumento=guitarra', {
      method: 'PUT', body: { niveles: personalizados },
    }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.instrumento).toBe('guitarra')
    expect(body.niveles).toHaveLength(3)
    expect(body.niveles[2].puntos_requeridos).toBe(200)
    expect(mockFrom).toHaveBeenCalledTimes(2) // delete + insert
  })

  it('200 sin instrumento borra solo la config global (delete sin eq)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))

    const res = await putNiveles(makeReq('http://localhost/api/admin/niveles', {
      method: 'PUT', body: { niveles: NIVELES_DB },
    }))

    expect(res.status).toBe(200)
    const deleteChain = mockFrom.mock.results[0].value
    expect(deleteChain.delete).toHaveBeenCalledTimes(1)
    expect(deleteChain.is).toHaveBeenCalledWith('instrumento_id', null)
  })
})
