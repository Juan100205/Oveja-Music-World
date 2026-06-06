/** @jest-environment node */
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/admin/users/route'
import { PATCH, DELETE } from '@/app/api/admin/users/[id]/route'
import { signToken } from '@/lib/auth'
import { createDbMock } from '@/test-utils/supabaseMock'

jest.mock('@/lib/supabase', () => ({ getSupabaseAdmin: jest.fn() }))
import { getSupabaseAdmin } from '@/lib/supabase'

// ── tokens ──────────────────────────────────────────────────────────────────
const ADMIN_TOKEN  = signToken({ sub: 'admin-1', email: 'admin@ov.com',   role: 'admin',   nivel: 1 })
const TEACHER_TOKEN= signToken({ sub: 'teach-1', email: 'teacher@ov.com', role: 'teacher', nivel: 1 })
const STUDENT_TOKEN= signToken({ sub: 'stud-1',  email: 'stud@ov.com',    role: 'student', nivel: 1 })

// ── helpers ─────────────────────────────────────────────────────────────────
function authGet(token: string) {
  return new NextRequest('http://localhost/api/admin/users', {
    method: 'GET',
    headers: { authorization: `Bearer ${token}` },
  })
}

function authPost(body: unknown, token: string) {
  return new NextRequest('http://localhost/api/admin/users', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
}

function authPatch(id: string, body: unknown, token: string) {
  return new NextRequest(`http://localhost/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
}

function authDelete(id: string, token: string) {
  return new NextRequest(`http://localhost/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` },
  })
}

const MOCK_USERS = [
  { id: 'u-1', email: 'a@b.com', nombre: 'Ana', role: 'student', nivel: 1, puntos: 0 },
  { id: 'u-2', email: 'b@c.com', nombre: 'Bob', role: 'teacher', nivel: 2, puntos: 200 },
]

// ── GET /api/admin/users ────────────────────────────────────────────────────
describe('GET /api/admin/users', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('retorna 403 sin token', async () => {
    const req = new NextRequest('http://localhost/api/admin/users', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('retorna 403 para teacher', async () => {
    const res = await GET(authGet(TEACHER_TOKEN))
    expect(res.status).toBe(403)
  })

  it('retorna 403 para student', async () => {
    const res = await GET(authGet(STUDENT_TOKEN))
    expect(res.status).toBe(403)
  })

  it('admin obtiene lista de usuarios', async () => {
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: MOCK_USERS, error: null }).then(resolve)
    )
    const res = await GET(authGet(ADMIN_TOKEN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.users).toHaveLength(2)
    expect(body.users[0].email).toBe('a@b.com')
  })

  it('retorna 500 si Supabase falla', async () => {
    chain.then.mockImplementationOnce((resolve: any, reject: any) =>
      Promise.resolve({ data: null, error: { message: 'DB error' } }).then(resolve, reject)
    )
    const res = await GET(authGet(ADMIN_TOKEN))
    expect(res.status).toBe(500)
  })
})

// ── POST /api/admin/users ───────────────────────────────────────────────────
describe('POST /api/admin/users', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('retorna 403 para no-admin', async () => {
    const res = await POST(authPost({ email: 'x@y.com', password: 'pass123' }, STUDENT_TOKEN))
    expect(res.status).toBe(403)
  })

  it('retorna 400 sin email o password', async () => {
    const r1 = await POST(authPost({ email: 'x@y.com' }, ADMIN_TOKEN))
    expect(r1.status).toBe(400)
    const r2 = await POST(authPost({ password: 'pass123' }, ADMIN_TOKEN))
    expect(r2.status).toBe(400)
  })

  it('retorna 400 si password < 6 chars', async () => {
    const res = await POST(authPost({ email: 'x@y.com', password: '123' }, ADMIN_TOKEN))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/contraseña/i)
  })

  it('retorna 409 si el email ya existe', async () => {
    chain.maybeSingle.mockResolvedValueOnce({ data: { id: 'u-existing' }, error: null })
    const res = await POST(authPost({ email: 'a@b.com', password: 'pass123' }, ADMIN_TOKEN))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/ya existe/i)
  })

  it('crea usuario correctamente con rol por defecto student', async () => {
    chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const newUser = { id: 'u-new', email: 'new@ov.com', nombre: null, role: 'student', nivel: 1, puntos: 0, cursos_acceso: [], clases_acceso: [], created_at: new Date().toISOString() }
    chain.single.mockResolvedValueOnce({ data: newUser, error: null })

    const res = await POST(authPost({ email: 'new@ov.com', password: 'pass123' }, ADMIN_TOKEN))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.user.email).toBe('new@ov.com')
    expect(body.user.role).toBe('student')
    expect(body.user).not.toHaveProperty('password_hash')
  })

  it('crea usuario con rol teacher cuando se especifica', async () => {
    chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const newTeacher = { id: 'u-t', email: 'teach@ov.com', role: 'teacher', nivel: 1, puntos: 0, cursos_acceso: ['piano'], clases_acceso: [], created_at: new Date().toISOString() }
    chain.single.mockResolvedValueOnce({ data: newTeacher, error: null })

    const res = await POST(authPost({
      email: 'teach@ov.com',
      password: 'pass123',
      role: 'teacher',
      cursos_acceso: ['piano'],
    }, ADMIN_TOKEN))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.user.role).toBe('teacher')
    expect(body.user.cursos_acceso).toContain('piano')
  })

  it('normaliza email a lowercase al crear', async () => {
    chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
    chain.single.mockResolvedValueOnce({ data: { id: 'u-x', email: 'new@ov.com', role: 'student', nivel: 1, puntos: 0, cursos_acceso: [], clases_acceso: [], created_at: '' }, error: null })
    await POST(authPost({ email: 'NEW@OV.COM', password: 'pass123' }, ADMIN_TOKEN))
    expect(chain.eq).toHaveBeenCalledWith('email', 'new@ov.com')
  })
})

// ── PATCH /api/admin/users/[id] ─────────────────────────────────────────────
describe('PATCH /api/admin/users/[id]', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  const params = Promise.resolve({ id: 'u-target' })

  it('retorna 403 para no-admin', async () => {
    const res = await PATCH(authPatch('u-target', { role: 'teacher' }, STUDENT_TOKEN), { params })
    expect(res.status).toBe(403)
  })

  it('retorna 400 si no hay campos válidos para actualizar', async () => {
    const res = await PATCH(authPatch('u-target', { puntos: 999 }, ADMIN_TOKEN), { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/campos/i)
  })

  it('actualiza role correctamente', async () => {
    const updatedUser = { id: 'u-target', email: 'x@y.com', role: 'teacher', nivel: 1, puntos: 0, cursos_acceso: [], clases_acceso: [] }
    chain.single.mockResolvedValueOnce({ data: updatedUser, error: null })

    const res = await PATCH(authPatch('u-target', { role: 'teacher' }, ADMIN_TOKEN), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user.role).toBe('teacher')
  })

  it('actualiza cursos_acceso para teacher', async () => {
    const updatedUser = { id: 'u-target', role: 'teacher', cursos_acceso: ['piano', 'bateria'] }
    chain.single.mockResolvedValueOnce({ data: updatedUser, error: null })

    const res = await PATCH(authPatch('u-target', { cursos_acceso: ['piano', 'bateria'] }, ADMIN_TOKEN), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user.cursos_acceso).toEqual(['piano', 'bateria'])
  })

  it('solo acepta campos permitidos (role, nombre, cursos_acceso, clases_acceso)', async () => {
    chain.single.mockResolvedValueOnce({ data: { id: 'u-target', nombre: 'Nuevo Nombre', role: 'student' }, error: null })
    const res = await PATCH(
      authPatch('u-target', { nombre: 'Nuevo Nombre', puntos: 9999, nivel: 99 }, ADMIN_TOKEN),
      { params }
    )
    expect(res.status).toBe(200)
    // El update de Supabase debe haberse llamado solo con 'nombre', no con puntos ni nivel
    expect(chain.update).toHaveBeenCalledWith({ nombre: 'Nuevo Nombre' })
  })
})

// ── DELETE /api/admin/users/[id] ────────────────────────────────────────────
describe('DELETE /api/admin/users/[id]', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('retorna 403 para no-admin', async () => {
    const params = Promise.resolve({ id: 'u-target' })
    const res = await DELETE(authDelete('u-target', STUDENT_TOKEN), { params })
    expect(res.status).toBe(403)
  })

  it('no permite que un admin se elimine a sí mismo', async () => {
    const params = Promise.resolve({ id: 'admin-1' }) // mismo sub del token
    const res = await DELETE(authDelete('admin-1', ADMIN_TOKEN), { params })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/ti mismo/i)
  })

  it('elimina un usuario correctamente', async () => {
    const params = Promise.resolve({ id: 'u-target' })
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ error: null }).then(resolve)
    )
    const res = await DELETE(authDelete('u-target', ADMIN_TOKEN), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})
