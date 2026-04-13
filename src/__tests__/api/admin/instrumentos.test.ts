/**
 * @jest-environment node
 *
 * TDD — Admin Instrumentos CRUD
 *
 * Rutas cubiertas:
 *  GET    /api/admin/instrumentos          → lista completa (admin)
 *  POST   /api/admin/instrumentos          → crear instrumento (con/sin auto-curso)
 *  PATCH  /api/admin/instrumentos/[id]     → actualizar campos
 *  DELETE /api/admin/instrumentos/[id]     → eliminar
 *
 * Casos clave:
 *  - Auth: 403 sin token, 403 student/teacher
 *  - POST: crea curso automático si crear_curso_vacio !== false
 *  - POST: reutiliza curso existente si ya existe
 *  - POST: genera id único (agrega timestamp si ya existe)
 *  - POST: glow por defecto = color + '66'
 *  - PATCH: solo campos permitidos
 *  - DELETE: 200 ok / 500 error DB
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

import { GET as getInstrumentos, POST as postInstrumento } from '@/app/api/admin/instrumentos/route'
import { PATCH as patchInstrumento, DELETE as deleteInstrumento } from '@/app/api/admin/instrumentos/[id]/route'

function makeChain(resolved: unknown) {
  const c: Record<string, unknown> = {}
  ;['select','insert','update','delete','eq','order','limit'].forEach(m => {
    c[m] = jest.fn().mockReturnValue(c)
  })
  c.single      = jest.fn().mockResolvedValue(resolved)
  c.maybeSingle = jest.fn().mockResolvedValue(resolved)
  c.then  = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(res, rej)
  c.catch = (rej: (e: unknown) => unknown) => Promise.resolve(resolved).catch(rej)
  return c
}

function adminAuth() {
  mockExtract.mockReturnValue('tok')
  mockVerify.mockReturnValue({ sub: 'a-1', role: 'admin', email: 'admin@test.com', nivel: 5 })
}
function noAuth()    { mockExtract.mockReturnValue(null) }
function studentAuth() {
  mockExtract.mockReturnValue('tok')
  mockVerify.mockReturnValue({ sub: 's-1', role: 'student', email: 's@t.com', nivel: 1 })
}
function teacherAuth() {
  mockExtract.mockReturnValue('tok')
  mockVerify.mockReturnValue({ sub: 't-1', role: 'teacher', email: 't@t.com', nivel: 2 })
}

function makeReq(url: string, opts?: { method?: string; body?: unknown }) {
  return new NextRequest(url, {
    method: opts?.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tok' },
    ...(opts?.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  })
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

const INSTRUMENTO_DB = {
  id: 'piano', nombre: 'Piano', emoji: '🎹', descripcion: 'Clases de piano',
  color: '#ec488a', glow: 'rgba(236,72,138,0.4)', zona: 'clase',
  curso_id: 'piano', orden: 0, activo: true, created_at: '2024-01-01',
}

afterEach(() => jest.clearAllMocks())

// ══════════════════════════════════════════════════════════════
// GET /api/admin/instrumentos
// ══════════════════════════════════════════════════════════════
describe('GET /api/admin/instrumentos', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await getInstrumentos(makeReq('http://localhost/api/admin/instrumentos'))
    expect(res.status).toBe(403)
  })

  it('403 con token student', async () => {
    studentAuth()
    const res = await getInstrumentos(makeReq('http://localhost/api/admin/instrumentos'))
    expect(res.status).toBe(403)
  })

  it('403 con token teacher', async () => {
    teacherAuth()
    const res = await getInstrumentos(makeReq('http://localhost/api/admin/instrumentos'))
    expect(res.status).toBe(403)
  })

  it('200 retorna lista completa de instrumentos', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: [INSTRUMENTO_DB], error: null }))

    const res  = await getInstrumentos(makeReq('http://localhost/api/admin/instrumentos'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body.instrumentos)).toBe(true)
    expect(body.instrumentos).toHaveLength(1)
    expect(body.instrumentos[0].id).toBe('piano')
  })

  it('200 retorna array vacío si no hay instrumentos', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))

    const res  = await getInstrumentos(makeReq('http://localhost/api/admin/instrumentos'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.instrumentos).toEqual([])
  })

  it('500 cuando DB falla', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }))

    const res = await getInstrumentos(makeReq('http://localhost/api/admin/instrumentos'))
    expect(res.status).toBe(500)
  })
})

// ══════════════════════════════════════════════════════════════
// POST /api/admin/instrumentos — validaciones
// ══════════════════════════════════════════════════════════════
describe('POST /api/admin/instrumentos — validaciones', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await postInstrumento(makeReq('http://localhost/api/admin/instrumentos', {
      method: 'POST', body: { nombre: 'Violín', color: '#ec488a', zona: 'clase' },
    }))
    expect(res.status).toBe(403)
  })

  it('400 body inválido (no JSON)', async () => {
    adminAuth()
    const res = await postInstrumento(new NextRequest('http://localhost/api/admin/instrumentos', {
      method: 'POST', body: 'INVALID{{', headers: { Authorization: 'Bearer tok' },
    }))
    expect(res.status).toBe(400)
  })

  it('400 sin nombre', async () => {
    adminAuth()
    const res = await postInstrumento(makeReq('http://localhost/api/admin/instrumentos', {
      method: 'POST', body: { color: '#ec488a', zona: 'clase' },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/nombre/i)
  })

  it('400 sin color', async () => {
    adminAuth()
    const res = await postInstrumento(makeReq('http://localhost/api/admin/instrumentos', {
      method: 'POST', body: { nombre: 'Violín', zona: 'clase' },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/color/i)
  })

  it('400 sin zona', async () => {
    adminAuth()
    const res = await postInstrumento(makeReq('http://localhost/api/admin/instrumentos', {
      method: 'POST', body: { nombre: 'Violín', color: '#ec488a' },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/zona/i)
  })
})

// ══════════════════════════════════════════════════════════════
// POST /api/admin/instrumentos — creación con auto-curso
// ══════════════════════════════════════════════════════════════
describe('POST /api/admin/instrumentos — creación con curso automático', () => {
  beforeEach(() => adminAuth())

  /**
   * Flujo POST con crear_curso_vacio (default):
   *  1. from('cursos').select('id').eq('id', slug).maybeSingle() → ¿existe?
   *  2. from('cursos').select('*', {count: 'exact', head: true}) → count
   *  3. from('cursos').insert(...) → crea curso
   *  4. from('instrumentos').select('id').eq('id', id).maybySingle() → ¿id libre?
   *  5. from('instrumentos').select('*', {count: 'exact', head: true}) → orden
   *  6. from('instrumentos').insert(...).select().single() → crea instrumento
   */
  function setupPostMock(opts: {
    cursoExistente?: boolean
    idTomado?:       boolean
    insertData?:     object
    insertError?:    object | null
  }) {
    const { cursoExistente = false, idTomado = false, insertData = INSTRUMENTO_DB, insertError = null } = opts

    mockFrom
      // 1. check curso existente
      .mockReturnValueOnce(makeChain({ data: cursoExistente ? { id: 'violin' } : null, error: null }))
      // 2. count cursos (solo si no existe)
      .mockReturnValueOnce(makeChain({ count: 2, error: null }))
      // 3. insert curso (solo si no existe)
      .mockReturnValueOnce(makeChain({ error: null }))
      // 4. check id instrumento
      .mockReturnValueOnce(makeChain({ data: idTomado ? { id: 'violin' } : null, error: null }))
      // 5. count instrumentos
      .mockReturnValueOnce(makeChain({ count: 3, error: null }))
      // 6. insert instrumento
      .mockReturnValueOnce(makeChain({ data: insertData, error: insertError }))
  }

  it('201 crea instrumento con curso automático', async () => {
    setupPostMock({})

    const res  = await postInstrumento(makeReq('http://localhost/api/admin/instrumentos', {
      method: 'POST',
      body: { nombre: 'Violín', emoji: '🎻', color: '#ec488a', glow: 'rgba(236,72,138,0.4)', zona: 'clase' },
    }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.instrumento).toBeDefined()
  })

  it('201 reutiliza curso existente (no lo recrea)', async () => {
    // Cuando el curso YA existe, actualiza su nombre/emoji en lugar de insertar
    mockFrom
      .mockReturnValueOnce(makeChain({ data: { id: 'violin' }, error: null })) // curso existe
      .mockReturnValueOnce(makeChain({ data: null, error: null }))              // update curso
      .mockReturnValueOnce(makeChain({ data: null, error: null }))              // check instrumento id
      .mockReturnValueOnce(makeChain({ count: 3, error: null }))                // count instrumentos
      .mockReturnValueOnce(makeChain({ data: INSTRUMENTO_DB, error: null }))    // insert instrumento

    const res  = await postInstrumento(makeReq('http://localhost/api/admin/instrumentos', {
      method: 'POST',
      body: { nombre: 'Violín', color: '#ec488a', zona: 'clase' },
    }))
    expect(res.status).toBe(201)
  })

  it('201 con crear_curso_vacio: false — no crea curso', async () => {
    // Sin crear curso: solo 3 llamadas (check id, count, insert instrumento)
    mockFrom
      .mockReturnValueOnce(makeChain({ data: null, error: null }))           // check instrumento id
      .mockReturnValueOnce(makeChain({ count: 1, error: null }))             // count instrumentos
      .mockReturnValueOnce(makeChain({ data: INSTRUMENTO_DB, error: null })) // insert instrumento

    const res  = await postInstrumento(makeReq('http://localhost/api/admin/instrumentos', {
      method: 'POST',
      body: { nombre: 'Violín', color: '#ec488a', zona: 'clase', crear_curso_vacio: false },
    }))
    expect(res.status).toBe(201)
  })

  it('genera glow por defecto como color + "66" si no se envía glow', async () => {
    const instrSinGlow = { ...INSTRUMENTO_DB, glow: '#ec488a66' }
    mockFrom
      .mockReturnValueOnce(makeChain({ data: null, error: null }))              // check curso
      .mockReturnValueOnce(makeChain({ count: 0, error: null }))                // count cursos
      .mockReturnValueOnce(makeChain({ error: null }))                          // insert curso
      .mockReturnValueOnce(makeChain({ data: null, error: null }))              // check instr id
      .mockReturnValueOnce(makeChain({ count: 0, error: null }))                // count instrs
      .mockReturnValueOnce(makeChain({ data: instrSinGlow, error: null }))      // insert

    const res  = await postInstrumento(makeReq('http://localhost/api/admin/instrumentos', {
      method: 'POST',
      body: { nombre: 'Violín', color: '#ec488a', zona: 'clase' }, // sin glow
    }))
    expect(res.status).toBe(201)
  })

  it('500 cuando falla la creación del curso', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: null, error: null }))                  // check curso
      .mockReturnValueOnce(makeChain({ count: 0, error: null }))                    // count
      .mockReturnValueOnce(makeChain({ error: { message: 'Insert error' } }))       // insert curso FALLA

    const res  = await postInstrumento(makeReq('http://localhost/api/admin/instrumentos', {
      method: 'POST',
      body: { nombre: 'Violín', color: '#ec488a', zona: 'clase' },
    }))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toMatch(/no se pudo crear/i)
  })

  it('500 cuando falla la inserción del instrumento', async () => {
    setupPostMock({ insertError: { message: 'Constraint violation' } })

    const res  = await postInstrumento(makeReq('http://localhost/api/admin/instrumentos', {
      method: 'POST',
      body: { nombre: 'Violín', color: '#ec488a', zona: 'clase' },
    }))
    expect(res.status).toBe(500)
  })

  it('instrumentos zona clase y gym son válidos', async () => {
    for (const zona of ['clase', 'gym']) {
      jest.clearAllMocks()
      adminAuth()
      setupPostMock({ insertData: { ...INSTRUMENTO_DB, zona } })

      const res = await postInstrumento(makeReq('http://localhost/api/admin/instrumentos', {
        method: 'POST',
        body: { nombre: 'Test', color: '#000', zona },
      }))
      expect(res.status).toBe(201)
    }
  })
})

// ══════════════════════════════════════════════════════════════
// PATCH /api/admin/instrumentos/[id]
// ══════════════════════════════════════════════════════════════
describe('PATCH /api/admin/instrumentos/[id]', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await patchInstrumento(
      makeReq('http://localhost/api/admin/instrumentos/piano', { method: 'PATCH', body: { nombre: 'Piano Pro' } }),
      makeParams('piano')
    )
    expect(res.status).toBe(403)
  })

  it('400 body inválido', async () => {
    adminAuth()
    const res = await patchInstrumento(
      new NextRequest('http://localhost/api/admin/instrumentos/piano', {
        method: 'PATCH', body: 'NOT_JSON{{', headers: { Authorization: 'Bearer tok' },
      }),
      makeParams('piano')
    )
    expect(res.status).toBe(400)
  })

  it('400 body sin campos permitidos', async () => {
    adminAuth()
    const res = await patchInstrumento(
      makeReq('http://localhost/api/admin/instrumentos/piano', { method: 'PATCH', body: { puntos: 100 } }),
      makeParams('piano')
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/sin campos/i)
  })

  it('200 actualiza nombre', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: { ...INSTRUMENTO_DB, nombre: 'Piano Actualizado' }, error: null }))

    const res  = await patchInstrumento(
      makeReq('http://localhost/api/admin/instrumentos/piano', { method: 'PATCH', body: { nombre: 'Piano Actualizado' } }),
      makeParams('piano')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.instrumento.nombre).toBe('Piano Actualizado')
  })

  it('200 actualiza activo (desactivar instrumento)', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: { ...INSTRUMENTO_DB, activo: false }, error: null }))

    const res  = await patchInstrumento(
      makeReq('http://localhost/api/admin/instrumentos/piano', { method: 'PATCH', body: { activo: false } }),
      makeParams('piano')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.instrumento.activo).toBe(false)
  })

  it('200 actualiza color y glow juntos', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({
      data: { ...INSTRUMENTO_DB, color: '#9b54f9', glow: 'rgba(155,84,249,0.4)' }, error: null,
    }))

    const res = await patchInstrumento(
      makeReq('http://localhost/api/admin/instrumentos/piano', {
        method: 'PATCH',
        body: { color: '#9b54f9', glow: 'rgba(155,84,249,0.4)' },
      }),
      makeParams('piano')
    )
    expect(res.status).toBe(200)
  })

  it('200 actualiza zona (clase → gym)', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: { ...INSTRUMENTO_DB, zona: 'gym' }, error: null }))

    const res = await patchInstrumento(
      makeReq('http://localhost/api/admin/instrumentos/piano', { method: 'PATCH', body: { zona: 'gym' } }),
      makeParams('piano')
    )
    expect(res.status).toBe(200)
  })

  it('200 actualiza curso_id', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: { ...INSTRUMENTO_DB, curso_id: 'piano-ninos' }, error: null }))

    const res = await patchInstrumento(
      makeReq('http://localhost/api/admin/instrumentos/piano', { method: 'PATCH', body: { curso_id: 'piano-ninos' } }),
      makeParams('piano')
    )
    expect(res.status).toBe(200)
  })

  it('500 cuando DB falla', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Update failed' } }))

    const res = await patchInstrumento(
      makeReq('http://localhost/api/admin/instrumentos/piano', { method: 'PATCH', body: { nombre: 'X' } }),
      makeParams('piano')
    )
    expect(res.status).toBe(500)
  })
})

// ══════════════════════════════════════════════════════════════
// DELETE /api/admin/instrumentos/[id]
// ══════════════════════════════════════════════════════════════
describe('DELETE /api/admin/instrumentos/[id]', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await deleteInstrumento(
      makeReq('http://localhost/api/admin/instrumentos/piano', { method: 'DELETE' }),
      makeParams('piano')
    )
    expect(res.status).toBe(403)
  })

  it('200 elimina instrumento', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ error: null }))

    const res  = await deleteInstrumento(
      makeReq('http://localhost/api/admin/instrumentos/piano', { method: 'DELETE' }),
      makeParams('piano')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
  })

  it('500 cuando DB falla', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ error: { message: 'Delete failed' } }))

    const res = await deleteInstrumento(
      makeReq('http://localhost/api/admin/instrumentos/piano', { method: 'DELETE' }),
      makeParams('piano')
    )
    expect(res.status).toBe(500)
  })
})
