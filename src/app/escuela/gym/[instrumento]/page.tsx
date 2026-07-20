'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useCallback, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { Application } from '@splinetool/runtime'

const Spline = dynamic(() => import('@splinetool/react-spline'), { ssr: false })
import VideoPlayerWithCards from '@/components/video/VideoPlayerWithCards'
import WaitingScreen from '@/components/ui/WaitingScreen'
import { LevelProgressPanel } from '@/components/gamification/LevelProgressPanel'
import TapeteCard from '@/components/ui/TapeteCard'
import RotateScreen from '@/components/ui/RotateScreen'
import { useAuth } from '@/hooks/useAuth'
import { useInstrumentos } from '@/hooks/useInstrumentos'
import { useOrientation } from '@/hooks/useOrientation'
import { useProgress } from '@/hooks/useProgress'
import { PUNTOS_POR_TIPO } from '@/types'
import type { GymInstrumento } from '@/data/gym'
import type { Seccion, Recurso, Modulo } from '@/data/cursos'

interface ModuloGym {
  id: string
  nombre: string
  zona: string | null
  orden: number
  secciones: Seccion[]
}

const SCENE_GYM = 'https://prod.spline.design/gYLTlZu92yz616yC/scene.splinecode'

const TIPO_ICON: Record<string, string> = {
  video: '▶️', drive: '📂', juego: '🎮',
  pdf: '📄', imagen: '🖼️', herramienta: '🛠️', otro: '🔗',
}

const TIPO_LABEL: Record<string, string> = {
  video: 'Video', drive: 'Google Drive', juego: 'Juego interactivo',
  pdf: 'Documento PDF', imagen: 'Imagen', herramienta: 'Herramienta', otro: 'Enlace',
}

const TIPO_MODO: Record<string, string> = {
  drive: 'Se abre en nueva pestaña',
  juego: 'Se abre en nueva pestaña',
  pdf: 'Abre en la app',
  imagen: 'Se abre en nueva pestaña',
  herramienta: 'Se abre en nueva pestaña',
  otro: 'Se abre en nueva pestaña',
}


const TIPO_COLOR: Record<string, string> = {
  drive:       'rgba(66,133,244,0.18)',
  juego:       'rgba(155,84,249,0.18)',
  pdf:         'rgba(234,67,53,0.18)',
  imagen:      'rgba(52,168,83,0.18)',
  herramienta: 'rgba(255,167,55,0.18)',
  otro:        'rgba(255,255,255,0.06)',
}

const TIPO_BORDER: Record<string, string> = {
  drive:       'rgba(66,133,244,0.3)',
  juego:       'rgba(155,84,249,0.3)',
  pdf:         'rgba(234,67,53,0.3)',
  imagen:      'rgba(52,168,83,0.3)',
  herramienta: 'rgba(255,167,55,0.3)',
  otro:        'rgba(255,255,255,0.1)',
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

function getDriveEmbedUrl(url: string): string {
  return url
    .replace(/\/view(\?.*)?$/, '/preview')
    .replace(/\/edit(\?.*)?$/, '/preview')
}

function getScratchEmbedId(url: string): string | null {
  const m = url.match(/scratch\.mit\.edu\/projects\/(\d+)/)
  return m ? m[1] : null
}

function getEmbedUrl(url: string, tipo: string): string {
  if (tipo === 'drive' || url.includes('drive.google.com')) return getDriveEmbedUrl(url)
  if (tipo === 'juego') {
    const scratchId = getScratchEmbedId(url)
    if (scratchId) return `https://scratch.mit.edu/projects/${scratchId}/embed`
  }
  return url
}

function isLocalPdf(url: string): boolean {
  return /\.pdf(\?|#|$)/i.test(url) && !url.includes('supabase.co/storage/')
}

// ── Video thumbnail card ───────────────────────────────────────
function VideoCard({ recurso, ytId, completed, onClick }: {
  recurso: Recurso; ytId: string; completed?: boolean; onClick: () => void
}) {
  const pts = recurso.puntos ?? PUNTOS_POR_TIPO[recurso.tipo] ?? 5
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl w-full cursor-pointer text-left"
      style={{ border: '1px solid rgba(255,255,255,0.08)', padding: 0, background: 'none' }}
    >
      <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: '16/9' }}>
        <img
          src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
          alt={recurso.label ?? 'Video'}
          className="w-full h-full object-cover"
          style={{ display: 'block' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(10,10,26,0.85) 0%, rgba(10,10,26,0.1) 50%, transparent 100%)' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            whileHover={{ scale: 1.15 }}
            className="flex items-center justify-center rounded-full"
            style={{
              width: 58, height: 58,
              background: 'rgba(61,184,250,0.92)',
              boxShadow: '0 0 32px rgba(61,184,250,0.7)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <span style={{ fontSize: 22, marginLeft: 3 }}>▶</span>
          </motion.div>
        </div>
        {recurso.label && (
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
            <p style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
              color: '#fff', lineHeight: 1.3,
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            }}>
              {recurso.label}
            </p>
          </div>
        )}
        {/* Puntos preview */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <span style={{ fontSize: 10 }}>⭐</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, color: '#fbbf24' }}>
            +{pts}
          </span>
        </div>
        {/* Completado badge */}
        {completed && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full px-2.5 py-1"
            style={{ background: 'rgba(52,211,153,0.85)', backdropFilter: 'blur(4px)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 10, color: '#fff' }}>✓</span>
          </div>
        )}
      </div>
    </motion.button>
  )
}

// ── External resource card ─────────────────────────────────────
function ExternalCard({ recurso, index, completed, onClick }: {
  recurso: Recurso; index: number; completed?: boolean; onClick: () => void
}) {
  const pts = recurso.puntos ?? PUNTOS_POR_TIPO[recurso.tipo] ?? 5
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex items-center gap-4 rounded-2xl px-4 py-4 w-full cursor-pointer text-left"
      style={{
        background: TIPO_COLOR[recurso.tipo] ?? 'rgba(255,255,255,0.05)',
        border: `1px solid ${completed ? 'rgba(52,211,153,0.3)' : (TIPO_BORDER[recurso.tipo] ?? 'rgba(255,255,255,0.08)')}`,
      }}
    >
      <div className="flex-shrink-0 flex items-center justify-center rounded-xl"
        style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.07)', fontSize: 22 }}>
        {completed ? (
          <span style={{ color: '#34d399' }}>✓</span>
        ) : (
          TIPO_ICON[recurso.tipo] ?? '🔗'
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#fff', lineHeight: 1.3 }}>
          {recurso.label ?? recurso.url}
          {completed && <span style={{ color: '#34d399', fontSize: 10, marginLeft: 6 }}>completado</span>}
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
          {TIPO_LABEL[recurso.tipo] ?? recurso.tipo} · +{pts} pts
        </p>
      </div>
      <div className="flex-shrink-0 flex items-center justify-center rounded-full"
        style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
        ›
      </div>
    </motion.button>
  )
}

// ── Points Toast ────────────────────────────────────────────────
function PtsToast({ pts, subioNivel, onDone }: { pts: number; subioNivel: boolean; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      onAnimationComplete={() => { setTimeout(onDone, 2500) }}
      className="fixed z-[70] bottom-8 left-1/2 -translate-x-1/2"
      style={{ fontFamily: 'var(--font-display)', fontWeight: 700, pointerEvents: 'none' }}
    >
      <div style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.95), rgba(249,115,22,0.95))',
        borderRadius: 16, padding: '12px 24px',
        boxShadow: '0 0 40px rgba(245,158,11,0.5)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>⭐</span>
        <span style={{ color: '#fff', fontSize: 17, letterSpacing: '0.02em' }}>+{pts} pts</span>
        {subioNivel && (
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, background: 'rgba(255,255,255,0.2)', borderRadius: 6, padding: '2px 8px' }}>
            ¡Subió de nivel!
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ── In-app iframe viewer ───────────────────────────────────────
function IframeViewer({ url, label, tipo, onClose }: {
  url: string; label?: string; tipo: string; onClose: () => void
}) {
  const embedUrl = getEmbedUrl(url, tipo)
  const isScratch = embedUrl.includes('scratch.mit.edu')
  const sandbox = isScratch
    ? 'allow-scripts allow-popups allow-forms allow-presentation allow-same-origin allow-storage-access-by-user-activation'
    : 'allow-scripts allow-popups allow-forms allow-presentation'
  return (
    <>
      <motion.div
        key="iframe-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 z-50"
        style={{ background: 'rgba(5,5,18,0.95)', backdropFilter: 'blur(20px)' }}
      />
      <motion.div
        key="iframe-viewer"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="absolute z-50 flex flex-col"
        style={{ inset: '16px', pointerEvents: 'none' }}
      >
        <div className="w-full h-full flex flex-col gap-3" style={{ pointerEvents: 'auto' }}>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.08)', fontSize: 18 }}>
              {TIPO_ICON[tipo] ?? '🔗'}
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1.2 }} className="truncate">
                {label ?? TIPO_LABEL[tipo] ?? 'Recurso'}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1, textTransform: 'capitalize' }}>
                {TIPO_LABEL[tipo] ?? tipo}
              </p>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-body)', fontSize: 12,
                color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
                padding: '6px 12px', borderRadius: 999,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                flexShrink: 0,
              }}
            >
              ↗ Nueva pestaña
            </a>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 14 }}
            >
              <X size={14} strokeWidth={1.5} />
            </motion.button>
          </div>

          <div className="flex-1 rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#fff', minHeight: 0 }}>
            {tipo === 'pdf' || /\.pdf(#|\?|$)/i.test(url) ? (
              <object data={url} type="application/pdf" className="w-full h-full"
                style={{ border: 'none', display: 'block' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#666', padding: 40, textAlign: 'center' }}>
                  No se pudo mostrar el PDF. <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#3db8fa' }}>Abrir en nueva pestaña</a>
                </p>
              </object>
            ) : (
              <iframe src={embedUrl} className="w-full h-full"
                style={{ border: 'none', display: 'block' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                sandbox={sandbox}
              />
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default function GymSalaPage({ moduloIdInicial }: { moduloIdInicial?: string } = {}) {
  const { instrumento } = useParams<{ instrumento: string }>()
  const router = useRouter()
  const { token, user, updateUser, refreshUser } = useAuth()
  useEffect(() => { refreshUser() }, [refreshUser])
  const { gym: allGym } = useInstrumentos(token)

  // Solo DB
  const [dbModulos, setDbModulos] = useState<ModuloGym[]>([])

  const { isMobile, isPortrait } = useOrientation()
  const { isCompleted, completeResource } = useProgress()
  const [toast, setToast] = useState<{ pts: number; subioNivel: boolean; id: number } | null>(null)
  const toastCountRef = useRef(0)
  const [isTrainning,    setIsTrainning]    = useState(false)
  const [isOutingGym,    setIsOutingGym]    = useState(false)
  const [panelOpen,      setPanelOpen]      = useState(false)
  const [salidaOpen,     setSalidaOpen]     = useState(false)
  const [moduloActivo,   setModuloActivo]   = useState<ModuloGym | null>(null)
  const [seccionActiva,  setSeccionActiva]  = useState<Seccion | null>(null)
  const [videoActivo,    setVideoActivo]    = useState<{ url: string; label?: string } | null>(null)
  const [externalActivo, setExternalActivo] = useState<{ url: string; label?: string; tipo: string } | null>(null)
  const [esperaActiva, setEsperaActiva]   = useState<{ url: string; label?: string; tipo: string } | null>(null)
  const [tapeteHintOpen, setTapeteHintOpen] = useState(true)
  const [fallbackVisible, setFallbackVisible] = useState(false)
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Refs espejo para usar en handleVariableChange sin dependencias inestables
  const panelOpenRef = useRef(false)
  useEffect(() => { panelOpenRef.current = panelOpen }, [panelOpen])
  const gymCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const splineAppRef = useRef<Application | null>(null)
  const prevVarsRef = useRef<Record<string, unknown>>({})
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const gymInstr = allGym.find(g => g.id === instrumento)
  const cursoId = gymInstr?.cursoId ?? instrumento

  // Fetch desde DB
  useEffect(() => {
    if (!token || !cursoId) return
    fetch(`/api/content?id=${cursoId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const mods: ModuloGym[] = (data?.modulos ?? [])
          .filter((m: ModuloGym) => m.zona !== 'clase')
          .map((m: ModuloGym) => ({
            ...m,
            secciones: (m.secciones ?? []).filter(
              (s: Seccion) => s.zona === 'gym' || s.zona === null
            ),
          }))
          .filter((m: ModuloGym) => m.secciones.length > 0)
        setDbModulos(mods)
        if (moduloIdInicial) {
          const mod = mods.find(m => m.id === moduloIdInicial) ?? null
          setModuloActivo(mod)
        }
      })
      .catch(() => {})
  }, [cursoId, token]) // eslint-disable-line react-hooks/exhaustive-deps

  const dismissTapeteHint = useCallback(() => setTapeteHintOpen(false), [])

  const handleVideoEnd = useCallback(() => {
    if (!videoActivo?.url) return
    completeResource(videoActivo.url, 'video').then(result => {
      if (result && !result.ya_completado) {
        setToast({ pts: result.puntos_ganados, subioNivel: result.subio_nivel ?? false, id: ++toastCountRef.current })
        if (result.total_puntos !== undefined) updateUser({ puntos: result.total_puntos, nivel: result.nivel })
      }
    })
  }, [videoActivo?.url, completeResource, updateUser])

  const handleOpenResource = useCallback(async (url: string, tipo: string) => {
    const result = await completeResource(url, tipo)
    if (result && !result.ya_completado) {
      setToast({ pts: result.puntos_ganados, subioNivel: result.subio_nivel ?? false, id: ++toastCountRef.current })
      if (result.total_puntos !== undefined) updateUser({ puntos: result.total_puntos, nivel: result.nivel })
    }
  }, [completeResource, updateUser])

  // 3s after tapete is dismissed, show fallback if tapete hasn't triggered
  useEffect(() => {
    if (tapeteHintOpen || panelOpen || isTrainning) return
    fallbackTimerRef.current = setTimeout(() => setFallbackVisible(true), 3000)
    return () => { if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current) }
  }, [tapeteHintOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isTrainning || panelOpen) {
      setFallbackVisible(false)
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current)
    }
  }, [isTrainning, panelOpen])

  // Sin módulo preseleccionado → el usuario debe pasar por el mapa
  useEffect(() => {
    if (!moduloIdInicial) router.replace('/escuela')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleVariableChange = useCallback((name: string, value: unknown) => {
    const isTrue = value === true || String(value).toLowerCase() === 'true'
    if (name === 'isTrainning') {
      flushSync(() => setIsTrainning(isTrue))
      if (isTrue) {
        if (gymCloseRef.current) clearTimeout(gymCloseRef.current)
        if (!panelOpenRef.current) {
          setTapeteHintOpen(false)
          setPanelOpen(true)
        }
      } else {
        if (gymCloseRef.current) clearTimeout(gymCloseRef.current)
        gymCloseRef.current = setTimeout(() => { setPanelOpen(false); setSeccionActiva(null) }, 600)
      }
    }
    if (name === 'isOutingGym') flushSync(() => setIsOutingGym(isTrue))
  }, [])

  const handleSplineLoad = useCallback((splineApp: Application) => {
    splineAppRef.current = splineApp
    prevVarsRef.current = { ...splineApp.getVariables() as Record<string, unknown> }

    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => {
      if (!splineAppRef.current) return
      const current = splineAppRef.current.getVariables() as Record<string, unknown>
      for (const key in current) {
        if (current[key] !== prevVarsRef.current[key]) {
          handleVariableChange(key, current[key])
          prevVarsRef.current[key] = current[key]
        }
      }
    }, 100)
  }, [handleVariableChange])

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const cerrarPanel = () => {
    setPanelOpen(false)
    setSeccionActiva(null)
    // moduloActivo se conserva para que "Entrenar" reabra en secciones del mismo módulo
  }

  // Sin módulo preseleccionado → redirigiendo al mapa (ver useEffect arriba)
  if (!moduloIdInicial) return null

  return (
    <main style={{ width: '100vw', height: '100dvh', background: '#0a0a1a', overflow: 'hidden', position: 'relative' }}>

      {/* Spline siempre montado — RotateScreen lo cubre en portrait como overlay */}
      <Spline scene={SCENE_GYM} onLoad={handleSplineLoad} />
      {isMobile && isPortrait && <RotateScreen />}

      <LevelProgressPanel
        puntos={user?.puntos ?? 0}
        nivel={user?.nivel ?? 1}
        modulo={moduloActivo as Modulo | null}
        isCompleted={isCompleted}
      />

      <TapeteCard show={tapeteHintOpen} onDismiss={dismissTapeteHint} sala="gym" />

      {/* ── Botón fijo ← Mapa ── */}
      <motion.button
        onClick={() => router.push('/escuela')}
        whileHover={{ x: -3 }} whileTap={{ scale: 0.95 }}
        className="absolute top-5 left-5 z-20 cursor-pointer"
        style={{ background: 'rgba(10,10,26,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '8px 16px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}
      >
        ← Mapa
      </motion.button>

      {/* ── Nombre instrumento + sección activa (top center) ── */}
      {gymInstr && (
        <div className="gym-label absolute top-5 left-1/2 -translate-x-1/2 z-20"
          style={{ background: 'rgba(10,10,26,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '8px 20px', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap' }}>
          {gymInstr.emoji} {gymInstr.nombre}{moduloActivo ? ` · ${moduloActivo.nombre}` : ''}
        </div>
      )}

      {/* ── Hint: pisa el tapete (solo si no hay sección activa ni panel abierto, ni móvil) ── */}
      <AnimatePresence>
        {!isTrainning && !fallbackVisible && !isMobile && !panelOpen && !salidaOpen && !seccionActiva && (
          <motion.p
            key="hint-tapete-gym"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.55, 0.35, 0.55] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#3db8fa',
              whiteSpace: 'nowrap',
            }}
          >
            pisa el tapete para iniciar
          </motion.p>
        )}
      </AnimatePresence>



      {/* ── isOutingGym → salida ── */}
      <AnimatePresence>
        {isOutingGym && !panelOpen && !salidaOpen && (
          <motion.button key="outing-btn"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            whileHover={{ scale: 1.06, boxShadow: '0 0 48px rgba(236,72,138,0.55)' }} whileTap={{ scale: 0.95 }}
            onClick={() => setSalidaOpen(true)}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 cursor-pointer"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(12px, 3.2vw, 16px)', padding: 'clamp(8px, 2vw, 14px) clamp(18px, 5vw, 36px)', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg, var(--om-pink) 0%, var(--om-purple) 100%)', color: '#fff', boxShadow: '0 0 32px rgba(236,72,138,0.4)', letterSpacing: '0.02em' }}
          >
            ← Salir del Gym
          </motion.button>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          PANEL — SECCIONES + RECURSOS
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div key="panel-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} onClick={cerrarPanel}
              className="absolute inset-0 z-20"
              style={{ background: 'rgba(10,10,26,0.72)', backdropFilter: 'blur(10px)' }} />

            <AnimatePresence mode="wait">

              {/* Nivel 1 — Lista de módulos */}
              {!moduloActivo && !seccionActiva && (
                <motion.div key="panel-modulos"
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl overflow-y-auto"
                  style={{ background: 'rgba(12,12,28,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)', maxHeight: '78dvh', padding: '20px 20px 32px' }}
                >
                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#fff' }}>
                        {gymInstr?.emoji} {gymInstr?.nombre}
                      </h2>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>Elige un módulo</p>
                    </div>
                    <button onClick={cerrarPanel} className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', fontSize: 14 }}><X size={14} strokeWidth={1.5} /></button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {dbModulos.map((mod, i) => (
                      <motion.button key={mod.id}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.045 }}
                        whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setModuloActivo(mod)}
                        className="flex items-center justify-between rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-left w-full cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 flex items-center justify-center rounded-full font-bold"
                            style={{ width: 34, height: 34, background: gymInstr?.color ?? 'rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13 }}>
                            {i + 1}
                          </div>
                          <div>
                            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1.2 }}>{mod.nombre}</p>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                              {mod.secciones.length} {mod.secciones.length === 1 ? 'sección' : 'secciones'}
                            </p>
                          </div>
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18 }}>›</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Nivel 2 — Secciones del módulo */}
              {moduloActivo && !seccionActiva && (
                <motion.div key="panel-secciones"
                  initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl overflow-y-auto"
                  style={{ background: 'rgba(12,12,28,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)', maxHeight: '78dvh', padding: '20px 20px 32px' }}
                >
                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />
                  <div className="flex items-center gap-3 mb-5">
                    <motion.button whileHover={{ x: -3 }}
                      onClick={cerrarPanel}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ArrowLeft size={13} strokeWidth={1.5} /> Cerrar
                    </motion.button>
                    <button onClick={cerrarPanel} className="ml-auto w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: 'none', fontSize: 13 }}><X size={14} strokeWidth={1.5} /></button>
                  </div>

                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 4 }}>
                    {moduloActivo.nombre}
                  </h2>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.38)', marginBottom: 20 }}>Elige una sección</p>

                  <div className="flex flex-col gap-3">
                    {moduloActivo.secciones.map((sec, i) => (
                      <motion.button key={sec.nombre}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.045 }}
                        whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setSeccionActiva(sec)}
                        className="flex items-center justify-between rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-left w-full cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
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

              {/* Nivel 3 — Recursos de la sección */}
              {seccionActiva && (
                <motion.div key="panel-recursos"
                  initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl overflow-y-auto"
                  style={{ background: 'rgba(12,12,28,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)', maxHeight: '78dvh', padding: '20px 20px 32px' }}
                >
                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />
                  <div className="flex items-center gap-3 mb-5">
                    <motion.button whileHover={{ x: -3 }}
                      onClick={() => setSeccionActiva(null)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ArrowLeft size={13} strokeWidth={1.5} /> {moduloActivo?.nombre ?? 'Secciones'}
                    </motion.button>
                    <button onClick={cerrarPanel} className="ml-auto w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: 'none', fontSize: 13 }}><X size={14} strokeWidth={1.5} /></button>
                  </div>

                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 16 }}>
                    {seccionActiva.nombre}
                  </h2>

                  <div className="flex flex-col gap-3">
                    {seccionActiva.recursos.map((recurso, i) => {
                      const ytId = recurso.tipo === 'video' ? getYouTubeId(recurso.url) : null

                      if (ytId) {
                        return (
                          <VideoCard
                            key={i}
                            recurso={recurso}
                            ytId={ytId}
                            completed={isCompleted(recurso.url)}
                            onClick={() => setVideoActivo({ url: recurso.url, label: recurso.label })}
                          />
                        )
                      }

                      return (
                        <ExternalCard
                          key={i}
                          recurso={recurso}
                          index={i}
                          completed={isCompleted(recurso.url)}
                          onClick={() => {
                            if (isLocalPdf(recurso.url)) {
                              setExternalActivo({ url: recurso.url, label: recurso.label, tipo: recurso.tipo })
                            } else {
                              window.open(recurso.url, '_blank')
                              setEsperaActiva({ url: recurso.url, label: recurso.label, tipo: recurso.tipo })
                            }
                          }}
                        />
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
          PANEL SALIDA
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {salidaOpen && (
          <>
            <motion.div key="salida-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }} onClick={() => setSalidaOpen(false)}
              className="absolute inset-0 z-40"
              style={{ background: 'rgba(10,10,26,0.75)', backdropFilter: 'blur(10px)' }} />
            <motion.div key="salida-panel"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-y-auto"
              style={{ background: 'rgba(12,12,28,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)', maxHeight: '80dvh', padding: '20px 20px 32px' }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>
                    {gymInstr?.emoji} {gymInstr?.nombre}
                  </h2>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>¿A dónde quieres ir?</p>
                </div>
                <button onClick={() => setSalidaOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', fontSize: 14 }}><X size={14} strokeWidth={1.5} /></button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/escuela')}
                className="w-full rounded-2xl flex items-center gap-4 px-4 py-3 sm:px-5 sm:py-4 cursor-pointer mb-4"
                style={{ background: 'linear-gradient(135deg, var(--om-blue) 0%, var(--om-purple) 100%)', border: 'none' }}
              >
                <span style={{ fontSize: 24 }}>🗺️</span>
                <div className="text-left">
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff' }}>Volver al Mapa</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Salir al mapa principal</p>
                </div>
              </motion.button>

              {dbModulos.length > 0 && (
                <>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 16 }} />
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', marginBottom: 12 }}>
                    CAMBIAR DE MÓDULO
                  </p>
                  <div className="flex flex-col gap-2">
                    {dbModulos.map((mod, i) => {
                      const esActual = mod.id === moduloIdInicial
                      return (
                        <motion.button key={mod.id}
                          whileHover={!esActual ? { x: 4 } : {}} whileTap={!esActual ? { scale: 0.98 } : {}}
                          onClick={() => {
                            if (esActual) return
                            setSalidaOpen(false)
                            router.push(`/escuela/gym/${instrumento}/${mod.id}`)
                          }}
                          className="w-full flex items-center gap-4 rounded-2xl px-4 py-3 cursor-pointer text-left"
                          style={{
                            background: esActual ? 'rgba(61,184,250,0.1)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${esActual ? 'rgba(61,184,250,0.3)' : 'rgba(255,255,255,0.07)'}`,
                            cursor: esActual ? 'default' : 'pointer',
                          }}
                        >
                          <div className="flex-shrink-0 flex items-center justify-center rounded-full"
                            style={{ width: 32, height: 32, background: `${gymInstr?.color ?? '#3db8fa'}20`, color: gymInstr?.color ?? '#3db8fa', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
                            {i + 1}
                          </div>
                          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: esActual ? '#3db8fa' : '#fff', margin: 0, flex: 1 }}>{mod.nombre}</p>
                          {esActual
                            ? <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: '#3db8fa', letterSpacing: '0.06em' }}>AQUÍ</span>
                            : <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 16 }}>›</span>
                          }
                        </motion.button>
                      )
                    })}
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          VIDEO PLAYER WITH CARDS
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {videoActivo && (
          <motion.div key="video-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(5,5,18,0.92)', backdropFilter: 'blur(16px)', padding: '24px 16px' }}>
            <div className="w-full" style={{ maxWidth: 720 }}>
              <VideoPlayerWithCards
                videoUrl={videoActivo.url}
                label={videoActivo.label}
                onClose={() => setVideoActivo(null)}
                onVideoEnd={handleVideoEnd}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          OVERLAY — VISOR EXTERNO (Drive / Juegos / PDF)
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {externalActivo && (
          <IframeViewer
            url={externalActivo.url}
            label={externalActivo.label}
            tipo={externalActivo.tipo}
            onClose={() => setExternalActivo(null)}
          />
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          OVERLAY — PANTALLA DE ESPERA
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {esperaActiva && (
          <WaitingScreen
            label={esperaActiva.label}
            tipo={esperaActiva.tipo}
            onComplete={() => {
              handleOpenResource(esperaActiva.url, esperaActiva.tipo)
              setEsperaActiva(null)
            }}
            onClose={() => setEsperaActiva(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <PtsToast key={toast.id} pts={toast.pts} subioNivel={toast.subioNivel} onDone={() => setToast(null)} />
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 640px) {
          .gym-label { max-width: calc(100vw - 140px) !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        }
      `}</style>
    </main>
  )
}
