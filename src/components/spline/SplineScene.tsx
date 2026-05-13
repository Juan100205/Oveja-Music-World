'use client'

import React, { useState, useEffect, useRef, useCallback, Component } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'

// Pre-warm the Spline JS bundle: starts downloading as soon as this module
// is parsed, instead of waiting for the component to first render.
if (typeof window !== 'undefined') {
  void import('@splinetool/react-spline')
}

const Spline = dynamic(() => import('@splinetool/react-spline'), { ssr: false })

// Default timeout — override per-scene via loadTimeoutMs prop.
const DEFAULT_LOAD_TIMEOUT_MS = 20_000
// One silent auto-retry before giving up (catches transient WebGL init errors on mobile).
const MAX_AUTO_RETRIES = 1

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

// ── Mobile-only dark background — no WebGL, no Spline ─────────
function MobileFallback() {
  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        background: '#0a0a1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.04em' }}>
        Oveja Music World
      </span>
    </div>
  )
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
  loadTimeoutMs?: number
  /** When true: on unrecoverable error, hide silently instead of showing error UI.
   *  Pages with their own fallback content (gym sala) should use this. */
  silentOnError?: boolean
}

const SplineScene = React.memo(function SplineScene({
  scene,
  onVariableChange,
  onLoad,
  loadTimeoutMs = DEFAULT_LOAD_TIMEOUT_MS,
  silentOnError = false,
}: SplineSceneProps) {
  // Detect mobile once on mount — skip WebGL entirely on small screens.
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)

  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const [autoRetryCount, setAutoRetryCount] = useState(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevVarsRef = useRef<Record<string, unknown>>({})
  const splineAppRef = useRef<{ getVariables: () => Record<string, unknown> } | null>(null)

  // Preload the .splinecode scene file so the browser fetches it in parallel
  // with the Spline JS runtime, shaving 1–2 round trips on slow connections.
  useEffect(() => {
    if (isMobile) return
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = scene
    link.setAttribute('as', 'fetch')
    link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
    return () => {
      if (document.head.contains(link)) document.head.removeChild(link)
    }
  }, [scene, isMobile])

  // Load timeout — restart whenever retryKey changes (auto-retry resets the clock).
  useEffect(() => {
    if (isMobile || loaded || error || hidden) return
    timeoutRef.current = setTimeout(() => {
      if (silentOnError) setHidden(true)
      else setError(true)
    }, loadTimeoutMs)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isMobile, loaded, error, hidden, retryKey, loadTimeoutMs, silentOnError])

  // Pause the variable-polling interval when the tab is hidden to free CPU.
  // Resume automatically when the tab becomes visible again.
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
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
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

  // On mobile: skip WebGL entirely, rely on page-level fallback timers.
  if (isMobile) return <MobileFallback />

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
              if (timeoutRef.current) clearTimeout(timeoutRef.current)
              splineAppRef.current = splineApp
              setLoaded(true)
              onLoad?.()

              if (!onVariableChange) return

              // Snapshot inicial
              const initial = splineApp.getVariables() as Record<string, unknown>
              prevVarsRef.current = { ...initial }

              // Start polling only if the tab is currently visible
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
