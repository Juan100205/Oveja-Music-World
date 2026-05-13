/**
 * SplineScene TDD tests
 * Verifica: loader, mobile fallback, error/timeout, auto-retry, polling de variables
 */
import React from 'react'
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react'

// ── Bridge para comunicar el mock con los tests ────────────────
const splineBridge: {
  onLoad?: (app: unknown) => void
  scene?: string
} = {}

jest.mock('next/dynamic', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react')
  return (_importFn: unknown) => {
    return function SplineSceneMock(props: {
      scene: string
      onLoad?: (app: unknown) => void
      style?: React.CSSProperties
    }) {
      splineBridge.onLoad = props.onLoad
      splineBridge.scene  = props.scene
      return React.createElement('div', {
        'data-testid': 'spline-canvas',
        'data-scene': props.scene,
        style: props.style,
      })
    }
  }
})

// ── Helpers ────────────────────────────────────────────────────
const SCENE_MAP       = 'https://prod.spline.design/WpjnQukgytAKxnYq/scene.splinecode'
const SCENE_GYM       = 'https://prod.spline.design/gYLTlZu92yz616yC/scene.splinecode'
const SCENE_CLASSROOM = 'https://prod.spline.design/646pGt79P6qgQp6p/scene.splinecode'

function makeSplineApp(vars: Record<string, unknown> = {}) {
  let currentVars = { ...vars }
  return {
    getVariables: jest.fn(() => ({ ...currentVars })),
    setVars(newVars: Record<string, unknown>) { currentVars = { ...newVars } },
  }
}

function triggerLoad(app: unknown = makeSplineApp()) {
  act(() => { splineBridge.onLoad?.(app) })
}

import SplineScene from '@/components/spline/SplineScene'

// ══════════════════════════════════════════════════════════════
// SUITE 1 — Renderizado inicial (desktop)
// ══════════════════════════════════════════════════════════════
describe('SplineScene — desktop', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
    splineBridge.onLoad = undefined
    splineBridge.scene  = undefined
  })

  it('muestra el loader mientras Spline no ha disparado onLoad', () => {
    render(<SplineScene scene={SCENE_MAP} />)
    expect(screen.getByText(/cargando mundo 3d/i)).toBeInTheDocument()
  })

  it('renderiza el canvas de Spline con la URL de escena correcta', () => {
    render(<SplineScene scene={SCENE_MAP} />)
    expect(screen.getByTestId('spline-canvas')).toHaveAttribute('data-scene', SCENE_MAP)
  })

  it('oculta el loader tras disparar onLoad', async () => {
    render(<SplineScene scene={SCENE_MAP} />)
    expect(screen.getByText(/cargando mundo 3d/i)).toBeInTheDocument()

    triggerLoad()

    await waitFor(() => {
      expect(screen.queryByText(/cargando mundo 3d/i)).not.toBeInTheDocument()
    })
  })

  it('el canvas tiene estilo width/height 100%', () => {
    render(<SplineScene scene={SCENE_MAP} />)
    const canvas = screen.getByTestId('spline-canvas')
    expect(canvas).toHaveStyle({ width: '100%', height: '100%' })
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 2 — Mobile fallback (< 768px)
// Spline NO carga en móvil — protege contra crash de WebGL.
// Las páginas con fallback timer (gym) manejan el contenido por su cuenta.
// ══════════════════════════════════════════════════════════════
describe('SplineScene — mobile fallback', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 })
    splineBridge.onLoad = undefined
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  })

  it('muestra texto de marca en móvil (MobileFallback)', () => {
    render(<SplineScene scene={SCENE_MAP} />)
    expect(screen.getByText(/oveja music world/i)).toBeInTheDocument()
  })

  it('NO renderiza el canvas de Spline en móvil', () => {
    render(<SplineScene scene={SCENE_MAP} />)
    expect(screen.queryByTestId('spline-canvas')).not.toBeInTheDocument()
  })

  it('NO muestra el loader de carga en móvil', () => {
    render(<SplineScene scene={SCENE_MAP} />)
    expect(screen.queryByText(/cargando mundo 3d/i)).not.toBeInTheDocument()
  })

  it('NO muestra error fallback en móvil aunque pase mucho tiempo', () => {
    jest.useFakeTimers()
    render(<SplineScene scene={SCENE_MAP} />)
    act(() => { jest.advanceTimersByTime(120_000) })
    expect(screen.queryByText(/no se pudo cargar/i)).not.toBeInTheDocument()
    jest.useRealTimers()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 3 — Error / Timeout
// ══════════════════════════════════════════════════════════════
describe('SplineScene — error fallback', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
    jest.useFakeTimers()
    splineBridge.onLoad = undefined
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('muestra error fallback tras agotar el timeout sin que Spline cargue', () => {
    render(<SplineScene scene={SCENE_MAP} loadTimeoutMs={5_000} />)
    act(() => { jest.advanceTimersByTime(5_000) })

    expect(screen.getByText(/no se pudo cargar/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })

  it('NO muestra error si Spline carga antes del timeout', () => {
    render(<SplineScene scene={SCENE_MAP} loadTimeoutMs={20_000} />)
    act(() => { jest.advanceTimersByTime(5_000) })
    triggerLoad()
    act(() => { jest.advanceTimersByTime(20_000) })

    expect(screen.queryByText(/no se pudo cargar/i)).not.toBeInTheDocument()
  })

  it('reintentar resetea el error y vuelve a mostrar el canvas', () => {
    render(<SplineScene scene={SCENE_MAP} loadTimeoutMs={5_000} />)
    act(() => { jest.advanceTimersByTime(5_000) })

    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(screen.queryByText(/no se pudo cargar/i)).not.toBeInTheDocument()
    expect(screen.getByTestId('spline-canvas')).toBeInTheDocument()
  })

  it('reintentar muestra el loader nuevamente', () => {
    render(<SplineScene scene={SCENE_MAP} loadTimeoutMs={5_000} />)
    act(() => { jest.advanceTimersByTime(5_000) })
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(screen.getByText(/cargando mundo 3d/i)).toBeInTheDocument()
  })

  it('con silentOnError: el timeout oculta Spline sin mostrar error UI', () => {
    render(<SplineScene scene={SCENE_GYM} loadTimeoutMs={5_000} silentOnError />)
    act(() => { jest.advanceTimersByTime(5_000) })

    // No error UI, no canvas — just disappears
    expect(screen.queryByText(/no se pudo cargar/i)).not.toBeInTheDocument()
    expect(screen.queryByTestId('spline-canvas')).not.toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 4 — Polling de variables Spline
// ══════════════════════════════════════════════════════════════
describe('SplineScene — polling de variables', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
    jest.useFakeTimers()
    splineBridge.onLoad = undefined
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('llama onVariableChange cuando una variable cambia a true', () => {
    const onVariableChange = jest.fn()
    render(<SplineScene scene={SCENE_MAP} onVariableChange={onVariableChange} />)

    const app = makeSplineApp({ IsOverGym: false, IsOverSchool: false })
    triggerLoad(app)

    act(() => { jest.advanceTimersByTime(100) })
    expect(onVariableChange).not.toHaveBeenCalled()

    app.setVars({ IsOverGym: true, IsOverSchool: false })
    act(() => { jest.advanceTimersByTime(100) })

    expect(onVariableChange).toHaveBeenCalledWith('IsOverGym', true)
    expect(onVariableChange).not.toHaveBeenCalledWith('IsOverSchool', expect.anything())
  })

  it('detecta múltiples cambios en el mismo tick', () => {
    const onVariableChange = jest.fn()
    render(<SplineScene scene={SCENE_MAP} onVariableChange={onVariableChange} />)

    const app = makeSplineApp({ IsOverGym: false, IsOverSchool: false })
    triggerLoad(app)

    app.setVars({ IsOverGym: true, IsOverSchool: true })
    act(() => { jest.advanceTimersByTime(100) })

    expect(onVariableChange).toHaveBeenCalledTimes(2)
    expect(onVariableChange).toHaveBeenCalledWith('IsOverGym', true)
    expect(onVariableChange).toHaveBeenCalledWith('IsOverSchool', true)
  })

  it('NO llama onVariableChange si nada cambia', () => {
    const onVariableChange = jest.fn()
    render(<SplineScene scene={SCENE_MAP} onVariableChange={onVariableChange} />)

    const app = makeSplineApp({ IsOverGym: false })
    triggerLoad(app)

    act(() => { jest.advanceTimersByTime(1000) })
    expect(onVariableChange).not.toHaveBeenCalled()
  })

  it('NO inicia polling si no se pasa onVariableChange', () => {
    render(<SplineScene scene={SCENE_MAP} />)

    const app = makeSplineApp({ IsOverGym: false })
    triggerLoad(app)

    act(() => { jest.advanceTimersByTime(1000) })
    expect(app.getVariables).not.toHaveBeenCalled()
  })

  it('polling empieza exactamente 100ms después de onLoad', () => {
    const onVariableChange = jest.fn()
    render(<SplineScene scene={SCENE_MAP} onVariableChange={onVariableChange} />)

    const app = makeSplineApp({ IsOverGym: false })
    triggerLoad(app)

    app.setVars({ IsOverGym: true })

    act(() => { jest.advanceTimersByTime(50) })
    expect(onVariableChange).not.toHaveBeenCalled()

    act(() => { jest.advanceTimersByTime(50) })
    expect(onVariableChange).toHaveBeenCalledWith('IsOverGym', true)
  })

  it('detecta cambio de variable de true a false', () => {
    const onVariableChange = jest.fn()
    render(<SplineScene scene={SCENE_MAP} onVariableChange={onVariableChange} />)

    const app = makeSplineApp({ IsOverGym: true })
    triggerLoad(app)

    act(() => { jest.advanceTimersByTime(100) }) // primer tick sin cambio

    app.setVars({ IsOverGym: false })
    act(() => { jest.advanceTimersByTime(100) })

    expect(onVariableChange).toHaveBeenCalledWith('IsOverGym', false)
  })

  // Variables específicas del gym sala
  it('detecta isTrainning y isOutingGym (variables del gym)', () => {
    const onVariableChange = jest.fn()
    render(<SplineScene scene={SCENE_GYM} onVariableChange={onVariableChange} />)

    const app = makeSplineApp({ isTrainning: false, isOutingGym: false })
    triggerLoad(app)

    app.setVars({ isTrainning: true, isOutingGym: false })
    act(() => { jest.advanceTimersByTime(100) })
    expect(onVariableChange).toHaveBeenCalledWith('isTrainning', true)

    app.setVars({ isTrainning: false, isOutingGym: true })
    act(() => { jest.advanceTimersByTime(100) })
    expect(onVariableChange).toHaveBeenCalledWith('isOutingGym', true)
  })
})

// ══════════════════════════════════════════════════════════════
// SUITE 5 — URLs de escenas (regresión)
// ══════════════════════════════════════════════════════════════
describe('SplineScene — URLs correctas por sala', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  })

  const SCENES = [
    ['mapa',       SCENE_MAP],
    ['gym',        SCENE_GYM],
    ['classroom',  SCENE_CLASSROOM],
  ] as const

  it.each(SCENES)('escena "%s" se pasa al canvas correctamente', (_, url) => {
    render(<SplineScene scene={url} />)
    expect(screen.getByTestId('spline-canvas')).toHaveAttribute('data-scene', url)
  })
})
