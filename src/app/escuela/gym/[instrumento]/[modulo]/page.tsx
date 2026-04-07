'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import SplineScene from '@/components/spline/SplineScene'
import { GYM_INSTRUMENTOS } from '@/data/gym'
import type { Seccion } from '@/data/cursos'

const SCENE_GYM = 'https://prod.spline.design/gYLTlZu92yz616yC/scene.splinecode'

const TIPO_ICON: Record<string, string> = {
  video: '▶️', drive: '📂', juego: '🎮',
  pdf: '📄', imagen: '🖼️', herramienta: '🛠️', otro: '🔗',
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

export default function GymSalaPage() {
  const { instrumento, modulo: moduloId } = useParams<{ instrumento: string; modulo: string }>()
  const router = useRouter()

  const [isTrainning,  setIsTrainning]  = useState(false)
  const [isOutingGym,  setIsOutingGym]  = useState(false)
  const [seccionesOpen, setSeccionesOpen] = useState(false)
  const [seccionActiva, setSeccionActiva] = useState<Seccion | null>(null)
  const [salidaOpen,    setSalidaOpen]    = useState(false)
  const [videoActivo,   setVideoActivo]   = useState<{ url: string; label?: string } | null>(null)

  const handleVariableChange = useCallback((name: string, value: unknown) => {
    const isTrue = value === true || String(value).toLowerCase() === 'true'
    if (name === 'isTrainning') flushSync(() => setIsTrainning(isTrue))
    if (name === 'isOutingGym') flushSync(() => setIsOutingGym(isTrue))
  }, [])

  const gymInstr = GYM_INSTRUMENTOS.find(g => g.id === instrumento)
  const modulo   = gymInstr?.modulos.find(m => m.id === moduloId)

  const cerrarSecciones = () => { setSeccionesOpen(false); setSeccionActiva(null) }

  return (
    <main style={{ width: '100vw', height: '100vh', background: '#0a0a1a', overflow: 'hidden', position: 'relative' }}>

      <SplineScene scene={SCENE_GYM} onVariableChange={handleVariableChange} />

      {/* ── Botón fijo ← Mapa ── */}
      <motion.button
        onClick={() => router.push('/escuela')}
        whileHover={{ x: -3 }} whileTap={{ scale: 0.95 }}
        className="absolute top-5 left-5 z-20 cursor-pointer"
        style={{ background: 'rgba(10,10,26,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '8px 16px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}
      >
        ← Mapa
      </motion.button>

      {/* ── Badge nombre módulo ── */}
      {modulo && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20"
          style={{ background: 'rgba(10,10,26,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '8px 20px', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap' }}>
          {gymInstr?.emoji} {modulo.nombre}
        </div>
      )}

      {/* ── isTrainning → Entrenar ── */}
      <AnimatePresence>
        {isTrainning && !seccionesOpen && !salidaOpen && (
          <motion.button
            key="trainning-btn"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            whileHover={{ scale: 1.06, boxShadow: '0 0 48px rgba(61,184,250,0.55)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSeccionesOpen(true)}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 cursor-pointer"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, padding: '14px 36px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, var(--om-blue) 0%, var(--om-purple) 100%)', color: '#fff', boxShadow: '0 0 32px rgba(61,184,250,0.4)', letterSpacing: '0.02em' }}
          >
            🏋️ Entrenar →
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── isOutingGym → abre panel salida ── */}
      <AnimatePresence>
        {isOutingGym && !seccionesOpen && !salidaOpen && (
          <motion.button
            key="outing-btn"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            whileHover={{ scale: 1.06, boxShadow: '0 0 48px rgba(236,72,138,0.55)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSalidaOpen(true)}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 cursor-pointer"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, padding: '14px 36px', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, var(--om-pink) 0%, var(--om-purple) 100%)', color: '#fff', boxShadow: '0 0 32px rgba(236,72,138,0.4)', letterSpacing: '0.02em' }}
          >
            ← Salir del Gym
          </motion.button>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          PANEL DE SECCIONES
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {seccionesOpen && (
          <>
            <motion.div key="sec-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} onClick={cerrarSecciones} className="absolute inset-0 z-20"
              style={{ background: 'rgba(10,10,26,0.72)', backdropFilter: 'blur(10px)' }} />

            <AnimatePresence mode="wait">

              {/* Lista de secciones */}
              {!seccionActiva && (
                <motion.div key="panel-secciones"
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl overflow-y-auto"
                  style={{ background: 'rgba(12,12,28,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)', maxHeight: '78vh', padding: '20px 24px 44px' }}>

                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>{modulo?.nombre}</h2>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>Elige una sección</p>
                    </div>
                    <button onClick={cerrarSecciones} className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', fontSize: 14 }}>✕</button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {(modulo?.secciones ?? []).map((sec, i) => (
                      <motion.button key={sec.nombre}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setSeccionActiva(sec)}
                        className="flex items-center justify-between rounded-2xl px-5 py-4 text-left w-full cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 flex items-center justify-center rounded-full font-bold"
                            style={{ width: 34, height: 34, background: gymInstr?.color ?? 'rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13 }}>
                            {i + 1}
                          </div>
                          <div>
                            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1.2 }}>{sec.nombre}</p>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                              {sec.recursos.length} {sec.recursos.length === 1 ? 'recurso' : 'recursos'}
                            </p>
                          </div>
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18 }}>›</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Recursos */}
              {seccionActiva && (
                <motion.div key="panel-recursos"
                  initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl overflow-y-auto"
                  style={{ background: 'rgba(12,12,28,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)', maxHeight: '78vh', padding: '20px 24px 44px' }}>

                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />
                  <div className="flex items-center gap-3 mb-5">
                    <motion.button whileHover={{ x: -3 }} onClick={() => setSeccionActiva(null)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                      ← Secciones
                    </motion.button>
                    <button onClick={cerrarSecciones} className="ml-auto w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: 'none', fontSize: 13 }}>✕</button>
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 16 }}>
                    {seccionActiva.nombre}
                  </h2>

                  <div className="flex flex-col gap-2">
                    {seccionActiva.recursos.map((recurso, i) => {
                      const ytId = recurso.tipo === 'video' ? getYouTubeId(recurso.url) : null
                      if (ytId) return (
                        <motion.button key={i}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                          onClick={() => setVideoActivo({ url: recurso.url, label: recurso.label })}
                          className="relative overflow-hidden rounded-2xl w-full cursor-pointer text-left"
                          style={{ border: 'none', padding: 0, background: 'none' }}>
                          <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                            <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt={recurso.label ?? 'Video'} className="w-full h-full object-cover" />
                            <div className="absolute inset-0" style={{ background: 'rgba(10,10,26,0.35)' }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="flex items-center justify-center rounded-full"
                                style={{ width: 52, height: 52, background: 'rgba(61,184,250,0.92)', boxShadow: '0 0 28px rgba(61,184,250,0.6)', fontSize: 20 }}>▶</div>
                            </div>
                          </div>
                          {recurso.label && <p className="px-1 pt-2 pb-1" style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{recurso.label}</p>}
                        </motion.button>
                      )
                      return (
                        <motion.a key={i} href={recurso.url} target="_blank" rel="noopener noreferrer"
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          whileHover={{ x: 4 }}
                          className="flex items-center gap-4 rounded-2xl px-5 py-4 no-underline"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <span style={{ fontSize: 20, flexShrink: 0 }}>{TIPO_ICON[recurso.tipo] ?? '🔗'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="truncate" style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#fff' }}>{recurso.label ?? recurso.url}</p>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, textTransform: 'capitalize' }}>{recurso.tipo}</p>
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
          PANEL SALIDA — isOutingGym
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {salidaOpen && (
          <>
            <motion.div key="salida-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} onClick={() => setSalidaOpen(false)} className="absolute inset-0 z-40"
              style={{ background: 'rgba(10,10,26,0.75)', backdropFilter: 'blur(10px)' }} />

            <motion.div key="salida-panel"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-y-auto"
              style={{ background: 'rgba(12,12,28,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)', maxHeight: '80vh', padding: '20px 24px 44px' }}>

              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>
                    {gymInstr?.emoji} {gymInstr?.nombre}
                  </h2>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>¿A dónde quieres ir?</p>
                </div>
                <button onClick={() => setSalidaOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', fontSize: 14 }}>✕</button>
              </div>

              {/* Volver al mapa */}
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 32px rgba(61,184,250,0.35)' }} whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/escuela')}
                className="w-full rounded-2xl flex items-center gap-4 px-5 py-4 cursor-pointer mb-5"
                style={{ background: 'linear-gradient(135deg, var(--om-blue) 0%, var(--om-purple) 100%)', border: 'none' }}>
                <span style={{ fontSize: 24 }}>🗺️</span>
                <div className="text-left">
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff' }}>Volver al Mapa</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Salir al mapa principal</p>
                </div>
              </motion.button>

              {/* Divisor */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>O CAMBIA DE SALA</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Módulos del instrumento */}
              <div className="flex flex-col gap-2">
                {(gymInstr?.modulos ?? []).map((mod, i) => {
                  const esActual = mod.id === moduloId
                  return (
                    <motion.button key={mod.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      whileHover={!esActual ? { x: 4 } : {}}
                      onClick={() => { if (!esActual) router.push(`/escuela/gym/${instrumento}/${mod.id}`) }}
                      className="flex items-center justify-between rounded-2xl px-5 py-4 text-left w-full"
                      style={{
                        background: esActual ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                        border: esActual ? `1px solid ${gymInstr?.glow ?? 'rgba(255,255,255,0.2)'}` : '1px solid rgba(255,255,255,0.07)',
                        cursor: esActual ? 'default' : 'pointer',
                      }}>
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center rounded-full font-bold"
                          style={{ width: 32, height: 32, background: esActual ? (gymInstr?.color ?? '') : 'rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 12 }}>
                          {i + 1}
                        </div>
                        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: esActual ? '#fff' : 'rgba(255,255,255,0.6)', lineHeight: 1.2 }}>
                          {mod.nombre}
                        </p>
                      </div>
                      {esActual
                        ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>AQUÍ</span>
                        : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>›</span>}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          OVERLAY PLAYER YOUTUBE
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {videoActivo && (
          <>
            <motion.div key="video-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }} onClick={() => setVideoActivo(null)} className="absolute inset-0 z-50"
              style={{ background: 'rgba(5,5,18,0.92)', backdropFilter: 'blur(16px)' }} />
            <motion.div key="video-player"
              initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }} transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="absolute z-50 flex items-center justify-center"
              style={{ inset: 0, padding: '24px 16px', pointerEvents: 'none' }}>
              <div className="w-full flex flex-col gap-3" style={{ maxWidth: 720, pointerEvents: 'auto' }}>
                <div className="flex items-center justify-between">
                  {videoActivo.label && <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff' }}>{videoActivo.label}</p>}
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setVideoActivo(null)} className="ml-auto w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 14 }}>✕</motion.button>
                </div>
                <div className="w-full rounded-3xl overflow-hidden"
                  style={{ aspectRatio: '16/9', boxShadow: '0 0 80px rgba(61,184,250,0.2)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(videoActivo.url)}?autoplay=1&rel=0`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen className="w-full h-full" style={{ border: 'none', display: 'block' }} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </main>
  )
}
