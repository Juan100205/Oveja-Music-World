'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { calcularProgreso, calcularPuntosParaSiguienteNivel } from '@/lib/gamification'
import { useNivelesConfig } from '@/hooks/useNivelesConfig'
import type { Modulo } from '@/data/cursos'
import { useAuth } from '@/hooks/useAuth'

// ── Badge config per level ────────────────────────────────────────
const BADGE: {
  emoji: string
  color: string
  border: string
  glow: string
  label: string
}[] = [
  { emoji: '🌱', color: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.45)',  glow: 'rgba(52,211,153,0.35)',  label: 'Principiante' },
  { emoji: '⭐', color: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.45)',  glow: 'rgba(251,191,36,0.35)',  label: 'Aprendiz'     },
  { emoji: '🎯', color: 'rgba(61,184,250,0.15)',  border: 'rgba(61,184,250,0.45)',  glow: 'rgba(61,184,250,0.35)',  label: 'Intermedio'   },
  { emoji: '🔥', color: 'rgba(255,167,55,0.15)',  border: 'rgba(255,167,55,0.45)',  glow: 'rgba(255,167,55,0.35)',  label: 'Avanzado'     },
  { emoji: '👑', color: 'rgba(155,84,249,0.15)',  border: 'rgba(155,84,249,0.45)',  glow: 'rgba(155,84,249,0.35)',  label: 'Maestro'      },
]

interface RankingEntry {
  posicion: number
  id: string
  nombre: string
  puntos: number
  nivel: number
  es_yo: boolean
}

const NIVEL_LABELS = ['', 'Principiante', 'Aprendiz', 'Intermedio', 'Avanzado', 'Maestro']
const NIVEL_COLORS = ['', 'rgba(52,211,153,0.9)', 'rgba(251,191,36,0.9)', 'rgba(61,184,250,0.9)', 'rgba(255,167,55,0.9)', 'rgba(155,84,249,0.9)']

interface Props {
  puntos: number
  nivel: number
  modulo: Modulo | null
  isCompleted: (url: string) => boolean
  instrumento?: string | null
}

export function LevelProgressPanel({ puntos, nivel, modulo, isCompleted, instrumento }: Props) {
  const { token } = useAuth()
  const config            = useNivelesConfig(token ?? null, instrumento)
  const [open, setOpen]           = useState(false)
  const [tab, setTab]             = useState<'progreso' | 'ranking'>('progreso')
  const [ranking, setRanking]     = useState<RankingEntry[]>([])
  const [rankLoading, setRankLoading] = useState(false)
  const [rankError, setRankError] = useState<string | null>(null)

  const fetchRanking = useCallback(async () => {
    if (!token) return
    setRankLoading(true)
    setRankError(null)
    try {
      const res = await fetch('/api/ranking', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      setRanking(data.ranking ?? [])
    } catch (e) {
      setRankError(e instanceof Error ? e.message : 'Error al cargar ranking')
    } finally {
      setRankLoading(false)
    }
  }, [token])

  // Cargar ranking cuando se cambia al tab
  useEffect(() => {
    if (open && tab === 'ranking' && ranking.length === 0 && !rankLoading) {
      fetchRanking()
    }
  }, [open, tab, ranking.length, rankLoading, fetchRanking])

  const idx           = Math.max(0, Math.min(nivel - 1, BADGE.length - 1))
  const badge         = BADGE[idx]
  const currentConfig = config.find(c => c.nivel === nivel)
  const nextConfig    = config.find(c => c.nivel === nivel + 1)
  const progreso      = calcularProgreso(puntos, config)
  const ptsFaltantes  = calcularPuntosParaSiguienteNivel(puntos, config)

  // ── Secciones del módulo (sin gym) ───────────────────────────
  const secciones     = modulo?.secciones.filter(s => s.zona !== 'gym') ?? []
  const totalModulo   = secciones.flatMap(s => s.recursos).length
  const doneModulo    = secciones.flatMap(s => s.recursos).filter(r => isCompleted(r.url)).length
  const moduloListo   = totalModulo > 0 && doneModulo === totalModulo

  return (
    <>
      {/* ── Floating pill button ─────────────────────────── */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.93 }}
        className="absolute top-5 right-5 z-20 flex items-center gap-2 cursor-pointer"
        style={{
          background: 'rgba(10,10,26,0.72)',
          backdropFilter: 'blur(14px)',
          border: `1px solid ${badge.border}`,
          borderRadius: 999,
          padding: '7px 14px 7px 10px',
          boxShadow: `0 0 18px ${badge.glow}`,
        }}
      >
        <span style={{ fontSize: 20, lineHeight: 1 }}>{badge.emoji}</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
            color: '#fff', lineHeight: 1.1, letterSpacing: '0.02em',
          }}>
            {currentConfig?.nombre ?? `Nivel ${nivel}`}
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
            {puntos} pts
          </span>
        </div>
        {/* Mini progress ring indicator */}
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: moduloListo ? 'rgba(52,211,153,0.9)' : badge.border,
          boxShadow: moduloListo ? '0 0 6px rgba(52,211,153,0.8)' : 'none',
          marginLeft: 2,
        }} />
      </motion.button>

      {/* ── Slide-up panel ───────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="progress-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="absolute inset-0 z-40"
              style={{ background: 'rgba(5,5,18,0.78)', backdropFilter: 'blur(10px)' }}
            />

            {/* Panel */}
            <motion.div
              key="progress-panel"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-y-auto"
              style={{
                background: 'rgba(12,12,28,0.98)',
                backdropFilter: 'blur(28px)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                maxHeight: '82vh',
                padding: '20px 20px 44px',
              }}
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full mx-auto mb-5"
                style={{ background: 'rgba(255,255,255,0.18)' }} />

              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <h2 style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: 18, color: '#fff',
                }}>
                  {tab === 'progreso' ? 'Mi Progreso' : '🏆 Ranking'}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-full cursor-pointer"
                  style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
                >
                  <X size={13} strokeWidth={1.8} />
                </motion.button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-5">
                {(['progreso', 'ranking'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      padding: '6px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                      background: tab === t ? 'rgba(236,72,138,0.18)' : 'rgba(255,255,255,0.06)',
                      color: tab === t ? '#ec488a' : 'rgba(255,255,255,0.4)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t === 'progreso' ? '📊 Progreso' : '🏆 Ranking'}
                  </button>
                ))}
              </div>

              {/* ══════════════════════════════════════════
                  TAB: PROGRESO
              ══════════════════════════════════════════ */}
              {tab === 'progreso' && (<>

              {/* ── Current level card ─────────────────────── */}
              <div className="rounded-2xl p-4 mb-5"
                style={{ background: badge.color, border: `1px solid ${badge.border}`, boxShadow: `0 0 24px ${badge.glow}` }}>
                <div className="flex items-center gap-4">
                  <motion.span
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ fontSize: 46, lineHeight: 1, flexShrink: 0 }}
                  >
                    {badge.emoji}
                  </motion.span>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: '#fff', lineHeight: 1.1 }}>
                      {currentConfig?.nombre ?? `Nivel ${nivel}`}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                      Nivel {nivel} de {config.length}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, color: '#fff', lineHeight: 1 }}>
                      {puntos}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                      puntos
                    </p>
                  </div>
                </div>

                {/* Progress bar to next level */}
                {nextConfig ? (
                  <div style={{ marginTop: 16 }}>
                    <div className="flex justify-between items-center mb-2">
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        Siguiente: <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{nextConfig.nombre}</span>
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                        {ptsFaltantes} pts para subir
                      </span>
                    </div>
                    <div style={{ height: 7, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progreso}%` }}
                        transition={{ duration: 1.1, ease: 'easeOut', delay: 0.2 }}
                        style={{ height: '100%', background: badge.border, borderRadius: 999 }}
                      />
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 6, textAlign: 'right' }}>
                      {progreso}% completado
                    </p>
                  </div>
                ) : (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: badge.border, textAlign: 'center' }}>
                      ¡Nivel máximo alcanzado!
                    </p>
                  </div>
                )}
              </div>

              {/* ── Módulo progress ───────────────────────── */}
              {modulo && secciones.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff' }}>
                      {modulo.nombre}
                    </h3>
                    <div className="flex items-center gap-2">
                      {moduloListo && (
                        <span style={{ fontSize: 14 }}>✅</span>
                      )}
                      <span style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                        color: moduloListo ? 'rgba(52,211,153,0.9)' : 'rgba(255,255,255,0.55)',
                      }}>
                        {doneModulo}/{totalModulo}
                      </span>
                    </div>
                  </div>

                  {/* Overall modulo bar */}
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden', marginBottom: 12 }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: totalModulo > 0 ? `${Math.round((doneModulo / totalModulo) * 100)}%` : '0%' }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                      style={{
                        height: '100%', borderRadius: 999,
                        background: moduloListo
                          ? 'rgba(52,211,153,0.8)'
                          : 'linear-gradient(90deg, var(--om-pink), var(--om-purple))',
                      }}
                    />
                  </div>

                  {/* Section breakdown */}
                  <div className="flex flex-col gap-2">
                    {secciones.map((seccion, i) => {
                      const total  = seccion.recursos.length
                      const done   = seccion.recursos.filter(r => isCompleted(r.url)).length
                      const listo  = total > 0 && done === total
                      const pct    = total > 0 ? Math.round((done / total) * 100) : 0

                      return (
                        <motion.div
                          key={seccion.nombre}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 + 0.1 }}
                          className="rounded-xl px-4 py-3"
                          style={{
                            background: listo ? 'rgba(52,211,153,0.07)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${listo ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.07)'}`,
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center rounded-full flex-shrink-0"
                                style={{
                                  width: 22, height: 22,
                                  background: listo ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.08)',
                                  fontSize: 11,
                                  fontFamily: 'var(--font-display)', fontWeight: 700,
                                  color: listo ? 'rgba(52,211,153,0.9)' : 'rgba(255,255,255,0.45)',
                                }}>
                                {listo ? '✓' : i + 1}
                              </div>
                              <span style={{
                                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13,
                                color: listo ? 'rgba(52,211,153,0.85)' : '#fff',
                              }}>
                                {seccion.nombre}
                              </span>
                            </div>
                            <span style={{
                              fontFamily: 'var(--font-body)', fontSize: 11,
                              color: listo ? 'rgba(52,211,153,0.7)' : 'rgba(255,255,255,0.35)',
                            }}>
                              {done}/{total}
                            </span>
                          </div>

                          {/* Section mini bar */}
                          <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.06 + 0.4 }}
                              style={{
                                height: '100%', borderRadius: 999,
                                background: listo ? 'rgba(52,211,153,0.7)' : 'rgba(236,72,138,0.6)',
                              }}
                            />
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Hint when incomplete */}
                  {!moduloListo && nextConfig && (
                    <p style={{
                      fontFamily: 'var(--font-body)', fontSize: 11,
                      color: 'rgba(255,255,255,0.3)', marginTop: 10,
                      textAlign: 'center', lineHeight: 1.5,
                    }}>
                      Completa todos los recursos de este nivel para acumular los puntos y desbloquear <span style={{ color: 'rgba(255,255,255,0.55)' }}>{nextConfig.nombre}</span>
                    </p>
                  )}
                </div>
              )}

              {/* ── Insignias ─────────────────────────────── */}
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 14 }}>
                  Insignias
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {config.map((lc, i) => {
                    const earned = nivel >= lc.nivel
                    const b      = BADGE[i]
                    return (
                      <motion.div
                        key={lc.nivel}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.07 + 0.2 }}
                        className="flex flex-col items-center gap-1"
                        style={{ opacity: earned ? 1 : 0.28 }}
                      >
                        <motion.div
                          animate={earned ? { scale: [1, 1.08, 1] } : {}}
                          transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                          className="flex items-center justify-center rounded-2xl"
                          style={{
                            width: '100%', aspectRatio: '1/1',
                            background: earned ? b.color : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${earned ? b.border : 'rgba(255,255,255,0.08)'}`,
                            boxShadow: earned ? `0 0 16px ${b.glow}` : 'none',
                            fontSize: 22,
                          }}
                        >
                          {earned ? b.emoji : '🔒'}
                        </motion.div>
                        <span style={{
                          fontFamily: 'var(--font-body)', fontSize: 9,
                          color: earned ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.22)',
                          textAlign: 'center', lineHeight: 1.3,
                        }}>
                          {lc.nombre}
                        </span>
                        {earned && (
                          <span style={{ fontSize: 8, color: b.border, fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                            ✓
                          </span>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              </>)}

              {/* ══════════════════════════════════════════
                  TAB: RANKING
              ══════════════════════════════════════════ */}
              {tab === 'ranking' && (
                <div>
                  {rankLoading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        border: '3px solid rgba(236,72,138,0.25)',
                        borderTopColor: '#ec488a',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                    </div>
                  )}

                  {rankError && (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,82,82,0.8)', marginBottom: 12 }}>
                        {rankError}
                      </p>
                      <button
                        onClick={fetchRanking}
                        style={{
                          padding: '7px 18px', borderRadius: 999, border: '1px solid rgba(236,72,138,0.3)',
                          background: 'rgba(236,72,138,0.1)', color: '#ec488a',
                          fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer',
                        }}
                      >
                        Reintentar
                      </button>
                    </div>
                  )}

                  {!rankLoading && !rankError && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {ranking.map((entry, i) => {
                        const nivelColor = NIVEL_COLORS[entry.nivel] ?? 'rgba(255,255,255,0.5)'
                        const medalEmoji = entry.posicion === 1 ? '🥇' : entry.posicion === 2 ? '🥈' : entry.posicion === 3 ? '🥉' : null
                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '10px 14px', borderRadius: 14,
                              background: entry.es_yo
                                ? 'rgba(236,72,138,0.12)'
                                : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${entry.es_yo ? 'rgba(236,72,138,0.35)' : 'rgba(255,255,255,0.07)'}`,
                              boxShadow: entry.es_yo ? '0 0 16px rgba(236,72,138,0.15)' : 'none',
                            }}
                          >
                            {/* Posición */}
                            <div style={{
                              width: 28, textAlign: 'center', flexShrink: 0,
                              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                            }}>
                              {medalEmoji ?? (
                                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                                  {entry.posicion}
                                </span>
                              )}
                            </div>

                            {/* Nombre + nivel */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                fontFamily: 'var(--font-display)', fontWeight: entry.es_yo ? 700 : 500,
                                fontSize: 13, color: entry.es_yo ? '#ec488a' : '#fff',
                                margin: 0, lineHeight: 1.2,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {entry.nombre}{entry.es_yo ? ' (tú)' : ''}
                              </p>
                              <span style={{
                                fontFamily: 'var(--font-body)', fontSize: 10,
                                color: nivelColor,
                              }}>
                                {NIVEL_LABELS[entry.nivel] ?? `Nivel ${entry.nivel}`}
                              </span>
                            </div>

                            {/* Puntos */}
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <p style={{
                                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
                                color: entry.es_yo ? '#ec488a' : '#fff', margin: 0,
                              }}>
                                {entry.puntos.toLocaleString()}
                              </p>
                              <p style={{
                                fontFamily: 'var(--font-body)', fontSize: 10,
                                color: 'rgba(255,255,255,0.3)', margin: 0,
                              }}>pts</p>
                            </div>
                          </motion.div>
                        )
                      })}

                      {ranking.length === 0 && (
                        <p style={{
                          textAlign: 'center', padding: '40px 0',
                          fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.3)',
                        }}>
                          No hay datos de ranking todavía
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
