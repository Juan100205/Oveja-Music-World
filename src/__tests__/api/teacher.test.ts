/** @jest-environment node */
import { NextRequest } from 'next/server'
import { signToken } from '@/lib/auth'
import { createDbMock } from '@/test-utils/supabaseMock'
import { GET as teacherContentGet } from '@/app/api/teacher/content/route'
import { GET as teacherStudentsGet } from '@/app/api/teacher/students/route'

jest.mock('@/lib/supabase', () => ({ getSupabaseAdmin: jest.fn() }))
import { getSupabaseAdmin } from '@/lib/supabase'

// ── tokens ──────────────────────────────────────────────────────────────────
const ADMIN_TOKEN   = signToken({ sub: 'admin-1', email: 'admin@ov.com',   role: 'admin',   nivel: 1 })
const TEACHER_TOKEN = signToken({ sub: 'teach-1', email: 'teach@ov.com',   role: 'teacher', nivel: 1 })
const STUDENT_TOKEN = signToken({ sub: 'stud-1',  email: 'stud@ov.com',    role: 'student', nivel: 1 })

function getReq(url: string, token?: string) {
  return new NextRequest(url, {
    method: 'GET',
    headers: token ? { authorization: `Bearer ${token}` } : {},
  })
}

// ── GET /api/teacher/content ─────────────────────────────────────────────────
describe('GET /api/teacher/content', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('retorna 403 para student', async () => {
    const res = await teacherContentGet(getReq('http://localhost/api/teacher/content', STUDENT_TOKEN))
    expect(res.status).toBe(403)
  })

  it('retorna 403 sin token', async () => {
    const res = await teacherContentGet(getReq('http://localhost/api/teacher/content'))
    expect(res.status).toBe(403)
  })

  it('admin obtiene todos los cursos (cursosAcceso = null)', async () => {
    const allCursos = [
      { id: 'piano', nombre: 'Piano', emoji: '🎹', orden: 0 },
      { id: 'bateria', nombre: 'Batería', emoji: '🥁', orden: 1 },
    ]
    // teacherGuard para admin → select('cursos_acceso') no se llama
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: allCursos, error: null }).then(resolve)
    )
    const res = await teacherContentGet(getReq('http://localhost/api/teacher/content', ADMIN_TOKEN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.cursos).toHaveLength(2)
  })

  it('teacher solo obtiene sus cursos asignados', async () => {
    const allCursos = [
      { id: 'piano', nombre: 'Piano', emoji: '🎹', orden: 0 },
      { id: 'bateria', nombre: 'Batería', emoji: '🥁', orden: 1 },
    ]
    // teacherGuard llama a users.select('cursos_acceso').eq('id', sub).single()
    chain.single.mockResolvedValueOnce({ data: { cursos_acceso: ['piano'] }, error: null })
    // luego la query de cursos (directo-await)
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: allCursos, error: null }).then(resolve)
    )
    const res = await teacherContentGet(getReq('http://localhost/api/teacher/content', TEACHER_TOKEN))
    expect(res.status).toBe(200)
    const body = await res.json()
    // Solo piano (filtrado en JS)
    expect(body.cursos).toHaveLength(1)
    expect(body.cursos[0].id).toBe('piano')
  })

  it('teacher sin cursos asignados recibe lista vacía', async () => {
    const allCursos = [
      { id: 'piano', nombre: 'Piano', emoji: '🎹', orden: 0 },
    ]
    chain.single.mockResolvedValueOnce({ data: { cursos_acceso: [] }, error: null })
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: allCursos, error: null }).then(resolve)
    )
    const res = await teacherContentGet(getReq('http://localhost/api/teacher/content', TEACHER_TOKEN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.cursos).toHaveLength(0)
  })

  it('teacher obtiene árbol completo del curso asignado', async () => {
    // teacherGuard: single para cursos_acceso
    chain.single
      .mockResolvedValueOnce({ data: { cursos_acceso: ['piano'] }, error: null })  // guard
      .mockResolvedValueOnce({ data: { id: 'piano', nombre: 'Piano', emoji: '🎹' }, error: null }) // curso

    chain.then
      .mockImplementationOnce((resolve: any) => // modulos
        Promise.resolve({ data: [{ id: 'mod-1', nombre: 'Mod 1', curso_id: 'piano', orden: 0 }], error: null }).then(resolve)
      )
      .mockImplementationOnce((resolve: any) => // secciones mod-1
        Promise.resolve({ data: [], error: null }).then(resolve)
      )

    const res = await teacherContentGet(getReq('http://localhost/api/teacher/content?id=piano', TEACHER_TOKEN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.curso.id).toBe('piano')
    expect(body.curso.modulos).toHaveLength(1)
  })

  it('teacher NO puede acceder al árbol de un curso no asignado', async () => {
    chain.single.mockResolvedValueOnce({ data: { cursos_acceso: ['piano'] }, error: null })
    const res = await teacherContentGet(getReq('http://localhost/api/teacher/content?id=bateria', TEACHER_TOKEN))
    expect(res.status).toBe(403)
  })
})

// ── GET /api/teacher/students ────────────────────────────────────────────────
describe('GET /api/teacher/students', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  const ALL_STUDENTS = [
    { id: 's-1', email: 'ana@ov.com',  nombre: 'Ana',  nivel: 1, puntos: 0,   cursos_acceso: ['piano'] },
    { id: 's-2', email: 'bob@ov.com',  nombre: 'Bob',  nivel: 2, puntos: 120, cursos_acceso: ['bateria'] },
    { id: 's-3', email: 'carl@ov.com', nombre: 'Carl', nivel: 1, puntos: 50,  cursos_acceso: ['piano', 'bateria'] },
  ]

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('retorna 403 para student', async () => {
    const res = await teacherStudentsGet(getReq('http://localhost/api/teacher/students', STUDENT_TOKEN))
    expect(res.status).toBe(403)
  })

  it('admin ve todos los estudiantes', async () => {
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: ALL_STUDENTS, error: null }).then(resolve)
    )
    const res = await teacherStudentsGet(getReq('http://localhost/api/teacher/students', ADMIN_TOKEN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.students).toHaveLength(3)
  })

  it('teacher solo ve estudiantes de sus cursos asignados', async () => {
    // teacherGuard
    chain.single.mockResolvedValueOnce({ data: { cursos_acceso: ['piano'] }, error: null })
    // students query
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: ALL_STUDENTS, error: null }).then(resolve)
    )
    const res = await teacherStudentsGet(getReq('http://localhost/api/teacher/students', TEACHER_TOKEN))
    expect(res.status).toBe(200)
    const body = await res.json()
    // Ana (piano) y Carl (piano+bateria) tienen piano → 2 estudiantes
    expect(body.students).toHaveLength(2)
    expect(body.students.map((s: any) => s.id)).toContain('s-1')
    expect(body.students.map((s: any) => s.id)).toContain('s-3')
    expect(body.students.map((s: any) => s.id)).not.toContain('s-2') // solo bateria
  })

  it('teacher sin cursos asignados no ve ningún estudiante', async () => {
    chain.single.mockResolvedValueOnce({ data: { cursos_acceso: [] }, error: null })
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: ALL_STUDENTS, error: null }).then(resolve)
    )
    const res = await teacherStudentsGet(getReq('http://localhost/api/teacher/students', TEACHER_TOKEN))
    const body = await res.json()
    expect(body.students).toHaveLength(0)
  })
})
