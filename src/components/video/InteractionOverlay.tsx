'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { InteractionPoint, InteractionTipo } from '@/types'

const TIPO_CONFIG: Record<InteractionTipo, {
  emoji:   string
  color:   string
  border:  string
  glow:    string
  label:   string
}> = {
  practica: {
    emoji:  '🎵',
    color:  'rgba(236,72,138,0.18)',
    border: 'rgba(236,72,138,0.5)',
    glow:   'rgba(236,72,138,0.3)',
    label:  '¡Momento de práctica!',
  },
  reflexion: {
    emoji:  '🧘',
    color:  'rgba(61,184,250,0.18)',
    border: 'rgba(61,184,250,0.5)',
    glow:   'rgba(61,184,250,0.3)',
    label:  '¡Reflexión!',
  },
  reto: {
    emoji:  '🔥',
    color:  'rgba(255,167,55,0.18)',
    border: 'rgba(255,167,55,0.5)',
    glow:   'rgba(255,167,55,0.3)',
    label:  '¡Reto activado!',
  },
}

interface Props {
  interaction: InteractionPoint | null
  onContinue:  () => void
}

export function InteractionOverlay({ interaction, onContinue }: Props) {
  const cfg = interaction ? TIPO_CONFIG[interaction.tipo] : null

  return (
    <AnimatePresence>
      {interaction && cfg && (
        <>
          {/* Backdrop blur */}
          <motion.div
            key="interact-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: 'rgba(5,5,18,0.88)',
              backdropFilter: 'blur(18px)',
            }}
          />

          {/* Card */}
          <motion.div
            key="interact-card"
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{   opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            style={{
              position:       'absolute',
              inset:          0,
              zIndex:         11,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              padding:        '20px 24px',
              pointerEvents:  'none',
            }}
          >
            <div
              style={{
                pointerEvents: 'auto',
                width:         '100%',
                maxWidth:      480,
                background:    'rgba(12,12,28,0.97)',
                border:        `1px solid ${cfg.border}`,
                borderRadius:  28,
                padding:       '36px 28px',
                boxShadow:     `0 0 60px ${cfg.glow}`,
                backdropFilter:'blur(24px)',
                textAlign:     'center',
              }}
            >
              {/* Pulsing emoji */}
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: 56, lineHeight: 1, marginBottom: 16 }}
              >
                {cfg.emoji}
              </motion.div>

              {/* Type label */}
              <p style={{
                fontFamily:    'var(--font-body)',
                fontSize:      11,
                fontWeight:    600,
                color:         cfg.border,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom:  10,
              }}>
                {cfg.label}
              </p>

              {/* Main message */}
              <p style={{
                fontFamily:   'var(--font-display)',
                fontWeight:   700,
                fontSize:     22,
                color:        '#fff',
                lineHeight:   1.35,
                marginBottom: 32,
              }}>
                {interaction.mensaje}
              </p>

              {/* Continue button */}
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: `0 0 40px ${cfg.glow}` }}
                whileTap={{ scale: 0.96 }}
                onClick={onContinue}
                style={{
                  background:    `linear-gradient(135deg, ${cfg.border}, ${cfg.border}bb)`,
                  border:        'none',
                  borderRadius:  999,
                  padding:       '14px 36px',
                  fontFamily:    'var(--font-display)',
                  fontWeight:    700,
                  fontSize:      15,
                  color:         '#fff',
                  cursor:        'pointer',
                  boxShadow:     `0 0 24px ${cfg.glow}`,
                  letterSpacing: '0.02em',
                }}
              >
                Continuar ▶
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
