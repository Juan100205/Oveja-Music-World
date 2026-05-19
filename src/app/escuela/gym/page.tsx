'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SplineScene from '@/components/spline/SplineScene'
import TapeteCard from '@/components/ui/TapeteCard'
import { useAuth } from '@/hooks/useAuth'
import { useInstrumentos } from '@/hooks/useInstrumentos'
import type { GymInstrumento } from '@/data/gym'
import type { Modulo, Seccion } from '@/data/cursos'

const SCENE_GYM = 'https://prod.spline.design/gYLTlZu92yz616yC/scene.splinecode'

const TIPO_ICON: Record<string, string> = {
  video:       '▶️',
  drive:       '📂',
  juego:       '🎮',
  pdf:         '📄',
  imagen:      '🖼️',
  herramienta: '🛠️',
  otro:        '🔗',
}

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

export default function GymPage() {
  const router = useRouter()
  const { token } = useAuth()
  const { gym: allGym } = useInstrumentos(token)

  const [menuOpen,          setMenuOpen]          = useState(false)
  const [instrActivo,       setInstrActivo]       = useState<GymInstrumento | null>(null)
  const [moduloActivo,      setModuloActivo]       = useState<Modulo | null>(null)
  const [seccionActiva,     setSeccionActiva]      = useState<Seccion | null>(null)
  const [videoActivo,       setVideoActivo]        = useState<{ url: string; label?: string } | null>(null)
  const [tapeteHintOpen, setTapeteHintOpen] = useState(true)
  const dismissTapeteHint = useCallback(() => setTapeteHintOpen(false), [])

  const cerrarTodo = () => {
    setMenuOpen(false)
    setInstrActivo(null)
    setModuloActivo(null)
    setSeccionActiva(null)
  }

  return (
    <main style={{ width: '100vw', height: '100dvh', background: '#0a0a1a', overflow: 'hidden', position: 'relative' }}>

      <SplineScene scene={SCENE_GYM} />

      <TapeteCard show={tapeteHintOpen} onDismiss={dismissTapeteHint} sala="gym" />

      {/* ── Botón fijo ← Mapa ── */}
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

      {/* ── Botón Entrenar ── */}
      <AnimatePresence>
        {!menuOpen && (
          <motion.button
            key="entrenar-btn"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            whileHover={{ scale: 1.06, boxShadow: '0 0 48px rgba(61,184,250,0.55)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMenuOpen(true)}
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
            🏋️ Entrenar →
          </motion.button>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          PANELES
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="gym-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={cerrarTodo}
              className="absolute inset-0 z-20"
              style={{ background: 'rgba(10,10,26,0.72)', backdropFilter: 'blur(10px)' }}
            />

            <AnimatePresence mode="wait">

              {/* ── PASO 1: Instrumentos ── */}
              {!instrActivo && (
                <motion.div
                  key="panel-instrumentos"
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl"
                  style={{
                    background: 'rgba(12,12,28,0.98)',
                    backdropFilter: 'blur(24px)',
                    padding: '20px 20px 32px',
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />

                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#fff' }}>
                        ¿Qué vas a practicar?
                      </h2>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                        Elige tu instrumento
                      </p>
                    </div>
                    <button
                      onClick={cerrarTodo}
                      className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', fontSize: 14 }}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {allGym.map((instr, i) => (
                      <motion.button
                        key={instr.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.055 }}
                        whileHover={{ scale: 1.04, boxShadow: `0 8px 32px ${instr.glow}` }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setInstrActivo(instr)}
                        className="relative overflow-hidden rounded-2xl p-4 text-left cursor-pointer"
                        style={{ background: instr.color, border: 'none', minHeight: 110 }}
                      >
                        <div
                          className="absolute inset-0 pointer-events-none rounded-2xl"
                          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%)' }}
                        />
                        <div className="text-3xl mb-2 relative">{instr.emoji}</div>
                        <h3 className="relative" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1.2 }}>
                          {instr.nombre}
                        </h3>
                        <p className="relative mt-1" style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.3 }}>
                          {instr.descripcion}
                        </p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── PASO 2: Módulos del instrumento ── */}
              {instrActivo && !moduloActivo && (
                <motion.div
                  key="panel-modulos"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl overflow-y-auto"
                  style={{
                    background: 'rgba(12,12,28,0.98)',
                    backdropFilter: 'blur(24px)',
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    maxHeight: '78dvh',
                    padding: '20px 20px 32px',
                  }}
                >
                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />

                  <div className="flex items-center gap-3 mb-6">
                    <motion.button
                      whileHover={{ x: -3 }}
                      onClick={() => setInstrActivo(null)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}
                    >
                      ← Instrumentos
                    </motion.button>
                    <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff', flex: 1 }}>
                      {instrActivo.emoji} {instrActivo.nombre}
                    </h2>
                    <button
                      onClick={cerrarTodo}
                      className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', fontSize: 14 }}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {instrActivo.modulos.map((modulo, i) => (
                      <motion.button
                        key={modulo.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.045 }}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setModuloActivo(modulo)}
                        className="flex items-center justify-between rounded-2xl px-5 py-4 text-left w-full cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="flex-shrink-0 flex items-center justify-center rounded-full font-bold"
                            style={{ width: 34, height: 34, background: instrActivo.color, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13 }}
                          >
                            {i + 1}
                          </div>
                          <div>
                            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1.2 }}>
                              {modulo.nombre}
                            </p>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                              {modulo.secciones.length} {modulo.secciones.length === 1 ? 'sección' : 'secciones'}
                            </p>
                          </div>
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18 }}>›</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── PASO 3: Secciones del módulo ── */}
              {instrActivo && moduloActivo && !seccionActiva && (
                <motion.div
                  key="panel-secciones"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl overflow-y-auto"
                  style={{
                    background: 'rgba(12,12,28,0.98)',
                    backdropFilter: 'blur(24px)',
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    maxHeight: '78dvh',
                    padding: '20px 20px 32px',
                  }}
                >
                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />

                  <div className="flex items-center gap-3 mb-5">
                    <motion.button
                      whileHover={{ x: -3 }}
                      onClick={() => setModuloActivo(null)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}
                    >
                      ← {instrActivo.nombre}
                    </motion.button>
                    <button
                      onClick={cerrarTodo}
                      className="ml-auto w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: 'none', fontSize: 13 }}
                    >
                      ✕
                    </button>
                  </div>

                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 16 }}>
                    {moduloActivo.nombre}
                  </h2>

                  <div className="flex flex-col gap-3">
                    {moduloActivo.secciones.map((seccion, i) => (
                      <motion.button
                        key={seccion.nombre}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSeccionActiva(seccion)}
                        className="flex items-center justify-between rounded-2xl px-5 py-4 text-left w-full cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="flex-shrink-0 flex items-center justify-center rounded-full font-bold"
                            style={{ width: 34, height: 34, background: instrActivo.color, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13 }}
                          >
                            {i + 1}
                          </div>
                          <div>
                            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1.2 }}>
                              {seccion.nombre}
                            </p>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                              {seccion.recursos.length} {seccion.recursos.length === 1 ? 'recurso' : 'recursos'}
                            </p>
                          </div>
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18 }}>›</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── PASO 4: Recursos ── */}
              {instrActivo && moduloActivo && seccionActiva && (
                <motion.div
                  key="panel-recursos"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl overflow-y-auto"
                  style={{
                    background: 'rgba(12,12,28,0.98)',
                    backdropFilter: 'blur(24px)',
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    maxHeight: '78dvh',
                    padding: '20px 20px 32px',
                  }}
                >
                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />

                  <div className="flex items-center gap-3 mb-5">
                    <motion.button
                      whileHover={{ x: -3 }}
                      onClick={() => setSeccionActiva(null)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}
                    >
                      ← {moduloActivo.nombre}
                    </motion.button>
                    <button
                      onClick={cerrarTodo}
                      className="ml-auto w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: 'none', fontSize: 13 }}
                    >
                      ✕
                    </button>
                  </div>

                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 16 }}>
                    {seccionActiva.nombre}
                  </h2>

                  <div className="flex flex-col gap-2">
                    {seccionActiva.recursos.map((recurso, i) => {
                      const ytId = recurso.tipo === 'video' ? getYouTubeId(recurso.url) : null

                      if (ytId) {
                        return (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setVideoActivo({ url: recurso.url, label: recurso.label })}
                            className="relative overflow-hidden rounded-2xl w-full cursor-pointer text-left"
                            style={{ border: 'none', padding: 0, background: 'none' }}
                          >
                            <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                              <img
                                src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                                alt={recurso.label ?? 'Video'}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0" style={{ background: 'rgba(10,10,26,0.35)' }} />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div
                                  className="flex items-center justify-center rounded-full"
                                  style={{ width: 52, height: 52, background: 'rgba(61,184,250,0.92)', boxShadow: '0 0 28px rgba(61,184,250,0.6)', fontSize: 20 }}
                                >
                                  ▶
                                </div>
                              </div>
                            </div>
                            {recurso.label && (
                              <p className="px-1 pt-2 pb-1" style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                                {recurso.label}
                              </p>
                            )}
                          </motion.button>
                        )
                      }

                      return (
                        <motion.a
                          key={i}
                          href={recurso.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          whileHover={{ x: 4 }}
                          className="flex items-center gap-4 rounded-2xl px-5 py-4 no-underline"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <span style={{ fontSize: 20, flexShrink: 0 }}>{TIPO_ICON[recurso.tipo] ?? '🔗'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="truncate" style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#fff', lineHeight: 1.3 }}>
                              {recurso.label ?? recurso.url}
                            </p>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, textTransform: 'capitalize' }}>
                              {recurso.tipo}
                            </p>
                          </div>
                          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, flexShrink: 0 }}>↗</span>
                        </motion.a>
                      )
                    })}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          OVERLAY PLAYER YOUTUBE
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {videoActivo && (
          <>
            <motion.div
              key="video-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setVideoActivo(null)}
              className="absolute inset-0 z-50"
              style={{ background: 'rgba(5,5,18,0.92)', backdropFilter: 'blur(16px)' }}
            />
            <motion.div
              key="video-player"
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="absolute z-50 flex items-center justify-center"
              style={{ inset: 0, padding: '24px 16px', pointerEvents: 'none' }}
            >
              <div className="w-full flex flex-col gap-3" style={{ maxWidth: 720, pointerEvents: 'auto' }}>
                <div className="flex items-center justify-between">
                  {videoActivo.label && (
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff' }}>
                      {videoActivo.label}
                    </p>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setVideoActivo(null)}
                    className="ml-auto w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 14 }}
                  >
                    ✕
                  </motion.button>
                </div>
                <div
                  className="w-full rounded-3xl overflow-hidden"
                  style={{ aspectRatio: '16/9', boxShadow: '0 0 80px rgba(61,184,250,0.2)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(videoActivo.url)}?autoplay=1&rel=0`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                    style={{ border: 'none', display: 'block' }}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </main>
  )
}
