/**
 * @jest-environment node
 *
 * TDD EXHAUSTIVO — Admin Content CRUD
 *
 * Rutas cubiertas:
 *  GET  /api/admin/content          → lista cursos
 *  GET  /api/admin/content?id=piano → árbol completo
 *  POST /api/admin/content/cursos
 *  PATCH /api/admin/content/cursos/[id]
 *  DELETE /api/admin/content/cursos/[id]
 *  POST /api/admin/content/modulos
 *  PATCH /api/admin/content/modulos/[id]
 *  DELETE /api/admin/content/modulos/[id]
 *  POST /api/admin/content/secciones
 *  PATCH /api/admin/content/secciones/[id]
 *  DELETE /api/admin/content/secciones/[id]
 *  POST /api/admin/content/recursos
 *  PATCH /api/admin/content/recursos/[id]
 *  DELETE /api/admin/content/recursos/[id]
 */

import { NextRequest } from 'next/server'

// ── Auth mock ──────────────────────────────────────────────────
jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  extractTokenFromHeader: jest.fn(),
  verifyToken: jest.fn(),
}))

import { extractTokenFromHeader, verifyToken } from '@/lib/auth'
const mockExtract = extractTokenFromHeader as jest.Mock
const mockVerify  = verifyToken as jest.Mock

// ── Supabase mock ──────────────────────────────────────────────
const mockFrom = jest.fn()
jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({ from: (...args: unknown[]) => mockFrom(...args) }),
}))

// ── Imports de rutas (después de mocks) ───────────────────────
import { GET as getContent } from '@/app/api/admin/content/route'
import { POST as postCurso } from '@/app/api/admin/content/cursos/route'
import { PATCH as patchCurso, DELETE as deleteCurso } from '@/app/api/admin/content/cursos/[id]/route'
import { POST as postModulo } from '@/app/api/admin/content/modulos/route'
import { PATCH as patchModulo, DELETE as deleteModulo } from '@/app/api/admin/content/modulos/[id]/route'
import { POST as postSeccion } from '@/app/api/admin/content/secciones/route'
import { PATCH as patchSeccion, DELETE as deleteSeccion } from '@/app/api/admin/content/secciones/[id]/route'
import { POST as postRecurso } from '@/app/api/admin/content/recursos/route'
import { PATCH as patchRecurso, DELETE as deleteRecurso } from '@/app/api/admin/content/recursos/[id]/route'

// ── Helpers ───────────────────────────────────────────────────

/**
 * Crea un chain Supabase chainable + thenable.
 * Se puede usar en:
 *   await db.from(...).select().eq().single()   → resolved
 *   await db.from(...).select('*', {head:true}).eq() → resolved (count)
 */
function makeChain(resolved: unknown) {
  const chain: Record<string, unknown> = {}
  const self = () => chain
  ;['select','insert','update','delete','upsert','eq','order','limit','in','maybeSingle'].forEach(m => {
    chain[m] = jest.fn().mockReturnValue(chain)
  })
  chain.single      = jest.fn().mockResolvedValue(resolved)
  chain.maybeSingle = jest.fn().mockResolvedValue(resolved)
  // thenable → permite `await chain.select(...)` o `await chain.select(...).eq(...)`
  chain.then  = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(res, rej)
  chain.catch = (rej: (e: unknown) => unknown) => Promise.resolve(resolved).catch(rej)
  return chain
}

function adminAuth() {
  mockExtract.mockReturnValue('admin-token')
  mockVerify.mockReturnValue({ sub: 'admin-1', role: 'admin', email: 'admin@test.com', nivel: 5 })
}

function noAuth() {
  mockExtract.mockReturnValue(null)
}

function studentAuth() {
  mockExtract.mockReturnValue('student-token')
  mockVerify.mockReturnValue({ sub: 'student-1', role: 'student', email: 's@test.com', nivel: 1 })
}

function makeReq(url: string, opts?: { method?: string; body?: unknown; token?: string }) {
  return new NextRequest(url, {
    method: opts?.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts?.token ?? 'admin-token'}`,
    },
    ...(opts?.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  })
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

// Fixtures
const CURSO_DB   = { id: 'piano', nombre: 'Piano', emoji: '🎹', orden: 0 }
const MODULO_DB  = { id: 'piano-modulo-1', nombre: 'Nivel 1', curso_id: 'piano', orden: 0 }
const SECCION_DB = { id: 'sec-1', nombre: 'Fundamentos', modulo_id: 'piano-modulo-1', zona: null, orden: 0 }
const RECURSO_DB = { id: 'rec-1', url: 'https://yt.com/v=abc', tipo: 'video', label: 'Clase 1', seccion_id: 'sec-1', orden: 0 }

afterEach(() => jest.clearAllMocks())

// ══════════════════════════════════════════════════════════════
// GET /api/admin/content
// ══════════════════════════════════════════════════════════════
describe('GET /api/admin/content — lista de cursos', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await getContent(makeReq('http://localhost/api/admin/content'))
    expect(res.status).toBe(403)
  })

  it('403 con token de student', async () => {
    studentAuth()
    const res = await getContent(makeReq('http://localhost/api/admin/content'))
    expect(res.status).toBe(403)
  })

  it('200 retorna lista de cursos', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: [CURSO_DB], error: null }))

    const res  = await getContent(makeReq('http://localhost/api/admin/content'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body.cursos)).toBe(true)
  })

  it('200 retorna array vacío si no hay cursos', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))

    const res  = await getContent(makeReq('http://localhost/api/admin/content'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.cursos).toEqual([])
  })

  it('500 cuando DB falla', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }))

    const res = await getContent(makeReq('http://localhost/api/admin/content'))
    expect(res.status).toBe(500)
  })
})

describe('GET /api/admin/content?id=piano — árbol completo', () => {
  it('404 cuando el curso no existe', async () => {
    adminAuth()
    // curso no encontrado
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Not found' } }))

    const res = await getContent(makeReq('http://localhost/api/admin/content?id=piano'))
    expect(res.status).toBe(404)
  })

  it('200 retorna árbol curso → módulos → secciones → recursos', async () => {
    adminAuth()
    // Primer from → curso
    // Segundo from → módulos
    // Tercer from → secciones del módulo
    // Cuarto from → recursos de la sección
    mockFrom
      .mockReturnValueOnce(makeChain({ data: CURSO_DB,   error: null }))  // curso
      .mockReturnValueOnce(makeChain({ data: [MODULO_DB], error: null }))  // modulos
      .mockReturnValueOnce(makeChain({ data: [SECCION_DB], error: null })) // secciones
      .mockReturnValueOnce(makeChain({ data: [RECURSO_DB], error: null })) // recursos

    const res  = await getContent(makeReq('http://localhost/api/admin/content?id=piano'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.curso.id).toBe('piano')
    expect(Array.isArray(body.curso.modulos)).toBe(true)
  })

  it('200 curso sin módulos retorna modulos vacío', async () => {
    adminAuth()
    mockFrom
      .mockReturnValueOnce(makeChain({ data: CURSO_DB, error: null }))
      .mockReturnValueOnce(makeChain({ data: [],       error: null }))

    const res  = await getContent(makeReq('http://localhost/api/admin/content?id=piano'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.curso.modulos).toEqual([])
  })
})

// ══════════════════════════════════════════════════════════════
// POST /api/admin/content/cursos
// ══════════════════════════════════════════════════════════════
describe('POST /api/admin/content/cursos', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await postCurso(makeReq('http://localhost/api/admin/content/cursos', {
      method: 'POST', body: { nombre: 'Piano' },
    }))
    expect(res.status).toBe(403)
  })

  it('400 sin nombre', async () => {
    adminAuth()
    const res = await postCurso(makeReq('http://localhost/api/admin/content/cursos', {
      method: 'POST', body: { emoji: '🎹' },
    }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/nombre/i)
  })

  it('400 nombre vacío', async () => {
    adminAuth()
    const res = await postCurso(makeReq('http://localhost/api/admin/content/cursos', {
      method: 'POST', body: { nombre: '   ' },
    }))
    expect(res.status).toBe(400)
  })

  it('201 crea curso con slug auto-generado desde nombre', async () => {
    adminAuth()
    const newCurso = { id: 'piano-1748000000000', nombre: 'Piano', emoji: '🎹', orden: 0 }
    // count → insert
    mockFrom
      .mockReturnValueOnce(makeChain({ count: 0, error: null }))
      .mockReturnValueOnce(makeChain({ data: newCurso, error: null }))

    const res  = await postCurso(makeReq('http://localhost/api/admin/content/cursos', {
      method: 'POST', body: { nombre: 'Piano', emoji: '🎹' },
    }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.curso).toBeDefined()
    expect(body.curso.nombre).toBe('Piano')
  })

  it('201 crea curso con id preferido', async () => {
    adminAuth()
    const newCurso = { ...CURSO_DB }
    // count → exists check (null = libre) → insert
    mockFrom
      .mockReturnValueOnce(makeChain({ count: 0, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null })) // no existe
      .mockReturnValueOnce(makeChain({ data: newCurso, error: null }))

    const res  = await postCurso(makeReq('http://localhost/api/admin/content/cursos', {
      method: 'POST', body: { nombre: 'Piano', id: 'piano', emoji: '🎹' },
    }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.curso.id).toBe('piano')
  })

  it('409 cuando el id preferido ya existe', async () => {
    adminAuth()
    // count → exists check (devuelve el curso existente)
    mockFrom
      .mockReturnValueOnce(makeChain({ count: 1, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: 'piano' }, error: null }))

    const res  = await postCurso(makeReq('http://localhost/api/admin/content/cursos', {
      method: 'POST', body: { nombre: 'Piano Nuevo', id: 'piano' },
    }))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/ya existe/i)
  })

  it('500 cuando DB falla en insert', async () => {
    adminAuth()
    mockFrom
      .mockReturnValueOnce(makeChain({ count: 0, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: { message: 'Insert failed' } }))

    const res = await postCurso(makeReq('http://localhost/api/admin/content/cursos', {
      method: 'POST', body: { nombre: 'Piano' },
    }))
    expect(res.status).toBe(500)
  })

  it('emoji por defecto 🎵 si no se envía', async () => {
    adminAuth()
    const newCurso = { id: 'violin', nombre: 'Violín', emoji: '🎵', orden: 0 }
    mockFrom
      .mockReturnValueOnce(makeChain({ count: 0, error: null }))
      .mockReturnValueOnce(makeChain({ data: newCurso, error: null }))

    const res  = await postCurso(makeReq('http://localhost/api/admin/content/cursos', {
      method: 'POST', body: { nombre: 'Violín' },
    }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.curso.emoji).toBe('🎵')
  })
})

// ══════════════════════════════════════════════════════════════
// PATCH /api/admin/content/cursos/[id]
// ══════════════════════════════════════════════════════════════
describe('PATCH /api/admin/content/cursos/[id]', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await patchCurso(
      makeReq('http://localhost/api/admin/content/cursos/piano', { method: 'PATCH', body: { nombre: 'Piano Pro' } }),
      makeParams('piano')
    )
    expect(res.status).toBe(403)
  })

  it('400 body sin campos reconocidos', async () => {
    adminAuth()
    const res = await patchCurso(
      makeReq('http://localhost/api/admin/content/cursos/piano', { method: 'PATCH', body: {} }),
      makeParams('piano')
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/nada/i)
  })

  it('200 actualiza nombre', async () => {
    adminAuth()
    const updated = { ...CURSO_DB, nombre: 'Piano Pro' }
    mockFrom.mockReturnValue(makeChain({ data: updated, error: null }))

    const res  = await patchCurso(
      makeReq('http://localhost/api/admin/content/cursos/piano', { method: 'PATCH', body: { nombre: 'Piano Pro' } }),
      makeParams('piano')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.curso.nombre).toBe('Piano Pro')
  })

  it('200 actualiza emoji', async () => {
    adminAuth()
    const updated = { ...CURSO_DB, emoji: '🎹' }
    mockFrom.mockReturnValue(makeChain({ data: updated, error: null }))

    const res  = await patchCurso(
      makeReq('http://localhost/api/admin/content/cursos/piano', { method: 'PATCH', body: { emoji: '🎹' } }),
      makeParams('piano')
    )
    expect(res.status).toBe(200)
  })

  it('200 actualiza nombre y emoji juntos', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: { ...CURSO_DB, nombre: 'X', emoji: '🎸' }, error: null }))

    const res = await patchCurso(
      makeReq('http://localhost/api/admin/content/cursos/piano', { method: 'PATCH', body: { nombre: 'X', emoji: '🎸' } }),
      makeParams('piano')
    )
    expect(res.status).toBe(200)
  })

  it('500 cuando DB falla', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Update failed' } }))

    const res = await patchCurso(
      makeReq('http://localhost/api/admin/content/cursos/piano', { method: 'PATCH', body: { nombre: 'X' } }),
      makeParams('piano')
    )
    expect(res.status).toBe(500)
  })
})

// ══════════════════════════════════════════════════════════════
// DELETE /api/admin/content/cursos/[id]
// ══════════════════════════════════════════════════════════════
describe('DELETE /api/admin/content/cursos/[id]', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await deleteCurso(
      makeReq('http://localhost/api/admin/content/cursos/piano', { method: 'DELETE' }),
      makeParams('piano')
    )
    expect(res.status).toBe(403)
  })

  it('200 elimina curso exitosamente', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ error: null }))

    const res  = await deleteCurso(
      makeReq('http://localhost/api/admin/content/cursos/piano', { method: 'DELETE' }),
      makeParams('piano')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
  })

  it('500 cuando DB falla al eliminar', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ error: { message: 'Delete failed' } }))

    const res = await deleteCurso(
      makeReq('http://localhost/api/admin/content/cursos/piano', { method: 'DELETE' }),
      makeParams('piano')
    )
    expect(res.status).toBe(500)
  })
})

// ══════════════════════════════════════════════════════════════
// POST /api/admin/content/modulos
// ══════════════════════════════════════════════════════════════
describe('POST /api/admin/content/modulos', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await postModulo(makeReq('http://localhost/api/admin/content/modulos', {
      method: 'POST', body: { curso_id: 'piano', nombre: 'Nivel 1' },
    }))
    expect(res.status).toBe(403)
  })

  it('400 sin curso_id', async () => {
    adminAuth()
    const res = await postModulo(makeReq('http://localhost/api/admin/content/modulos', {
      method: 'POST', body: { nombre: 'Nivel 1' },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/curso_id/i)
  })

  it('400 sin nombre', async () => {
    adminAuth()
    const res = await postModulo(makeReq('http://localhost/api/admin/content/modulos', {
      method: 'POST', body: { curso_id: 'piano' },
    }))
    expect(res.status).toBe(400)
  })

  it('201 crea módulo con orden correcto', async () => {
    adminAuth()
    // count → insert
    mockFrom
      .mockReturnValueOnce(makeChain({ count: 2, error: null }))   // 2 módulos existentes
      .mockReturnValueOnce(makeChain({ data: MODULO_DB, error: null }))

    const res  = await postModulo(makeReq('http://localhost/api/admin/content/modulos', {
      method: 'POST', body: { curso_id: 'piano', nombre: 'Nivel 1' },
    }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.modulo).toBeDefined()
    expect(Array.isArray(body.modulo.secciones)).toBe(true)
  })

  it('500 cuando DB falla en insert', async () => {
    adminAuth()
    mockFrom
      .mockReturnValueOnce(makeChain({ count: 0, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: { message: 'Insert failed' } }))

    const res = await postModulo(makeReq('http://localhost/api/admin/content/modulos', {
      method: 'POST', body: { curso_id: 'piano', nombre: 'Nivel 1' },
    }))
    expect(res.status).toBe(500)
  })

  it('500 cuando falla el count', async () => {
    adminAuth()
    mockFrom.mockReturnValueOnce(makeChain({ count: null, error: { message: 'Count failed' } }))

    const res = await postModulo(makeReq('http://localhost/api/admin/content/modulos', {
      method: 'POST', body: { curso_id: 'piano', nombre: 'Nivel 1' },
    }))
    expect(res.status).toBe(500)
  })
})

// ══════════════════════════════════════════════════════════════
// PATCH /api/admin/content/modulos/[id]
// ══════════════════════════════════════════════════════════════
describe('PATCH /api/admin/content/modulos/[id]', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await patchModulo(
      makeReq('http://localhost/api/admin/content/modulos/mod-1', { method: 'PATCH', body: { nombre: 'Nivel 2' } }),
      makeParams('mod-1')
    )
    expect(res.status).toBe(403)
  })

  it('400 sin nombre', async () => {
    adminAuth()
    const res = await patchModulo(
      makeReq('http://localhost/api/admin/content/modulos/mod-1', { method: 'PATCH', body: {} }),
      makeParams('mod-1')
    )
    expect(res.status).toBe(400)
  })

  it('400 nombre vacío', async () => {
    adminAuth()
    const res = await patchModulo(
      makeReq('http://localhost/api/admin/content/modulos/mod-1', { method: 'PATCH', body: { nombre: '  ' } }),
      makeParams('mod-1')
    )
    expect(res.status).toBe(400)
  })

  it('200 actualiza nombre del módulo', async () => {
    adminAuth()
    const updated = { ...MODULO_DB, nombre: 'Nivel Avanzado' }
    mockFrom.mockReturnValue(makeChain({ data: updated, error: null }))

    const res  = await patchModulo(
      makeReq('http://localhost/api/admin/content/modulos/mod-1', { method: 'PATCH', body: { nombre: 'Nivel Avanzado' } }),
      makeParams('mod-1')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.modulo.nombre).toBe('Nivel Avanzado')
  })

  it('500 cuando DB falla', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Update failed' } }))

    const res = await patchModulo(
      makeReq('http://localhost/api/admin/content/modulos/mod-1', { method: 'PATCH', body: { nombre: 'X' } }),
      makeParams('mod-1')
    )
    expect(res.status).toBe(500)
  })
})

// ══════════════════════════════════════════════════════════════
// DELETE /api/admin/content/modulos/[id]
// ══════════════════════════════════════════════════════════════
describe('DELETE /api/admin/content/modulos/[id]', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await deleteModulo(
      makeReq('http://localhost/api/admin/content/modulos/mod-1', { method: 'DELETE' }),
      makeParams('mod-1')
    )
    expect(res.status).toBe(403)
  })

  it('200 elimina módulo', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ error: null }))

    const res  = await deleteModulo(
      makeReq('http://localhost/api/admin/content/modulos/mod-1', { method: 'DELETE' }),
      makeParams('mod-1')
    )
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('500 cuando DB falla', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ error: { message: 'Delete failed' } }))

    const res = await deleteModulo(
      makeReq('http://localhost/api/admin/content/modulos/mod-1', { method: 'DELETE' }),
      makeParams('mod-1')
    )
    expect(res.status).toBe(500)
  })
})

// ══════════════════════════════════════════════════════════════
// POST /api/admin/content/secciones
// ══════════════════════════════════════════════════════════════
describe('POST /api/admin/content/secciones', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await postSeccion(makeReq('http://localhost/api/admin/content/secciones', {
      method: 'POST', body: { modulo_id: 'mod-1', nombre: 'Fundamentos' },
    }))
    expect(res.status).toBe(403)
  })

  it('400 sin modulo_id', async () => {
    adminAuth()
    const res = await postSeccion(makeReq('http://localhost/api/admin/content/secciones', {
      method: 'POST', body: { nombre: 'Fundamentos' },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/modulo_id/i)
  })

  it('400 sin nombre', async () => {
    adminAuth()
    const res = await postSeccion(makeReq('http://localhost/api/admin/content/secciones', {
      method: 'POST', body: { modulo_id: 'mod-1' },
    }))
    expect(res.status).toBe(400)
  })

  it('201 crea sección sin zona', async () => {
    adminAuth()
    mockFrom
      .mockReturnValueOnce(makeChain({ count: 0, error: null }))
      .mockReturnValueOnce(makeChain({ data: SECCION_DB, error: null }))

    const res  = await postSeccion(makeReq('http://localhost/api/admin/content/secciones', {
      method: 'POST', body: { modulo_id: 'mod-1', nombre: 'Fundamentos' },
    }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.seccion).toBeDefined()
    expect(Array.isArray(body.seccion.recursos)).toBe(true)
  })

  it('201 crea sección con zona', async () => {
    adminAuth()
    const secConZona = { ...SECCION_DB, zona: 'gym' }
    mockFrom
      .mockReturnValueOnce(makeChain({ count: 1, error: null }))
      .mockReturnValueOnce(makeChain({ data: secConZona, error: null }))

    const res  = await postSeccion(makeReq('http://localhost/api/admin/content/secciones', {
      method: 'POST', body: { modulo_id: 'mod-1', nombre: 'Cardio', zona: 'gym' },
    }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.seccion.zona).toBe('gym')
  })

  it('500 cuando DB falla', async () => {
    adminAuth()
    mockFrom
      .mockReturnValueOnce(makeChain({ count: 0, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: { message: 'Insert failed' } }))

    const res = await postSeccion(makeReq('http://localhost/api/admin/content/secciones', {
      method: 'POST', body: { modulo_id: 'mod-1', nombre: 'X' },
    }))
    expect(res.status).toBe(500)
  })
})

// ══════════════════════════════════════════════════════════════
// PATCH /api/admin/content/secciones/[id]
// ══════════════════════════════════════════════════════════════
describe('PATCH /api/admin/content/secciones/[id]', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await patchSeccion(
      makeReq('http://localhost/api/admin/content/secciones/sec-1', { method: 'PATCH', body: { nombre: 'X' } }),
      makeParams('sec-1')
    )
    expect(res.status).toBe(403)
  })

  it('400 body sin campos reconocidos', async () => {
    adminAuth()
    const res = await patchSeccion(
      makeReq('http://localhost/api/admin/content/secciones/sec-1', { method: 'PATCH', body: {} }),
      makeParams('sec-1')
    )
    expect(res.status).toBe(400)
  })

  it('200 actualiza nombre', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: { ...SECCION_DB, nombre: 'Ritmo' }, error: null }))

    const res  = await patchSeccion(
      makeReq('http://localhost/api/admin/content/secciones/sec-1', { method: 'PATCH', body: { nombre: 'Ritmo' } }),
      makeParams('sec-1')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.seccion.nombre).toBe('Ritmo')
  })

  it('200 actualiza zona', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: { ...SECCION_DB, zona: 'gym' }, error: null }))

    const res = await patchSeccion(
      makeReq('http://localhost/api/admin/content/secciones/sec-1', { method: 'PATCH', body: { zona: 'gym' } }),
      makeParams('sec-1')
    )
    expect(res.status).toBe(200)
  })

  it('200 actualiza nombre y zona', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: { ...SECCION_DB, nombre: 'X', zona: 'clase' }, error: null }))

    const res = await patchSeccion(
      makeReq('http://localhost/api/admin/content/secciones/sec-1', { method: 'PATCH', body: { nombre: 'X', zona: 'clase' } }),
      makeParams('sec-1')
    )
    expect(res.status).toBe(200)
  })

  it('500 cuando DB falla', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Update failed' } }))

    const res = await patchSeccion(
      makeReq('http://localhost/api/admin/content/secciones/sec-1', { method: 'PATCH', body: { nombre: 'X' } }),
      makeParams('sec-1')
    )
    expect(res.status).toBe(500)
  })
})

// ══════════════════════════════════════════════════════════════
// DELETE /api/admin/content/secciones/[id]
// ══════════════════════════════════════════════════════════════
describe('DELETE /api/admin/content/secciones/[id]', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await deleteSeccion(
      makeReq('http://localhost/api/admin/content/secciones/sec-1', { method: 'DELETE' }),
      makeParams('sec-1')
    )
    expect(res.status).toBe(403)
  })

  it('200 elimina sección', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ error: null }))

    const res  = await deleteSeccion(
      makeReq('http://localhost/api/admin/content/secciones/sec-1', { method: 'DELETE' }),
      makeParams('sec-1')
    )
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('500 cuando DB falla', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ error: { message: 'Delete failed' } }))

    const res = await deleteSeccion(
      makeReq('http://localhost/api/admin/content/secciones/sec-1', { method: 'DELETE' }),
      makeParams('sec-1')
    )
    expect(res.status).toBe(500)
  })
})

// ══════════════════════════════════════════════════════════════
// POST /api/admin/content/recursos
// ══════════════════════════════════════════════════════════════
describe('POST /api/admin/content/recursos', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await postRecurso(makeReq('http://localhost/api/admin/content/recursos', {
      method: 'POST', body: { seccion_id: 'sec-1', url: 'https://yt.com', tipo: 'video' },
    }))
    expect(res.status).toBe(403)
  })

  it('400 sin seccion_id', async () => {
    adminAuth()
    const res = await postRecurso(makeReq('http://localhost/api/admin/content/recursos', {
      method: 'POST', body: { url: 'https://yt.com', tipo: 'video' },
    }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/seccion_id/i)
  })

  it('400 sin url', async () => {
    adminAuth()
    const res = await postRecurso(makeReq('http://localhost/api/admin/content/recursos', {
      method: 'POST', body: { seccion_id: 'sec-1', tipo: 'video' },
    }))
    expect(res.status).toBe(400)
  })

  it('400 sin tipo', async () => {
    adminAuth()
    const res = await postRecurso(makeReq('http://localhost/api/admin/content/recursos', {
      method: 'POST', body: { seccion_id: 'sec-1', url: 'https://yt.com' },
    }))
    expect(res.status).toBe(400)
  })

  it('201 crea recurso de tipo video', async () => {
    adminAuth()
    mockFrom
      .mockReturnValueOnce(makeChain({ count: 0, error: null }))
      .mockReturnValueOnce(makeChain({ data: RECURSO_DB, error: null }))

    const res  = await postRecurso(makeReq('http://localhost/api/admin/content/recursos', {
      method: 'POST', body: { seccion_id: 'sec-1', url: 'https://yt.com/v=abc', tipo: 'video', label: 'Clase 1' },
    }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.recurso.tipo).toBe('video')
  })

  it('201 crea recurso sin label (opcional)', async () => {
    adminAuth()
    mockFrom
      .mockReturnValueOnce(makeChain({ count: 0, error: null }))
      .mockReturnValueOnce(makeChain({ data: { ...RECURSO_DB, label: null }, error: null }))

    const res  = await postRecurso(makeReq('http://localhost/api/admin/content/recursos', {
      method: 'POST', body: { seccion_id: 'sec-1', url: 'https://yt.com/v=abc', tipo: 'drive' },
    }))
    expect(res.status).toBe(201)
  })

  it('201 crea recurso tipo pdf', async () => {
    adminAuth()
    const pdfRecurso = { ...RECURSO_DB, tipo: 'pdf' }
    mockFrom
      .mockReturnValueOnce(makeChain({ count: 1, error: null }))
      .mockReturnValueOnce(makeChain({ data: pdfRecurso, error: null }))

    const res  = await postRecurso(makeReq('http://localhost/api/admin/content/recursos', {
      method: 'POST', body: { seccion_id: 'sec-1', url: 'https://drive.com/doc', tipo: 'pdf' },
    }))
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.recurso.tipo).toBe('pdf')
  })

  it('500 cuando DB falla', async () => {
    adminAuth()
    mockFrom
      .mockReturnValueOnce(makeChain({ count: 0, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: { message: 'Insert failed' } }))

    const res = await postRecurso(makeReq('http://localhost/api/admin/content/recursos', {
      method: 'POST', body: { seccion_id: 'sec-1', url: 'https://yt.com', tipo: 'video' },
    }))
    expect(res.status).toBe(500)
  })
})

// ══════════════════════════════════════════════════════════════
// PATCH /api/admin/content/recursos/[id]
// ══════════════════════════════════════════════════════════════
describe('PATCH /api/admin/content/recursos/[id]', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await patchRecurso(
      makeReq('http://localhost/api/admin/content/recursos/rec-1', { method: 'PATCH', body: { url: 'https://new.com' } }),
      makeParams('rec-1')
    )
    expect(res.status).toBe(403)
  })

  it('400 body sin campos reconocidos', async () => {
    adminAuth()
    const res = await patchRecurso(
      makeReq('http://localhost/api/admin/content/recursos/rec-1', { method: 'PATCH', body: {} }),
      makeParams('rec-1')
    )
    expect(res.status).toBe(400)
  })

  it('200 actualiza url', async () => {
    adminAuth()
    const updated = { ...RECURSO_DB, url: 'https://new.com' }
    mockFrom.mockReturnValue(makeChain({ data: updated, error: null }))

    const res  = await patchRecurso(
      makeReq('http://localhost/api/admin/content/recursos/rec-1', { method: 'PATCH', body: { url: 'https://new.com' } }),
      makeParams('rec-1')
    )
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.recurso.url).toBe('https://new.com')
  })

  it('200 actualiza tipo', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: { ...RECURSO_DB, tipo: 'pdf' }, error: null }))

    const res = await patchRecurso(
      makeReq('http://localhost/api/admin/content/recursos/rec-1', { method: 'PATCH', body: { tipo: 'pdf' } }),
      makeParams('rec-1')
    )
    expect(res.status).toBe(200)
  })

  it('200 actualiza label a null cuando es vacío', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: { ...RECURSO_DB, label: null }, error: null }))

    const res = await patchRecurso(
      makeReq('http://localhost/api/admin/content/recursos/rec-1', { method: 'PATCH', body: { label: '' } }),
      makeParams('rec-1')
    )
    expect(res.status).toBe(200)
  })

  it('200 actualiza interacciones', async () => {
    adminAuth()
    const interacciones = [{ id: 'i1', at_seconds: 30, mensaje: 'Pausa aquí', tipo: 'practica' }]
    mockFrom.mockReturnValue(makeChain({ data: { ...RECURSO_DB, interacciones }, error: null }))

    const res = await patchRecurso(
      makeReq('http://localhost/api/admin/content/recursos/rec-1', { method: 'PATCH', body: { interacciones } }),
      makeParams('rec-1')
    )
    expect(res.status).toBe(200)
  })

  it('500 cuando DB falla', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'Update failed' } }))

    const res = await patchRecurso(
      makeReq('http://localhost/api/admin/content/recursos/rec-1', { method: 'PATCH', body: { url: 'https://x.com' } }),
      makeParams('rec-1')
    )
    expect(res.status).toBe(500)
  })
})

// ══════════════════════════════════════════════════════════════
// DELETE /api/admin/content/recursos/[id]
// ══════════════════════════════════════════════════════════════
describe('DELETE /api/admin/content/recursos/[id]', () => {
  it('403 sin token', async () => {
    noAuth()
    const res = await deleteRecurso(
      makeReq('http://localhost/api/admin/content/recursos/rec-1', { method: 'DELETE' }),
      makeParams('rec-1')
    )
    expect(res.status).toBe(403)
  })

  it('200 elimina recurso', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ error: null }))

    const res  = await deleteRecurso(
      makeReq('http://localhost/api/admin/content/recursos/rec-1', { method: 'DELETE' }),
      makeParams('rec-1')
    )
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('500 cuando DB falla', async () => {
    adminAuth()
    mockFrom.mockReturnValue(makeChain({ error: { message: 'Delete failed' } }))

    const res = await deleteRecurso(
      makeReq('http://localhost/api/admin/content/recursos/rec-1', { method: 'DELETE' }),
      makeParams('rec-1')
    )
    expect(res.status).toBe(500)
  })
})
