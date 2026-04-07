'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import SplineScene from '@/components/spline/SplineScene'

const SCENE_CLASSROOM = 'https://prod.spline.design/646pGt79P6qgQp6p/scene.splinecode'

export default function ClasePage() {
  const { instrumento } = useParams<{ instrumento: string }>()
  const router = useRouter()

  const [isInClass,     setIsInClass]     = useState(false)
  const [isOutingClass, setIsOutingClass] = useState(false)

  const handleVariableChange = useCallback((name: string, value: unknown) => {
    const isTrue = value === true || String(value).toLowerCase() === 'true'
    if (name === 'isInClass')     flushSync(() => setIsInClass(isTrue))
    if (name === 'isOutingClass') flushSync(() => setIsOutingClass(isTrue))
  }, [])

  return (
    <main style={{ width: '100vw', height: '100vh', background: '#0a0a1a', overflow: 'hidden', position: 'relative' }}>

      <SplineScene scene={SCENE_CLASSROOM} onVariableChange={handleVariableChange} />

      {/* ── Botón fijo volver al mapa ── */}
      <motion.button
        onClick={() => router.push('/escuela')}
        whileHover={{ x: -3 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-5 left-5 z-20 flex items-center gap-2 cursor-pointer"
        style={{
          background: 'rgba(10,10,26,0.6)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 999,
          padding: '8px 16px',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        ← Mapa
      </motion.button>

      {/* ── Tomar Lecciones ── */}
      <AnimatePresence>
        {isInClass && (
          <motion.button
            key="lecciones-btn"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            whileHover={{ scale: 1.06, boxShadow: '0 0 48px rgba(236,72,138,0.55)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/escuela')}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 cursor-pointer"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 16,
              padding: '14px 36px',
              borderRadius: 999,
              border: 'none',
              background: 'linear-gradient(135deg, var(--om-pink) 0%, var(--om-purple) 100%)',
              color: '#fff',
              boxShadow: '0 0 32px rgba(236,72,138,0.4)',
              letterSpacing: '0.02em',
            }}
          >
            Tomar Lecciones →
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Volver al Mapa ── */}
      <AnimatePresence>
        {isOutingClass && (
          <motion.button
            key="volver-btn"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            whileHover={{ scale: 1.06, boxShadow: '0 0 48px rgba(61,184,250,0.55)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/escuela')}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 cursor-pointer"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 16,
              padding: '14px 36px',
              borderRadius: 999,
              border: 'none',
              background: 'linear-gradient(135deg, var(--om-blue) 0%, var(--om-purple) 100%)',
              color: '#fff',
              boxShadow: '0 0 32px rgba(61,184,250,0.4)',
              letterSpacing: '0.02em',
            }}
          >
            ← Volver al Mapa
          </motion.button>
        )}
      </AnimatePresence>

    </main>
  )
}
