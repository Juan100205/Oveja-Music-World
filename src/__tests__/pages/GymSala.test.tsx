/**
 * GymSalaPage (/escuela/gym/[instrumento]) — TDD tests
 *
 * El componente SIEMPRE requiere `seccionIdxInicial` para renderizar.
 * Sin él, redirige a /escuela y devuelve null.
 *
 * Flujos probados:
 *  - seccionIdxInicial={0}     → seccionActiva=Do Mayor, panel cerrado al inicio
 *  - seccionIdxInicial={99}    → seccionActiva=null (fuera de rango), hint visible
 *  - sin seccionIdxInicial     → null (redirige)
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

// ── Helpers ────────────────────────────────────────────────────
function simulateVar(name: string, value: unknown) {
  act(() => { capturedOnVariableChange?.(name, value) })
}

// ══════════════════════════════════════════════════════════════
// SUITE 1 — Renderizado base
// Requiere seccionIdxInicial para renderizar. Sin él → null.
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — renderizado base', () => {
  beforeEach(() => {
    capturedOnVariableChange = undefined
    mockPush.mockClear()
  })

  it('monta sin errores con seccionIdxInicial', () => {
    expect(() => render(<GymSalaPage seccionIdxInicial={0} />)).not.toThrow()
  })

  it('renderiza SplineScene con la URL del gym', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    expect(screen.getByTestId('spline-scene')).toHaveAttribute(
      'data-scene',
      'https://prod.spline.design/gYLTlZu92yz616yC/scene.splinecode'
    )
  })

  it('muestra botón ← Mapa', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    expect(screen.getByText(/← mapa/i)).toBeInTheDocument()
  })

  it('botón ← Mapa navega a /escuela', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    fireEvent.click(screen.getByText(/← mapa/i))
    expect(mockPush).toHaveBeenCalledWith('/escuela')
  })

  it('NO muestra TapeteCard (viene desde mapa con sección preseleccionada)', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    expect(screen.queryByTestId('tapete-card')).not.toBeInTheDocument()
  })

  it('muestra botón "🏋️ Entrenar →" desde el inicio (panel cerrado)', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    expect(screen.getByText(/🏋️ entrenar/i)).toBeInTheDocument()
  })

  it('sin seccionIdxInicial renderiza null y redirige', () => {
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
  })

  it('"🏋️ Entrenar →" está visible cuando el panel está cerrado', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    expect(screen.getByText(/🏋️ entrenar/i)).toBeInTheDocument()
  })

  it('"← Salir del Gym" aparece cuando isOutingGym = true', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    simulateVar('isOutingGym', true)
    expect(screen.getByText(/salir del gym/i)).toBeInTheDocument()
  })

  it('isOutingGym acepta string "true"', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    simulateVar('isOutingGym', 'true')
    expect(screen.getByText(/salir del gym/i)).toBeInTheDocument()
  })

  it('variables desconocidas no rompen la UI', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    expect(() => simulateVar('variableRara', 123)).not.toThrow()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 3 — Panel de secciones
// Usa seccionIdxInicial=99 → seccionActiva=null → panel muestra lista
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — panel secciones', () => {
  beforeEach(() => {
    capturedOnVariableChange = undefined
    mockPush.mockClear()
  })

  it('abre panel al clicar Entrenar', () => {
    render(<GymSalaPage seccionIdxInicial={99} />)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    expect(screen.getByText(/elige una sección/i)).toBeInTheDocument()
  })

  it('muestra sección "Do Mayor" en el panel', () => {
    render(<GymSalaPage seccionIdxInicial={99} />)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    expect(screen.getByText('Do Mayor')).toBeInTheDocument()
  })

  it('muestra todas las secciones del instrumento', () => {
    render(<GymSalaPage seccionIdxInicial={99} />)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    expect(screen.getByText('Do Mayor')).toBeInTheDocument()
    expect(screen.getByText('Sol Mayor')).toBeInTheDocument()
  })

  it('navega a recursos al seleccionar sección "Do Mayor"', () => {
    render(<GymSalaPage seccionIdxInicial={99} />)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    fireEvent.click(screen.getByText('Do Mayor'))
    expect(screen.getByText('Acorde Do')).toBeInTheDocument()
  })

  it('X cierra el panel de secciones', () => {
    render(<GymSalaPage seccionIdxInicial={99} />)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    expect(screen.getByText(/elige una sección/i)).toBeInTheDocument()

    // El X del panel de secciones cierra el panel
    const xButtons = screen.getAllByRole('button')
    const closeBtn = xButtons.find(b => b.querySelector('svg'))
    if (closeBtn) fireEvent.click(closeBtn)

    expect(screen.queryByText(/elige una sección/i)).not.toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 4 — Apertura directa con seccionIdxInicial
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — seccionIdxInicial (ruta /gym/[instrumento]/[idx])', () => {
  beforeEach(() => {
    capturedOnVariableChange = undefined
    mockPush.mockClear()
  })

  it('con seccionIdxInicial=0: al clicar Entrenar ve recursos de "Do Mayor"', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    expect(screen.getByText('Acorde Do')).toBeInTheDocument()
  })

  it('con seccionIdxInicial=0 NO muestra TapeteCard', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    expect(screen.queryByTestId('tapete-card')).not.toBeInTheDocument()
  })

  it('con seccionIdxInicial=1: al clicar Entrenar ve recursos de "Sol Mayor"', () => {
    render(<GymSalaPage seccionIdxInicial={1} />)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    expect(screen.getByText('Acorde Sol PDF')).toBeInTheDocument()
  })

  it('con seccionIdxInicial fuera de rango no explota', () => {
    expect(() => render(<GymSalaPage seccionIdxInicial={99} />)).not.toThrow()
  })

  it('"← Mapa" en el panel de recursos navega a /escuela', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    // Dentro del panel de recursos hay un botón con texto "Mapa"
    const mapaButtons = screen.getAllByText(/mapa/i)
    fireEvent.click(mapaButtons[0])
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
  })

  it('abre panel de salida al clicar "← Salir del Gym"', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))
    expect(screen.getByText(/a dónde quieres ir/i)).toBeInTheDocument()
  })

  it('muestra opción "Volver al Mapa"', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))
    expect(screen.getByText('Volver al Mapa')).toBeInTheDocument()
  })

  it('"Volver al Mapa" navega a /escuela', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))
    fireEvent.click(screen.getByText('Volver al Mapa'))
    expect(mockPush).toHaveBeenCalledWith('/escuela')
  })

  it('muestra lista "CAMBIAR DE SECCIÓN" en el panel de salida', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))
    expect(screen.getByText(/cambiar de sección/i)).toBeInTheDocument()
  })

  it('el panel de salida lista todas las secciones del instrumento', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))
    expect(screen.getByText('Do Mayor')).toBeInTheDocument()
    expect(screen.getByText('Sol Mayor')).toBeInTheDocument()
  })

  it('navegar a Sol Mayor desde salida llama router.push con índice 1', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    simulateVar('isOutingGym', true)
    fireEvent.click(screen.getByText(/salir del gym/i))
    // seccionActiva=Do Mayor (idx=0), Sol Mayor (idx=1) no es la actual → navega
    fireEvent.click(screen.getByText('Sol Mayor'))
    expect(mockPush).toHaveBeenCalledWith('/escuela/gym/guitarra/1')
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 6 — Hint "pisa el tapete" (solo visible cuando seccionActiva=null)
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — hint pisa el tapete', () => {
  beforeEach(() => {
    capturedOnVariableChange = undefined
    jest.useFakeTimers()
  })
  afterEach(() => { jest.useRealTimers() })

  it('muestra hint cuando seccionActiva es null (idx fuera de rango)', () => {
    render(<GymSalaPage seccionIdxInicial={99} />)
    expect(screen.getByText(/pisa el tapete para iniciar/i)).toBeInTheDocument()
  })

  it('NO muestra hint cuando seccionActiva está establecida (idx válido)', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    expect(screen.queryByText(/pisa el tapete para iniciar/i)).not.toBeInTheDocument()
  })

  it('hint desaparece después de 3s (fallback timer)', () => {
    render(<GymSalaPage seccionIdxInicial={99} />)
    expect(screen.getByText(/pisa el tapete para iniciar/i)).toBeInTheDocument()
    act(() => { jest.advanceTimersByTime(3_000) })
    expect(screen.queryByText(/pisa el tapete para iniciar/i)).not.toBeInTheDocument()
  })

  it('NO muestra fallback si el panel ya está abierto (seccionIdxInicial)', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    act(() => { jest.advanceTimersByTime(3_000) })
    expect(screen.getByText('Acorde Do')).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 7 — Reproductor de video (YouTube)
// ══════════════════════════════════════════════════════════════
describe('GymSalaPage — reproductor de video', () => {
  beforeEach(() => { capturedOnVariableChange = undefined }
  )

  it('muestra thumbnail de YouTube al abrir panel con sección de video', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    const img = screen.getByRole('img', { name: /acorde do/i })
    expect(img).toHaveAttribute('src', expect.stringContaining('img.youtube.com'))
  })

  it('abre el overlay de video al clicar el thumbnail', () => {
    render(<GymSalaPage seccionIdxInicial={0} />)
    fireEvent.click(screen.getByText(/🏋️ entrenar/i))
    fireEvent.click(screen.getByRole('img', { name: /acorde do/i }))
    const titles = screen.getAllByText('Acorde Do')
    expect(titles.length).toBeGreaterThan(0)
  })
})
