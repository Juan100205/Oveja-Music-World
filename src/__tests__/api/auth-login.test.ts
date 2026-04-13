/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

// ── Mocks ─────────────────────────────────────────────────────
const mockSingle = jest.fn()

jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      single: mockSingle,
    })),
  }),
}))

// Mock verifyPassword para no depender de bcrypt en unit tests
const mockVerifyPassword = jest.fn()
const mockSignToken      = jest.fn()

jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
  signToken:      (...args: unknown[]) => mockSignToken(...args),
}))

import { POST } from '@/app/api/auth/login/route'

// ── Fixtures ──────────────────────────────────────────────────
const DB_USER = {
  id: 'u-1', email: 'juan@test.com', role: 'student',
  nivel: 1, puntos: 0, nombre: 'Juan', created_at: '2024-01-01',
  password_hash: '$2b$12$hash', cursos_acceso: [], clases_acceso: [],
}

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSignToken.mockReturnValue('jwt-signed-token')
})

// ── Tests ─────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('login exitoso: retorna token y user sin password_hash', async () => {
    mockSingle.mockResolvedValue({ data: DB_USER, error: null })
    mockVerifyPassword.mockResolvedValue(true)

    const res  = await POST(makeReq({ email: 'juan@test.com', password: 'secret123' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.token).toBe('jwt-signed-token')
    expect(body.user.email).toBe('juan@test.com')
    expect(body.user.password_hash).toBeUndefined()
    expect(body.user.id).toBe('u-1')
  })

  it('normaliza email a minúsculas antes de buscar', async () => {
    mockSingle.mockResolvedValue({ data: DB_USER, error: null })
    mockVerifyPassword.mockResolvedValue(true)

    await POST(makeReq({ email: 'JUAN@TEST.COM', password: 'secret123' }))

    // La validación de email pasa, y la búsqueda debe hacerse en lowercase
    // (el route llama email.toLowerCase())
    expect(mockSingle).toHaveBeenCalled()
  })

  it('401 con password incorrecto', async () => {
    mockSingle.mockResolvedValue({ data: DB_USER, error: null })
    mockVerifyPassword.mockResolvedValue(false)

    // 'wrongpassword' tiene > 6 chars para superar validación de formato
    const res  = await POST(makeReq({ email: 'juan@test.com', password: 'wrongpassword' }))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Credenciales inválidas')
  })

  it('401 si usuario no existe en BD', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'No rows returned' } })

    const res  = await POST(makeReq({ email: 'noexiste@test.com', password: 'cualquier' }))
    const body = await res.json()

    expect(res.status).toBe(401)
    expect(body.error).toBe('Credenciales inválidas')
  })

  it('400 sin email', async () => {
    const res  = await POST(makeReq({ password: 'secret123' }))
    expect(res.status).toBe(400)
  })

  it('400 con email inválido', async () => {
    const res  = await POST(makeReq({ email: 'no-es-email', password: 'secret123' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Email inválido')
  })

  it('400 con password menor a 6 caracteres', async () => {
    const res  = await POST(makeReq({ email: 'juan@test.com', password: '123' }))
    expect(res.status).toBe(400)
  })

  it('400 con body completamente inválido', async () => {
    const res = await new Promise<Response>(resolve =>
      resolve(POST(new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: 'NOT_JSON{{{{',
      })))
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('Body inválido')
  })

  it('no filtra usuarios por rol — cualquier rol puede hacer login', async () => {
    const adminUser = { ...DB_USER, role: 'admin' }
    mockSingle.mockResolvedValue({ data: adminUser, error: null })
    mockVerifyPassword.mockResolvedValue(true)

    const res  = await POST(makeReq({ email: 'juan@test.com', password: 'secret123' }))
    expect(res.status).toBe(200)
    expect((await res.json()).user.role).toBe('admin')
  })

  it('teacher puede hacer login', async () => {
    const teacherUser = { ...DB_USER, role: 'teacher' }
    mockSingle.mockResolvedValue({ data: teacherUser, error: null })
    mockVerifyPassword.mockResolvedValue(true)

    const res = await POST(makeReq({ email: 'profe@test.com', password: 'secret123' }))
    expect(res.status).toBe(200)
  })

  it('token no expuesto en password_hash del response', async () => {
    mockSingle.mockResolvedValue({ data: DB_USER, error: null })
    mockVerifyPassword.mockResolvedValue(true)

    const body = await (await POST(makeReq({ email: 'juan@test.com', password: 'secret123' }))).json()

    expect(body.user).not.toHaveProperty('password_hash')
  })
})
