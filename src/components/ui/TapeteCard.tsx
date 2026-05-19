'use client'

import { AnimatePresence, motion } from 'framer-motion'

interface TapeteCardProps {
  show: boolean
  onDismiss: () => void
  /** mapa: escuela principal; gym | clase: salas Spline */
  sala: 'mapa' | 'gym' | 'clase'
}

const CYAN      = '#22d3ee'
const CYAN_GLOW = 'rgba(34,211,238,0.35)'
const CYAN_DIM  = 'rgba(34,211,238,0.12)'

export default function TapeteCard({ show, onDismiss, sala }: TapeteCardProps) {
  const emoji = sala === 'mapa' ? '🗺️' : sala === 'gym' ? '🏋️' : '🎸'
  const subtitle =
    sala === 'mapa'
      ? 'Salta sobre el tapete de la escuela o del gym para abrir clases o entrenamiento.'
      : sala === 'gym'
        ? 'Salta o párate sobre el tapete para abrir el panel de entrenamiento.'
        : 'Salta o párate sobre el tapete del salón para abrir el contenido de clase.'

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            key="tapete-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(5,5,18,0.82)', backdropFilter: 'blur(8px)' }}
          />

          {/* Card */}
          <motion.div
            key="tapete-card"
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="fixed inset-0 m-auto z-[60]"
            style={{
              width: 'min(320px, 90vw)',
              maxHeight: 'calc(100dvh - 32px)',
              height: 'fit-content',
              background: 'rgba(8,20,28,0.97)',
              border: `1px solid rgba(34,211,238,0.3)`,
              borderRadius: 20,
              boxShadow: `0 0 60px ${CYAN_GLOW}, 0 0 120px rgba(34,211,238,0.06), 0 24px 48px rgba(0,0,0,0.65)`,
              padding: '20px 20px 18px',
              textAlign: 'center',
              overflow: 'auto',
              position: 'fixed',
            }}
          >
            {/* Top glow line */}
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: 160, height: 2,
              background: `linear-gradient(90deg, transparent, ${CYAN}, transparent)`,
            }} />

            {/* Corner accents */}
            <div style={{ position: 'absolute', top: 10, left: 10, width: 14, height: 14, borderTop: `2px solid ${CYAN}`, borderLeft: `2px solid ${CYAN}`, borderRadius: '3px 0 0 0', opacity: 0.5 }} />
            <div style={{ position: 'absolute', top: 10, right: 10, width: 14, height: 14, borderTop: `2px solid ${CYAN}`, borderRight: `2px solid ${CYAN}`, borderRadius: '0 3px 0 0', opacity: 0.5 }} />
            <div style={{ position: 'absolute', bottom: 10, left: 10, width: 14, height: 14, borderBottom: `2px solid ${CYAN}`, borderLeft: `2px solid ${CYAN}`, borderRadius: '0 0 0 3px', opacity: 0.5 }} />
            <div style={{ position: 'absolute', bottom: 10, right: 10, width: 14, height: 14, borderBottom: `2px solid ${CYAN}`, borderRight: `2px solid ${CYAN}`, borderRadius: '0 0 3px 0', opacity: 0.5 }} />

            {/* Room emoji */}
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 34, lineHeight: 1, marginBottom: 10 }}
            >
              {emoji}
            </motion.div>

            {/* Title */}
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17,
              color: CYAN, marginBottom: 8, letterSpacing: '0.03em',
              textShadow: `0 0 20px ${CYAN_GLOW}`,
            }}>
              ¡Pisa el tapete!
            </h2>

            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 12,
              color: 'rgba(255,255,255,0.5)', marginBottom: 16,
              lineHeight: 1.5, padding: '0 4px',
            }}>
              {subtitle}
            </p>

            {/* Tapete visual */}
            <div style={{
              margin: '0 auto 16px',
              width: 100, height: 40,
              borderRadius: 10,
              background: CYAN_DIM,
              border: `1px solid rgba(34,211,238,0.4)`,
              boxShadow: `0 0 20px ${CYAN_GLOW}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <motion.div
                animate={{ x: [-100, 100] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  top: 0, bottom: 0,
                  width: 36,
                  background: `linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)`,
                  pointerEvents: 'none',
                }}
              />
              <span style={{ fontSize: 20, position: 'relative' }}>👟</span>
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: `0 0 40px ${CYAN_GLOW}` }}
              whileTap={{ scale: 0.97 }}
              onClick={onDismiss}
              style={{
                width: '100%',
                padding: '11px 0',
                borderRadius: 10,
                border: `1px solid rgba(34,211,238,0.5)`,
                background: CYAN_DIM,
                color: CYAN,
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: `0 0 20px rgba(34,211,238,0.15)`,
                letterSpacing: '0.04em',
                textShadow: `0 0 12px ${CYAN_GLOW}`,
              }}
            >
              ¡Entendido!
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
