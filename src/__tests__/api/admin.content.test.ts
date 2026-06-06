/** @jest-environment node */
import { NextRequest } from 'next/server'
import { signToken } from '@/lib/auth'
import { createDbMock } from '@/test-utils/supabaseMock'

// Rutas de admin content
import { GET as contentGet }         from '@/app/api/admin/content/route'
import { POST as cursosPost }        from '@/app/api/admin/content/cursos/route'
import { PATCH as cursosPatch, DELETE as cursosDelete } from '@/app/api/admin/content/cursos/[id]/route'
import { POST as modulosPost }       from '@/app/api/admin/content/modulos/route'
import { PATCH as modulosPatch, DELETE as modulosDelete } from '@/app/api/admin/content/modulos/[id]/route'
import { POST as seccionesPost }     from '@/app/api/admin/content/secciones/route'
import { PATCH as seccionesPatch, DELETE as seccionesDelete } from '@/app/api/admin/content/secciones/[id]/route'
import { POST as recursosPost }      from '@/app/api/admin/content/recursos/route'

jest.mock('@/lib/supabase', () => ({ getSupabaseAdmin: jest.fn() }))
import { getSupabaseAdmin } from '@/lib/supabase'

// ── tokens ──────────────────────────────────────────────────────────────────
const ADMIN_TOKEN   = signToken({ sub: 'admin-1', email: 'admin@ov.com',   role: 'admin',   nivel: 1 })
const TEACHER_TOKEN = signToken({ sub: 'teach-1', email: 'teacher@ov.com', role: 'teacher', nivel: 1 })

// ── helpers ─────────────────────────────────────────────────────────────────
function req(method: string, url: string, body?: unknown, token?: string) {
  return new NextRequest(url, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

// ── GET /api/admin/content ──────────────────────────────────────────────────
describe('GET /api/admin/content', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('retorna 403 para no-admin', async () => {
    const res = await contentGet(req('GET', 'http://localhost/api/admin/content', undefined, TEACHER_TOKEN))
    expect(res.status).toBe(403)
  })

  it('lista todos los cursos sin parámetro id', async () => {
    const cursos = [
      { id: 'piano', nombre: 'Piano', emoji: '🎹', orden: 0 },
      { id: 'bateria', nombre: 'Batería', emoji: '🥁', orden: 1 },
    ]
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ data: cursos, error: null }).then(resolve)
    )
    const res = await contentGet(req('GET', 'http://localhost/api/admin/content', undefined, ADMIN_TOKEN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.cursos).toHaveLength(2)
  })

  it('retorna árbol completo del curso con ?id=piano', async () => {
    chain.single.mockResolvedValueOnce({ data: { id: 'piano', nombre: 'Piano', emoji: '🎹' }, error: null })
    // modulos query (directo-await devuelve array)
    chain.then
      .mockImplementationOnce((resolve: any) =>
        Promise.resolve({ data: [{ id: 'mod-1', nombre: 'Módulo 1', orden: 0, curso_id: 'piano' }], error: null }).then(resolve)
      )
      // secciones para mod-1
      .mockImplementationOnce((resolve: any) =>
        Promise.resolve({ data: [{ id: 'sec-1', nombre: 'Sec 1', modulo_id: 'mod-1', zona: null }], error: null }).then(resolve)
      )
      // recursos para sec-1
      .mockImplementationOnce((resolve: any) =>
        Promise.resolve({ data: [], error: null }).then(resolve)
      )

    const res = await contentGet(req('GET', 'http://localhost/api/admin/content?id=piano', undefined, ADMIN_TOKEN))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.curso.id).toBe('piano')
    expect(body.curso.modulos).toHaveLength(1)
    expect(body.curso.modulos[0].secciones).toHaveLength(1)
    expect(body.curso.modulos[0].secciones[0].recursos).toHaveLength(0)
  })

  it('retorna 404 si el curso no existe', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    const res = await contentGet(req('GET', 'http://localhost/api/admin/content?id=no-existe', undefined, ADMIN_TOKEN))
    expect(res.status).toBe(404)
  })
})

// ── POST /api/admin/content/cursos ─────────────────────────────────────────
describe('POST /api/admin/content/cursos', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('retorna 403 para no-admin', async () => {
    const res = await cursosPost(req('POST', 'http://localhost/api/admin/content/cursos', { nombre: 'Piano' }, TEACHER_TOKEN))
    expect(res.status).toBe(403)
  })

  it('retorna 400 si nombre está vacío', async () => {
    const res = await cursosPost(req('POST', 'http://localhost/api/admin/content/cursos', { nombre: '' }, ADMIN_TOKEN))
    expect(res.status).toBe(400)
  })

  it('crea un curso correctamente con emoji por defecto', async () => {
    // count query
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ count: 2, data: null, error: null }).then(resolve)
    )
    const newCurso = { id: 'piano-1234', nombre: 'Piano', emoji: '🎵', orden: 2 }
    chain.single.mockResolvedValueOnce({ data: newCurso, error: null })

    const res = await cursosPost(req('POST', 'http://localhost/api/admin/content/cursos', { nombre: 'Piano' }, ADMIN_TOKEN))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.curso.nombre).toBe('Piano')
    expect(body.curso.emoji).toBe('🎵')
  })

  it('crea un curso con emoji personalizado', async () => {
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ count: 0, data: null, error: null }).then(resolve)
    )
    const newCurso = { id: 'bateria-123', nombre: 'Batería', emoji: '🥁', orden: 0 }
    chain.single.mockResolvedValueOnce({ data: newCurso, error: null })

    const res = await cursosPost(req('POST', 'http://localhost/api/admin/content/cursos', { nombre: 'Batería', emoji: '🥁' }, ADMIN_TOKEN))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.curso.emoji).toBe('🥁')
  })

  it('genera id como slug desde el nombre', async () => {
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ count: 0 }).then(resolve)
    )
    chain.single.mockResolvedValueOnce({ data: { id: 'piano-classico-123', nombre: 'Piano Clásico' }, error: null })

    await cursosPost(req('POST', 'http://localhost/api/admin/content/cursos', { nombre: 'Piano Clásico' }, ADMIN_TOKEN))
    // Verificar que insert fue llamado con un id que contiene 'piano'
    const insertCall = chain.insert.mock.calls[0][0]
    expect(insertCall.id).toMatch(/^piano/)
    expect(insertCall.id).not.toContain(' ')
    expect(insertCall.id).not.toContain('á') // sin acentos
  })
})

// ── PATCH/DELETE /api/admin/content/cursos/[id] ─────────────────────────────
describe('PATCH /api/admin/content/cursos/[id]', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('retorna 403 para no-admin', async () => {
    const params = Promise.resolve({ id: 'piano' })
    const res = await cursosPatch(req('PATCH', 'http://localhost/api/admin/content/cursos/piano', { nombre: 'X' }, TEACHER_TOKEN), { params })
    expect(res.status).toBe(403)
  })

  it('retorna 400 si no hay campos para actualizar', async () => {
    const params = Promise.resolve({ id: 'piano' })
    const res = await cursosPatch(req('PATCH', 'http://localhost/api/admin/content/cursos/piano', {}, ADMIN_TOKEN), { params })
    expect(res.status).toBe(400)
  })

  it('actualiza nombre del curso', async () => {
    const params = Promise.resolve({ id: 'piano' })
    chain.single.mockResolvedValueOnce({ data: { id: 'piano', nombre: 'Piano Avanzado', emoji: '🎹' }, error: null })
    const res = await cursosPatch(req('PATCH', 'http://localhost/api/admin/content/cursos/piano', { nombre: 'Piano Avanzado' }, ADMIN_TOKEN), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.curso.nombre).toBe('Piano Avanzado')
  })
})

describe('DELETE /api/admin/content/cursos/[id]', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('retorna 403 para no-admin', async () => {
    const params = Promise.resolve({ id: 'piano' })
    const res = await cursosDelete(req('DELETE', 'http://localhost/api/admin/content/cursos/piano', undefined, TEACHER_TOKEN), { params })
    expect(res.status).toBe(403)
  })

  it('elimina el curso correctamente (cascade en DB)', async () => {
    const params = Promise.resolve({ id: 'piano' })
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ error: null }).then(resolve)
    )
    const res = await cursosDelete(req('DELETE', 'http://localhost/api/admin/content/cursos/piano', undefined, ADMIN_TOKEN), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})

// ── POST /api/admin/content/modulos ─────────────────────────────────────────
describe('POST /api/admin/content/modulos', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('retorna 403 para no-admin', async () => {
    const res = await modulosPost(req('POST', 'http://localhost/api/admin/content/modulos', { curso_id: 'piano', nombre: 'Mod 1' }, TEACHER_TOKEN))
    expect(res.status).toBe(403)
  })

  it('retorna 400 si falta curso_id o nombre', async () => {
    const r1 = await modulosPost(req('POST', 'http://localhost/api/admin/content/modulos', { nombre: 'Mod 1' }, ADMIN_TOKEN))
    expect(r1.status).toBe(400)
    const r2 = await modulosPost(req('POST', 'http://localhost/api/admin/content/modulos', { curso_id: 'piano' }, ADMIN_TOKEN))
    expect(r2.status).toBe(400)
  })

  it('crea un módulo correctamente con secciones vacías', async () => {
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ count: 0 }).then(resolve)
    )
    const newMod = { id: 'piano-modulo-123', curso_id: 'piano', nombre: 'Escalas', orden: 0 }
    chain.single.mockResolvedValueOnce({ data: newMod, error: null })

    const res = await modulosPost(req('POST', 'http://localhost/api/admin/content/modulos', { curso_id: 'piano', nombre: 'Escalas' }, ADMIN_TOKEN))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.modulo.nombre).toBe('Escalas')
    expect(body.modulo.secciones).toEqual([])
  })
})

// ── PATCH/DELETE /api/admin/content/modulos/[id] ────────────────────────────
describe('PATCH /api/admin/content/modulos/[id]', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('retorna 400 si nombre está vacío', async () => {
    const params = Promise.resolve({ id: 'mod-1' })
    const res = await modulosPatch(req('PATCH', 'http://localhost/api/admin/content/modulos/mod-1', { nombre: '' }, ADMIN_TOKEN), { params })
    expect(res.status).toBe(400)
  })

  it('actualiza el nombre del módulo', async () => {
    const params = Promise.resolve({ id: 'mod-1' })
    chain.single.mockResolvedValueOnce({ data: { id: 'mod-1', nombre: 'Nuevo Nombre', orden: 0 }, error: null })
    const res = await modulosPatch(req('PATCH', 'http://localhost/api/admin/content/modulos/mod-1', { nombre: 'Nuevo Nombre' }, ADMIN_TOKEN), { params })
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/admin/content/modulos/[id]', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('elimina módulo y sus secciones/recursos en cascade', async () => {
    const params = Promise.resolve({ id: 'mod-1' })
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ error: null }).then(resolve)
    )
    const res = await modulosDelete(req('DELETE', 'http://localhost/api/admin/content/modulos/mod-1', undefined, ADMIN_TOKEN), { params })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })
})

// ── POST /api/admin/content/secciones ───────────────────────────────────────
describe('POST /api/admin/content/secciones', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('retorna 400 si falta modulo_id o nombre', async () => {
    const r1 = await seccionesPost(req('POST', 'http://localhost/api/admin/content/secciones', { nombre: 'Sec 1' }, ADMIN_TOKEN))
    expect(r1.status).toBe(400)
  })

  it('crea sección sin zona (accesible en clase y gym)', async () => {
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ count: 0 }).then(resolve)
    )
    const newSec = { id: 'sec-uuid', modulo_id: 'mod-1', nombre: 'Intro', zona: null, orden: 0 }
    chain.single.mockResolvedValueOnce({ data: newSec, error: null })

    const res = await seccionesPost(req('POST', 'http://localhost/api/admin/content/secciones', { modulo_id: 'mod-1', nombre: 'Intro' }, ADMIN_TOKEN))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.seccion.zona).toBeNull()
    expect(body.seccion.recursos).toEqual([])
  })

  it('crea sección con zona clase', async () => {
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ count: 1 }).then(resolve)
    )
    const newSec = { id: 'sec-uuid2', modulo_id: 'mod-1', nombre: 'Clase', zona: 'clase', orden: 1 }
    chain.single.mockResolvedValueOnce({ data: newSec, error: null })

    const res = await seccionesPost(req('POST', 'http://localhost/api/admin/content/secciones', { modulo_id: 'mod-1', nombre: 'Clase', zona: 'clase' }, ADMIN_TOKEN))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.seccion.zona).toBe('clase')
  })
})

// ── PATCH/DELETE /api/admin/content/secciones/[id] ──────────────────────────
describe('PATCH /api/admin/content/secciones/[id]', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('retorna 400 si no hay nada para actualizar', async () => {
    const params = Promise.resolve({ id: 'sec-1' })
    const res = await seccionesPatch(req('PATCH', 'http://localhost/api/admin/content/secciones/sec-1', {}, ADMIN_TOKEN), { params })
    expect(res.status).toBe(400)
  })

  it('actualiza nombre y zona simultáneamente', async () => {
    const params = Promise.resolve({ id: 'sec-1' })
    chain.single.mockResolvedValueOnce({ data: { id: 'sec-1', nombre: 'Gym Section', zona: 'gym', orden: 0 }, error: null })
    const res = await seccionesPatch(req('PATCH', 'http://localhost/api/admin/content/secciones/sec-1', { nombre: 'Gym Section', zona: 'gym' }, ADMIN_TOKEN), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.seccion.zona).toBe('gym')
  })
})

describe('DELETE /api/admin/content/secciones/[id]', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('elimina sección correctamente', async () => {
    const params = Promise.resolve({ id: 'sec-1' })
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ error: null }).then(resolve)
    )
    const res = await seccionesDelete(req('DELETE', 'http://localhost/api/admin/content/secciones/sec-1', undefined, ADMIN_TOKEN), { params })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })
})

// ── POST /api/admin/content/recursos ────────────────────────────────────────
describe('POST /api/admin/content/recursos', () => {
  let chain: ReturnType<typeof createDbMock>['chain']

  beforeEach(() => {
    const mock = createDbMock()
    chain = mock.chain
    ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock.db)
  })

  it('retorna 400 si falta seccion_id, url o tipo', async () => {
    const r1 = await recursosPost(req('POST', 'http://localhost/api/admin/content/recursos', { url: 'http://x.com', tipo: 'video' }, ADMIN_TOKEN))
    expect(r1.status).toBe(400)
    const r2 = await recursosPost(req('POST', 'http://localhost/api/admin/content/recursos', { seccion_id: 'sec-1', tipo: 'video' }, ADMIN_TOKEN))
    expect(r2.status).toBe(400)
    const r3 = await recursosPost(req('POST', 'http://localhost/api/admin/content/recursos', { seccion_id: 'sec-1', url: 'http://x.com' }, ADMIN_TOKEN))
    expect(r3.status).toBe(400)
  })

  it('crea recurso de tipo video', async () => {
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ count: 0 }).then(resolve)
    )
    const newRecurso = { id: 'rec-uuid', seccion_id: 'sec-1', url: 'https://youtu.be/abc', tipo: 'video', label: null, orden: 0 }
    chain.single.mockResolvedValueOnce({ data: newRecurso, error: null })

    const res = await recursosPost(req('POST', 'http://localhost/api/admin/content/recursos', { seccion_id: 'sec-1', url: 'https://youtu.be/abc', tipo: 'video' }, ADMIN_TOKEN))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.recurso.tipo).toBe('video')
    expect(body.recurso.url).toBe('https://youtu.be/abc')
  })

  it('crea recurso con todos los tipos válidos', async () => {
    const tipos = ['video', 'drive', 'juego', 'pdf', 'imagen', 'herramienta', 'otro'] as const
    for (const tipo of tipos) {
      const mock2 = createDbMock()
      ;(getSupabaseAdmin as jest.Mock).mockReturnValue(mock2.db)
      mock2.chain.then.mockImplementationOnce((resolve: any) =>
        Promise.resolve({ count: 0 }).then(resolve)
      )
      mock2.chain.single.mockResolvedValueOnce({ data: { id: 'r', seccion_id: 'sec-1', url: 'http://x.com', tipo, label: null, orden: 0 }, error: null })

      const res = await recursosPost(req('POST', 'http://localhost/api/admin/content/recursos', { seccion_id: 'sec-1', url: 'http://x.com', tipo }, ADMIN_TOKEN))
      expect(res.status).toBe(201)
    }
  })

  it('crea recurso con label opcional', async () => {
    chain.then.mockImplementationOnce((resolve: any) =>
      Promise.resolve({ count: 1 }).then(resolve)
    )
    const newRecurso = { id: 'rec-2', seccion_id: 'sec-1', url: 'https://drive.google.com/abc', tipo: 'drive', label: 'Partitura PDF', orden: 1 }
    chain.single.mockResolvedValueOnce({ data: newRecurso, error: null })

    const res = await recursosPost(req('POST', 'http://localhost/api/admin/content/recursos', {
      seccion_id: 'sec-1',
      url: 'https://drive.google.com/abc',
      tipo: 'drive',
      label: 'Partitura PDF',
    }, ADMIN_TOKEN))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.recurso.label).toBe('Partitura PDF')
  })
})
