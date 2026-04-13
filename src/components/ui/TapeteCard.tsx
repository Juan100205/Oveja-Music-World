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
              width: 'min(340px, 92vw)',
              height: 'fit-content',
              background: 'rgba(8,20,28,0.97)',
              border: `1px solid rgba(34,211,238,0.3)`,
              borderRadius: 20,
              boxShadow: `0 0 60px ${CYAN_GLOW}, 0 0 120px rgba(34,211,238,0.06), 0 24px 48px rgba(0,0,0,0.65)`,
              padding: '28px 24px 24px',
              textAlign: 'center',
              overflow: 'hidden',
            }}
          >
            {/* Top glow line */}
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: 160, height: 2,
              background: `linear-gradient(90deg, transparent, ${CYAN}, transparent)`,
            }} />

            {/* Corner accents */}
            <div style={{ position: 'absolute', top: 12, left: 12, width: 16, height: 16, borderTop: `2px solid ${CYAN}`, borderLeft: `2px solid ${CYAN}`, borderRadius: '3px 0 0 0', opacity: 0.5 }} />
            <div style={{ position: 'absolute', top: 12, right: 12, width: 16, height: 16, borderTop: `2px solid ${CYAN}`, borderRight: `2px solid ${CYAN}`, borderRadius: '0 3px 0 0', opacity: 0.5 }} />
            <div style={{ position: 'absolute', bottom: 12, left: 12, width: 16, height: 16, borderBottom: `2px solid ${CYAN}`, borderLeft: `2px solid ${CYAN}`, borderRadius: '0 0 0 3px', opacity: 0.5 }} />
            <div style={{ position: 'absolute', bottom: 12, right: 12, width: 16, height: 16, borderBottom: `2px solid ${CYAN}`, borderRight: `2px solid ${CYAN}`, borderRadius: '0 0 3px 0', opacity: 0.5 }} />

            {/* Room emoji */}
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 42, lineHeight: 1, marginBottom: 14 }}
            >
              {emoji}
            </motion.div>

            {/* Title */}
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
              color: CYAN, marginBottom: 6, letterSpacing: '0.03em',
              textShadow: `0 0 20px ${CYAN_GLOW}`,
            }}>
              ¡Pisa el tapete!
            </h2>

            <p style={{
              fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15,
              color: CYAN, marginBottom: 10, letterSpacing: '0.02em',
              textShadow: `0 0 14px ${CYAN_GLOW}`,
            }}>
              ¡Salta sobre el tapete!
            </p>

            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'rgba(255,255,255,0.5)', marginBottom: 24,
              lineHeight: 1.55, padding: '0 8px',
            }}>
              {subtitle}
            </p>

            {/* Tapete visual */}
            <div style={{
              margin: '0 auto 24px',
              width: 120, height: 52,
              borderRadius: 12,
              background: CYAN_DIM,
              border: `1px solid rgba(34,211,238,0.4)`,
              boxShadow: `0 0 24px ${CYAN_GLOW}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Scan line animation */}
              <motion.div
                animate={{ x: [-120, 120] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  top: 0, bottom: 0,
                  width: 40,
                  background: `linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)`,
                  pointerEvents: 'none',
                }}
              />
              <span style={{ fontSize: 22, position: 'relative' }}>👟</span>
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: `0 0 40px ${CYAN_GLOW}` }}
              whileTap={{ scale: 0.97 }}
              onClick={onDismiss}
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 12,
                border: `1px solid rgba(34,211,238,0.5)`,
                background: CYAN_DIM,
                color: CYAN,
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 15,
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
