'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

interface CompleteResult {
  ya_completado: boolean
  puntos_ganados: number
  total_puntos?: number
  nivel?: number
  subio_nivel?: boolean
}

export function useProgress() {
  const { token, isAuthenticated } = useAuth()
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isAuthenticated || !token) return
    fetch('/api/progress', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.completed)) {
          setCompleted(new Set(data.completed))
        }
      })
      .catch(() => {})
  }, [isAuthenticated, token])

  const completeResource = useCallback(
    async (url: string, tipo: string): Promise<CompleteResult | null> => {
      if (!token) return null
      try {
        const res = await fetch('/api/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url, tipo }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }))
          console.error('[useProgress] API error:', res.status, err)
          return null
        }
        const data: CompleteResult = await res.json()
        if (!data.ya_completado) {
          setCompleted(prev => new Set([...prev, url]))
        }
        return data
      } catch (err) {
        console.error('[useProgress] completeResource failed:', err)
        return null
      }
    },
    [token]
  )

  const isCompleted = useCallback((url: string) => completed.has(url), [completed])

  return { isCompleted, completeResource }
}
