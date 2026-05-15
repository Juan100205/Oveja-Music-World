/**
 * @jest-environment node
 *
 * TDD — POST /api/admin/seed-instrumentos
 *
 * Verifica:
 *  - 403 sin token o con rol no-admin
 *  - 200 con admin: upsertea 6 instrumentos + 6 cursos
 *  - Todos los instrumentos tienen zona='ambos' (visibles en clase y gym)
 *  - Todos tienen activo=true
 *  - Cada instrumento tiene curso_id definido
 *  - Es idempotente (upsert, no insert)
 *  - 500 cuando DB falla en cursos
 *  - 500 cuando DB falla en instrumentos
 */

import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  extractTokenFromHeader: jest.fn(),
  verifyToken:            jest.fn(),
}))

import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
const mockExtract = extractTokenFromHeader as jest.Mock
const mockVerify  = verifyToken as jest.Mock

const mockFrom = jest.fn()
jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({ from: (...a: unknown[]) => mockFrom(...a) }),
}))

import { POST, SEED_INSTRUMENTOS, SEED_CURSOS } from '@/app/api/admin/seed-instrumentos/route'

function makeReq() {
  return new NextRequest('http://localhost/api/admin/seed-instrumentos', {
    method: 'POST',
    headers: { Authorization: 'Bearer tok' },
  })
}

function authAs(role: 'student' | 'teacher' | 'admin') {
  mockExtract.mockReturnValue('tok')
  mockVerify.mockReturnValue({ sub: 'u-1', email: 'admin@t.com', role })
}

// Chain que simula upsert().select() → { data, error }
function makeUpsertChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  ;['upsert', 'select'].forEach(m => { chain[m] = jest.fn().mockReturnValue(chain) })
  chain.then = (res: (v: unknown) => unknown) => Promise.resolve(result).then(res)
  return chain
}

afterEach(() => jest.clearAllMocks())

// ══════════════════════════════════════════════════════════════
// Auth
// ══════════════════════════════════════════════════════════════
describe('POST /api/admin/seed-instrumentos — auth', () => {
  it('403 sin token', async () => {
    mockExtract.mockReturnValue(null)
    const res = await POST(makeReq())
    expect(res.status).toBe(403)
  })

  it('403 con token de student', async () => {
    authAs('student')
    const res = await POST(makeReq())
    expect(res.status).toBe(403)
  })

  it('403 con token de teacher', async () => {
    authAs('teacher')
    const res = await POST(makeReq())
    expect(res.status).toBe(403)
  })

  it('200 con token de admin', async () => {
    authAs('admin')
    mockFrom.mockReturnValue(makeUpsertChain({ data: SEED_INSTRUMENTOS, error: null }))
    const res = await POST(makeReq())
    expect(res.status).toBe(200)
  })
})

// ══════════════════════════════════════════════════════════════
// Datos del seed
// ══════════════════════════════════════════════════════════════
describe('SEED_INSTRUMENTOS — estructura de datos', () => {
  it('contiene exactamente 6 instrumentos', () => {
    expect(SEED_INSTRUMENTOS).toHaveLength(6)
  })

  it('todos tienen zona="ambos" (visibles en clase Y gym)', () => {
    expect(SEED_INSTRUMENTOS.every(i => i.zona === 'ambos')).toBe(true)
  })

  it('todos tienen activo=true', () => {
    expect(SEED_INSTRUMENTOS.every(i => i.activo === true)).toBe(true)
  })

  it('todos tienen curso_id definido', () => {
    expect(SEED_INSTRUMENTOS.every(i => typeof i.curso_id === 'string' && i.curso_id.length > 0)).toBe(true)
  })

  it('los IDs esperados están presentes', () => {
    const ids = SEED_INSTRUMENTOS.map(i => i.id)
    expect(ids).toContain('bateria')
    expect(ids).toContain('piano')
    expect(ids).toContain('guitarra')
    expect(ids).toContain('canto')
    expect(ids).toContain('violin')
    expect(ids).toContain('introduccion')
  })

  it('el orden es secuencial (0..5)', () => {
    const ordenes = SEED_INSTRUMENTOS.map(i => i.orden).sort((a, b) => a - b)
    expect(ordenes).toEqual([0, 1, 2, 3, 4, 5])
  })
})

describe('SEED_CURSOS — estructura de datos', () => {
  it('contiene exactamente 6 cursos', () => {
    expect(SEED_CURSOS).toHaveLength(6)
  })

  it('todos tienen id y nombre', () => {
    expect(SEED_CURSOS.every(c => c.id && c.nombre)).toBe(true)
  })

  it('cada instrumento apunta a un curso_id presente en SEED_CURSOS', () => {
    const cursoIds = new Set(SEED_CURSOS.map(c => c.id))
    expect(SEED_INSTRUMENTOS.every(i => cursoIds.has(i.curso_id))).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════
// Respuesta del endpoint
// ══════════════════════════════════════════════════════════════
describe('POST /api/admin/seed-instrumentos — respuesta', () => {
  beforeEach(() => authAs('admin'))

  it('retorna ok:true y count=6', async () => {
    mockFrom.mockReturnValue(makeUpsertChain({ data: SEED_INSTRUMENTOS, error: null }))
    const res  = await POST(makeReq())
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.seeded).toBe(6)
  })

  it('retorna los instrumentos resultantes', async () => {
    mockFrom.mockReturnValue(makeUpsertChain({ data: SEED_INSTRUMENTOS, error: null }))
    const res  = await POST(makeReq())
    const body = await res.json()
    expect(Array.isArray(body.results)).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════
// Errores DB
// ══════════════════════════════════════════════════════════════
describe('POST /api/admin/seed-instrumentos — errores DB', () => {
  beforeEach(() => authAs('admin'))

  it('500 cuando falla el upsert de cursos', async () => {
    // Primera llamada (cursos) falla, segunda (instrumentos) no llega
    mockFrom
      .mockReturnValueOnce(makeUpsertChain({ data: null, error: { message: 'DB timeout' } }))
    const res = await POST(makeReq())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/cursos/)
  })

  it('500 cuando falla el upsert de instrumentos', async () => {
    mockFrom
      .mockReturnValueOnce(makeUpsertChain({ data: [], error: null }))         // cursos ok
      .mockReturnValueOnce(makeUpsertChain({ data: null, error: { message: 'constraint violation' } })) // instrs falla
    const res = await POST(makeReq())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/instrumentos/)
  })
})
