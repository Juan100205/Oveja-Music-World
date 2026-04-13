/**
 * @jest-environment node
 *
 * TDD — PATCH /api/teacher/students/[id]
 *
 * Escenarios cubiertos:
 *  - 403 sin token
 *  - 403 rol incorrecto (student)
 *  - 403 profesor intenta editar alumno fuera de sus cursos
 *  - 400 nivel fuera de rango (< 1 o > 5)
 *  - 400 puntos negativos
 *  - 400 body vacío / sin campos permitidos
 *  - 200 actualiza nivel
 *  - 200 actualiza puntos
 *  - 200 actualiza clases_acceso
 *  - 200 actualiza campos combinados
 *  - Admin puede editar cualquier alumno (sin restricción de cursos)
 */

import { NextRequest } from 'next/server'

// ── Mocks de infraestructura ───────────────────────────────────
const mockSelect  = jest.fn()
const mockUpdate  = jest.fn()
const mockEq      = jest.fn()
const mockSingle  = jest.fn()

jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({
      select:  mockSelect,
      update:  mockUpdate,
    }),
  }),
}))

jest.mock('@/lib/teacherGuard', () => ({
  teacherGuard: jest.fn(),
}))

import { teacherGuard } from '@/lib/teacherGuard'
const mockTeacherGuard = teacherGuard as jest.Mock

// ── Helpers ────────────────────────────────────────────────────
function makeRequest(body: unknown, token = 'Bearer valid') {
  return new NextRequest('http://localhost/api/teacher/students/student-1', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify(body),
  })
}

function makeParams(id = 'student-1') {
  return { params: Promise.resolve({ id }) }
}

// Alumno de ejemplo
const MOCK_STUDENT = {
  id: 'student-1',
  email: 'alumno@test.com',
  nombre: 'Alumno Test',
  nivel: 2,
  puntos: 150,
  cursos_acceso: ['piano', 'guitarra-adultos'],
  clases_acceso: ['piano', 'guitarra'],
}

// Configuración de cadena de mocks Supabase
function setupSupabaseMock(opts: {
  studentData?: typeof MOCK_STUDENT | null
  studentError?: { message: string } | null
  updateData?: Partial<typeof MOCK_STUDENT> | null
  updateError?: { message: string } | null
}) {
  const selectChain = {
    eq:     jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data:  opts.studentData  !== undefined ? opts.studentData  : MOCK_STUDENT,
      error: opts.studentError !== undefined ? opts.studentError : null,
    }),
  }
  mockSelect.mockReturnValue(selectChain)

  const updateChain = {
    eq:     jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data:  opts.updateData  ?? { ...MOCK_STUDENT },
      error: opts.updateError ?? null,
    }),
  }
  mockUpdate.mockReturnValue(updateChain)

  return { selectChain, updateChain }
}

// Importar DESPUÉS de los mocks
import { PATCH } from '@/app/api/teacher/students/[id]/route'

// ══════════════════════════════════════════════════════════════
// SUITE 1 — Auth / permisos
// ══════════════════════════════════════════════════════════════
describe('PATCH /api/teacher/students/[id] — auth', () => {
  it('devuelve 403 sin token (teacherGuard null)', async () => {
    mockTeacherGuard.mockResolvedValue(null)

    const res = await PATCH(makeRequest({ nivel: 3 }), makeParams())
    expect(res.status).toBe(403)
  })

  it('devuelve 403 cuando teacherGuard falla (rol student)', async () => {
    mockTeacherGuard.mockResolvedValue(null)

    const res = await PATCH(makeRequest({ nivel: 3 }), makeParams())
    const json = await res.json()
    expect(res.status).toBe(403)
    expect(json.error).toMatch(/sin permisos|no autorizado/i)
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 2 — Autorización por cursos (teacher scope)
// ══════════════════════════════════════════════════════════════
describe('PATCH /api/teacher/students/[id] — scope de cursos', () => {
  it('403 cuando el alumno no tiene cursos del profesor', async () => {
    mockTeacherGuard.mockResolvedValue({
      payload: { sub: 'teacher-1', role: 'teacher' },
      cursosAcceso: ['bateria'],           // profesor solo tiene batería
    })
    setupSupabaseMock({
      studentData: {
        ...MOCK_STUDENT,
        cursos_acceso: ['piano', 'guitarra-adultos'],  // alumno no tiene batería
      },
    })

    const res = await PATCH(makeRequest({ nivel: 3 }), makeParams())
    expect(res.status).toBe(403)
  })

  it('200 cuando hay al menos un curso en común', async () => {
    mockTeacherGuard.mockResolvedValue({
      payload: { sub: 'teacher-1', role: 'teacher' },
      cursosAcceso: ['piano'],             // profesor tiene piano
    })
    setupSupabaseMock({
      studentData: {
        ...MOCK_STUDENT,
        cursos_acceso: ['piano'],          // alumno tiene piano ✓
      },
      updateData: { ...MOCK_STUDENT, nivel: 3 },
    })

    const res = await PATCH(makeRequest({ nivel: 3 }), makeParams())
    expect(res.status).toBe(200)
  })

  it('admin puede editar cualquier alumno (cursosAcceso = null)', async () => {
    mockTeacherGuard.mockResolvedValue({
      payload: { sub: 'admin-1', role: 'admin' },
      cursosAcceso: null,                  // admin = acceso total
    })
    setupSupabaseMock({
      studentData: { ...MOCK_STUDENT, cursos_acceso: [] },
      updateData:  { ...MOCK_STUDENT, nivel: 5 },
    })

    const res = await PATCH(makeRequest({ nivel: 5 }), makeParams())
    expect(res.status).toBe(200)
  })

  it('alumno sin cursos_acceso no bloquea al admin', async () => {
    mockTeacherGuard.mockResolvedValue({
      payload: { sub: 'admin-1', role: 'admin' },
      cursosAcceso: null,
    })
    setupSupabaseMock({
      studentData: { ...MOCK_STUDENT, cursos_acceso: undefined as unknown as string[] },
      updateData:  { ...MOCK_STUDENT, puntos: 999 },
    })

    const res = await PATCH(makeRequest({ puntos: 999 }), makeParams())
    expect(res.status).toBe(200)
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 3 — Validaciones de campos
// ══════════════════════════════════════════════════════════════
describe('PATCH /api/teacher/students/[id] — validaciones', () => {
  beforeEach(() => {
    mockTeacherGuard.mockResolvedValue({
      payload: { sub: 'teacher-1', role: 'teacher' },
      cursosAcceso: ['piano'],
    })
    setupSupabaseMock({})
  })

  it('400 cuando nivel < 1', async () => {
    const res = await PATCH(makeRequest({ nivel: 0 }), makeParams())
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/nivel/i)
  })

  it('400 cuando nivel > 5', async () => {
    const res = await PATCH(makeRequest({ nivel: 6 }), makeParams())
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/nivel/i)
  })

  it('400 cuando nivel no es entero', async () => {
    const res = await PATCH(makeRequest({ nivel: 2.5 }), makeParams())
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/nivel/i)
  })

  it('400 cuando puntos < 0', async () => {
    const res = await PATCH(makeRequest({ puntos: -1 }), makeParams())
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/puntos/i)
  })

  it('400 body vacío', async () => {
    const res = await PATCH(makeRequest({}), makeParams())
    expect(res.status).toBe(400)
  })

  it('400 sin campos permitidos', async () => {
    const res = await PATCH(makeRequest({ email: 'hack@test.com' }), makeParams())
    expect(res.status).toBe(400)
  })

  it('400 clases_acceso no es array', async () => {
    const res = await PATCH(makeRequest({ clases_acceso: 'piano' }), makeParams())
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/clases_acceso/i)
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 4 — Actualizaciones exitosas
// ══════════════════════════════════════════════════════════════
describe('PATCH /api/teacher/students/[id] — éxito', () => {
  beforeEach(() => {
    mockTeacherGuard.mockResolvedValue({
      payload: { sub: 'teacher-1', role: 'teacher' },
      cursosAcceso: ['piano'],
    })
  })

  it('200 actualiza nivel correctamente', async () => {
    const updated = { ...MOCK_STUDENT, nivel: 4 }
    setupSupabaseMock({ updateData: updated })

    const res = await PATCH(makeRequest({ nivel: 4 }), makeParams())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.student.nivel).toBe(4)
  })

  it('200 actualiza puntos correctamente', async () => {
    const updated = { ...MOCK_STUDENT, puntos: 500 }
    setupSupabaseMock({ updateData: updated })

    const res = await PATCH(makeRequest({ puntos: 500 }), makeParams())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.student.puntos).toBe(500)
  })

  it('200 actualiza clases_acceso correctamente', async () => {
    const updated = { ...MOCK_STUDENT, clases_acceso: ['piano', 'bateria'] }
    setupSupabaseMock({ updateData: updated })

    const res = await PATCH(makeRequest({ clases_acceso: ['piano', 'bateria'] }), makeParams())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.student.clases_acceso).toEqual(['piano', 'bateria'])
  })

  it('200 actualiza nivel + puntos en una sola llamada', async () => {
    const updated = { ...MOCK_STUDENT, nivel: 3, puntos: 300 }
    setupSupabaseMock({ updateData: updated })

    const res = await PATCH(makeRequest({ nivel: 3, puntos: 300 }), makeParams())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.student.nivel).toBe(3)
    expect(json.student.puntos).toBe(300)
  })

  it('200 acepta puntos = 0', async () => {
    const updated = { ...MOCK_STUDENT, puntos: 0 }
    setupSupabaseMock({ updateData: updated })

    const res = await PATCH(makeRequest({ puntos: 0 }), makeParams())
    expect(res.status).toBe(200)
  })

  it('200 acepta nivel = 1 (mínimo)', async () => {
    const updated = { ...MOCK_STUDENT, nivel: 1 }
    setupSupabaseMock({ updateData: updated })

    const res = await PATCH(makeRequest({ nivel: 1 }), makeParams())
    expect(res.status).toBe(200)
  })

  it('200 acepta nivel = 5 (máximo)', async () => {
    const updated = { ...MOCK_STUDENT, nivel: 5 }
    setupSupabaseMock({ updateData: updated })

    const res = await PATCH(makeRequest({ nivel: 5 }), makeParams())
    expect(res.status).toBe(200)
  })

  it('la respuesta contiene el student completo', async () => {
    setupSupabaseMock({ updateData: MOCK_STUDENT })

    const res = await PATCH(makeRequest({ nivel: 2 }), makeParams())
    const json = await res.json()
    expect(json.student).toMatchObject({
      id: 'student-1',
      nivel: expect.any(Number),
      puntos: expect.any(Number),
    })
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 5 — Errores de base de datos
// ══════════════════════════════════════════════════════════════
describe('PATCH /api/teacher/students/[id] — errores DB', () => {
  beforeEach(() => {
    mockTeacherGuard.mockResolvedValue({
      payload: { sub: 'admin-1', role: 'admin' },
      cursosAcceso: null,
    })
  })

  it('500 cuando falla la consulta del alumno', async () => {
    setupSupabaseMock({
      studentData: null,
      studentError: { message: 'DB error' },
    })

    const res = await PATCH(makeRequest({ nivel: 3 }), makeParams())
    expect(res.status).toBeGreaterThanOrEqual(400)
  })

  it('404 cuando el alumno no existe', async () => {
    setupSupabaseMock({ studentData: null, studentError: null })

    const res = await PATCH(makeRequest({ nivel: 3 }), makeParams())
    expect(res.status).toBe(404)
  })

  it('500 cuando falla el update', async () => {
    setupSupabaseMock({ updateError: { message: 'Update failed' } })

    const res = await PATCH(makeRequest({ nivel: 3 }), makeParams())
    expect(res.status).toBeGreaterThanOrEqual(400)
  })
})
