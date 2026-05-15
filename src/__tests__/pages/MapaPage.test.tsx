/**
 * MapaPage (/escuela) — TDD tests
 * Verifica: renderizado, panels Spline (desktop), navegación móvil, acceso por instrumento
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
}))

type MockUser = { role: string; clases_acceso?: string[] } | null
let mockUser: MockUser = { role: 'admin', clases_acceso: ['guitarra'] }

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    get user() { return mockUser },
    token: 'test-token',
    logout: jest.fn(),
  }),
}))

jest.mock('@/data/clases', () => ({
  CLASES_CONFIG: [
    {
      id: 'guitarra',
      nombre: 'Guitarra',
      emoji: '🎸',
      descripcion: 'Rock y pop',
      color: '#ec488a',
      glow: 'rgba(236,72,138,0.4)',
      cursoId: 'curso-guitarra',
    },
  ],
}))

jest.mock('@/data/gym', () => ({
  GYM_INSTRUMENTOS: [
    {
      id: 'gym-general',
      nombre: 'General',
      emoji: '💪',
      descripcion: 'Entrenamiento general',
      color: '#3db8fa',
      glow: 'rgba(61,184,250,0.4)',
      modulos: [],
    },
  ],
  getSecciones: () => [],
}))

jest.mock('@/data/cursos', () => ({
  CURSOS: [],
}))

const MOCK_CLASES = [
  {
    id: 'guitarra',
    nombre: 'Guitarra',
    emoji: '🎸',
    descripcion: 'Rock y pop',
    color: '#ec488a',
    glow: 'rgba(236,72,138,0.4)',
    cursoId: 'curso-guitarra',
  },
]
const MOCK_GYM = [
  {
    id: 'gym-general',
    nombre: 'General',
    emoji: '💪',
    descripcion: 'Entrenamiento general',
    color: '#3db8fa',
    glow: 'rgba(61,184,250,0.4)',
    modulos: [],
  },
]

jest.mock('@/hooks/useInstrumentos', () => ({
  useInstrumentos: () => ({
    clases:    MOCK_CLASES,
    gym:       MOCK_GYM,
    dbClases:  MOCK_CLASES,
    dbGym:     MOCK_GYM,
    cursosMap: [],
    loading:   false,
  }),
}))

import MapaPage from '@/app/escuela/page'

// ── Helpers ────────────────────────────────────────────────────
function setDesktop() {
  Object.defineProperty(window, 'innerWidth',  { writable: true, configurable: true, value: 1280 })
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 })
}
function setMobile() {
  // landscape: width > height so isPortrait=false and mobile buttons appear
  Object.defineProperty(window, 'innerWidth',  { writable: true, configurable: true, value: 667 })
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 375 })
}

function simulateVar(name: string, value: unknown) {
  act(() => { capturedOnVariableChange?.(name, value) })
}

function dismissTapete() {
  fireEvent.click(screen.getByText('Entendido'))
}

// ══════════════════════════════════════════════════════════════
// SUITE 1 — Renderizado base
// ══════════════════════════════════════════════════════════════
describe('MapaPage — renderizado base', () => {
  beforeEach(() => {
    setDesktop()
    capturedOnVariableChange = undefined
    mockPush.mockClear()
    mockUser = { role: 'admin', clases_acceso: ['guitarra'] }
  })

  it('monta sin errores', () => {
    expect(() => render(<MapaPage />)).not.toThrow()
  })

  it('renderiza SplineScene con la escena del mapa', () => {
    render(<MapaPage />)
    expect(screen.getByTestId('spline-scene')).toHaveAttribute(
      'data-scene',
      'https://prod.spline.design/WpjnQukgytAKxnYq/scene.splinecode'
    )
  })

  it('muestra TapeteCard al inicio', () => {
    render(<MapaPage />)
    expect(screen.getByTestId('tapete-card')).toBeInTheDocument()
  })

  it('TapeteCard desaparece al hacer clic en Entendido', () => {
    render(<MapaPage />)
    dismissTapete()
    expect(screen.queryByTestId('tapete-card')).not.toBeInTheDocument()
  })

  it('muestra botón "Salir"', () => {
    render(<MapaPage />)
    expect(screen.getByText(/salir/i)).toBeInTheDocument()
  })

  it('muestra botón Admin al usuario con role=admin', () => {
    mockUser = { role: 'admin' }
    render(<MapaPage />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('NO muestra botón Admin a usuario no-admin', () => {
    mockUser = { role: 'student', clases_acceso: [] }
    render(<MapaPage />)
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 2 — Variables Spline → panels (desktop)
// El panel se abre AUTOMÁTICAMENTE al recibir IsOverGym/IsOverSchool=true.
// No hay botón intermedio: el hover de Spline activa el panel directamente.
// ══════════════════════════════════════════════════════════════
describe('MapaPage — hover Spline abre panel (desktop)', () => {
  beforeEach(() => {
    setDesktop()
    capturedOnVariableChange = undefined
    mockUser = { role: 'admin', clases_acceso: ['guitarra'] }
  })

  it('IsOverGym=true abre panel del gym automáticamente', () => {
    render(<MapaPage />)
    simulateVar('IsOverGym', true)
    expect(screen.getByText(/qué vas a practicar/i)).toBeInTheDocument()
  })

  it('IsOverSchool=true abre panel de clases automáticamente', () => {
    render(<MapaPage />)
    simulateVar('IsOverSchool', true)
    expect(screen.getByText(/a qué clase vas hoy/i)).toBeInTheDocument()
  })

  it('IsOverGym acepta string "true"', () => {
    render(<MapaPage />)
    simulateVar('IsOverGym', 'true')
    expect(screen.getByText(/qué vas a practicar/i)).toBeInTheDocument()
  })

  it('IsOverSchool acepta string "true"', () => {
    render(<MapaPage />)
    simulateVar('IsOverSchool', 'true')
    expect(screen.getByText(/a qué clase vas hoy/i)).toBeInTheDocument()
  })

  it('variables desconocidas no rompen la UI', () => {
    render(<MapaPage />)
    expect(() => simulateVar('UnknownVar', 99)).not.toThrow()
    expect(screen.getByTestId('spline-scene')).toBeInTheDocument()
  })

  it('cuando clasesOpen=true, IsOverGym NO abre gym panel', () => {
    render(<MapaPage />)
    simulateVar('IsOverSchool', true)  // clases abre primero
    simulateVar('IsOverGym', true)     // gym no debe abrirse
    // Solo debe estar el panel de clases
    expect(screen.queryByText(/qué vas a practicar/i)).not.toBeInTheDocument()
    expect(screen.getByText(/a qué clase vas hoy/i)).toBeInTheDocument()
  })

  it('cuando gymOpen=true, IsOverSchool NO abre clases panel', () => {
    render(<MapaPage />)
    simulateVar('IsOverGym', true)     // gym abre primero
    simulateVar('IsOverSchool', true)  // clases no debe abrirse
    expect(screen.queryByText(/a qué clase vas hoy/i)).not.toBeInTheDocument()
    expect(screen.getByText(/qué vas a practicar/i)).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 3 — Panel de Clases (flujo 2 pasos: instrumento → módulo)
// ══════════════════════════════════════════════════════════════
describe('MapaPage — panel Clases', () => {
  beforeEach(() => {
    setDesktop()
    capturedOnVariableChange = undefined
    mockUser = { role: 'admin', clases_acceso: ['guitarra'] }
  })

  it('muestra "¿A qué clase vas hoy?" al abrir', () => {
    render(<MapaPage />)
    simulateVar('IsOverSchool', true)
    expect(screen.getByText(/a qué clase vas hoy/i)).toBeInTheDocument()
  })

  it('muestra instrumento Guitarra (paso 1)', () => {
    render(<MapaPage />)
    simulateVar('IsOverSchool', true)
    expect(screen.getByText('Guitarra')).toBeInTheDocument()
  })

  it('clicar Guitarra avanza al paso 2 (módulos)', () => {
    render(<MapaPage />)
    simulateVar('IsOverSchool', true)
    fireEvent.click(screen.getByText('Guitarra'))
    // Paso 2 muestra "Guitarra" en el header y un botón ← Clases
    expect(screen.getByRole('button', { name: /clases/i })).toBeInTheDocument()
  })

  it('sin módulos muestra "Contenido próximamente" (CURSOS vacío en mock)', () => {
    render(<MapaPage />)
    simulateVar('IsOverSchool', true)
    fireEvent.click(screen.getByText('Guitarra'))
    expect(screen.getByText(/contenido próximamente/i)).toBeInTheDocument()
  })

  it('botón ← Clases vuelve al paso 1', () => {
    render(<MapaPage />)
    simulateVar('IsOverSchool', true)
    fireEvent.click(screen.getByText('Guitarra'))
    fireEvent.click(screen.getByRole('button', { name: /clases/i }))
    expect(screen.getByText(/a qué clase vas hoy/i)).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 4 — Panel de Gym (flujo 2 pasos: instrumento → sección)
// ══════════════════════════════════════════════════════════════
describe('MapaPage — panel Gym', () => {
  beforeEach(() => {
    setDesktop()
    capturedOnVariableChange = undefined
    mockUser = { role: 'admin', clases_acceso: ['guitarra'] }
  })

  it('muestra "¿Qué vas a practicar?" al abrir', () => {
    render(<MapaPage />)
    simulateVar('IsOverGym', true)
    expect(screen.getByText(/qué vas a practicar/i)).toBeInTheDocument()
  })

  it('muestra instrumento General (paso 1)', () => {
    render(<MapaPage />)
    simulateVar('IsOverGym', true)
    expect(screen.getByText('General')).toBeInTheDocument()
  })

  it('clicar instrumento avanza al paso 2 (secciones)', () => {
    render(<MapaPage />)
    simulateVar('IsOverGym', true)
    fireEvent.click(screen.getByText('General'))
    // Paso 2 muestra el nombre del instrumento y un botón ← Instrumentos
    expect(screen.getByRole('button', { name: /instrumentos/i })).toBeInTheDocument()
  })

  it('sin secciones muestra "Contenido próximamente"', () => {
    render(<MapaPage />)
    simulateVar('IsOverGym', true)
    fireEvent.click(screen.getByText('General'))
    expect(screen.getByText(/contenido próximamente/i)).toBeInTheDocument()
  })

  it('botón ← Instrumentos vuelve al paso 1', () => {
    render(<MapaPage />)
    simulateVar('IsOverGym', true)
    fireEvent.click(screen.getByText('General'))
    fireEvent.click(screen.getByRole('button', { name: /instrumentos/i }))
    expect(screen.getByText(/qué vas a practicar/i)).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 5 — Filtro clases_acceso (desktop)
// ══════════════════════════════════════════════════════════════
describe('MapaPage — filtro clases_acceso', () => {
  beforeEach(() => {
    setDesktop()
    localStorage.clear()
    capturedOnVariableChange = undefined
    mockUser = { role: 'admin', clases_acceso: ['guitarra'] }
  })

  it('usuario student sin clases_acceso ve "Sin clases disponibles"', () => {
    mockUser = { role: 'student' }
    render(<MapaPage />)
    simulateVar('IsOverSchool', true)
    expect(screen.getByText(/sin clases disponibles/i)).toBeInTheDocument()
  })

  it('usuario student con clases_acceso=[] ve "Sin clases disponibles"', () => {
    mockUser = { role: 'student', clases_acceso: [] }
    render(<MapaPage />)
    simulateVar('IsOverSchool', true)
    expect(screen.getByText(/sin clases disponibles/i)).toBeInTheDocument()
  })

  it('usuario student con clases_acceso=["guitarra"] ve Guitarra', () => {
    mockUser = { role: 'student', clases_acceso: ['guitarra'] }
    render(<MapaPage />)
    simulateVar('IsOverSchool', true)
    expect(screen.getByText('Guitarra')).toBeInTheDocument()
    expect(screen.queryByText(/sin clases disponibles/i)).not.toBeInTheDocument()
  })

  it('gym-general siempre visible sin clases_acceso', () => {
    mockUser = { role: 'student' }
    render(<MapaPage />)
    simulateVar('IsOverGym', true)
    expect(screen.getByText('General')).toBeInTheDocument()
  })

  it('gym-general siempre visible con clases_acceso=[]', () => {
    mockUser = { role: 'student', clases_acceso: [] }
    render(<MapaPage />)
    simulateVar('IsOverGym', true)
    expect(screen.getByText('General')).toBeInTheDocument()
  })

  it('admin ve todos los instrumentos sin importar clases_acceso', () => {
    mockUser = { role: 'admin' }
    render(<MapaPage />)
    simulateVar('IsOverSchool', true)
    expect(screen.getByText('Guitarra')).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 6 — Navegación móvil (< 768px)
// En móvil, SplineScene devuelve MobileFallback (no hay hover Spline).
// La página expone botones "📚 Clases" y "🏋️ Gym" tras cerrar el tapete.
// ══════════════════════════════════════════════════════════════
describe('MapaPage — navegación móvil', () => {
  beforeEach(() => {
    setMobile()
    localStorage.clear()
    capturedOnVariableChange = undefined
    mockUser = { role: 'admin', clases_acceso: ['guitarra'] }
    mockPush.mockClear()
  })

  afterEach(() => {
    setDesktop()
    localStorage.clear()
  })

  it('muestra botones móviles en landscape aunque el tapete esté activo', () => {
    render(<MapaPage />)
    expect(screen.getByRole('button', { name: /clases/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /gym/i })).toBeInTheDocument()
  })

  it('muestra botón "📚 Clases" tras cerrar el tapete', () => {
    render(<MapaPage />)
    dismissTapete()
    expect(screen.getByRole('button', { name: /clases/i })).toBeInTheDocument()
  })

  it('muestra botón "🏋️ Gym" tras cerrar el tapete', () => {
    render(<MapaPage />)
    dismissTapete()
    expect(screen.getByRole('button', { name: /gym/i })).toBeInTheDocument()
  })

  it('"📚 Clases" abre el panel de clases', () => {
    render(<MapaPage />)
    dismissTapete()
    fireEvent.click(screen.getByRole('button', { name: /clases/i }))
    expect(screen.getByText(/a qué clase vas hoy/i)).toBeInTheDocument()
  })

  it('"🏋️ Gym" abre el panel de gym', () => {
    render(<MapaPage />)
    dismissTapete()
    fireEvent.click(screen.getByRole('button', { name: /gym/i }))
    expect(screen.getByText(/qué vas a practicar/i)).toBeInTheDocument()
  })

  it('botones desaparecen cuando un panel está abierto', () => {
    render(<MapaPage />)
    dismissTapete()
    fireEvent.click(screen.getByRole('button', { name: /gym/i }))
    // Panel abierto → botones de navegación ocultos
    expect(screen.queryByRole('button', { name: /^clases$/i })).not.toBeInTheDocument()
  })

  it('en desktop (1280px) NO se muestran los botones móviles', () => {
    setDesktop()
    render(<MapaPage />)
    dismissTapete()
    // No deben aparecer los botones de navegación móvil
    expect(screen.queryByRole('button', { name: /^clases$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^gym$/i })).not.toBeInTheDocument()
  })

  it('móvil: panel de clases muestra instrumento Guitarra', () => {
    render(<MapaPage />)
    dismissTapete()
    fireEvent.click(screen.getByRole('button', { name: /clases/i }))
    expect(screen.getByText('Guitarra')).toBeInTheDocument()
  })

  it('móvil: panel de gym muestra instrumento General', () => {
    render(<MapaPage />)
    dismissTapete()
    fireEvent.click(screen.getByRole('button', { name: /gym/i }))
    expect(screen.getByText('General')).toBeInTheDocument()
  })
})
