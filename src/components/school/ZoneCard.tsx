'use client'

import { motion } from 'framer-motion'
import { puedeAccederZona } from '@/lib/gamification'
import type { Zone } from '@/types'

// Color por zona — paleta Oveja Music
const ZONE_COLORS: Record<string, { bg: string; glow: string; icon: string }> = {
  piano:      { bg: 'linear-gradient(135deg, #ec488a, #ff7eb3)', glow: 'rgba(236,72,138,0.4)',  icon: '🎹' },
  percusion:  { bg: 'linear-gradient(135deg, #3db8fa, #6dd5ff)', glow: 'rgba(61,184,250,0.4)',  icon: '🥁' },
  jazz:       { bg: 'linear-gradient(135deg, #9b54f9, #c084ff)', glow: 'rgba(155,84,249,0.4)',  icon: '🎷' },
  produccion: { bg: 'linear-gradient(135deg, #ffa737, #ffcc80)', glow: 'rgba(255,167,55,0.4)',  icon: '🎛️' },
}

const DEFAULT_COLOR = { bg: 'linear-gradient(135deg, #5d5d5d, #888)', glow: 'rgba(93,93,93,0.3)', icon: '🎵' }

interface ZoneCardProps {
  zone: Zone
  nivelUsuario: number
  onClick: (zone: Zone) => void
}

export default function ZoneCard({ zone, nivelUsuario, onClick }: ZoneCardProps) {
  const accessible = puedeAccederZona(nivelUsuario, zone.nivel_requerido)
  const color = ZONE_COLORS[zone.id] ?? DEFAULT_COLOR

  return (
    <motion.button
      onClick={() => accessible && onClick(zone)}
      disabled={!accessible}
      aria-disabled={!accessible}
      data-testid={`zone-card-${zone.id}`}
      whileHover={accessible ? { scale: 1.04, boxShadow: `0 8px 32px ${color.glow}` } : {}}
      whileTap={accessible ? { scale: 0.97 } : {}}
      className="relative overflow-hidden rounded-2xl p-4 text-left w-full transition-opacity"
      style={{
        background: accessible ? color.bg : '#e8eaf0',
        opacity: accessible ? 1 : 0.5,
        cursor: accessible ? 'pointer' : 'not-allowed',
        border: 'none',
      }}
    >
      {/* Icono */}
      <div className="text-3xl mb-2">{color.icon}</div>

      {/* Nombre */}
      <h3
        className="font-bold text-sm leading-tight"
        style={{ fontFamily: 'var(--font-display)', color: accessible ? '#fff' : 'var(--om-text)' }}
      >
        {zone.nombre}
      </h3>

      {/* Descripción */}
      {zone.descripcion && (
        <p className="text-xs mt-1 leading-snug" style={{ color: accessible ? 'rgba(255,255,255,0.8)' : '#aaa' }}>
          {zone.descripcion}
        </p>
      )}

      {/* Badge */}
      <div className="mt-3">
        {accessible ? (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontFamily: 'var(--font-body)' }}
          >
            ✓ Disponible
          </span>
        ) : (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#e8eaf0', color: 'var(--om-text)', fontFamily: 'var(--font-body)' }}
          >
            🔒 Nivel {zone.nivel_requerido}
          </span>
        )}
      </div>

      {/* Shimmer accesible */}
      {accessible && (
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)' }}
        />
      )}
    </motion.button>
  )
}
