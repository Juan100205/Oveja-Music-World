/**
 * @jest-environment node
 *
 * TDD — GET /api/content (student content endpoint)
 *
 * Verifica el ciclo completo:
 *   Admin agrega sección a módulo → aparece en vista del estudiante
 *
 * Escenarios:
 *  1. Auth: 401 sin token, 401 token inválido
 *  2. Cualquier rol puede acceder (student, teacher, admin)
 *  3. 400 sin parámetro id
 *  4. Módulos vacíos en DB → retorna [] (estudiante verá datos estáticos)
 *  5. DB tiene módulos → retorna árbol completo (modulos → secciones → recursos)
 *  6. Recursos mapeados con `label` (no `nombre`) para compatibilidad con la UI
 *  7. Sección nueva aparece en el módulo — ciclo admin → estudiante
 *  8. Módulo con múltiples secciones retorna todas
 *  9. Sección sin recursos retorna recursos: []
 * 10. 500 cuando DB falla
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

import { GET } from '@/app/api/content/route'

// ── Helpers ────────────────────────────────────────────────────
function makeChain(resolved: unknown) {
  const c: Record<string, unknown> = {}
  ;['select','eq','order','limit','insert','update'].forEach(m => {
    c[m] = jest.fn().mockReturnValue(c)
  })
  c.single      = jest.fn().mockResolvedValue(resolved)
  c.maybeSingle = jest.fn().mockResolvedValue(resolved)
  c.then  = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(resolved).then(res, rej)
  c.catch = (rej: (e: unknown) => unknown) => Promise.resolve(resolved).catch(rej)
  return c
}

function authAs(role: 'student' | 'teacher' | 'admin') {
  mockExtract.mockReturnValue('tok')
  mockVerify.mockReturnValue({ sub: 'u-1', email: 'u@t.com', role, nivel: 1 })
}

function makeReq(id?: string) {
  const url = id
    ? `http://localhost/api/content?id=${id}`
    : 'http://localhost/api/content'
  return new NextRequest(url, {
    headers: { Authorization: 'Bearer tok' },
  })
}

afterEach(() => jest.resetAllMocks())

// ── Fixtures ───────────────────────────────────────────────────
const MODULOS_DB = [
  { id: 'piano-modulo-2', nombre: 'Módulo 2: Nivel 1 – Clases', orden: 1 },
  { id: 'piano-modulo-4', nombre: 'Módulo 4: Nivel 2 – Clases', orden: 2 },
]

const SECCIONES_MODULO_2 = [
  { id: 's-1', nombre: 'Videos de clase', zona: 'clase', orden: 0 },
  { id: 's-2', nombre: 'Materiales',       zona: 'clase', orden: 1 },
]

// Sección nueva agregada por el admin
const SECCION_NUEVA = [
  { id: 's-99', nombre: 'Práctica guiada', zona: 'clase', orden: 2 },
]

const RECURSOS_SECCION_1 = [
  { id: 'r-1', url: 'https://yt.com/vid1', tipo: 'video', nombre: 'Clase 1 – Postura', orden: 0 },
  { id: 'r-2', url: 'https://yt.com/vid2', tipo: 'video', nombre: 'Clase 2 – Escalas', orden: 1 },
]

const RECURSOS_NUEVA = [
  { id: 'r-99', url: 'https://yt.com/practica', tipo: 'video', nombre: 'Ejercicio de práctica', orden: 0 },
]

// ══════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════
describe('GET /api/content — auth', () => {
  it('401 sin token', async () => {
    mockExtract.mockReturnValue(null)
    const res = await GET(makeReq('piano'))
    expect(res.status).toBe(401)
  })

  it('401 token inválido', async () => {
    mockExtract.mockReturnValue('bad')
    mockVerify.mockReturnValue(null)
    const res = await GET(makeReq('piano'))
    expect(res.status).toBe(401)
  })

  it('student puede acceder', async () => {
    authAs('student')
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))
    const res = await GET(makeReq('piano'))
    expect(res.status).toBe(200)
  })

  it('teacher puede acceder', async () => {
    authAs('teacher')
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))
    const res = await GET(makeReq('piano'))
    expect(res.status).toBe(200)
  })

  it('admin puede acceder', async () => {
    authAs('admin')
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))
    const res = await GET(makeReq('piano'))
    expect(res.status).toBe(200)
  })
})

// ══════════════════════════════════════════════════════════════
// VALIDACIÓN
// ══════════════════════════════════════════════════════════════
describe('GET /api/content — validación', () => {
  it('400 sin parámetro id', async () => {
    authAs('student')
    const res = await GET(makeReq())
    expect(res.status).toBe(400)
  })
})

// ══════════════════════════════════════════════════════════════
// DB VACÍA — estudiante ve datos estáticos (respuesta es [])
// ══════════════════════════════════════════════════════════════
describe('GET /api/content — DB sin módulos para el curso', () => {
  it('retorna modulos: [] cuando el curso no está en DB', async () => {
    authAs('student')
    // DB no tiene módulos para este cursoId
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))

    const res  = await GET(makeReq('piano'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.modulos).toEqual([])
    // La UI usará los datos estáticos como fallback
  })
})

// ══════════════════════════════════════════════════════════════
// CICLO COMPLETO — admin agrega sección → estudiante la ve
// ══════════════════════════════════════════════════════════════
describe('GET /api/content — ciclo admin → estudiante', () => {
  beforeEach(() => authAs('student'))

  /**
   * Simula: admin agrega "Práctica guiada" al módulo piano-modulo-2.
   * El estudiante abre el classroom y debe ver esa sección nueva.
   */
  it('sección nueva creada por admin aparece para el estudiante', async () => {
    // DB tiene 1 módulo con la sección nueva ya guardada
    const SECCIONES_CON_NUEVA = [...SECCIONES_MODULO_2, ...SECCION_NUEVA]

    mockFrom
      // 1. SELECT modulos WHERE curso_id = piano
      .mockReturnValueOnce(makeChain({ data: [MODULOS_DB[0]], error: null }))
      // 2. SELECT secciones WHERE modulo_id = piano-modulo-2
      .mockReturnValueOnce(makeChain({ data: SECCIONES_CON_NUEVA, error: null }))
      // 3. SELECT recursos WHERE seccion_id = s-1
      .mockReturnValueOnce(makeChain({ data: RECURSOS_SECCION_1, error: null }))
      // 4. SELECT recursos WHERE seccion_id = s-2
      .mockReturnValueOnce(makeChain({ data: [], error: null }))
      // 5. SELECT recursos WHERE seccion_id = s-99 (sección nueva)
      .mockReturnValueOnce(makeChain({ data: RECURSOS_NUEVA, error: null }))

    const res  = await GET(makeReq('piano'))
    const body = await res.json()

    expect(res.status).toBe(200)

    const modulo = body.modulos[0]
    expect(modulo.id).toBe('piano-modulo-2')

    // La sección nueva está presente
    const seccionNueva = modulo.secciones.find((s: { nombre: string }) => s.nombre === 'Práctica guiada')
    expect(seccionNueva).toBeDefined()
    expect(seccionNueva.recursos).toHaveLength(1)
    expect(seccionNueva.recursos[0].url).toBe('https://yt.com/practica')
  })

  it('módulo con múltiples secciones retorna todas', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: [MODULOS_DB[0]], error: null }))
      .mockReturnValueOnce(makeChain({ data: SECCIONES_MODULO_2, error: null }))
      .mockReturnValueOnce(makeChain({ data: RECURSOS_SECCION_1, error: null }))
      .mockReturnValueOnce(makeChain({ data: [], error: null }))

    const res  = await GET(makeReq('piano'))
    const body = await res.json()

    const modulo = body.modulos[0]
    expect(modulo.secciones).toHaveLength(2)
    expect(modulo.secciones[0].nombre).toBe('Videos de clase')
    expect(modulo.secciones[1].nombre).toBe('Materiales')
  })

  it('sección sin recursos retorna recursos: []', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: [MODULOS_DB[0]], error: null }))
      .mockReturnValueOnce(makeChain({ data: [SECCIONES_MODULO_2[1]], error: null })) // "Materiales" sin recursos
      .mockReturnValueOnce(makeChain({ data: [], error: null }))

    const res  = await GET(makeReq('piano'))
    const body = await res.json()

    const seccion = body.modulos[0].secciones[0]
    expect(seccion.nombre).toBe('Materiales')
    expect(seccion.recursos).toEqual([])
  })
})

// ══════════════════════════════════════════════════════════════
// ESTRUCTURA DE RESPUESTA
// ══════════════════════════════════════════════════════════════
describe('GET /api/content — estructura compatible con UI', () => {
  beforeEach(() => authAs('student'))

  it('recursos tienen campo `label` (no `nombre`) para compatibilidad con Recurso interface', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: [MODULOS_DB[0]], error: null }))
      .mockReturnValueOnce(makeChain({ data: [SECCIONES_MODULO_2[0]], error: null }))
      .mockReturnValueOnce(makeChain({ data: RECURSOS_SECCION_1, error: null }))

    const res  = await GET(makeReq('piano'))
    const body = await res.json()

    const recurso = body.modulos[0].secciones[0].recursos[0]
    expect(recurso).toHaveProperty('url')
    expect(recurso).toHaveProperty('tipo')
    expect(recurso).toHaveProperty('label')         // campo correcto para la UI
    expect(recurso).not.toHaveProperty('nombre')    // campo DB no expuesto
    expect(recurso.label).toBe('Clase 1 – Postura')
  })

  it('recurso sin nombre en DB tiene label: undefined', async () => {
    const recursoSinNombre = [{ id: 'r-x', url: 'https://yt.com/x', tipo: 'drive', nombre: null, orden: 0 }]
    mockFrom
      .mockReturnValueOnce(makeChain({ data: [MODULOS_DB[0]], error: null }))
      .mockReturnValueOnce(makeChain({ data: [SECCIONES_MODULO_2[0]], error: null }))
      .mockReturnValueOnce(makeChain({ data: recursoSinNombre, error: null }))

    const res  = await GET(makeReq('piano'))
    const body = await res.json()

    const recurso = body.modulos[0].secciones[0].recursos[0]
    expect(recurso.label).toBeUndefined()
  })

  it('módulos tienen id y nombre', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: MODULOS_DB, error: null }))
      // secciones para modulo[0]
      .mockReturnValueOnce(makeChain({ data: [], error: null }))
      // secciones para modulo[1]
      .mockReturnValueOnce(makeChain({ data: [], error: null }))

    const res  = await GET(makeReq('piano'))
    const body = await res.json()

    expect(body.modulos).toHaveLength(2)
    body.modulos.forEach((m: { id: string; nombre: string; secciones: unknown[] }) => {
      expect(m).toHaveProperty('id')
      expect(m).toHaveProperty('nombre')
      expect(m).toHaveProperty('secciones')
    })
  })

  it('sección tiene nombre, zona y recursos', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: [MODULOS_DB[0]], error: null }))
      .mockReturnValueOnce(makeChain({ data: [SECCIONES_MODULO_2[0]], error: null }))
      .mockReturnValueOnce(makeChain({ data: [], error: null }))

    const res  = await GET(makeReq('piano'))
    const body = await res.json()

    const sec = body.modulos[0].secciones[0]
    expect(sec).toHaveProperty('nombre')
    expect(sec).toHaveProperty('zona')
    expect(sec).toHaveProperty('recursos')
  })

  it('zona null en DB se omite en la respuesta (undefined)', async () => {
    const seccionSinZona = [{ id: 's-z', nombre: 'Teoría', zona: null, orden: 0 }]
    mockFrom
      .mockReturnValueOnce(makeChain({ data: [MODULOS_DB[0]], error: null }))
      .mockReturnValueOnce(makeChain({ data: seccionSinZona, error: null }))
      .mockReturnValueOnce(makeChain({ data: [], error: null }))

    const res  = await GET(makeReq('piano'))
    const body = await res.json()

    const sec = body.modulos[0].secciones[0]
    // zona null → undefined → not serialized in JSON
    expect(sec.zona).toBeUndefined()
  })
})

// ══════════════════════════════════════════════════════════════
// MÚLTIPLES MÓDULOS
// ══════════════════════════════════════════════════════════════
describe('GET /api/content — múltiples módulos', () => {
  beforeEach(() => authAs('student'))

  it('retorna todos los módulos del curso en orden', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: MODULOS_DB, error: null }))
      // secciones de cada módulo
      .mockReturnValueOnce(makeChain({ data: SECCIONES_MODULO_2, error: null }))
      .mockReturnValueOnce(makeChain({ data: [], error: null })) // recursos s-1
      .mockReturnValueOnce(makeChain({ data: [], error: null })) // recursos s-2
      .mockReturnValueOnce(makeChain({ data: [], error: null })) // secciones módulo 4
    const res  = await GET(makeReq('piano'))
    const body = await res.json()

    expect(body.modulos).toHaveLength(2)
    expect(body.modulos[0].id).toBe('piano-modulo-2')
    expect(body.modulos[1].id).toBe('piano-modulo-4')
  })
})

// ══════════════════════════════════════════════════════════════
// ERRORES DB
// ══════════════════════════════════════════════════════════════
describe('GET /api/content — errores DB', () => {
  it('500 cuando falla la consulta de módulos', async () => {
    authAs('student')
    mockFrom.mockReturnValue(makeChain({ data: null, error: { message: 'DB error' } }))

    const res = await GET(makeReq('piano'))
    expect(res.status).toBe(500)
  })
})
