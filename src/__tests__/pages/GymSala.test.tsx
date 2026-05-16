/**
 * GymSalaPage (/escuela/gym/[instrumento]/[modulo]) — tests
 *
 * El componente requiere `moduloIdInicial` para renderizar.
 * Sin él, redirige a /escuela y devuelve null.
 * Datos vienen de /api/content (fetch), no de datos estáticos.
 */
import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'

// ── Mocks ──────────────────────────────────────────────────────
let capturedOnVariableChange: ((name: string, value: unknown) => void) | undefined

jest.mock('@/components/spline/SplineScene', () => ({
  __esModule: true,
  default: jest.fn(({ scene, onVariableChange }: {
    scene: string
    onVariableChange?: (name: string, value: unknown) => void
  }) => {
    capturedOnVariableChange = onVariableChange
    return <div data-testid="spline-scene" data-scene={scene} />
  }),
}))

jest.mock('@/components/ui/TapeteCard', () => ({
  __esModule: true,
  default: jest.fn(({ show, onDismiss }: { show: boolean; onDismiss: () => void }) =>
    show ? (
      <div data-testid="tapete-card">
        <button onClick={onDismiss}>Entendido</button>
      </div>
    ) : null
  ),
}))

jest.mock('@/components/ui/RotateScreen', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="rotate-screen" />),
}))

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useParams: () => ({ instrumento: 'guitarra' }),
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ token: 'test-token', user: { id: 'u1', role: 'student' }, logout: jest.fn() }),
}))

jest.mock('@/hooks/useInstrumentos', () => ({
  useInstrumentos: () => ({
    clases:   [],
    gym:      [{ id: 'guitarra', nombre: 'Guitarra', emoji: '🎸', descripcion: 'Rock y pop', color: '#ec488a', glow: 'rgba(236,72,138,0.4)', modulos: [], cursoId: 'guitarra' }],
    dbClases: [],
    dbGym:    [{ id: 'guitarra', nombre: 'Guitarra', emoji: '🎸', descripcion: 'Rock y pop', color: '#ec488a', glow: 'rgba(236,72,138,0.4)', modulos: [], cursoId: 'guitarra' }],
    loading:  false,
  }),
}))

jest.mock('@/hooks/useOrientation', () => ({
  useOrientation: () => ({ isMobile: false, isPortrait: false }),
}))

jest.mock('@/data/gym', () => ({
  GYM_INSTRUMENTOS: [
    {
      id: 'guitarra',
      nombre: 'Guitarra',
      emoji: '🎸',
      descripcion: 'Rock y pop',
      color: '#ec488a',
      glow: 'rgba(236,72,138,0.4)',
      cursoId: 'guitarra',
      modulos: [],
    },
  ],
  getSecciones: () => [],
}))

// ── Datos de API ────────────────────────────────────────────────
const MODULOS_API = [
  {
    id: 'mod-1',
    nombre: 'Acordes básicos',
    zona: null,
    orden: 0,
    secciones: [
      { nombre: 'Do Mayor', zona: 'gym', recursos: [{ tipo: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', label: 'Acorde Do' }] },
      { nombre: 'Sol Mayor', zona: 'gym', recursos: [{ tipo: 'pdf', url: 'https://example.com/sol.pdf', label: 'Acorde Sol PDF' }] },
    ],
  },
  {
    id: 'mod-2',
    nombre: 'Ritmo avanzado',
    zona: null,
    orden: 1,
    secciones: [
      { nombre: 'Compás 4/4', zona: 'gym', recursos: [] },
    ],
  },
]

function mockFetchOk() {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ modulos: MODULOS_API }),
  }) as jest.Mock
}

import GymSalaPage from '@/app/escuela/gym/[instrumento]/page'

// ── Helpers ────────────────────────────────────────────────────
function simulateVar(name: string, value: unknown) {
  act(() => { capturedOnVariableChange?.(name, value) })
}

// ══════════════════════════════════════════════════════════════
// SUITE 1 — Renderizado base
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — renderizado base', () => {
  beforeEach(() => {
    capturedOnVariableChange = undefined
    mockPush.mockClear()
    mockFetchOk()
  })
  afterEach(() => { jest.clearAllMocks() })

  it('monta sin errores con moduloIdInicial', () => {
    expect(() => render(<GymSalaPage moduloIdInicial="mod-1" />)).not.toThrow()
  })

  it('renderiza SplineScene con la URL del gym', () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    expect(screen.getByTestId('spline-scene')).toHaveAttribute(
      'data-scene',
      'https://prod.spline.design/gYLTlZu92yz616yC/scene.splinecode'
    )
  })

  it('muestra botón ← Mapa', () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    expect(screen.getByText(/← mapa/i)).toBeInTheDocument()
  })

  it('botón ← Mapa navega a /escuela', () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    fireEvent.click(screen.getByText(/← mapa/i))
    expect(mockPush).toHaveBeenCalledWith('/escuela')
  })

  it('NO muestra TapeteCard cuando viene con módulo preseleccionado', () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    expect(screen.queryByTestId('tapete-card')).not.toBeInTheDocument()
  })

  it('sin moduloIdInicial renderiza null y redirige', () => {
    const { container } = render(<GymSalaPage />)
    expect(container.firstChild).toBeNull()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 2 — Variables de Spline → botones
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — variables Spline', () => {
  beforeEach(() => {
    capturedOnVariableChange = undefined
    mockPush.mockClear()
    mockFetchOk()
  })
  afterEach(() => { jest.clearAllMocks() })

  it('"🏋️ Entrenar →" visible cuando el panel está cerrado', () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    // Antes del fetch el panel aún no se abrió
    expect(screen.getByText(/🏋️ entrenar/i)).toBeInTheDocument()
  })

  it('"← Salir del Gym" aparece cuando isOutingGym = true', () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    simulateVar('isOutingGym', true)
    expect(screen.getByText(/salir del gym/i)).toBeInTheDocument()
  })

  it('isOutingGym acepta string "true"', () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    simulateVar('isOutingGym', 'true')
    expect(screen.getByText(/salir del gym/i)).toBeInTheDocument()
  })

  it('variables desconocidas no rompen la UI', () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    expect(() => simulateVar('variableRara', 123)).not.toThrow()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 3 — Panel de navegación (módulos → secciones → recursos)
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — panel navegación', () => {
  beforeEach(() => {
    capturedOnVariableChange = undefined
    mockPush.mockClear()
    mockFetchOk()
  })
  afterEach(() => { jest.clearAllMocks() })

  it('abre panel al clicar Entrenar (nivel 1 — módulos)', async () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    // Antes del fetch el panel está cerrado
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    expect(screen.getByText(/elige un módulo/i)).toBeInTheDocument()
  })

  it('muestra los módulos en el panel nivel 1', async () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    await waitFor(() => {
      expect(screen.getByText('Acordes básicos')).toBeInTheDocument()
      expect(screen.getByText('Ritmo avanzado')).toBeInTheDocument()
    })
  })

  it('al seleccionar módulo muestra sus secciones (nivel 2)', async () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    await waitFor(() => screen.getByText('Acordes básicos'))
    fireEvent.click(screen.getByText('Acordes básicos'))
    expect(screen.getByText(/elige una sección/i)).toBeInTheDocument()
    expect(screen.getByText('Do Mayor')).toBeInTheDocument()
    expect(screen.getByText('Sol Mayor')).toBeInTheDocument()
  })

  it('al seleccionar sección muestra sus recursos (nivel 3)', async () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    await waitFor(() => screen.getByText('Acordes básicos'))
    fireEvent.click(screen.getByText('Acordes básicos'))
    fireEvent.click(screen.getByText('Do Mayor'))
    expect(screen.getByText('Acorde Do')).toBeInTheDocument()
  })

  it('botón ← cierra el panel desde el nivel de secciones', async () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    await waitFor(() => screen.getByText('Do Mayor'))
    fireEvent.click(screen.getByText(/cerrar/i))
    expect(screen.queryByText(/elige una sección/i)).not.toBeInTheDocument()
  })

  it('X cierra el panel de módulos', async () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    await waitFor(() => screen.getByText(/elige un módulo/i))
    const xButtons = screen.getAllByRole('button')
    const closeBtn = xButtons.find(b => b.querySelector('svg'))
    if (closeBtn) fireEvent.click(closeBtn)
    expect(screen.queryByText(/elige un módulo/i)).not.toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 4 — Apertura directa con moduloIdInicial
// Al llegar desde /escuela con módulo ya seleccionado
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — moduloIdInicial (ruta /gym/[instrumento]/[modulo])', () => {
  beforeEach(() => {
    capturedOnVariableChange = undefined
    mockPush.mockClear()
    mockFetchOk()
  })
  afterEach(() => { jest.clearAllMocks() })

  it('tras fetch con mod-1 válido, panel abre en nivel de secciones', async () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    await waitFor(() => expect(screen.getByText(/elige una sección/i)).toBeInTheDocument())
    expect(screen.getByText('Do Mayor')).toBeInTheDocument()
  })

  it('NO muestra TapeteCard con módulo preseleccionado', () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    expect(screen.queryByTestId('tapete-card')).not.toBeInTheDocument()
  })

  it('al seleccionar sección "Do Mayor" muestra sus recursos', async () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    await waitFor(() => screen.getByText('Do Mayor'))
    fireEvent.click(screen.getByText('Do Mayor'))
    expect(screen.getByText('Acorde Do')).toBeInTheDocument()
  })

  it('módulo inexistente no explota', async () => {
    expect(() => render(<GymSalaPage moduloIdInicial="no-existe" />)).not.toThrow()
  })

  it('"← Mapa" navega a /escuela', () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    fireEvent.click(screen.getByText(/← mapa/i))
    expect(mockPush).toHaveBeenCalledWith('/escuela')
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 5 — Panel de salida (isOutingGym)
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — panel salida', () => {
  beforeEach(() => {
    capturedOnVariableChange = undefined
    mockPush.mockClear()
    mockFetchOk()
  })
  afterEach(() => { jest.clearAllMocks() })

  it('abre panel de salida al clicar "← Salir del Gym"', () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))
    expect(screen.getByText(/a dónde quieres ir/i)).toBeInTheDocument()
  })

  it('muestra opción "Volver al Mapa"', () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))
    expect(screen.getByText('Volver al Mapa')).toBeInTheDocument()
  })

  it('"Volver al Mapa" navega a /escuela', () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))
    fireEvent.click(screen.getByText('Volver al Mapa'))
    expect(mockPush).toHaveBeenCalledWith('/escuela')
  })

  it('muestra lista "CAMBIAR DE MÓDULO" en el panel de salida', async () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    await waitFor(() => {}) // espera fetch
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))
    expect(screen.getByText(/cambiar de módulo/i)).toBeInTheDocument()
  })

  it('el panel de salida lista los módulos del instrumento', async () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    await waitFor(() => {})
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))
    expect(screen.getByText('Acordes básicos')).toBeInTheDocument()
    expect(screen.getByText('Ritmo avanzado')).toBeInTheDocument()
  })

  it('navegar a mod-2 desde salida llama router.push con su id', async () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    await waitFor(() => {})
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))
    fireEvent.click(screen.getByText('Ritmo avanzado'))
    expect(mockPush).toHaveBeenCalledWith('/escuela/gym/guitarra/mod-2')
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 6 — Hint "pisa el tapete"
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — hint pisa el tapete', () => {
  beforeEach(() => {
    capturedOnVariableChange = undefined
    jest.useFakeTimers()
    mockFetchOk()
  })
  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('NO muestra hint cuando viene con módulo preseleccionado (tapeteHintOpen=false)', () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    expect(screen.queryByTestId('tapete-card')).not.toBeInTheDocument()
  })

  it('hint desaparece después de 3s (fallback timer)', () => {
    // Para ver el hint sin módulo preseleccionado el componente retorna null,
    // así que testeamos el fallback indirectamente: panel abierto → hint nunca aparece
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    act(() => { jest.advanceTimersByTime(3_000) })
    expect(screen.queryByText(/pisa el tapete/i)).not.toBeInTheDocument()
  })

  it('NO muestra fallback si el panel está abierto', async () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    act(() => { jest.advanceTimersByTime(3_000) })
    expect(screen.queryByText(/pisa el tapete/i)).not.toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 7 — Reproductor de video (YouTube)
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — reproductor de video', () => {
  beforeEach(() => {
    capturedOnVariableChange = undefined
    mockFetchOk()
  })
  afterEach(() => { jest.clearAllMocks() })

  it('muestra thumbnail de YouTube al abrir panel con sección de video', async () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    await waitFor(() => screen.getByText('Do Mayor'))
    fireEvent.click(screen.getByText('Do Mayor'))
    const img = screen.getByRole('img', { name: /acorde do/i })
    expect(img).toHaveAttribute('src', expect.stringContaining('img.youtube.com'))
  })

  it('abre el overlay de video al clicar el thumbnail', async () => {
    render(<GymSalaPage moduloIdInicial="mod-1" />)
    await waitFor(() => screen.getByText('Do Mayor'))
    fireEvent.click(screen.getByText('Do Mayor'))
    fireEvent.click(screen.getByRole('img', { name: /acorde do/i }))
    const titles = screen.getAllByText('Acorde Do')
    expect(titles.length).toBeGreaterThan(0)
  })
})
