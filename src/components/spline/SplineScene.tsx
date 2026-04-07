'use client'

import React, { useState, useEffect, useRef, Component } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'

const Spline = dynamic(() => import('@splinetool/react-spline'), { ssr: false })

const LOAD_TIMEOUT_MS = 90000

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

function MobileFallback() {
  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 12,
        background: 'linear-gradient(160deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)',
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        style={{ fontSize: 72 }}
      >
        🎵
      </motion.div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--om-pink)', opacity: 0.7, letterSpacing: 2 }}>
        OVEJA MUSIC WORLD
      </p>
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

/*
  Contenedor con dimensiones explícitas en vh/vw.
  ParentSize (interno de Spline) usa ResizeObserver para medir
  su div padre — necesita px reales, no % heredados de parents
  con altura indefinida.
  NO usamos position:fixed porque queda atrapado dentro del
  stacking context de los transforms de framer-motion.
*/
interface SplineSceneProps {
  scene: string
  onVariableChange?: (name: string, value: unknown) => void
}

const SplineScene = React.memo(function SplineScene({ scene, onVariableChange }: SplineSceneProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevVarsRef = useRef<Record<string, unknown>>({})

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setIsMobile(window.innerWidth < 768) }, [])

  useEffect(() => {
    if (isMobile || loaded || error) return

    timeoutRef.current = setTimeout(() => setError(true), LOAD_TIMEOUT_MS)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isMobile, loaded, error])

  // Limpia el polling solo al desmontar el componente
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  if (isMobile) {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh' }}>
        <MobileFallback />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh' }}>
        <ErrorFallback onRetry={() => { setError(false); setLoaded(false); setRetryKey(k => k + 1) }} />
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100vw',
        height: '100vh',
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

      <div style={{ width: '100vw', height: '100vh' }}>
        <SplineErrorBoundary key={retryKey} onError={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); setError(true) }}>
          <Spline
            scene={scene}
            onLoad={(splineApp) => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current)
              setLoaded(true)

              if (!onVariableChange) return

              // Snapshot inicial
              const initial = splineApp.getVariables() as Record<string, unknown>
              prevVarsRef.current = { ...initial }

              // Polling cada 100ms — detecta cambios en variables de Spline
              pollRef.current = setInterval(() => {
                const current = splineApp.getVariables() as Record<string, unknown>
                for (const key in current) {
                  if (current[key] !== prevVarsRef.current[key]) {
                    onVariableChange(key, current[key])
                    prevVarsRef.current[key] = current[key]
                  }
                }
              }, 100)
            }}
            style={{ width: '100%', height: '100%' }}
          />
        </SplineErrorBoundary>
      </div>
    </div>
  )
})

export default SplineScene
