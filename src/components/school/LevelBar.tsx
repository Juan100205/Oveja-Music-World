'use client'

import { motion } from 'framer-motion'
import { calcularNivel, calcularProgreso, calcularPuntosParaSiguienteNivel } from '@/lib/gamification'
import { LEVEL_CONFIG } from '@/types'

interface LevelBarProps {
  puntos: number
}

const NIVEL_COLORS = ['#3db8fa', '#9b54f9', '#ec488a', '#ffa737', '#ffb251']

export default function LevelBar({ puntos }: LevelBarProps) {
  const nivel       = calcularNivel(puntos)
  const progreso    = calcularProgreso(puntos)
  const faltantes   = calcularPuntosParaSiguienteNivel(puntos)
  const nombreNivel = LEVEL_CONFIG.find(c => c.nivel === nivel)?.nombre ?? ''
  const color       = NIVEL_COLORS[(nivel - 1) % NIVEL_COLORS.length]

  return (
    <div className="flex flex-col gap-1.5 w-full" data-testid="level-bar">
      <div className="flex justify-between items-center">
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: color }}>
          Nivel {nivel} — {nombreNivel}
        </span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
          {puntos} pts
        </span>
      </div>

      {/* Track */}
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
        <motion.div
          className="h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progreso}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ background: color }}
          role="progressbar"
          aria-valuenow={progreso}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {faltantes > 0 && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          {faltantes} puntos para nivel {nivel + 1}
        </p>
      )}
    </div>
  )
}
