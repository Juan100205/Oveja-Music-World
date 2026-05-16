'use client'

import React, { useState, useEffect, useRef, useCallback, Component } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'

// Pre-warm the Spline JS bundle: starts downloading as soon as this module
// is parsed, instead of waiting for the component to first render.
if (typeof window !== 'undefined') {
  void import('@splinetool/react-spline')
}

// @splinetool/react-spline/next is an async Server Component — it cannot be used
// inside a Client Component. We use the standard client-only export via dynamic.
const Spline = dynamic(() => import('@splinetool/react-spline'), { ssr: false })

// Two silent auto-retries on JS runtime errors before giving up.
// There is NO load timeout — Spline waits as long as necessary.
const MAX_AUTO_RETRIES = 2

// ── Error boundary for Spline runtime errors ───────────────────
class SplineErrorBoundary extends Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    console.error('[SplineScene] Runtime error:', error)
    this.props.onError()
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

function SplineLoader() {
  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 16, background: '#0a0a1a', zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      <motion.span
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        style={{ fontSize: 36 }}
      >
        🎵
      </motion.span>
      <motion.p
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--om-pink)' }}
      >
        Cargando mundo 3D...
      </motion.p>
    </div>
  )
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 16, background: '#0a0a1a',
      }}
    >
      <span style={{ fontSize: 48 }}>🎵</span>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--om-pink)', opacity: 0.6 }}>
        No se pudo cargar el mundo 3D
      </p>
      <button
        onClick={onRetry}
        style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
          padding: '10px 28px', borderRadius: 999, cursor: 'pointer',
          background: 'rgba(236,72,138,0.15)', color: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(236,72,138,0.3)',
        }}
      >
        Reintentar
      </button>
    </div>
  )
}

interface SplineSceneProps {
  scene: string
  onVariableChange?: (name: string, value: unknown) => void
  onLoad?: () => void
  /** When true: on unrecoverable JS error, hide silently instead of showing error UI.
   *  Pages with their own fallback content (gym sala) should use this. */
  silentOnError?: boolean
}

const SplineScene = React.memo(function SplineScene({
  scene,
  onVariableChange,
  onLoad,
  silentOnError = false,
}: SplineSceneProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const [autoRetryCount, setAutoRetryCount] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevVarsRef = useRef<Record<string, unknown>>({})
  const splineAppRef = useRef<{ getVariables: () => Record<string, unknown> } | null>(null)

  // Preload the .splinecode scene file so the browser fetches it in parallel
  // with the Spline JS runtime, shaving 1–2 round trips on slow connections.
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = scene
    link.setAttribute('as', 'fetch')
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
    return () => {
      if (document.head.contains(link)) document.head.removeChild(link)
    }
  }, [scene])

  // Restart the poll whenever onVariableChange changes (parent re-renders with a new callback).
  // Also handles tab visibility: pause when hidden, resume when visible.
  useEffect(() => {
    if (!loaded || !onVariableChange) return

    const startPoll = () => {
      if (pollRef.current || !splineAppRef.current) return
      pollRef.current = setInterval(() => {
        if (!splineAppRef.current) return
        const current = splineAppRef.current.getVariables()
        for (const key in current) {
          if (current[key] !== prevVarsRef.current[key]) {
            onVariableChange(key, current[key])
            prevVarsRef.current[key] = current[key]
          }
        }
      }, 100)
    }

    const stopPoll = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }

    const handleVisibility = () => {
      if (document.hidden) stopPoll()
      else startPoll()
    }

    // Always (re)start the poll when this effect runs — covers the case where a
    // new onVariableChange caused the previous effect's cleanup to call stopPoll().
    stopPoll()
    if (!document.hidden) startPoll()

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      stopPoll()
    }
  }, [loaded, onVariableChange])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const handleBoundaryError = useCallback(() => {
    if (autoRetryCount < MAX_AUTO_RETRIES) {
      // Silent auto-retry: don't show any error UI, just remount Spline.
      setAutoRetryCount(c => c + 1)
      setLoaded(false)
      setRetryKey(k => k + 1)
    } else if (silentOnError) {
      setHidden(true)
    } else {
      setError(true)
    }
  }, [autoRetryCount, silentOnError])

  // After max retries with silentOnError: just disappear, page handles content.
  if (hidden) return null

  if (error) {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100dvh' }}>
        <ErrorFallback
          onRetry={() => {
            setError(false)
            setLoaded(false)
            setAutoRetryCount(0)
            setRetryKey(k => k + 1)
          }}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        zIndex: 0,
        background: '#0a0a1a',
      }}
    >
      <AnimatePresence>
        {!loaded && (
          <motion.div
            key="loader"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'absolute', inset: 0, zIndex: 2 }}
          >
            <SplineLoader />
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ width: '100vw', height: '100dvh' }}>
        <SplineErrorBoundary
          key={retryKey}
          onError={handleBoundaryError}
        >
          <Spline
            scene={scene}
            onLoad={(splineApp) => {
              splineAppRef.current = splineApp
              setLoaded(true)
              onLoad?.()

              if (!onVariableChange) return

              const initial = splineApp.getVariables() as Record<string, unknown>
              prevVarsRef.current = { ...initial }

              if (!document.hidden) {
                pollRef.current = setInterval(() => {
                  if (!splineAppRef.current) return
                  const current = splineAppRef.current.getVariables() as Record<string, unknown>
                  for (const key in current) {
                    if (current[key] !== prevVarsRef.current[key]) {
                      onVariableChange(key, current[key])
                      prevVarsRef.current[key] = current[key]
                    }
                  }
                }, 100)
              }
            }}
            style={{ width: '100%', height: '100%' }}
          />
        </SplineErrorBoundary>
      </div>
    </div>
  )
})

export default SplineScene
