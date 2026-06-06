/** @jest-environment node */
import { NextRequest } from 'next/server'
import { GET, PATCH } from '@/app/api/users/me/route'
import { signToken } from '@/lib/auth'
import { createDbMock } from '@/test-utils/supabaseMock'

jest.mock('@/lib/supabase', () => ({ getSupabaseAdmin: jest.fn() }))
import { getSupabaseAdmin } from '@/lib/supabase'

// ── helpers ────────────────────────────────────────────────────────────────
const STUDENT_TOKEN = signToken({ sub: 'u-1', email: 'a@b.com', role: 'student', nivel: 1 })
const TEACHER_TOKEN = signToken({ sub: 'u-2', email: 'teacher@b.com', role: 'teacher', nivel: 2 })

function getReq(token?: string) {
  return new NextRequest('http://localhost/api/users/me', {
    method: 'GET',
    headers: token ? { authorization: `Bearer ${token}` } : {},
  })
}

function patchReq(body: unknown, token?: string) {
  return new NextRequest('http://localhost/api/users/me', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

const MOCK_USER = {
  id: 'u-1',
  email: 'a@b.com',
  role: 'student',
  nivel: 1,
  puntos: 80,
  nombre: 'Ana',
  created_at: new Date().toISOString(),
}

// ── tests ──────────────────────────────────────────────────────────────────
describe('GET /api/users/me', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('retorna 401 sin token', async () => {
    const res = await GET(getReq())
    expect(res.status).toBe(401)
  })

  it('retorna 401 con token inválido', async () => {
    const res = await GET(getReq('token-falso'))
    expect(res.status).toBe(401)
  })

  it('retorna 404 si el usuario no existe en DB', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    const res = await GET(getReq(STUDENT_TOKEN))
    expect(res.status).toBe(404)
  })

  it('retorna perfil con datos de gamificación para estudiante válido', async () => {
    chain.single.mockResolvedValueOnce({ data: MOCK_USER, error: null })
    const res = await GET(getReq(STUDENT_TOKEN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user.email).toBe('a@b.com')
    expect(body.gamification).toBeDefined()
    expect(body.gamification.nivel).toBe(1)          // 80 pts → nivel 1
    expect(body.gamification.progreso).toBeGreaterThan(0)
    expect(body.gamification.puntos_para_siguiente).toBe(20) // faltan 20 para nivel 2 (100)
  })

  it('un teacher también puede acceder a su perfil', async () => {
    const teacherUser = { ...MOCK_USER, id: 'u-2', email: 'teacher@b.com', role: 'teacher' }
    chain.single.mockResolvedValueOnce({ data: teacherUser, error: null })
    const res = await GET(getReq(TEACHER_TOKEN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user.role).toBe('teacher')
  })
})

describe('PATCH /api/users/me', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('retorna 401 sin token', async () => {
    const res = await PATCH(patchReq({ puntos: 20 }))
    expect(res.status).toBe(401)
  })

  it('retorna 400 con puntos <= 0', async () => {
    const res = await PATCH(patchReq({ puntos: 0 }, STUDENT_TOKEN))
    expect(res.status).toBe(400)
    const res2 = await PATCH(patchReq({ puntos: -5 }, STUDENT_TOKEN))
    expect(res2.status).toBe(400)
  })

  it('suma puntos correctamente y detecta subida de nivel', async () => {
    // puntos actuales: 80, sumar 25 → 105 pts → sube a nivel 2
    chain.single
      .mockResolvedValueOnce({ data: { puntos: 80 }, error: null })         // GET puntos actuales
      .mockResolvedValueOnce({ data: { id: 'u-1', puntos: 105, nivel: 2 }, error: null }) // UPDATE result
    const res = await PATCH(patchReq({ puntos: 25 }, STUDENT_TOKEN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.puntos).toBe(105)
    expect(body.nivel).toBe(2)
    expect(body.subio_nivel).toBe(true)
    expect(body.progreso).toBeDefined()
  })

  it('no detecta subida de nivel si permanece en el mismo nivel', async () => {
    // puntos actuales: 50, sumar 10 → 60 → nivel 1 → mismo nivel
    chain.single
      .mockResolvedValueOnce({ data: { puntos: 50 }, error: null })
      .mockResolvedValueOnce({ data: { id: 'u-1', puntos: 60, nivel: 1 }, error: null })
    const res = await PATCH(patchReq({ puntos: 10 }, STUDENT_TOKEN))
    const body = await res.json()
    expect(body.subio_nivel).toBe(false)
  })
})
