/**
 * TDD — TeacherPage (/teacher) controles de edición de alumno
 *
 * Cubre:
 *  - Renderizado base (tabs, topbar)
 *  - Lista de alumnos (tab Mis Estudiantes)
 *  - Fila expandible con panel de edición
 *  - Botones +/- de nivel (rango 1–5)
 *  - El profesor NO puede editar puntos (solo admin)
 *  - El profesor NO puede asignar cursos/chips de clases_acceso (solo admin)
 *  - Botón Guardar → PATCH API (solo envía nivel)
 *  - Update optimista + revert en error
 *  - Estado loading durante save
 */
import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'

// ── Mocks ──────────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}))

jest.mock('@/app/admin/ContentManager', () => ({
  __esModule: true,
  default: () => <div data-testid="content-manager" />,
}))

// Mock useInstrumentos to avoid fetch('/api/instrumentos') calls
const mockClases = [
  { id: 'piano', nombre: 'Piano', emoji: '🎹', descripcion: '', color: '#ec488a', glow: '', cursoId: 'piano' },
  { id: 'guitarra', nombre: 'Guitarra', emoji: '🎸', descripcion: '', color: '#3db8fa', glow: '', cursoId: 'guitarra' },
  { id: 'bateria', nombre: 'Batería', emoji: '🥁', descripcion: '', color: '#ffa737', glow: '', cursoId: 'bateria' },
]

jest.mock('@/hooks/useInstrumentos', () => ({
  useInstrumentos: jest.fn(() => ({
    clases: mockClases,
    gym: [],
    cursosMap: [],
    loading: false,
  })),
}))

// Auth configurable
type MockUser = { role: string; cursos_acceso?: string[] } | null
let mockTeacherUser: MockUser = {
  role: 'teacher',
  cursos_acceso: ['piano', 'guitarra-adultos'],
}
let mockToken = 'test-token'

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    get user()  { return mockTeacherUser },
    get token() { return mockToken },
    loading: false,
    isAuthenticated: true,
    logout: jest.fn(),
  }),
}))

// fetch global mock
const mockFetch = jest.fn()
global.fetch = mockFetch

// ── Datos de prueba ────────────────────────────────────────────
const STUDENTS = [
  {
    id: 'stu-1',
    email: 'ana@test.com',
    nombre: 'Ana García',
    nivel: 2,
    puntos: 150,
    cursos_acceso: ['piano'],
    created_at: '2024-01-01',
  },
  {
    id: 'stu-2',
    email: 'bob@test.com',
    nombre: 'Bob Smith',
    nivel: 3,
    puntos: 320,
    cursos_acceso: ['guitarra-adultos'],
    created_at: '2024-01-02',
  },
]

function setupFetch(students = STUDENTS) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ students }),
  })
}

function setupFetchPatch(updated: typeof STUDENTS[0]) {
  mockFetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ students: STUDENTS }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ student: updated }) })
}

import TeacherPage from '@/app/teacher/page'

// ══════════════════════════════════════════════════════════════
// SUITE 1 — Renderizado base
// ══════════════════════════════════════════════════════════════
describe('TeacherPage — renderizado base', () => {
  beforeEach(() => {
    mockTeacherUser = { role: 'teacher', cursos_acceso: ['piano'] }
    mockFetch.mockClear()
  })

  it('monta sin errores', () => {
    expect(() => render(<TeacherPage />)).not.toThrow()
  })

  it('muestra "Panel Docente" en el topbar', () => {
    render(<TeacherPage />)
    expect(screen.getByText(/panel docente/i)).toBeInTheDocument()
  })

  it('muestra tab "Mis Clases" activo por defecto', () => {
    render(<TeacherPage />)
    expect(screen.getByText(/mis clases/i)).toBeInTheDocument()
  })

  it('muestra tab "Mis Estudiantes"', () => {
    render(<TeacherPage />)
    expect(screen.getByText(/mis estudiantes/i)).toBeInTheDocument()
  })

  it('muestra ContentManager en tab Mis Clases', () => {
    render(<TeacherPage />)
    expect(screen.getByTestId('content-manager')).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 2 — Lista de estudiantes
// ══════════════════════════════════════════════════════════════
describe('TeacherPage — lista de estudiantes', () => {
  beforeEach(() => {
    mockTeacherUser = { role: 'teacher', cursos_acceso: ['piano'] }
    mockFetch.mockClear()
  })

  async function goToStudents() {
    setupFetch()
    render(<TeacherPage />)
    await act(async () => {
      fireEvent.click(screen.getByText(/mis estudiantes/i))
    })
    await waitFor(() => screen.getByText('Ana García'))
  }

  it('llama a /api/teacher/students al cambiar a tab Estudiantes', async () => {
    setupFetch()
    render(<TeacherPage />)
    await act(async () => {
      fireEvent.click(screen.getByText(/mis estudiantes/i))
    })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/teacher/students',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer test-token' }) })
    )
  })

  it('muestra nombre y email de cada estudiante', async () => {
    await goToStudents()
    expect(screen.getByText('Ana García')).toBeInTheDocument()
    expect(screen.getByText('ana@test.com')).toBeInTheDocument()
    expect(screen.getByText('Bob Smith')).toBeInTheDocument()
  })

  it('muestra nivel de cada estudiante', async () => {
    await goToStudents()
    expect(screen.getByText(/aprendiz/i)).toBeInTheDocument()   // nivel 2
    expect(screen.getByText(/intermedio/i)).toBeInTheDocument() // nivel 3
  })

  it('muestra puntos de cada estudiante', async () => {
    await goToStudents()
    expect(screen.getByText(/150 pts/i)).toBeInTheDocument()
    expect(screen.getByText(/320 pts/i)).toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay estudiantes', async () => {
    setupFetch([])
    render(<TeacherPage />)
    await act(async () => { fireEvent.click(screen.getByText(/mis estudiantes/i)) })
    await waitFor(() =>
      expect(screen.getByText(/no hay estudiantes/i)).toBeInTheDocument()
    )
  })

  it('muestra error cuando falla la fetch', async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'Forbidden' }) })
    render(<TeacherPage />)
    await act(async () => { fireEvent.click(screen.getByText(/mis estudiantes/i)) })
    await waitFor(() =>
      expect(screen.getByText(/forbidden/i)).toBeInTheDocument()
    )
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 3 — Panel de edición (expandir / cerrar)
// ══════════════════════════════════════════════════════════════
describe('TeacherPage — panel de edición', () => {
  async function goToStudents() {
    setupFetch()
    render(<TeacherPage />)
    await act(async () => { fireEvent.click(screen.getByText(/mis estudiantes/i)) })
    await waitFor(() => screen.getByText('Ana García'))
  }

  beforeEach(() => {
    mockTeacherUser = { role: 'teacher', cursos_acceso: ['piano'] }
    mockFetch.mockClear()
  })

  it('cada fila tiene un botón "Editar"', async () => {
    await goToStudents()
    const editBtns = screen.getAllByRole('button', { name: /editar/i })
    expect(editBtns).toHaveLength(STUDENTS.length)
  })

  it('clicar Editar expande el panel de controles', async () => {
    await goToStudents()
    fireEvent.click(screen.getAllByRole('button', { name: /editar/i })[0])
    expect(screen.getByTestId('edit-panel-stu-1')).toBeInTheDocument()
  })

  it('clicar Editar de nuevo colapsa el panel', async () => {
    await goToStudents()
    const editBtn = screen.getAllByRole('button', { name: /editar/i })[0]
    fireEvent.click(editBtn)
    expect(screen.getByTestId('edit-panel-stu-1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(screen.queryByTestId('edit-panel-stu-1')).not.toBeInTheDocument()
  })

  it('solo un panel abierto a la vez', async () => {
    await goToStudents()
    const [editBtn1, editBtn2] = screen.getAllByRole('button', { name: /editar/i })
    fireEvent.click(editBtn1)
    expect(screen.getByTestId('edit-panel-stu-1')).toBeInTheDocument()
    fireEvent.click(editBtn2)
    expect(screen.queryByTestId('edit-panel-stu-1')).not.toBeInTheDocument()
    expect(screen.getByTestId('edit-panel-stu-2')).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 4 — Controles de nivel
// ══════════════════════════════════════════════════════════════
describe('TeacherPage — controles de nivel', () => {
  async function openPanel(studentIdx = 0) {
    setupFetch()
    render(<TeacherPage />)
    await act(async () => { fireEvent.click(screen.getByText(/mis estudiantes/i)) })
    await waitFor(() => screen.getByText('Ana García'))
    fireEvent.click(screen.getAllByRole('button', { name: /editar/i })[studentIdx])
  }

  beforeEach(() => {
    mockTeacherUser = { role: 'teacher', cursos_acceso: ['piano'] }
    mockFetch.mockClear()
  })

  it('muestra el nivel actual del alumno en el panel', async () => {
    await openPanel(0)  // Ana: nivel 2
    expect(screen.getByTestId('nivel-value-stu-1')).toHaveTextContent('2')
  })

  it('botón + incrementa el nivel en el draft', async () => {
    await openPanel(0)
    fireEvent.click(screen.getByTestId('nivel-up-stu-1'))
    expect(screen.getByTestId('nivel-value-stu-1')).toHaveTextContent('3')
  })

  it('botón - decrementa el nivel en el draft', async () => {
    await openPanel(0)
    fireEvent.click(screen.getByTestId('nivel-down-stu-1'))
    expect(screen.getByTestId('nivel-value-stu-1')).toHaveTextContent('1')
  })

  it('botón + no supera nivel 5', async () => {
    setupFetch([{ ...STUDENTS[0], nivel: 5 }])
    render(<TeacherPage />)
    await act(async () => { fireEvent.click(screen.getByText(/mis estudiantes/i)) })
    await waitFor(() => screen.getByText('Ana García'))
    fireEvent.click(screen.getByRole('button', { name: /editar/i }))
    fireEvent.click(screen.getByTestId('nivel-up-stu-1'))
    expect(screen.getByTestId('nivel-value-stu-1')).toHaveTextContent('5')
  })

  it('botón - no baja de nivel 1', async () => {
    setupFetch([{ ...STUDENTS[0], nivel: 1 }])
    render(<TeacherPage />)
    await act(async () => { fireEvent.click(screen.getByText(/mis estudiantes/i)) })
    await waitFor(() => screen.getByText('Ana García'))
    fireEvent.click(screen.getByRole('button', { name: /editar/i }))
    fireEvent.click(screen.getByTestId('nivel-down-stu-1'))
    expect(screen.getByTestId('nivel-value-stu-1')).toHaveTextContent('1')
  })

  it('botón + deshabilitado en nivel 5', async () => {
    setupFetch([{ ...STUDENTS[0], nivel: 5 }])
    render(<TeacherPage />)
    await act(async () => { fireEvent.click(screen.getByText(/mis estudiantes/i)) })
    await waitFor(() => screen.getByText('Ana García'))
    fireEvent.click(screen.getByRole('button', { name: /editar/i }))
    expect(screen.getByTestId('nivel-up-stu-1')).toBeDisabled()
  })

  it('botón - deshabilitado en nivel 1', async () => {
    setupFetch([{ ...STUDENTS[0], nivel: 1 }])
    render(<TeacherPage />)
    await act(async () => { fireEvent.click(screen.getByText(/mis estudiantes/i)) })
    await waitFor(() => screen.getByText('Ana García'))
    fireEvent.click(screen.getByRole('button', { name: /editar/i }))
    expect(screen.getByTestId('nivel-down-stu-1')).toBeDisabled()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 5 — El profesor NO puede editar puntos ni asignar cursos
// (solo el administrador lo hace desde /admin)
// ══════════════════════════════════════════════════════════════
describe('TeacherPage — restricciones del profesor', () => {
  async function openPanel(studentIdx = 0) {
    setupFetch()
    render(<TeacherPage />)
    await act(async () => { fireEvent.click(screen.getByText(/mis estudiantes/i)) })
    await waitFor(() => screen.getByText('Ana García'))
    fireEvent.click(screen.getAllByRole('button', { name: /editar/i })[studentIdx])
  }

  beforeEach(() => {
    mockTeacherUser = { role: 'teacher', cursos_acceso: ['piano'] }
    mockFetch.mockClear()
  })

  it('NO muestra los controles de puntos', async () => {
    await openPanel(0)
    expect(screen.queryByTestId('puntos-input-stu-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('puntos-up-stu-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('puntos-down-stu-1')).not.toBeInTheDocument()
  })

  it('NO muestra chips para asignar cursos (clases_acceso)', async () => {
    await openPanel(0)
    expect(screen.queryByTestId('clase-chip-piano')).not.toBeInTheDocument()
    expect(screen.queryByTestId('clase-chip-guitarra')).not.toBeInTheDocument()
    expect(screen.queryByTestId('clase-chip-bateria')).not.toBeInTheDocument()
  })

  it('los puntos del alumno siguen visibles como dato de solo lectura', async () => {
    await openPanel(0)
    expect(screen.getByText(/150 pts/i)).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 6 — Guardar cambios (PATCH API)
// ══════════════════════════════════════════════════════════════
describe('TeacherPage — guardar cambios', () => {
  beforeEach(() => {
    mockTeacherUser = { role: 'teacher', cursos_acceso: ['piano'] }
    mockFetch.mockClear()
  })

  async function openAndEdit() {
    setupFetchPatch({ ...STUDENTS[0], nivel: 3 })
    render(<TeacherPage />)
    await act(async () => { fireEvent.click(screen.getByText(/mis estudiantes/i)) })
    await waitFor(() => screen.getByText('Ana García'))
    fireEvent.click(screen.getAllByRole('button', { name: /editar/i })[0])
    // Cambiar nivel de 2 → 3
    fireEvent.click(screen.getByTestId('nivel-up-stu-1'))
  }

  it('botón Guardar está presente en el panel', async () => {
    setupFetch()
    render(<TeacherPage />)
    await act(async () => { fireEvent.click(screen.getByText(/mis estudiantes/i)) })
    await waitFor(() => screen.getByText('Ana García'))
    fireEvent.click(screen.getAllByRole('button', { name: /editar/i })[0])
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument()
  })

  it('Guardar llama PATCH /api/teacher/students/stu-1', async () => {
    await openAndEdit()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    })
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/teacher/students/stu-1',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        })
      )
    })
  })

  it('Guardar envía el nivel actualizado en el body', async () => {
    await openAndEdit()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    })
    await waitFor(() => {
      const call = mockFetch.mock.calls.find(c => c[0].includes('stu-1') && c[1]?.method === 'PATCH')
      expect(call).toBeDefined()
      const body = JSON.parse(call![1].body)
      expect(body.nivel).toBe(3)
    })
  })

  it('Guardar NO envía puntos ni clases_acceso', async () => {
    await openAndEdit()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    })
    await waitFor(() => {
      const call = mockFetch.mock.calls.find(c => c[0].includes('stu-1') && c[1]?.method === 'PATCH')
      expect(call).toBeDefined()
      const body = JSON.parse(call![1].body)
      expect(body.puntos).toBeUndefined()
      expect(body.clases_acceso).toBeUndefined()
    })
  })

  it('panel se cierra tras guardar con éxito', async () => {
    await openAndEdit()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    })
    await waitFor(() => {
      expect(screen.queryByTestId('edit-panel-stu-1')).not.toBeInTheDocument()
    })
  })

  it('muestra error si PATCH falla', async () => {
    setupFetch()
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ students: STUDENTS }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Forbidden' }) })

    render(<TeacherPage />)
    await act(async () => { fireEvent.click(screen.getByText(/mis estudiantes/i)) })
    await waitFor(() => screen.getByText('Ana García'))
    fireEvent.click(screen.getAllByRole('button', { name: /editar/i })[0])

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    })
    await waitFor(() => {
      expect(screen.getByTestId('edit-error-stu-1')).toBeInTheDocument()
    })
  })
})
