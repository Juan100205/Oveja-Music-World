/**
 * @jest-environment node
 *
 * TDD — Teacher Content API
 *
 * Rutas cubiertas:
 *  GET /api/teacher/content          → lista cursos (filtrada por scope)
 *  GET /api/teacher/content?id=X     → árbol completo del curso (con scope check)
 *
 * Escenarios:
 *  - 403 sin permisos (teacherGuard null)
 *  - Teacher ve solo sus cursos (scope)
 *  - Admin ve todos los cursos (cursosAcceso = null)
 *  - 403 cuando teacher intenta ver curso fuera de su scope
 *  - 404 curso no encontrado
 *  - 200 árbol completo con módulos → secciones → recursos
 *  - 500 errores de DB
 */

import { NextRequest } from 'next/server'

jest.mock('@/lib/teacherGuard', () => ({
  teacherGuard: jest.fn(),
}))

import { teacherGuard } from '@/lib/teacherGuard'
const mockTeacherGuard = teacherGuard as jest.Mock

const mockFrom = jest.fn()
jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({ from: (...args: unknown[]) => mockFrom(...args) }),
}))

import { GET } from '@/app/api/teacher/content/route'

function makeChain(resolved: unknown) {
  const chain: Record<string, unknown> = {}
  ;['select','eq','order','limit'].forEach(m => {
    chain[m] = jest.fn().mockReturnValue(chain)
  })
  chain.single      = jest.fn().mockResolvedValue(resolved)
  chain.maybeSingle = jest.fn().mockResolvedValue(resolved)
  chain.then  = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(res, rej)
  chain.catch = (rej: (e: unknown) => unknown) => Promise.resolve(resolved).catch(rej)
  return chain
}

function makeReq(url: string) {
  return new NextRequest(url, {
    headers: { Authorization: 'Bearer token' },
  })
}

afterEach(() => jest.clearAllMocks())

const CURSOS_ALL = [
  { id: 'piano',    nombre: 'Piano',    emoji: '🎹', orden: 0 },
  { id: 'guitarra', nombre: 'Guitarra', emoji: '🎸', orden: 1 },
  { id: 'bateria',  nombre: 'Batería',  emoji: '🥁', orden: 2 },
]

const MODULO_DB  = { id: 'piano-mod-1', nombre: 'Nivel 1', curso_id: 'piano', orden: 0 }
const SECCION_DB = { id: 'sec-1', nombre: 'Fundamentos', modulo_id: 'piano-mod-1', orden: 0 }
const RECURSO_DB = { id: 'rec-1', url: 'https://yt.com', tipo: 'video', seccion_id: 'sec-1', orden: 0 }

// ══════════════════════════════════════════════════════════════
// Auth
// ══════════════════════════════════════════════════════════════
describe('GET /api/teacher/content — autenticación', () => {
  it('403 sin permisos (teacherGuard retorna null)', async () => {
    mockTeacherGuard.mockResolvedValue(null)

    const res  = await GET(makeReq('http://localhost/api/teacher/content'))
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toMatch(/sin permisos/i)
  })
})

// ══════════════════════════════════════════════════════════════
// Lista de cursos (sin ?id)
// ══════════════════════════════════════════════════════════════
describe('GET /api/teacher/content — lista de cursos', () => {
  it('admin ve todos los cursos (cursosAcceso = null)', async () => {
    mockTeacherGuard.mockResolvedValue({ payload: { sub: 'a-1', role: 'admin' }, cursosAcceso: null })
    mockFrom.mockReturnValue(makeChain({ data: CURSOS_ALL, error: null }))

    const res  = await GET(makeReq('http://localhost/api/teacher/content'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.cursos).toHaveLength(3)
  })

  it('teacher solo ve sus cursos asignados', async () => {
    mockTeacherGuard.mockResolvedValue({
      payload: { sub: 't-1', role: 'teacher' },
      cursosAcceso: ['piano'],  // solo piano
    })
    mockFrom.mockReturnValue(makeChain({ data: CURSOS_ALL, error: null }))

    const res  = await GET(makeReq('http://localhost/api/teacher/content'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.cursos).toHaveLength(1)
    expect(body.cursos[0].id).toBe('piano')
  })

  it('teacher con múltiples cursos asignados ve todos ellos', async () => {
    mockTeacherGuard.mockResolvedValue({
      payload: { sub: 't-1', role: 'teacher' },
      cursosAcceso: ['piano', 'guitarra'],
    })
    mockFrom.mockReturnValue(makeChain({ data: CURSOS_ALL, error: null }))

    const res  = await GET(makeReq('http://localhost/api/teacher/content'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.cursos).toHaveLength(2)
    expect(body.cursos.map((c: { id: string }) => c.id)).toContain('piano')
    expect(body.cursos.map((c: { id: string }) => c.id)).toContain('guitarra')
  })

  it('teacher sin cursos asignados ve lista vacía', async () => {
    mockTeacherGuard.mockResolvedValue({
      payload: { sub: 't-1', role: 'teacher' },
      cursosAcceso: [],
    })
    mockFrom.mockReturnValue(makeChain({ data: CURSOS_ALL, error: null }))

    const res  = await GET(makeReq('http://localhost/api/teacher/content'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.cursos).toEqual([])
  })

  it('500 cuando DB falla al listar cursos', async () => {
    mockTeacherGuard.mockResolvedValue({ payload: { sub: 'a-1', role: 'admin' }, cursosAcceso: null })
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }))

    const res = await GET(makeReq('http://localhost/api/teacher/content'))
    expect(res.status).toBe(500)
  })
})

// ══════════════════════════════════════════════════════════════
// Árbol completo (?id=piano)
// ══════════════════════════════════════════════════════════════
describe('GET /api/teacher/content?id=piano — árbol completo', () => {
  it('403 teacher intenta ver curso fuera de su scope', async () => {
    mockTeacherGuard.mockResolvedValue({
      payload: { sub: 't-1', role: 'teacher' },
      cursosAcceso: ['guitarra'],  // no tiene piano
    })

    const res  = await GET(makeReq('http://localhost/api/teacher/content?id=piano'))
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toMatch(/sin permisos/i)
  })

  it('404 cuando el curso no existe', async () => {
    mockTeacherGuard.mockResolvedValue({ payload: { sub: 'a-1', role: 'admin' }, cursosAcceso: null })
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Not found' } }))

    const res = await GET(makeReq('http://localhost/api/teacher/content?id=inexistente'))
    expect(res.status).toBe(404)
  })

  it('200 admin puede ver cualquier curso por árbol', async () => {
    mockTeacherGuard.mockResolvedValue({ payload: { sub: 'a-1', role: 'admin' }, cursosAcceso: null })
    mockFrom
      .mockReturnValueOnce(makeChain({ data: CURSOS_ALL[0], error: null }))  // curso
      .mockReturnValueOnce(makeChain({ data: [MODULO_DB],   error: null }))  // modulos
      .mockReturnValueOnce(makeChain({ data: [SECCION_DB],  error: null }))  // secciones
      .mockReturnValueOnce(makeChain({ data: [RECURSO_DB],  error: null }))  // recursos

    const res  = await GET(makeReq('http://localhost/api/teacher/content?id=piano'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.curso.id).toBe('piano')
    expect(Array.isArray(body.curso.modulos)).toBe(true)
  })

  it('200 teacher puede ver su propio curso por árbol', async () => {
    mockTeacherGuard.mockResolvedValue({
      payload: { sub: 't-1', role: 'teacher' },
      cursosAcceso: ['piano'],  // tiene piano ✓
    })
    mockFrom
      .mockReturnValueOnce(makeChain({ data: CURSOS_ALL[0], error: null }))
      .mockReturnValueOnce(makeChain({ data: [],             error: null })) // sin módulos

    const res  = await GET(makeReq('http://localhost/api/teacher/content?id=piano'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.curso.modulos).toEqual([])
  })

  it('árbol incluye secciones anidadas en módulos', async () => {
    mockTeacherGuard.mockResolvedValue({ payload: { sub: 'a-1', role: 'admin' }, cursosAcceso: null })
    mockFrom
      .mockReturnValueOnce(makeChain({ data: CURSOS_ALL[0], error: null }))
      .mockReturnValueOnce(makeChain({ data: [MODULO_DB],   error: null }))
      .mockReturnValueOnce(makeChain({ data: [SECCION_DB, { ...SECCION_DB, id: 'sec-2', nombre: 'Ritmo' }], error: null }))
      .mockReturnValueOnce(makeChain({ data: [RECURSO_DB],  error: null }))
      .mockReturnValueOnce(makeChain({ data: [],             error: null })) // recursos sec-2

    const res  = await GET(makeReq('http://localhost/api/teacher/content?id=piano'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.curso.modulos[0].secciones).toHaveLength(2)
  })
})
