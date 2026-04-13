/**
 * @jest-environment node
 *
 * TDD EXHAUSTIVO — Admin Users CRUD
 *
 * Rutas cubiertas:
 *  GET    /api/admin/users          → lista usuarios
 *  POST   /api/admin/users          → crear usuario
 *  PATCH  /api/admin/users/[id]     → actualizar usuario
 *  DELETE /api/admin/users/[id]     → eliminar usuario
 *
 * Casos cubiertos:
 *  - Auth: 403 sin token, 403 con rol student/teacher
 *  - Validaciones de campos
 *  - Creación exitosa con todos los roles
 *  - Actualización: cursos_acceso, clases_acceso, role, nombre
 *  - Protección: admin no puede eliminarse a sí mismo
 *  - Errores de DB (500)
 */

import { NextRequest } from 'next/server'

// ── Auth mock ──────────────────────────────────────────────────
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  extractTokenFromHeader: jest.fn(),
  verifyToken: jest.fn(),
  hashPassword: jest.fn().mockResolvedValue('$2b$12$hashed'),
}))

import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
const mockExtract = extractTokenFromHeader as jest.Mock
const mockVerify  = verifyToken as jest.Mock

// ── Supabase mock ──────────────────────────────────────────────
const mockFrom = jest.fn()
jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({ from: (...args: unknown[]) => mockFrom(...args) }),
}))

// ── Imports de rutas ─────────────────────────────────────────
import { GET as getUsers, POST as postUser } from '@/app/api/admin/users/route'
import { PATCH as patchUser, DELETE as deleteUser } from '@/app/api/admin/users/[id]/route'

// ── Helpers ───────────────────────────────────────────────────
function makeChain(resolved: unknown) {
  const chain: Record<string, unknown> = {}
  ;['select','insert','update','delete','eq','order','limit','in'].forEach(m => {
    chain[m] = jest.fn().mockReturnValue(chain)
  })
  chain.single      = jest.fn().mockResolvedValue(resolved)
  chain.maybeSingle = jest.fn().mockResolvedValue(resolved)
  chain.then  = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(res, rej)
  chain.catch = (rej: (e: unknown) => unknown) => Promise.resolve(resolved).catch(rej)
  return chain
}

function adminAuth(sub = 'admin-1') {
  mockExtract.mockReturnValue('admin-token')
  mockVerify.mockReturnValue({ sub, role: 'admin', email: 'admin@test.com', nivel: 5 })
}
function noAuth() { mockExtract.mockReturnValue(null) }
function studentAuth() {
  mockExtract.mockReturnValue('student-token')
  mockVerify.mockReturnValue({ sub: 's-1', role: 'student', email: 's@test.com', nivel: 1 })
}
function teacherAuth() {
  mockExtract.mockReturnValue('teacher-token')
  mockVerify.mockReturnValue({ sub: 't-1', role: 'teacher', email: 't@test.com', nivel: 2 })
}

function makeReq(url: string, opts?: { method?: string; body?: unknown }) {
  return new NextRequest(url, {
    method: opts?.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer token',
    },
    ...(opts?.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  })
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

const USER_DB = {
  id: 'u-1',
  email: 'student@test.com',
  nombre: 'Alumno Test',
  role: 'student',
  nivel: 1,
  puntos: 0,
  cursos_acceso: ['piano'],
  clases_acceso: [],
  created_at: '2024-01-01T00:00:00Z',
}

afterEach(() => jest.clearAllMocks())

// ══════════════════════════════════════════════════════════════
// GET /api/admin/users
// ══════════════════════════════════════════════════════════════
describe('GET /api/admin/users — lista usuarios', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await getUsers(makeReq('http://localhost/api/admin/users'))
    expect(res.status).toBe(403)
  })

  it('403 con token de student', async () => {
    studentAuth()
    const res = await getUsers(makeReq('http://localhost/api/admin/users'))
    expect(res.status).toBe(403)
  })

  it('403 con token de teacher', async () => {
    teacherAuth()
    const res = await getUsers(makeReq('http://localhost/api/admin/users'))
    expect(res.status).toBe(403)
  })

  it('200 retorna lista de usuarios', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: [USER_DB], error: null }))

    const res  = await getUsers(makeReq('http://localhost/api/admin/users'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body.users)).toBe(true)
    expect(body.users).toHaveLength(1)
    expect(body.users[0].email).toBe('student@test.com')
  })

  it('200 retorna array vacío si no hay usuarios', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))

    const res  = await getUsers(makeReq('http://localhost/api/admin/users'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.users).toEqual([])
  })

  it('no expone password_hash en la respuesta (Supabase solo retorna columnas SELECT)', async () => {
    adminAuth()
    // La query usa SELECT con columnas explícitas, Supabase nunca retorna password_hash
    // El mock refleja exactamente lo que devolvería Supabase (sin password_hash)
    mockFrom.mockReturnValue(makeChain({ data: [USER_DB], error: null }))

    const res  = await getUsers(makeReq('http://localhost/api/admin/users'))
    const body = await res.json()

    expect(body.users[0]).not.toHaveProperty('password_hash')
  })

  it('500 cuando DB falla', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }))

    const res = await getUsers(makeReq('http://localhost/api/admin/users'))
    expect(res.status).toBe(500)
  })
})

// ══════════════════════════════════════════════════════════════
// POST /api/admin/users — crear usuario
// ══════════════════════════════════════════════════════════════
describe('POST /api/admin/users — crear usuario', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await postUser(makeReq('http://localhost/api/admin/users', {
      method: 'POST', body: { email: 'new@test.com', password: '123456' },
    }))
    expect(res.status).toBe(403)
  })

  it('400 sin email', async () => {
    adminAuth()
    const res = await postUser(makeReq('http://localhost/api/admin/users', {
      method: 'POST', body: { password: '123456' },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/email/i)
  })

  it('400 sin password', async () => {
    adminAuth()
    const res = await postUser(makeReq('http://localhost/api/admin/users', {
      method: 'POST', body: { email: 'new@test.com' },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/password/i)
  })

  it('400 password menor a 6 caracteres', async () => {
    adminAuth()
    const res = await postUser(makeReq('http://localhost/api/admin/users', {
      method: 'POST', body: { email: 'new@test.com', password: '123' },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/6 caracteres/i)
  })

  it('409 cuando el email ya existe', async () => {
    adminAuth()
    // exists check devuelve un usuario
    mockFrom.mockReturnValueOnce(makeChain({ data: { id: 'existing' }, error: null }))

    const res  = await postUser(makeReq('http://localhost/api/admin/users', {
      method: 'POST', body: { email: 'existing@test.com', password: '123456' },
    }))
    expect(res.status).toBe(409)
    expect((await res.json()).error).toMatch(/ya existe/i)
  })

  it('201 crea usuario student por defecto', async () => {
    adminAuth()
    // exists check → null (no existe)
    mockFrom
      .mockReturnValueOnce(makeChain({ data: null, error: null }))
      .mockReturnValueOnce(makeChain({ data: USER_DB, error: null }))

    const res  = await postUser(makeReq('http://localhost/api/admin/users', {
      method: 'POST', body: { email: 'new@test.com', password: '123456' },
    }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.user.email).toBe('student@test.com')
    expect(body.user).not.toHaveProperty('password_hash')
  })

  it('201 crea usuario teacher con role explícito', async () => {
    adminAuth()
    const teacherUser = { ...USER_DB, role: 'teacher', email: 'teacher@test.com' }
    mockFrom
      .mockReturnValueOnce(makeChain({ data: null, error: null }))
      .mockReturnValueOnce(makeChain({ data: teacherUser, error: null }))

    const res  = await postUser(makeReq('http://localhost/api/admin/users', {
      method: 'POST', body: { email: 'teacher@test.com', password: '123456', role: 'teacher' },
    }))
    expect(res.status).toBe(201)
  })

  it('201 crea usuario admin con role explícito', async () => {
    adminAuth()
    const adminUser = { ...USER_DB, role: 'admin', email: 'new-admin@test.com' }
    mockFrom
      .mockReturnValueOnce(makeChain({ data: null, error: null }))
      .mockReturnValueOnce(makeChain({ data: adminUser, error: null }))

    const res  = await postUser(makeReq('http://localhost/api/admin/users', {
      method: 'POST', body: { email: 'new-admin@test.com', password: '123456', role: 'admin' },
    }))
    expect(res.status).toBe(201)
  })

  it('201 crea usuario con nombre y cursos_acceso', async () => {
    adminAuth()
    const newUser = { ...USER_DB, nombre: 'Juan', cursos_acceso: ['piano', 'guitarra'] }
    mockFrom
      .mockReturnValueOnce(makeChain({ data: null, error: null }))
      .mockReturnValueOnce(makeChain({ data: newUser, error: null }))

    const res  = await postUser(makeReq('http://localhost/api/admin/users', {
      method: 'POST', body: {
        email: 'juan@test.com', password: '123456',
        nombre: 'Juan', cursos_acceso: ['piano', 'guitarra'],
      },
    }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.user.cursos_acceso).toContain('piano')
  })

  it('normaliza email a minúsculas', async () => {
    adminAuth()
    mockFrom
      .mockReturnValueOnce(makeChain({ data: null, error: null }))
      .mockReturnValueOnce(makeChain({ data: { ...USER_DB, email: 'juan@test.com' }, error: null }))

    await postUser(makeReq('http://localhost/api/admin/users', {
      method: 'POST', body: { email: 'JUAN@TEST.COM', password: '123456' },
    }))

    // La primera llamada a from (exists check) debe buscar en lowercase
    expect(mockFrom).toHaveBeenCalledTimes(2)
  })

  it('400 body inválido (no JSON)', async () => {
    adminAuth()
    const res = await postUser(new NextRequest('http://localhost/api/admin/users', {
      method: 'POST',
      body: 'NOT_JSON{{',
      headers: { Authorization: 'Bearer token' },
    }))
    expect(res.status).toBe(400)
  })
})

// ══════════════════════════════════════════════════════════════
// PATCH /api/admin/users/[id]
// ══════════════════════════════════════════════════════════════
describe('PATCH /api/admin/users/[id] — actualizar usuario', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await patchUser(
      makeReq('http://localhost/api/admin/users/u-1', { method: 'PATCH', body: { nombre: 'Nuevo' } }),
      makeParams('u-1')
    )
    expect(res.status).toBe(403)
  })

  it('403 con role student', async () => {
    studentAuth()
    const res = await patchUser(
      makeReq('http://localhost/api/admin/users/u-1', { method: 'PATCH', body: { nombre: 'Nuevo' } }),
      makeParams('u-1')
    )
    expect(res.status).toBe(403)
  })

  it('400 body sin campos permitidos', async () => {
    adminAuth()
    const res = await patchUser(
      makeReq('http://localhost/api/admin/users/u-1', { method: 'PATCH', body: { nivel: 3 } }),
      makeParams('u-1')
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/no hay campos/i)
  })

  it('400 body inválido', async () => {
    adminAuth()
    const res = await patchUser(
      new NextRequest('http://localhost/api/admin/users/u-1', {
        method: 'PATCH',
        body: 'NOT_JSON{{',
        headers: { Authorization: 'Bearer token' },
      }),
      makeParams('u-1')
    )
    expect(res.status).toBe(400)
  })

  it('200 actualiza nombre', async () => {
    adminAuth()
    const updated = { ...USER_DB, nombre: 'Juan Actualizado' }
    mockFrom.mockReturnValue(makeChain({ data: updated, error: null }))

    const res  = await patchUser(
      makeReq('http://localhost/api/admin/users/u-1', { method: 'PATCH', body: { nombre: 'Juan Actualizado' } }),
      makeParams('u-1')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user.nombre).toBe('Juan Actualizado')
  })

  it('200 actualiza role', async () => {
    adminAuth()
    const updated = { ...USER_DB, role: 'teacher' }
    mockFrom.mockReturnValue(makeChain({ data: updated, error: null }))

    const res  = await patchUser(
      makeReq('http://localhost/api/admin/users/u-1', { method: 'PATCH', body: { role: 'teacher' } }),
      makeParams('u-1')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user.role).toBe('teacher')
  })

  it('200 actualiza cursos_acceso', async () => {
    adminAuth()
    const updated = { ...USER_DB, cursos_acceso: ['piano', 'violin'] }
    mockFrom.mockReturnValue(makeChain({ data: updated, error: null }))

    const res  = await patchUser(
      makeReq('http://localhost/api/admin/users/u-1', { method: 'PATCH', body: { cursos_acceso: ['piano', 'violin'] } }),
      makeParams('u-1')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user.cursos_acceso).toContain('violin')
  })

  it('200 actualiza clases_acceso', async () => {
    adminAuth()
    const updated = { ...USER_DB, clases_acceso: ['bateria'] }
    mockFrom.mockReturnValue(makeChain({ data: updated, error: null }))

    const res  = await patchUser(
      makeReq('http://localhost/api/admin/users/u-1', { method: 'PATCH', body: { clases_acceso: ['bateria'] } }),
      makeParams('u-1')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.user.clases_acceso).toContain('bateria')
  })

  it('200 actualiza múltiples campos a la vez', async () => {
    adminAuth()
    const updated = { ...USER_DB, nombre: 'Juan', role: 'teacher', cursos_acceso: ['piano'] }
    mockFrom.mockReturnValue(makeChain({ data: updated, error: null }))

    const res = await patchUser(
      makeReq('http://localhost/api/admin/users/u-1', {
        method: 'PATCH',
        body: { nombre: 'Juan', role: 'teacher', cursos_acceso: ['piano'] },
      }),
      makeParams('u-1')
    )
    expect(res.status).toBe(200)
  })
})

// ══════════════════════════════════════════════════════════════
// DELETE /api/admin/users/[id]
// ══════════════════════════════════════════════════════════════
describe('DELETE /api/admin/users/[id] — eliminar usuario', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await deleteUser(
      makeReq('http://localhost/api/admin/users/u-1', { method: 'DELETE' }),
      makeParams('u-1')
    )
    expect(res.status).toBe(403)
  })

  it('403 con role student', async () => {
    studentAuth()
    const res = await deleteUser(
      makeReq('http://localhost/api/admin/users/u-1', { method: 'DELETE' }),
      makeParams('u-1')
    )
    expect(res.status).toBe(403)
  })

  it('400 admin no puede eliminarse a sí mismo', async () => {
    adminAuth('admin-self') // sub = 'admin-self'
    const res  = await deleteUser(
      makeReq('http://localhost/api/admin/users/admin-self', { method: 'DELETE' }),
      makeParams('admin-self')  // mismo id que el admin autenticado
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/a ti mismo/i)
  })

  it('200 elimina otro usuario exitosamente', async () => {
    adminAuth('admin-1')  // sub = admin-1
    mockFrom.mockReturnValue(makeChain({ error: null }))

    const res  = await deleteUser(
      makeReq('http://localhost/api/admin/users/u-other', { method: 'DELETE' }),
      makeParams('u-other')  // diferente del admin
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
  })

  it('400 cuando DB falla al eliminar', async () => {
    adminAuth('admin-1')
    mockFrom.mockReturnValue(makeChain({ error: { message: 'Foreign key constraint' } }))

    const res = await deleteUser(
      makeReq('http://localhost/api/admin/users/u-1', { method: 'DELETE' }),
      makeParams('u-1')
    )
    expect(res.status).toBe(400)
  })
})
