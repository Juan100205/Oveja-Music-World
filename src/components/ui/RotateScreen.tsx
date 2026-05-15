'use client'

import { motion } from 'framer-motion'

export default function RotateScreen() {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#0a0a1a',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 28,
        padding: '0 32px',
      }}
    >
      {/* Phone rotating animation */}
      <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Glow ring */}
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.18, 0.32, 0.18] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: 110, height: 110,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(61,184,250,0.35) 0%, transparent 70%)',
          }}
        />
        {/* Phone icon rotating */}
        <motion.div
          animate={{ rotate: [0, -90, -90, 0] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.35, 0.65, 1],
          }}
          style={{ fontSize: 64, lineHeight: 1, transformOrigin: 'center center' }}
        >
          📱
        </motion.div>

        {/* Arrow arc */}
        <motion.div
          animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', times: [0, 0.2, 0.6, 1] }}
          style={{
            position: 'absolute',
            top: 8, right: 8,
            fontSize: 22,
            color: '#3db8fa',
          }}
        >
          ↺
        </motion.div>
      </div>

      {/* Text */}
      <div style={{ textAlign: 'center' }}>
        <motion.h2
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 22,
            color: '#fff',
            margin: '0 0 10px',
            letterSpacing: '0.02em',
          }}
        >
          Gira tu pantalla
        </motion.h2>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.55,
          maxWidth: 260,
          margin: '0 auto',
        }}>
          El mundo 3D funciona en modo horizontal.
          Rota el dispositivo para continuar.
        </p>
      </div>

      {/* Landscape indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 20px',
        background: 'rgba(61,184,250,0.08)',
        border: '1px solid rgba(61,184,250,0.2)',
        borderRadius: 999,
      }}>
        <span style={{ fontSize: 18 }}>🔄</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(61,184,250,0.8)' }}>
          Modo horizontal requerido
        </span>
      </div>
    </div>
  )
}
