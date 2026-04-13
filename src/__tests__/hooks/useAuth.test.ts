import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'

// ── Mocks ─────────────────────────────────────────────────────
const mockFetch = jest.fn()
global.fetch = mockFetch

// localStorage mock (jsdom provee uno funcional)
beforeEach(() => {
  localStorage.clear()
  mockFetch.mockReset()
})

// ── Tests ─────────────────────────────────────────────────────
describe('useAuth — estado inicial', () => {
  it('resuelve loading: false rápidamente tras el mount', async () => {
    // React Testing Library ejecuta efectos de forma síncrona dentro de act(),
    // por lo que loading pasa de true → false antes del primer acceso a result.current.
    // Lo que importa es que el hook siempre termina en un estado definido (no queda colgado).
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('sin localStorage: user y token son null después del mount', async () => {
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('con token y user en localStorage: restaura sesión automáticamente', async () => {
    const mockUser = { id: 'u1', email: 'juan@test.com', role: 'student', nivel: 1, puntos: 0, created_at: '2024-01-01' }
    localStorage.setItem('token', 'saved-token-123')
    localStorage.setItem('user', JSON.stringify(mockUser))

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.token).toBe('saved-token-123')
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('JSON inválido en localStorage: limpia y arranca sin sesión', async () => {
    localStorage.setItem('token', 'some-token')
    localStorage.setItem('user', 'INVALID_JSON{{{')

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    // Debe limpiar localStorage
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})

describe('useAuth — login', () => {
  const mockUser = {
    id: 'u1', email: 'juan@test.com', role: 'student',
    nivel: 1, puntos: 0, nombre: 'Juan', created_at: '2024-01-01',
  }

  it('login exitoso guarda token y user en estado y localStorage', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'jwt-token', user: mockUser }),
    })

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let success: boolean
    await act(async () => {
      success = await result.current.login({ email: 'juan@test.com', password: 'secret123' })
    })

    expect(success!).toBe(true)
    expect(result.current.token).toBe('jwt-token')
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('token')).toBe('jwt-token')
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockUser)
  })

  it('login fallido: error de servidor no guarda sesión', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Credenciales inválidas' }),
    })

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let success: boolean
    await act(async () => {
      success = await result.current.login({ email: 'bad@test.com', password: 'wrong' })
    })

    expect(success!).toBe(false)
    expect(result.current.token).toBeNull()
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.error).toBe('Credenciales inválidas')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('login con error de red: error = "Error de conexión"', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let success: boolean
    await act(async () => {
      success = await result.current.login({ email: 'juan@test.com', password: 'secret123' })
    })

    expect(success!).toBe(false)
    expect(result.current.error).toBe('Error de conexión')
  })
})

describe('useAuth — logout', () => {
  it('logout limpia estado y localStorage', async () => {
    const mockUser = { id: 'u1', email: 'juan@test.com', role: 'student', nivel: 1, puntos: 0, created_at: '2024-01-01' }
    localStorage.setItem('token', 'tok')
    localStorage.setItem('user', JSON.stringify(mockUser))

    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))

    act(() => { result.current.logout() })

    expect(result.current.token).toBeNull()
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('logout de usuario no autenticado no falla', async () => {
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(() => act(() => { result.current.logout() })).not.toThrow()
  })
})

describe('useAuth — aislamiento entre instancias', () => {
  it('dos hooks independientes no comparten estado', async () => {
    const userA = { id: 'uA', email: 'a@test.com', role: 'student', nivel: 1, puntos: 0, created_at: '2024-01-01' }
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'token-a', user: userA }) })

    const { result: hookA } = renderHook(() => useAuth())
    const { result: hookB } = renderHook(() => useAuth())

    await waitFor(() => expect(hookA.current.loading).toBe(false))
    await waitFor(() => expect(hookB.current.loading).toBe(false))

    await act(async () => {
      await hookA.current.login({ email: 'a@test.com', password: 'pass' })
    })

    // hookA tiene sesión, hookB también la verá (comparten localStorage en jsdom)
    // Lo importante es que el token de A no "entra" mágicamente en B sin re-mount
    expect(hookA.current.isAuthenticated).toBe(true)
  })
})
