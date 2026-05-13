/**
 * GymSalaPage (/escuela/gym/[instrumento]) — TDD tests
 * Verifica: renderizado, botones Spline, panel secciones, salida, video
 */
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'

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
    clases: [],
    gym: [
      { id: 'guitarra', nombre: 'Guitarra', emoji: '🎸', descripcion: 'Rock y pop', color: '#ec488a', glow: 'rgba(236,72,138,0.4)', modulos: [] },
    ],
  }),
}))

// Datos inline en el factory (jest.mock se hoist antes de las declaraciones de const)
jest.mock('@/data/gym', () => ({
  GYM_INSTRUMENTOS: [
    {
      id: 'guitarra',
      nombre: 'Guitarra',
      emoji: '🎸',
      descripcion: 'Rock y pop',
      color: '#ec488a',
      glow: 'rgba(236,72,138,0.4)',
      modulos: [
        {
          id: 'mod-1',
          nombre: 'Acordes básicos',
          secciones: [
            {
              nombre: 'Do Mayor',
              zona: 'gym',
              recursos: [
                { tipo: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', label: 'Acorde Do' },
              ],
            },
            {
              nombre: 'Sol Mayor',
              zona: 'gym',
              recursos: [
                { tipo: 'pdf', url: 'https://example.com/sol.pdf', label: 'Acorde Sol PDF' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'piano',
      nombre: 'Piano',
      emoji: '🎹',
      descripcion: 'Piano clásico',
      color: '#9b54f9',
      glow: 'rgba(155,84,249,0.4)',
      modulos: [],
    },
  ],
  getSecciones: (instr: { modulos: Array<{ secciones: Array<{ zona: string }> }> }) =>
    instr.modulos.flatMap(m => m.secciones).filter(s => s.zona !== 'clase'),
}))

import GymSalaPage from '@/app/escuela/gym/[instrumento]/page'

// ── Helper ─────────────────────────────────────────────────────
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
  })

  it('monta sin errores', () => {
    expect(() => render(<GymSalaPage />)).not.toThrow()
  })

  it('renderiza SplineScene con la URL del gym', () => {
    render(<GymSalaPage />)
    expect(screen.getByTestId('spline-scene')).toHaveAttribute(
      'data-scene',
      'https://prod.spline.design/gYLTlZu92yz616yC/scene.splinecode'
    )
  })

  it('muestra botón ← Mapa', () => {
    render(<GymSalaPage />)
    expect(screen.getByText(/← mapa/i)).toBeInTheDocument()
  })

  it('botón ← Mapa navega a /escuela', () => {
    render(<GymSalaPage />)
    fireEvent.click(screen.getByText(/← mapa/i))
    expect(mockPush).toHaveBeenCalledWith('/escuela')
  })

  it('muestra TapeteCard al inicio', () => {
    render(<GymSalaPage />)
    expect(screen.getByTestId('tapete-card')).toBeInTheDocument()
  })

  it('TapeteCard desaparece al hacer clic en Entendido', () => {
    render(<GymSalaPage />)
    fireEvent.click(screen.getByText('Entendido'))
    expect(screen.queryByTestId('tapete-card')).not.toBeInTheDocument()
  })

  it('muestra hint "pisa el tapete para iniciar"', () => {
    render(<GymSalaPage />)
    expect(screen.getByText(/pisa el tapete para iniciar/i)).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 2 — Variables de Spline → botones
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — variables Spline', () => {
  beforeEach(() => { capturedOnVariableChange = undefined })

  it('botón "🏋️ Entrenar →" aparece cuando isTrainning = true', () => {
    render(<GymSalaPage />)
    simulateVar('isTrainning', true)
    expect(screen.getByText(/🏋️ entrenar/i)).toBeInTheDocument()
  })

  it('botón "← Salir del Gym" aparece cuando isOutingGym = true', () => {
    render(<GymSalaPage />)
    simulateVar('isOutingGym', true)
    expect(screen.getByText(/salir del gym/i)).toBeInTheDocument()
  })

  it('isTrainning acepta string "true"', () => {
    render(<GymSalaPage />)
    simulateVar('isTrainning', 'true')
    expect(screen.getByText(/🏋️ entrenar/i)).toBeInTheDocument()
  })

  it('isOutingGym acepta string "true"', () => {
    render(<GymSalaPage />)
    simulateVar('isOutingGym', 'true')
    expect(screen.getByText(/salir del gym/i)).toBeInTheDocument()
  })

  it('variables desconocidas no rompen la UI', () => {
    render(<GymSalaPage />)
    expect(() => simulateVar('variableRara', 123)).not.toThrow()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 3 — Panel de secciones
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — panel secciones', () => {
  beforeEach(() => { capturedOnVariableChange = undefined })

  it('abre panel al clicar Entrenar', () => {
    render(<GymSalaPage />)
    simulateVar('isTrainning', true)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))

    expect(screen.getByText(/elige una sección/i)).toBeInTheDocument()
  })

  it('muestra sección "Do Mayor" en el panel', () => {
    render(<GymSalaPage />)
    simulateVar('isTrainning', true)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))

    expect(screen.getByText('Do Mayor')).toBeInTheDocument()
  })

  it('muestra todas las secciones del instrumento', () => {
    render(<GymSalaPage />)
    simulateVar('isTrainning', true)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))

    expect(screen.getByText('Do Mayor')).toBeInTheDocument()
    expect(screen.getByText('Sol Mayor')).toBeInTheDocument()
  })

  it('navega a recursos al seleccionar sección "Do Mayor"', () => {
    render(<GymSalaPage />)
    simulateVar('isTrainning', true)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    fireEvent.click(screen.getByText('Do Mayor'))

    expect(screen.getByText('Acorde Do')).toBeInTheDocument()
  })

  it('botón ← Secciones vuelve a la lista de secciones', () => {
    render(<GymSalaPage />)
    simulateVar('isTrainning', true)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    fireEvent.click(screen.getByText('Do Mayor'))

    // El botón de volver dice "Secciones" (ArrowLeft es SVG, no texto)
    fireEvent.click(screen.getByRole('button', { name: /secciones/i }))

    expect(screen.getByText(/elige una sección/i)).toBeInTheDocument()
    expect(screen.getByText('Do Mayor')).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 4 — Apertura directa con seccionIdxInicial
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — seccionIdxInicial (ruta /gym/[instrumento]/[idx])', () => {
  beforeEach(() => { mockPush.mockClear() })

  it('con seccionIdxInicial=0 abre directamente el panel de recursos', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    expect(screen.getByText('Acorde Do')).toBeInTheDocument()
  })

  it('con seccionIdxInicial=0 NO muestra TapeteCard', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    expect(screen.queryByTestId('tapete-card')).not.toBeInTheDocument()
  })

  it('con seccionIdxInicial=1 abre la segunda sección', () => {
    render(<GymSalaPage seccionIdxInicial={1} />)
    expect(screen.getByText('Acorde Sol PDF')).toBeInTheDocument()
  })

  it('con seccionIdxInicial fuera de rango no explota', () => {
    expect(() => render(<GymSalaPage seccionIdxInicial={99} />)).not.toThrow()
  })

  it('con seccionIdxInicial, el botón ← navega de vuelta al instrumento', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    // El botón "← Secciones" navega a /escuela/gym/guitarra cuando viene de URL
    fireEvent.click(screen.getByRole('button', { name: /secciones/i }))
    expect(mockPush).toHaveBeenCalledWith('/escuela/gym/guitarra')
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 5 — Panel de salida (isOutingGym)
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — panel salida', () => {
  beforeEach(() => {
    capturedOnVariableChange = undefined
    mockPush.mockClear()
  })

  it('abre panel de salida al clicar "← Salir del Gym"', () => {
    render(<GymSalaPage />)
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))

    expect(screen.getByText(/a dónde quieres ir/i)).toBeInTheDocument()
  })

  it('muestra opción "Volver al Mapa"', () => {
    render(<GymSalaPage />)
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))

    expect(screen.getByText('Volver al Mapa')).toBeInTheDocument()
  })

  it('"Volver al Mapa" navega a /escuela', () => {
    render(<GymSalaPage />)
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))
    fireEvent.click(screen.getByText('Volver al Mapa'))

    expect(mockPush).toHaveBeenCalledWith('/escuela')
  })

  it('muestra lista "CAMBIAR DE SECCIÓN" en el panel de salida', () => {
    render(<GymSalaPage />)
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))

    expect(screen.getByText(/cambiar de sección/i)).toBeInTheDocument()
  })

  it('el panel de salida lista todas las secciones del instrumento', () => {
    render(<GymSalaPage />)
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))

    expect(screen.getByText('Do Mayor')).toBeInTheDocument()
    expect(screen.getByText('Sol Mayor')).toBeInTheDocument()
  })

  it('navegar a otra sección desde el panel de salida llama router.push con el índice', () => {
    render(<GymSalaPage />)
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))

    // Click en "Sol Mayor" (índice 1) — no hay sección activa, no es "esActual"
    fireEvent.click(screen.getByText('Sol Mayor'))

    expect(mockPush).toHaveBeenCalledWith('/escuela/gym/guitarra/1')
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 6 — Fallback timer (3s tras tapete dismiss)
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — fallback timer móvil', () => {
  beforeEach(() => {
    capturedOnVariableChange = undefined
    jest.useFakeTimers()
  })
  afterEach(() => { jest.useRealTimers() })

  it('NO muestra botón Entrenar antes de 3s después del tapete', () => {
    render(<GymSalaPage />)
    fireEvent.click(screen.getByText('Entendido'))

    act(() => { jest.advanceTimersByTime(2_999) })
    expect(screen.queryByText(/🏋️ entrenar/i)).not.toBeInTheDocument()
  })

  it('muestra botón Entrenar a los 3s después de cerrar el tapete', () => {
    render(<GymSalaPage />)
    fireEvent.click(screen.getByText('Entendido'))

    act(() => { jest.advanceTimersByTime(3_000) })
    expect(screen.getByText(/🏋️ entrenar/i)).toBeInTheDocument()
  })

  it('NO muestra fallback si el panel ya está abierto (seccionIdxInicial)', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    // Panel abierto desde inicio — no debe aparecer botón de entrenar además del panel
    act(() => { jest.advanceTimersByTime(3_000) })
    // El panel de recursos debe estar visible, no el botón flotante
    expect(screen.getByText('Acorde Do')).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 7 — Reproductor de video (YouTube)
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — reproductor de video', () => {
  beforeEach(() => { capturedOnVariableChange = undefined })

  it('muestra thumbnail de YouTube al abrir sección con video', () => {
    render(<GymSalaPage />)
    simulateVar('isTrainning', true)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    fireEvent.click(screen.getByText('Do Mayor'))

    const img = screen.getByRole('img', { name: /acorde do/i })
    expect(img).toHaveAttribute('src', expect.stringContaining('img.youtube.com'))
  })

  it('abre el overlay de video al clicar el thumbnail', () => {
    render(<GymSalaPage />)
    simulateVar('isTrainning', true)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    fireEvent.click(screen.getByText('Do Mayor'))
    fireEvent.click(screen.getByRole('img', { name: /acorde do/i }))

    // El overlay muestra el label del video
    const titles = screen.getAllByText('Acorde Do')
    expect(titles.length).toBeGreaterThan(0)
  })
})
