/** @jest-environment node */
// Tests de integración cross-role: student, teacher y admin
// Valida QUIÉN puede acceder a QUÉ endpoint
import { NextRequest } from 'next/server'
import { signToken } from '@/lib/auth'
import { createDbMock } from '@/test-utils/supabaseMock'

// Rutas que se van a testear
import { GET as adminUsersGet, POST as adminUsersPost } from '@/app/api/admin/users/route'
import { GET as adminContentGet }                       from '@/app/api/admin/content/route'
import { POST as cursosPost }                            from '@/app/api/admin/content/cursos/route'
import { GET as teacherContentGet }                     from '@/app/api/teacher/content/route'
import { GET as teacherStudentsGet }                    from '@/app/api/teacher/students/route'
import { GET as usersMeGet }                            from '@/app/api/users/me/route'
import { GET as progressGet }                           from '@/app/api/progress/route'

jest.mock('@/lib/supabase', () => ({ getSupabaseAdmin: jest.fn() }))
import { getSupabaseAdmin } from '@/lib/supabase'

// ── tokens de cada rol ───────────────────────────────────────────────────────
const TOKENS = {
  admin:   signToken({ sub: 'admin-1', email: 'admin@ov.com',   role: 'admin',   nivel: 1 }),
  teacher: signToken({ sub: 'teach-1', email: 'teach@ov.com',   role: 'teacher', nivel: 1 }),
  student: signToken({ sub: 'stud-1',  email: 'stud@ov.com',    role: 'student', nivel: 1 }),
}

function makeReq(method: string, url: string, token?: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

// ── matriz de acceso por rol ─────────────────────────────────────────────────

describe('Acceso a rutas admin-only (/api/admin/*)', () => {
  beforeEach(() => {
    const mock = createDbMock()
    mock.chain.then.mockImplementation((resolve: any) =>
      Promise.resolve({ data: [], error: null }).then(resolve)
    )
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('student NO puede acceder a GET /api/admin/users → 403', async () => {
    const res = await adminUsersGet(makeReq('GET', 'http://localhost/api/admin/users', TOKENS.student))
    expect(res.status).toBe(403)
  })

  it('teacher NO puede acceder a GET /api/admin/users → 403', async () => {
    const res = await adminUsersGet(makeReq('GET', 'http://localhost/api/admin/users', TOKENS.teacher))
    expect(res.status).toBe(403)
  })

  it('admin SÍ puede acceder a GET /api/admin/users → 200', async () => {
    const res = await adminUsersGet(makeReq('GET', 'http://localhost/api/admin/users', TOKENS.admin))
    expect(res.status).toBe(200)
  })

  it('student NO puede crear usuario → 403', async () => {
    const res = await adminUsersPost(makeReq('POST', 'http://localhost/api/admin/users', TOKENS.student, { email: 'x@y.com', password: 'pass123' }))
    expect(res.status).toBe(403)
  })

  it('teacher NO puede crear usuario → 403', async () => {
    const res = await adminUsersPost(makeReq('POST', 'http://localhost/api/admin/users', TOKENS.teacher, { email: 'x@y.com', password: 'pass123' }))
    expect(res.status).toBe(403)
  })

  it('student NO puede acceder a GET /api/admin/content → 403', async () => {
    const res = await adminContentGet(makeReq('GET', 'http://localhost/api/admin/content', TOKENS.student))
    expect(res.status).toBe(403)
  })

  it('teacher NO puede acceder a GET /api/admin/content → 403', async () => {
    const res = await adminContentGet(makeReq('GET', 'http://localhost/api/admin/content', TOKENS.teacher))
    expect(res.status).toBe(403)
  })

  it('student NO puede crear cursos → 403', async () => {
    const res = await cursosPost(makeReq('POST', 'http://localhost/api/admin/content/cursos', TOKENS.student, { nombre: 'X' }))
    expect(res.status).toBe(403)
  })

  it('acceso sin token siempre retorna 403 en rutas admin', async () => {
    const r1 = await adminUsersGet(makeReq('GET', 'http://localhost/api/admin/users'))
    const r2 = await adminContentGet(makeReq('GET', 'http://localhost/api/admin/content'))
    expect(r1.status).toBe(403)
    expect(r2.status).toBe(403)
  })
})

describe('Acceso a rutas teacher (/api/teacher/*)', () => {
  beforeEach(() => {
    const mock = createDbMock()
    mock.chain.single.mockResolvedValue({ data: { cursos_acceso: ['piano'] }, error: null })
    mock.chain.then.mockImplementation((resolve: any) =>
      Promise.resolve({ data: [], error: null }).then(resolve)
    )
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('student NO puede acceder a /api/teacher/content → 403', async () => {
    const res = await teacherContentGet(makeReq('GET', 'http://localhost/api/teacher/content', TOKENS.student))
    expect(res.status).toBe(403)
  })

  it('sin token NO puede acceder a /api/teacher/content → 403', async () => {
    const res = await teacherContentGet(makeReq('GET', 'http://localhost/api/teacher/content'))
    expect(res.status).toBe(403)
  })

  it('teacher SÍ puede acceder a /api/teacher/content → 200', async () => {
    const res = await teacherContentGet(makeReq('GET', 'http://localhost/api/teacher/content', TOKENS.teacher))
    expect(res.status).toBe(200)
  })

  it('admin SÍ puede acceder a /api/teacher/content → 200', async () => {
    const res = await teacherContentGet(makeReq('GET', 'http://localhost/api/teacher/content', TOKENS.admin))
    expect(res.status).toBe(200)
  })

  it('student NO puede acceder a /api/teacher/students → 403', async () => {
    const res = await teacherStudentsGet(makeReq('GET', 'http://localhost/api/teacher/students', TOKENS.student))
    expect(res.status).toBe(403)
  })

  it('teacher SÍ puede acceder a /api/teacher/students → 200', async () => {
    const res = await teacherStudentsGet(makeReq('GET', 'http://localhost/api/teacher/students', TOKENS.teacher))
    expect(res.status).toBe(200)
  })
})

describe('Acceso a rutas de usuario (/api/users/me y /api/progress)', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('cualquier rol autenticado puede acceder a /api/users/me', async () => {
    const mockUser = { id: 'u', email: 'x@y.com', role: 'student', nivel: 1, puntos: 0, nombre: null, created_at: '' }
    for (const role of ['student', 'teacher', 'admin'] as const) {
      const mock2 = createDbMock()
      mock2.chain.single.mockResolvedValueOnce({ data: { ...mockUser, role }, error: null })
      ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock2.db)
      const res = await usersMeGet(makeReq('GET', 'http://localhost/api/users/me', TOKENS[role]))
      expect(res.status).toBe(200)
    }
  })

  it('sin token retorna 401 en /api/users/me', async () => {
    const res = await usersMeGet(makeReq('GET', 'http://localhost/api/users/me'))
    expect(res.status).toBe(401)
  })

  it('cualquier rol autenticado puede consultar /api/progress', async () => {
    for (const role of ['student', 'teacher', 'admin'] as const) {
      const mock2 = createDbMock()
      mock2.chain.then.mockImplementationOnce((resolve: any) =>
        Promise.resolve({ data: [], error: null }).then(resolve)
      )
      ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock2.db)
      const res = await progressGet(makeReq('GET', 'http://localhost/api/progress', TOKENS[role]))
      expect(res.status).toBe(200)
    }
  })

  it('sin token retorna 401 en /api/progress', async () => {
    const res = await progressGet(makeReq('GET', 'http://localhost/api/progress'))
    expect(res.status).toBe(401)
  })
})

describe('CRUD completo: admin crea curso → asigna a teacher → teacher lo ve', () => {
  it('flujo: crear curso (admin) y verificar que teacher asignado lo puede ver', async () => {
    // 1. Admin crea el curso
    const adminMock = createDbMock()
    adminMock.chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ count: 0 }).then(resolve)
    )
    adminMock.chain.single.mockResolvedValueOnce({
      data: { id: 'violin-123', nombre: 'Violín', emoji: '🎻', orden: 0 },
      error: null,
    })
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(adminMock.db)

    const createRes = await cursosPost(
      makeReq('POST', 'http://localhost/api/admin/content/cursos', TOKENS.admin, { nombre: 'Violín', emoji: '🎻' })
    )
    expect(createRes.status).toBe(201)
    const { curso } = await createRes.json()
    expect(curso.id).toBe('violin-123')

    // 2. Teacher con acceso a violin ve el curso
    const teacherToken = signToken({ sub: 'violin-teacher', email: 'vt@ov.com', role: 'teacher', nivel: 1 })
    const teacherMock = createDbMock()
    teacherMock.chain.single.mockResolvedValueOnce({
      data: { cursos_acceso: ['violin-123'] },
      error: null,
    })
    teacherMock.chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: [{ id: 'violin-123', nombre: 'Violín', emoji: '🎻', orden: 0 }], error: null }).then(resolve)
    )
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(teacherMock.db)

    const viewRes = await teacherContentGet(
      makeReq('GET', 'http://localhost/api/teacher/content', teacherToken)
    )
    expect(viewRes.status).toBe(200)
    const viewBody = await viewRes.json()
    expect(viewBody.cursos[0].id).toBe('violin-123')

    // 3. Teacher sin ese curso NO lo ve
    const teacherMock2 = createDbMock()
    teacherMock2.chain.single.mockResolvedValueOnce({
      data: { cursos_acceso: ['piano'] }, // solo piano, no violin
      error: null,
    })
    teacherMock2.chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: [{ id: 'violin-123', nombre: 'Violín', emoji: '🎻', orden: 0 }], error: null }).then(resolve)
    )
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(teacherMock2.db)

    const noAccessRes = await teacherContentGet(
      makeReq('GET', 'http://localhost/api/teacher/content', TOKENS.teacher)
    )
    expect(noAccessRes.status).toBe(200)
    const noAccessBody = await noAccessRes.json()
    expect(noAccessBody.cursos).toHaveLength(0) // filtrado fuera, no ve violin
  })
})
