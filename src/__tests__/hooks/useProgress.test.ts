import { renderHook, act, waitFor } from '@testing-library/react'

// ── Mocks ─────────────────────────────────────────────────────
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock useAuth para controlar el estado de autenticación
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

import { useAuth } from '@/hooks/useAuth'
import { useProgress } from '@/hooks/useProgress'

const mockUseAuth = useAuth as jest.Mock

function setupAuth(token: string | null = 'test-token', isAuthenticated = true) {
  mockUseAuth.mockReturnValue({ token, isAuthenticated })
}

beforeEach(() => {
  mockFetch.mockReset()
  mockUseAuth.mockReset()
})

// ── Carga inicial de progreso ─────────────────────────────────
describe('useProgress — carga inicial', () => {
  it('carga completados del servidor al montar con sesión activa', async () => {
    setupAuth('tok-1')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ completed: ['https://yt.com/v=abc', 'https://yt.com/v=def'] }),
    })

    const { result } = renderHook(() => useProgress())
    // Esperar a que el estado refleje los datos cargados
    await waitFor(() => expect(result.current.isCompleted('https://yt.com/v=abc')).toBe(true))

    expect(result.current.isCompleted('https://yt.com/v=def')).toBe(true)
    expect(result.current.isCompleted('https://yt.com/v=xyz')).toBe(false)
  })

  it('no carga progreso si usuario no está autenticado', async () => {
    setupAuth(null, false)

    renderHook(() => useProgress())
    await new Promise(r => setTimeout(r, 50))

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('maneja error de red silenciosamente (no rompe el hook)', async () => {
    setupAuth('tok-1')
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useProgress())
    await new Promise(r => setTimeout(r, 50))

    // No debe lanzar; isCompleted retorna false
    expect(result.current.isCompleted('any-url')).toBe(false)
  })

  it('maneja respuesta sin campo completed', async () => {
    setupAuth('tok-1')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'algo-raro' }),
    })

    const { result } = renderHook(() => useProgress())
    await waitFor(() => expect(mockFetch).toHaveBeenCalled())

    expect(result.current.isCompleted('any-url')).toBe(false)
  })
})

// ── completeResource ──────────────────────────────────────────
describe('useProgress — completeResource', () => {
  const VIDEO_URL = 'https://www.youtube.com/watch?v=TEST'

  beforeEach(() => {
    setupAuth('token-abc')
    // GET inicial vacío
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ completed: [] }),
    })
  })

  it('recurso nuevo: agrega al set local y retorna puntos_ganados', async () => {
    const { result } = renderHook(() => useProgress())
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ya_completado: false, puntos_ganados: 20, total_puntos: 20, nivel: 1, subio_nivel: false }),
    })

    let response: Awaited<ReturnType<typeof result.current.completeResource>>
    await act(async () => {
      response = await result.current.completeResource(VIDEO_URL, 'video')
    })

    expect(response!.puntos_ganados).toBe(20)
    expect(response!.ya_completado).toBe(false)
    expect(result.current.isCompleted(VIDEO_URL)).toBe(true)
  })

  it('recurso ya completado: retorna ya_completado: true, no re-agrega', async () => {
    const { result } = renderHook(() => useProgress())
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ya_completado: true, puntos_ganados: 0 }),
    })

    // Pre-completar localmente
    act(() => { /* no-op */ })

    let response: Awaited<ReturnType<typeof result.current.completeResource>>
    await act(async () => {
      response = await result.current.completeResource(VIDEO_URL, 'video')
    })

    expect(response!.ya_completado).toBe(true)
    expect(response!.puntos_ganados).toBe(0)
  })

  it('retorna null si no hay token', async () => {
    mockUseAuth.mockReturnValue({ token: null, isAuthenticated: false })
    const { result } = renderHook(() => useProgress())

    let response: Awaited<ReturnType<typeof result.current.completeResource>>
    await act(async () => {
      response = await result.current.completeResource(VIDEO_URL, 'video')
    })

    expect(response).toBeNull()
    // Solo el GET inicial (que tampoco se hará) o nada
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('error de red: retorna null sin romper el estado', async () => {
    const { result } = renderHook(() => useProgress())
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    mockFetch.mockRejectedValueOnce(new Error('Network'))

    let response: Awaited<ReturnType<typeof result.current.completeResource>>
    await act(async () => {
      response = await result.current.completeResource(VIDEO_URL, 'video')
    })

    expect(response).toBeNull()
    expect(result.current.isCompleted(VIDEO_URL)).toBe(false)
  })

  it('completeResource con tipo drive otorga 5 pts (no 20)', async () => {
    const { result } = renderHook(() => useProgress())
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ya_completado: false, puntos_ganados: 5, total_puntos: 5 }),
    })

    let response: Awaited<ReturnType<typeof result.current.completeResource>>
    await act(async () => {
      response = await result.current.completeResource('https://drive.google.com/doc1', 'drive')
    })

    expect(response!.puntos_ganados).toBe(5)
  })

  it('aislamiento: dos hooks independientes no comparten el mismo Set de completados', async () => {
    // Ambos hooks usan el mismo auth mock (mismo token)
    setupAuth('shared-token')

    // Hook 1 y Hook 2 parten sin completados
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ completed: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ completed: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ya_completado: false, puntos_ganados: 20 }) })

    const { result: progress1 } = renderHook(() => useProgress())
    const { result: progress2 } = renderHook(() => useProgress())

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))

    // Solo hook1 completa URL-A
    await act(async () => {
      await progress1.current.completeResource('URL-A', 'video')
    })

    await waitFor(() => expect(progress1.current.isCompleted('URL-A')).toBe(true))

    // Hook2 no debe ver URL-A (su Set está aislado)
    expect(progress2.current.isCompleted('URL-A')).toBe(false)
  })
})

// ── isCompleted ───────────────────────────────────────────────
describe('useProgress — isCompleted', () => {
  it('retorna false para URL no completada', async () => {
    setupAuth('tok')
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ completed: ['URL-1'] }) })

    const { result } = renderHook(() => useProgress())
    await waitFor(() => expect(mockFetch).toHaveBeenCalled())

    expect(result.current.isCompleted('URL-2')).toBe(false)
  })

  it('retorna true para URL del servidor', async () => {
    setupAuth('tok')
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ completed: ['URL-SERVER'] }) })

    const { result } = renderHook(() => useProgress())
    await waitFor(() => expect(result.current.isCompleted('URL-SERVER')).toBe(true))
  })

  it('retorna true después de completar vía completeResource (antes del reload)', async () => {
    setupAuth('tok')
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ completed: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ya_completado: false, puntos_ganados: 20 }) })

    const { result } = renderHook(() => useProgress())
    // Esperar a que termine la carga inicial
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    await act(async () => {
      await result.current.completeResource('NEW-URL', 'video')
    })

    await waitFor(() => expect(result.current.isCompleted('NEW-URL')).toBe(true))
  })
})
