/**
 * @jest-environment node
 *
 * TDD — GET /api/teacher/students
 *
 * Escenarios cubiertos:
 *  - 403 sin permisos (teacherGuard null)
 *  - Admin ve todos los estudiantes (cursosAcceso = null)
 *  - Teacher solo ve alumnos con cursos en común
 *  - Teacher sin cursos asignados ve lista vacía
 *  - No expone campos sensibles (password_hash)
 *  - 500 cuando DB falla
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

import { GET } from '@/app/api/teacher/students/route'

function makeChain(resolved: unknown) {
  const chain: Record<string, unknown> = {}
  ;['select','eq','order','limit'].forEach(m => {
    chain[m] = jest.fn().mockReturnValue(chain)
  })
  chain.then  = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(res, rej)
  chain.catch = (rej: (e: unknown) => unknown) => Promise.resolve(resolved).catch(rej)
  return chain
}

function makeReq() {
  return new NextRequest('http://localhost/api/teacher/students', {
    headers: { Authorization: 'Bearer token' },
  })
}

afterEach(() => jest.clearAllMocks())

const ALL_STUDENTS = [
  { id: 's-1', email: 'ana@test.com',  nombre: 'Ana',  nivel: 2, puntos: 150, cursos_acceso: ['piano'], created_at: '2024-01-01' },
  { id: 's-2', email: 'bob@test.com',  nombre: 'Bob',  nivel: 1, puntos: 50,  cursos_acceso: ['guitarra'], created_at: '2024-01-02' },
  { id: 's-3', email: 'carl@test.com', nombre: 'Carl', nivel: 3, puntos: 350, cursos_acceso: ['piano', 'bateria'], created_at: '2024-01-03' },
]

describe('GET /api/teacher/students — autenticación', () => {
  it('403 sin permisos (teacherGuard null)', async () => {
    mockTeacherGuard.mockResolvedValue(null)

    const res  = await GET(makeReq())
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toMatch(/sin permisos/i)
  })
})

describe('GET /api/teacher/students — scope de cursos', () => {
  it('admin ve todos los estudiantes (cursosAcceso = null)', async () => {
    mockTeacherGuard.mockResolvedValue({ payload: { sub: 'a-1', role: 'admin' }, cursosAcceso: null })
    mockFrom.mockReturnValue(makeChain({ data: ALL_STUDENTS, error: null }))

    const res  = await GET(makeReq())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.students).toHaveLength(3)
  })

  it('teacher solo ve alumnos con cursos en común', async () => {
    mockTeacherGuard.mockResolvedValue({
      payload: { sub: 't-1', role: 'teacher' },
      cursosAcceso: ['piano'],  // solo piano
    })
    mockFrom.mockReturnValue(makeChain({ data: ALL_STUDENTS, error: null }))

    const res  = await GET(makeReq())
    const body = await res.json()

    expect(res.status).toBe(200)
    // Ana (piano) y Carl (piano + bateria) ✓ — Bob (guitarra) ✗
    expect(body.students).toHaveLength(2)
    expect(body.students.map((s: { id: string }) => s.id)).toContain('s-1')  // Ana
    expect(body.students.map((s: { id: string }) => s.id)).toContain('s-3')  // Carl
    expect(body.students.map((s: { id: string }) => s.id)).not.toContain('s-2')  // Bob
  })

  it('teacher con múltiples cursos filtra correctamente', async () => {
    mockTeacherGuard.mockResolvedValue({
      payload: { sub: 't-1', role: 'teacher' },
      cursosAcceso: ['guitarra', 'bateria'],
    })
    mockFrom.mockReturnValue(makeChain({ data: ALL_STUDENTS, error: null }))

    const res  = await GET(makeReq())
    const body = await res.json()

    // Bob (guitarra) ✓ — Carl (piano + bateria) ✓ — Ana (solo piano) ✗
    expect(body.students).toHaveLength(2)
    expect(body.students.map((s: { id: string }) => s.id)).toContain('s-2')  // Bob
    expect(body.students.map((s: { id: string }) => s.id)).toContain('s-3')  // Carl
  })

  it('teacher sin cursos asignados ve lista vacía', async () => {
    mockTeacherGuard.mockResolvedValue({
      payload: { sub: 't-1', role: 'teacher' },
      cursosAcceso: [],  // sin cursos
    })
    mockFrom.mockReturnValue(makeChain({ data: ALL_STUDENTS, error: null }))

    const res  = await GET(makeReq())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.students).toEqual([])
  })

  it('teacher no ve alumnos sin cursos_acceso definido', async () => {
    const sinCursos = { id: 's-4', email: 'x@test.com', nombre: 'X', nivel: 1, puntos: 0, cursos_acceso: null, created_at: '2024-01-04' }
    mockTeacherGuard.mockResolvedValue({
      payload: { sub: 't-1', role: 'teacher' },
      cursosAcceso: ['piano'],
    })
    mockFrom.mockReturnValue(makeChain({ data: [...ALL_STUDENTS, sinCursos], error: null }))

    const res  = await GET(makeReq())
    const body = await res.json()

    // El alumno sin cursos_acceso no debe aparecer en el resultado del teacher
    expect(body.students.map((s: { id: string }) => s.id)).not.toContain('s-4')
  })

  it('la respuesta solo contiene roles student (no teachers ni admins)', async () => {
    // La query filtra por role = 'student' en DB — aquí verificamos que el mock fue llamado
    mockTeacherGuard.mockResolvedValue({ payload: { sub: 'a-1', role: 'admin' }, cursosAcceso: null })
    const chain = makeChain({ data: ALL_STUDENTS, error: null })
    mockFrom.mockReturnValue(chain)

    await GET(makeReq())

    // Verifica que se filtró por role = student
    const eqMock = chain.eq as jest.Mock
    expect(eqMock).toHaveBeenCalledWith('role', 'student')
  })
})

describe('GET /api/teacher/students — errores DB', () => {
  it('500 cuando DB falla', async () => {
    mockTeacherGuard.mockResolvedValue({ payload: { sub: 'a-1', role: 'admin' }, cursosAcceso: null })
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }))

    const res = await GET(makeReq())
    expect(res.status).toBe(500)
  })
})

describe('GET /api/teacher/students — estructura de respuesta', () => {
  it('cada alumno tiene los campos esperados', async () => {
    mockTeacherGuard.mockResolvedValue({ payload: { sub: 'a-1', role: 'admin' }, cursosAcceso: null })
    mockFrom.mockReturnValue(makeChain({ data: [ALL_STUDENTS[0]], error: null }))

    const res  = await GET(makeReq())
    const body = await res.json()

    const student = body.students[0]
    expect(student).toHaveProperty('id')
    expect(student).toHaveProperty('email')
    expect(student).toHaveProperty('nombre')
    expect(student).toHaveProperty('nivel')
    expect(student).toHaveProperty('puntos')
    expect(student).toHaveProperty('cursos_acceso')
    // No debe exponer password_hash
    expect(student).not.toHaveProperty('password_hash')
  })
})
