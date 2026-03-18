'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import LevelBar from '@/components/school/LevelBar'
import ZoneCard from '@/components/school/ZoneCard'
import VideoPlayer from '@/components/video/VideoPlayer'
import SplineScene from '@/components/spline/SplineScene'
import type { Zone, Video } from '@/types'

const SCENE_CLASE = 'https://prod.spline.design/646pGt79P6qgQp6p/scene.splinecode'

const ZONAS: Zone[] = [
  { id: 'piano',      nombre: 'Sala de Piano',        nivel_requerido: 1, spline_object_id: 'piano_room',     descripcion: 'Teoría y práctica de piano' },
  { id: 'percusion',  nombre: 'Sala de Percusión',     nivel_requerido: 1, spline_object_id: 'percusion_room', descripcion: 'Ritmo y técnica de batería' },
  { id: 'jazz',       nombre: 'Sala de Jazz',           nivel_requerido: 3, spline_object_id: 'jazz_room',      descripcion: 'Improvisación y armonía jazz' },
  { id: 'produccion', nombre: 'Estudio de Producción',  nivel_requerido: 5, spline_object_id: 'studio_room',    descripcion: 'Producción y mezcla musical' },
]

export default function ClasePage() {
  const { user, token, isAuthenticated, loading, logout } = useAuth()
  const router = useRouter()

  const [salasOpen, setSalasOpen]           = useState(false)
  const [zonaActiva, setZonaActiva]         = useState<Zone | null>(null)
  const [videos, setVideos]                 = useState<Video[]>([])
  const [loadingVideos, setLoadingVideos]   = useState(false)
  const [puntosActuales, setPuntosActuales] = useState(0)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/login')
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    if (user) setPuntosActuales(user.puntos)
  }, [user])

  const abrirZona = async (zona: Zone) => {
    setZonaActiva(zona)
    setSalasOpen(false)
    setLoadingVideos(true)
    try {
      const res = await fetch(`/api/videos?zona=${zona.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setVideos(data.videos ?? [])
    } catch {
      setVideos([])
    } finally {
      setLoadingVideos(false)
    }
  }

  const handleVideoCompleto = (puntos: number) => setPuntosActuales(p => p + puntos)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a1a' }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--om-pink)' }}
        >
          Cargando...
        </motion.div>
      </div>
    )
  }

  if (!user) return null

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0a0a1a' }}>

        {/* ── Spline de fondo ── */}
        <SplineScene scene={SCENE_CLASE} />

        {/* ── Header flotante ── */}
        <div
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4"
          style={{ background: 'linear-gradient(to bottom, rgba(10,10,26,0.85) 0%, transparent 100%)' }}
        >
          {/* Izquierda */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ x: -3 }}
              onClick={() => router.push('/escuela')}
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.6)', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              ← Mapa
            </motion.button>

            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>

            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--om-pink)' }}>
              Oveja Music
            </span>
          </div>

          {/* Derecha */}
          <div className="flex items-center gap-4">
            <div className="w-44 hidden sm:block">
              <LevelBar puntos={puntosActuales} />
            </div>
            <button
              onClick={logout}
              className="text-xs transition-colors"
              style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Salir
            </button>
          </div>
        </div>

        {/* ── Botón "Salas" flotante ── */}
        <AnimatePresence>
          {!salasOpen && !zonaActiva && (
            <motion.button
              key="salas-btn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.25 }}
              whileHover={{ scale: 1.06, boxShadow: '0 0 36px rgba(61,184,250,0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSalasOpen(true)}
              className="absolute bottom-10 right-8 z-20 cursor-pointer"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 14,
                padding: '12px 28px',
                borderRadius: 999,
                border: 'none',
                background: 'linear-gradient(135deg, var(--om-blue) 0%, var(--om-purple) 100%)',
                color: '#fff',
                boxShadow: '0 0 24px rgba(61,184,250,0.35)',
              }}
            >
              🎵 Salas
            </motion.button>
          )}
        </AnimatePresence>

        {/* ── Panel de salas (slide-up) ── */}
        <AnimatePresence>
          {salasOpen && (
            <>
              <motion.div
                key="salas-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSalasOpen(false)}
                className="absolute inset-0 z-20"
                style={{ background: 'rgba(10,10,26,0.65)', backdropFilter: 'blur(8px)' }}
              />

              <motion.div
                key="salas-panel"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl"
                style={{ background: 'rgba(15,15,30,0.97)', backdropFilter: 'blur(20px)', padding: '28px 24px 36px' }}
              >
                {/* Handle */}
                <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.2)' }} />

                <div className="flex items-center justify-between mb-5">
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--om-pink)' }}>
                    Elige tu sala
                  </h2>
                  <button
                    onClick={() => setSalasOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: 'none', fontSize: 14 }}
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ZONAS.map(zona => (
                    <ZoneCard
                      key={zona.id}
                      zone={zona}
                      nivelUsuario={user.nivel}
                      onClick={abrirZona}
                    />
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Overlay de video ── */}
        <AnimatePresence>
          {zonaActiva && (
            <>
              <motion.div
                key="video-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 z-40"
                style={{ background: 'rgba(10,10,26,0.85)', backdropFilter: 'blur(16px)' }}
              />

              <motion.div
                key="video-panel"
                initial={{ opacity: 0, scale: 0.95, y: 32 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 32 }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                className="absolute z-50 overflow-y-auto rounded-3xl"
                style={{
                  inset: '80px 16px 16px 16px',
                  background: 'rgba(15,15,30,0.98)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(236,72,138,0.2)',
                  boxShadow: '0 0 60px rgba(236,72,138,0.15)',
                }}
              >
                {/* Header del overlay */}
                <div
                  className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 rounded-t-3xl"
                  style={{
                    background: 'rgba(15,15,30,0.95)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                      style={{ background: 'linear-gradient(135deg, var(--om-pink), var(--om-purple))' }}
                    >
                      🎵
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>
                      {zonaActiva.nombre}
                    </h2>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setZonaActiva(null)}
                    className="w-9 h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: 'none', fontSize: 14 }}
                  >
                    ✕
                  </motion.button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                  {loadingVideos && (
                    <motion.p
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-center py-12"
                      style={{ fontFamily: 'var(--font-body)', color: 'var(--om-blue)' }}
                    >
                      Cargando videos...
                    </motion.p>
                  )}

                  {!loadingVideos && videos.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-3">🎵</div>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>
                        No hay videos disponibles para tu nivel en esta zona.
                      </p>
                    </div>
                  )}

                  {videos.map((video, i) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <VideoPlayer video={video} token={token!} onComplete={handleVideoCompleto} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

    </main>
  )
}
