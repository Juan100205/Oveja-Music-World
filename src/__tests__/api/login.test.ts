/** @jest-environment node */
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/login/route'
import { hashPassword, signToken } from '@/lib/auth'
import { createDbMock } from '@/test-utils/supabaseMock'

jest.mock('@/lib/supabase', () => ({ getSupabaseAdmin: jest.fn() }))
import { getSupabaseAdmin } from '@/lib/supabase'

// ── helpers ────────────────────────────────────────────────────────────────
function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ── fixtures ───────────────────────────────────────────────────────────────
const RAW_PASSWORD = 'secret123'
let PASSWORD_HASH: string

beforeAll(async () => {
  PASSWORD_HASH = await hashPassword(RAW_PASSWORD)
})

const MOCK_USER = {
  id: 'user-1',
  email: 'juan@test.com',
  role: 'student' as const,
  nivel: 1,
  puntos: 0,
  nombre: 'Juan',
  created_at: new Date().toISOString(),
  cursos_acceso: [],
  clases_acceso: [],
  password_hash: '', // se asigna en beforeEach
}

// ── tests ──────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('retorna 400 si el body no es JSON válido', async () => {
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'no-es-json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 si email es inválido', async () => {
    const res = await POST(makeReq({ email: 'no-email', password: RAW_PASSWORD }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/email/i)
  })

  it('retorna 400 si password es muy corto', async () => {
    const res = await POST(makeReq({ email: 'juan@test.com', password: '123' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/contraseña/i)
  })

  it('retorna 401 si el usuario no existe en DB', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    const res = await POST(makeReq({ email: 'noexiste@test.com', password: RAW_PASSWORD }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Credenciales inválidas')
  })

  it('retorna 401 si el password no coincide', async () => {
    chain.single.mockResolvedValueOnce({
      data: { ...MOCK_USER, password_hash: PASSWORD_HASH },
      error: null,
    })
    const res = await POST(makeReq({ email: 'juan@test.com', password: 'wrongpassword' }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Credenciales inválidas')
  })

  it('retorna 200 con token y user (sin password_hash) en login exitoso', async () => {
    chain.single.mockResolvedValueOnce({
      data: { ...MOCK_USER, password_hash: PASSWORD_HASH },
      error: null,
    })
    const res = await POST(makeReq({ email: 'juan@test.com', password: RAW_PASSWORD }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.token).toBeDefined()
    expect(body.user).toBeDefined()
    expect(body.user.password_hash).toBeUndefined()
    expect(body.user.email).toBe('juan@test.com')
    expect(body.user.role).toBe('student')
  })

  it('normaliza el email a lowercase antes de buscar', async () => {
    chain.single.mockResolvedValueOnce({
      data: { ...MOCK_USER, email: 'juan@test.com', password_hash: PASSWORD_HASH },
      error: null,
    })
    await POST(makeReq({ email: 'JUAN@TEST.COM', password: RAW_PASSWORD }))
    // El eq() debe haberse llamado con el email en lowercase
    expect(chain.eq).toHaveBeenCalledWith('email', 'juan@test.com')
  })
})
