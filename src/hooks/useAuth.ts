'use client'

import { useState, useEffect, useCallback } from 'react'
import type { User, LoginCredentials } from '@/types'

interface AuthState {
  user: Omit<User, 'password_hash'> | null
  token: string | null
  loading: boolean
  error: string | null
}

interface RegisterCredentials {
  email: string
  password: string
  nombre?: string
}

interface UseAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>
  register: (credentials: RegisterCredentials) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  updateUser: (patch: Partial<Omit<User, 'password_hash'>>) => void
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
  })

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        setState({ user, token, loading: false, error: null })
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setState(s => ({ ...s, loading: false }))
      }
    } else {
      setState(s => ({ ...s, loading: false }))
    }
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })

      const data = await res.json()

      if (!res.ok) {
        setState(s => ({ ...s, loading: false, error: data.error }))
        return false
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setState({ user: data.user, token: data.token, loading: false, error: null })
      return true
    } catch {
      setState(s => ({ ...s, loading: false, error: 'Error de conexión' }))
      return false
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setState({ user: null, token: null, loading: false, error: null })
  }, [])

  const updateUser = useCallback((patch: Partial<Omit<User, 'password_hash'>>) => {
    setState(prev => {
      if (!prev.user) return prev
      const updated = { ...prev.user, ...patch }
      localStorage.setItem('user', JSON.stringify(updated))
      return { ...prev, user: updated }
    })
  }, [])

  const register = useCallback(async (credentials: RegisterCredentials): Promise<{ ok: boolean; error?: string }> => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      const data = await res.json()
      setState(s => ({ ...s, loading: false }))
      if (!res.ok) return { ok: false, error: data.error }
      return { ok: true }
    } catch {
      setState(s => ({ ...s, loading: false }))
      return { ok: false, error: 'Error de conexión' }
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) return
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
      if (!res.ok) return
      const data = await res.json()
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
        setState(prev => ({ ...prev, user: data.user }))
      }
    } catch {
      // silencioso
    }
  }, [])

  return {
    ...state,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: !!state.token && !!state.user,
  }
}
