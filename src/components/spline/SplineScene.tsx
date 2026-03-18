'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const Spline = dynamic(() => import('@splinetool/react-spline'), { ssr: false })

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

/*
  Contenedor con dimensiones explícitas en vh/vw.
  ParentSize (interno de Spline) usa ResizeObserver para medir
  su div padre — necesita px reales, no % heredados de parents
  con altura indefinida.
  NO usamos position:fixed porque queda atrapado dentro del
  stacking context de los transforms de framer-motion.
*/
export default function SplineScene({ scene }: { scene: string }) {
  const [loaded, setLoaded] = useState(false)

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

      {/* Spline siempre montado — el div tiene 100vw × 100vh explícitos */}
      <div style={{ width: '100vw', height: '100vh' }}>
        <Spline
          scene={scene}
          onLoad={() => setLoaded(true)}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}
