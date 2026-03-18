'use client'

import { useState, useEffect, useCallback } from 'react'
import type { User, LoginCredentials } from '@/types'

interface AuthState {
  user: Omit<User, 'password_hash'> | null
  token: string | null
  loading: boolean
  error: string | null
}

interface UseAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
  })

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

  return {
    ...state,
    login,
    logout,
    isAuthenticated: !!state.token && !!state.user,
  }
}
