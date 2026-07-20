'use client'

import { motion } from 'framer-motion'

const TIPO_ICON: Record<string, string> = {
  drive: '📂', juego: '🎮', pdf: '📄',
  imagen: '🖼️', herramienta: '🛠️', otro: '🔗',
}

const TIPO_LABEL: Record<string, string> = {
  drive: 'Google Drive', juego: 'Juego interactivo',
  pdf: 'Documento PDF', imagen: 'Imagen',
  herramienta: 'Herramienta', otro: 'Enlace',
}

interface WaitingScreenProps {
  label?: string
  tipo: string
  onComplete: () => void
  onClose: () => void
}

export default function WaitingScreen({ label, tipo, onComplete, onClose }: WaitingScreenProps) {
  return (
    <>
      <motion.div
        key="waiting-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 z-50"
        style={{ background: 'rgba(5,5,18,0.95)', backdropFilter: 'blur(20px)' }}
      />

      <motion.div
        key="waiting-screen"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="absolute inset-0 z-50 flex items-center justify-center"
        style={{ padding: 24 }}
      >
        <div
          className="flex flex-col items-center gap-6 text-center"
          style={{
            maxWidth: 400,
            width: '100%',
            background: 'rgba(12,12,28,0.98)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 28,
            padding: '40px 32px',
          }}
        >
          {/* Ícono animado */}
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 72, height: 72,
              borderRadius: 20,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 34,
            }}
          >
            {TIPO_ICON[tipo] ?? '🔗'}
          </motion.div>

          {/* Título */}
          <div className="flex flex-col gap-2">
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 18,
                color: '#fff',
                lineHeight: 1.3,
              }}
            >
              {label ?? TIPO_LABEL[tipo] ?? 'Actividad'}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'rgba(255,255,255,0.45)',
                lineHeight: 1.5,
              }}
            >
              Se abrió en una pestaña nueva. <br />
              Realiza la actividad allí y cuando termines, regresa aquí.
            </p>
          </div>

          {/* Indicador de espera */}
          <div
            className="flex items-center gap-2"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 999,
              padding: '8px 18px',
            }}
          >
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 8, height: 8,
                borderRadius: '50%',
                background: '#3db8fa',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Te esperamos...
            </span>
          </div>

          {/* Botones */}
          <div className="flex flex-col gap-3" style={{ width: '100%' }}>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(52,211,153,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={onComplete}
              className="w-full cursor-pointer"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 15,
                color: '#fff',
                background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
                border: 'none',
                borderRadius: 16,
                padding: '14px 24px',
                letterSpacing: '0.02em',
              }}
            >
              Ya completé
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="w-full cursor-pointer"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 13,
                color: 'rgba(255,255,255,0.45)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: '12px 24px',
              }}
            >
              Cerrar
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
