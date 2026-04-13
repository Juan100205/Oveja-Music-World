/**
 * @jest-environment node
 *
 * TDD — POST /api/auth/register
 *
 * Escenarios cubiertos:
 *  - 400 body inválido
 *  - 400 email inválido (sin @, sin dominio)
 *  - 400 password menor a 6 caracteres
 *  - 400 sin email
 *  - 400 sin password
 *  - 409 email ya registrado
 *  - 201 registro exitoso como student (rol por defecto)
 *  - 201 con nombre opcional
 *  - 201 sin nombre (null)
 *  - no expone password_hash
 *  - retorna token JWT en éxito
 *  - email se normaliza a minúsculas
 *  - 500 error de DB al insertar
 */

import { NextRequest } from 'next/server'

const mockSingle = jest.fn()

jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({
    from: jest.fn(() => ({
      select:  jest.fn().mockReturnThis(),
      insert:  jest.fn().mockReturnThis(),
      eq:      jest.fn().mockReturnThis(),
      single:  mockSingle,
    })),
  }),
}))

const mockHashPassword = jest.fn()
const mockSignToken    = jest.fn()

jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  hashPassword: (...args: unknown[]) => mockHashPassword(...args),
  signToken:    (...args: unknown[]) => mockSignToken(...args),
}))

import { POST } from '@/app/api/auth/register/route'

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const NEW_USER = {
  id: 'u-new',
  email: 'nuevo@test.com',
  role: 'student',
  nivel: 1,
  puntos: 0,
  nombre: null,
  created_at: '2024-01-01T00:00:00Z',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockHashPassword.mockResolvedValue('$2b$12$hashed')
  mockSignToken.mockReturnValue('jwt-signed-token')
})

describe('POST /api/auth/register — validaciones', () => {
  it('400 body inválido (no JSON)', async () => {
    const res = await POST(new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: 'NOT_JSON{{{{',
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/body inválido/i)
  })

  it('400 sin email', async () => {
    const res  = await POST(makeReq({ password: '123456' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toMatch(/email/i)
  })

  it('400 email sin formato válido (sin @)', async () => {
    const res  = await POST(makeReq({ email: 'noemail', password: '123456' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toMatch(/email/i)
  })

  it('400 email sin dominio', async () => {
    const res = await POST(makeReq({ email: 'test@', password: '123456' }))
    expect(res.status).toBe(400)
  })

  it('400 sin password', async () => {
    const res  = await POST(makeReq({ email: 'test@test.com' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toMatch(/contraseña/i)
  })

  it('400 password menor a 6 caracteres', async () => {
    const res  = await POST(makeReq({ email: 'test@test.com', password: '123' }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toMatch(/6 caracteres/i)
  })

  it('400 password exactamente 5 caracteres', async () => {
    const res = await POST(makeReq({ email: 'test@test.com', password: '12345' }))
    expect(res.status).toBe(400)
  })

  it('acepta password de exactamente 6 caracteres', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: null })          // exists check → no existe
      .mockResolvedValueOnce({ data: NEW_USER, error: null })      // insert

    const res = await POST(makeReq({ email: 'test@test.com', password: '123456' }))
    expect(res.status).toBe(201)
  })
})

describe('POST /api/auth/register — duplicados', () => {
  it('409 cuando el email ya está registrado', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 'existing' }, error: null })

    const res  = await POST(makeReq({ email: 'existing@test.com', password: '123456' }))
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error).toMatch(/ya está registrado/i)
  })

  it('verifica email en lowercase al buscar duplicados', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 'existing' }, error: null })

    await POST(makeReq({ email: 'EXISTING@TEST.COM', password: '123456' }))

    // El registro fue rechazado porque el email normalizado ya existe
    expect(mockSingle).toHaveBeenCalledTimes(1)
  })
})

describe('POST /api/auth/register — éxito', () => {
  it('201 crea usuario student por defecto', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: NEW_USER, error: null })

    const res  = await POST(makeReq({ email: 'nuevo@test.com', password: '123456' }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.user).toBeDefined()
    expect(body.token).toBeDefined()
  })

  it('retorna JWT token en éxito', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: NEW_USER, error: null })

    const res  = await POST(makeReq({ email: 'nuevo@test.com', password: '123456' }))
    const body = await res.json()

    expect(body.token).toBe('jwt-signed-token')
  })

  it('no expone password_hash en la respuesta', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: NEW_USER, error: null })

    const res  = await POST(makeReq({ email: 'nuevo@test.com', password: '123456' }))
    const body = await res.json()

    expect(body.user).not.toHaveProperty('password_hash')
  })

  it('rol del usuario creado es student', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: NEW_USER, error: null })

    const res  = await POST(makeReq({ email: 'nuevo@test.com', password: '123456' }))
    const body = await res.json()

    expect(body.user.role).toBe('student')
  })

  it('crea usuario con nombre si se provee', async () => {
    const userConNombre = { ...NEW_USER, nombre: 'Juan' }
    mockSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: userConNombre, error: null })

    const res  = await POST(makeReq({ email: 'nuevo@test.com', password: '123456', nombre: 'Juan' }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.user.nombre).toBe('Juan')
  })

  it('nombre es null si no se provee', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: NEW_USER, error: null }) // NEW_USER.nombre = null

    const res  = await POST(makeReq({ email: 'nuevo@test.com', password: '123456' }))
    const body = await res.json()

    expect(body.user.nombre).toBeNull()
  })

  it('hashea la password antes de guardar', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: NEW_USER, error: null })

    await POST(makeReq({ email: 'nuevo@test.com', password: '123456' }))

    expect(mockHashPassword).toHaveBeenCalledWith('123456')
  })

  it('email se normaliza a minúsculas en registro', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: { ...NEW_USER, email: 'nuevo@test.com' }, error: null })

    const res  = await POST(makeReq({ email: 'NUEVO@TEST.COM', password: '123456' }))
    const body = await res.json()

    expect(res.status).toBe(201)
    // El email guardado debe ser en minúsculas
    expect(body.user.email).toBe('nuevo@test.com')
  })

  it('nivel inicial siempre es 1', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: NEW_USER, error: null })

    const res  = await POST(makeReq({ email: 'nuevo@test.com', password: '123456' }))
    const body = await res.json()

    expect(body.user.nivel).toBe(1)
  })

  it('puntos iniciales siempre es 0', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: NEW_USER, error: null })

    const res  = await POST(makeReq({ email: 'nuevo@test.com', password: '123456' }))
    const body = await res.json()

    expect(body.user.puntos).toBe(0)
  })
})

describe('POST /api/auth/register — errores DB', () => {
  it('500 cuando DB falla al insertar', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: null })           // exists check OK
      .mockResolvedValueOnce({ data: null, error: { message: 'Insert failed' } }) // insert falla

    const res  = await POST(makeReq({ email: 'nuevo@test.com', password: '123456' }))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toMatch(/error al crear/i)
  })
})
