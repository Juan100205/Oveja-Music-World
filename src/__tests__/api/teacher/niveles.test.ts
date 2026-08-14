/**
 * @jest-environment node
 *
 * TDD — Teacher Niveles (configuración de puntos por nivel por instrumento)
 *
 * Rutas cubiertas:
 *  GET /api/teacher/niveles?instrumento=piano
 *  PUT /api/teacher/niveles?instrumento=piano
 *
 * Casos clave:
 *  - Auth: 403 sin token, 403 student
 *  - 400 si falta `instrumento`
 *  - 403 si el teacher no tiene ese instrumento en cursos_acceso
 *  - Admin puede (canAccess con cursosAcceso null)
 *  - GET devuelve la config del instrumento (o fallback global)
 *  - PUT valida y reemplaza la config del instrumento
 */

import { NextRequest } from 'next/server'

jest.mock('@/lib/teacherGuard', () => ({
  teacherGuard: jest.fn(),
  canAccess:    jest.fn(),
}))

import { teacherGuard, canAccess } from '@/lib/teacherGuard'
const mockTeacherGuard = teacherGuard as jest.Mock
const mockCanAccess    = canAccess as jest.Mock

const mockFrom = jest.fn()
jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({ from: (...a: unknown[]) => mockFrom(...a) }),
}))

import { GET as getNiveles, PUT as putNiveles } from '@/app/api/teacher/niveles/route'

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

const NIVELES_DB = [
  { nivel: 1, puntos_requeridos: 0,   nombre: 'Principiante' },
  { nivel: 2, puntos_requeridos: 100, nombre: 'Aprendiz' },
  { nivel: 3, puntos_requeridos: 300, nombre: 'Intermedio' },
  { nivel: 4, puntos_requeridos: 600, nombre: 'Avanzado' },
  { nivel: 5, puntos_requeridos: 1000, nombre: 'Maestro' },
]

function teacherGuardOk(cursosAcceso: string[] | null) {
  mockTeacherGuard.mockResolvedValue({ payload: { sub: 't-1', role: cursosAcceso === null ? 'admin' : 'teacher' }, cursosAcceso })
}

function noAuth() {
  mockTeacherGuard.mockResolvedValue(null)
}

function makeReq(url: string, opts?: { method?: string; body?: unknown }) {
  return new NextRequest(url, {
    method: opts?.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' },
    ...(opts?.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  })
}

afterEach(() => jest.clearAllMocks())

describe('GET /api/teacher/niveles — auth y acceso', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await getNiveles(makeReq('http://localhost/api/teacher/niveles?instrumento=piano'))
    expect(res.status).toBe(403)
  })

  it('400 sin instrumento', async () => {
    teacherGuardOk(['piano'])
    const res = await getNiveles(makeReq('http://localhost/api/teacher/niveles'))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/instrumento/i)
  })

  it('403 si el teacher no imparte el instrumento', async () => {
    teacherGuardOk(['guitarra'])
    mockCanAccess.mockReturnValue(false)
    const res = await getNiveles(makeReq('http://localhost/api/teacher/niveles?instrumento=piano'))
    expect(res.status).toBe(403)
  })

  it('200 devuelve la config del instrumento si el teacher lo imparte', async () => {
    teacherGuardOk(['piano'])
    mockCanAccess.mockReturnValue(true)
    mockFrom.mockReturnValue(makeChain({ data: [...NIVELES_DB].reverse(), error: null }))

    const res  = await getNiveles(makeReq('http://localhost/api/teacher/niveles?instrumento=piano'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.instrumento).toBe('piano')
    expect(body.niveles).toHaveLength(5)
    expect(body.niveles[0].nivel).toBe(1)
    expect(mockFrom).toHaveBeenCalledWith('config_niveles')
  })

  it('200 admin puede leer cualquier instrumento', async () => {
    teacherGuardOk(null)
    mockCanAccess.mockReturnValue(true)
    mockFrom.mockReturnValue(makeChain({ data: NIVELES_DB, error: null }))

    const res = await getNiveles(makeReq('http://localhost/api/teacher/niveles?instrumento=piano'))
    expect(res.status).toBe(200)
  })

  it('200 cae a la config global si el instrumento no tiene filas propias', async () => {
    teacherGuardOk(['piano'])
    mockCanAccess.mockReturnValue(true)
    mockFrom
      .mockReturnValueOnce(makeChain({ data: [], error: null }))  // instrumento → vacío
      .mockReturnValueOnce(makeChain({ data: NIVELES_DB, error: null })) // global

    const res  = await getNiveles(makeReq('http://localhost/api/teacher/niveles?instrumento=piano'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.niveles).toHaveLength(5)
  })
})

describe('PUT /api/teacher/niveles', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await putNiveles(makeReq('http://localhost/api/teacher/niveles?instrumento=piano', {
      method: 'PUT', body: { niveles: NIVELES_DB },
    }))
    expect(res.status).toBe(403)
  })

  it('400 sin instrumento', async () => {
    teacherGuardOk(['piano'])
    const res = await putNiveles(makeReq('http://localhost/api/teacher/niveles', {
      method: 'PUT', body: { niveles: NIVELES_DB },
    }))
    expect(res.status).toBe(400)
  })

  it('403 si no imparte el instrumento', async () => {
    teacherGuardOk(['guitarra'])
    mockCanAccess.mockReturnValue(false)
    const res = await putNiveles(makeReq('http://localhost/api/teacher/niveles?instrumento=piano', {
      method: 'PUT', body: { niveles: NIVELES_DB },
    }))
    expect(res.status).toBe(403)
  })

  it('400 con niveles inválidos (no contiguos)', async () => {
    teacherGuardOk(['piano'])
    mockCanAccess.mockReturnValue(true)
    const mal = [NIVELES_DB[0], { nivel: 3, puntos_requeridos: 200, nombre: 'Salto' }]
    const res = await putNiveles(makeReq('http://localhost/api/teacher/niveles?instrumento=piano', {
      method: 'PUT', body: { niveles: mal },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/contiguos/i)
  })

  it('200 reemplaza la config del instrumento (delete + insert)', async () => {
    teacherGuardOk(['piano'])
    mockCanAccess.mockReturnValue(true)
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }))

    const personalizados = [
      { nivel: 1, puntos_requeridos: 0,   nombre: 'Iniciado' },
      { nivel: 2, puntos_requeridos: 50,  nombre: 'Intermedio' },
      { nivel: 3, puntos_requeridos: 200, nombre: 'Maestro' },
    ]

    const res  = await putNiveles(makeReq('http://localhost/api/teacher/niveles?instrumento=piano', {
      method: 'PUT', body: { niveles: personalizados },
    }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.instrumento).toBe('piano')
    expect(body.niveles).toHaveLength(3)
    expect(body.niveles[1].puntos_requeridos).toBe(50)
    expect(mockFrom).toHaveBeenCalledTimes(2) // delete + insert
  })

  it('500 cuando la DB falla en el delete', async () => {
    teacherGuardOk(['piano'])
    mockCanAccess.mockReturnValue(true)
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Delete failed' } }))

    const res = await putNiveles(makeReq('http://localhost/api/teacher/niveles?instrumento=piano', {
      method: 'PUT', body: { niveles: NIVELES_DB },
    }))
    expect(res.status).toBe(500)
  })
})
