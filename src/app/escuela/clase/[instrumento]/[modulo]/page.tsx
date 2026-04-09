'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useCallback, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import SplineScene from '@/components/spline/SplineScene'
import { CLASES_CONFIG } from '@/data/clases'
import { CURSOS } from '@/data/cursos'
import type { Seccion, Recurso } from '@/data/cursos'
import { useProgress } from '@/hooks/useProgress'
import { PUNTOS_POR_TIPO } from '@/types'

const SCENE_CLASSROOM = 'https://prod.spline.design/646pGt79P6qgQp6p/scene.splinecode'

const TIPO_ICON: Record<string, string> = {
  video:       '▶️',
  drive:       '📂',
  juego:       '🎮',
  pdf:         '📄',
  imagen:      '🖼️',
  herramienta: '🛠️',
  otro:        '🔗',
}

const TIPO_LABEL: Record<string, string> = {
  video: 'Video', drive: 'Google Drive', juego: 'Juego interactivo',
  pdf: 'Documento PDF', imagen: 'Imagen', herramienta: 'Herramienta', otro: 'Enlace',
}

const TIPO_MODO: Record<string, string> = {
  drive:       'Abre en la app',
  juego:       'Abre en la app',
  pdf:         'Abre en la app',
  imagen:      'Abre en la app',
  herramienta: 'Abre en la app',
  otro:        'Abre en la app',
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
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
}

function getDriveEmbedUrl(url: string): string {
  return url
    .replace(/\/view(\?.*)?$/, '/preview')
    .replace(/\/edit(\?.*)?$/, '/preview')
}

function getEmbedUrl(url: string, tipo: string): string {
  if (tipo === 'drive' || url.includes('drive.google.com')) return getDriveEmbedUrl(url)
  return url
}

// ── Video thumbnail card ───────────────────────────────────────
function VideoCard({ recurso, ytId, completed, onClick }: {
  recurso: Recurso; ytId: string; completed: boolean; onClick: () => void
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl w-full cursor-pointer text-left"
      style={{ border: `1px solid ${completed ? 'rgba(52,211,153,0.35)' : 'rgba(255,255,255,0.08)'}`, padding: 0, background: 'none' }}
    >
      <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: '16/9' }}>
        {/* Thumbnail */}
        <img
          src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
          alt={recurso.label ?? 'Video'}
          className="w-full h-full object-cover"
          style={{ display: 'block', filter: completed ? 'brightness(0.65)' : 'none' }}
        />
        {/* Gradient bottom */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(10,10,26,0.85) 0%, rgba(10,10,26,0.1) 50%, transparent 100%)' }}
        />
        {/* Play / check button */}
        <div className="absolute inset-0 flex items-center justify-center">
          {completed ? (
            <div className="flex items-center justify-center rounded-full"
              style={{ width: 58, height: 58, background: 'rgba(52,211,153,0.92)', boxShadow: '0 0 32px rgba(52,211,153,0.6)' }}>
              <span style={{ fontSize: 24 }}>✓</span>
            </div>
          ) : (
            <motion.div whileHover={{ scale: 1.15 }} className="flex items-center justify-center rounded-full"
              style={{ width: 58, height: 58, background: 'rgba(236,72,138,0.92)', boxShadow: '0 0 32px rgba(236,72,138,0.7)', backdropFilter: 'blur(4px)' }}>
              <span style={{ fontSize: 22, marginLeft: 3 }}>▶</span>
            </motion.div>
          )}
        </div>
        {/* Label overlay at bottom */}
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
        {/* Pts badge */}
        {!completed && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full"
            style={{ background: 'rgba(10,10,26,0.7)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
              +{PUNTOS_POR_TIPO.video} pts
            </span>
          </div>
        )}
      </div>
    </motion.button>
  )
}

// ── External resource card ─────────────────────────────────────
function ExternalCard({ recurso, index, completed, onClick }: {
  recurso: Recurso; index: number; completed: boolean; onClick: () => void
}) {
  const pts = PUNTOS_POR_TIPO[recurso.tipo] ?? 5
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
        background: completed ? 'rgba(52,211,153,0.08)' : (TIPO_COLOR[recurso.tipo] ?? 'rgba(255,255,255,0.05)'),
        border: `1px solid ${completed ? 'rgba(52,211,153,0.3)' : (TIPO_BORDER[recurso.tipo] ?? 'rgba(255,255,255,0.08)')}`,
      }}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-xl"
        style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.07)', fontSize: 22 }}
      >
        {completed ? '✅' : (TIPO_ICON[recurso.tipo] ?? '🔗')}
      </div>
      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="truncate" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: completed ? 'rgba(52,211,153,0.9)' : '#fff', lineHeight: 1.3 }}>
          {recurso.label ?? recurso.url}
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
          {TIPO_LABEL[recurso.tipo] ?? recurso.tipo} · {completed ? 'Completado' : (TIPO_MODO[recurso.tipo] ?? 'Abre en la app')}
        </p>
      </div>
      {/* Arrow / pts */}
      {completed ? (
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'rgba(52,211,153,0.7)', flexShrink: 0 }}>✓</span>
      ) : (
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="flex items-center justify-center rounded-full"
            style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
            ›
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>+{pts}</span>
        </div>
      )}
    </motion.button>
  )
}

// ── In-app iframe viewer ───────────────────────────────────────
function IframeViewer({ url, label, tipo, onClose }: {
  url: string; label?: string; tipo: string; onClose: () => void
}) {
  const embedUrl = getEmbedUrl(url, tipo)
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
          {/* Header */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.08)', fontSize: 18 }}
            >
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
            {/* Open in tab fallback */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 flex-shrink-0"
              style={{
                fontFamily: 'var(--font-body)', fontSize: 12,
                color: 'rgba(255,255,255,0.45)',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              ↗ Nueva pestaña
            </a>
            {/* Close */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 14 }}
            >
              <X size={14} strokeWidth={1.5} />
            </motion.button>
          </div>

          {/* iframe */}
          <div
            className="flex-1 rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#fff', minHeight: 0 }}
          >
            <iframe
              src={embedUrl}
              className="w-full h-full"
              style={{ border: 'none', display: 'block' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
            />
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ── Toast de puntos ────────────────────────────────────────────
function PtsToast({ pts, subioNivel, onDone }: { pts: number; subioNivel: boolean; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.9 }}
      transition={{ type: 'spring', damping: 22, stiffness: 300 }}
      className="absolute top-16 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-1"
    >
      <div className="flex items-center gap-2 px-5 py-3 rounded-2xl"
        style={{
          background: 'rgba(12,12,28,0.96)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(52,211,153,0.4)',
          boxShadow: '0 0 32px rgba(52,211,153,0.25)',
        }}>
        <span style={{ fontSize: 18 }}>⭐</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'rgb(52,211,153)' }}>
          +{pts} pts
        </span>
      </div>
      {subioNivel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="px-4 py-2 rounded-xl"
          style={{ background: 'rgba(155,84,249,0.85)', backdropFilter: 'blur(12px)' }}
        >
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#fff' }}>
            🎉 ¡Subiste de nivel!
          </span>
        </motion.div>
      )}
    </motion.div>
  )
}

export default function ModuloPage() {
  const { instrumento, modulo: moduloId } = useParams<{ instrumento: string; modulo: string }>()
  const router = useRouter()

  const { isCompleted, completeResource } = useProgress()

  const [isInClass,     setIsInClass]     = useState(false)
  const [isOutingClass, setIsOutingClass] = useState(false)
  const [seccionesOpen, setSeccionesOpen] = useState(false)
  const [seccionActiva, setSeccionActiva] = useState<Seccion | null>(null)
  const [videoActivo,   setVideoActivo]   = useState<{ url: string; label?: string } | null>(null)
  const [externalActivo, setExternalActivo] = useState<{ url: string; label?: string; tipo: string } | null>(null)
  const [salidaOpen,    setSalidaOpen]    = useState(false)
  const [toast, setToast] = useState<{ pts: number; subioNivel: boolean; id: number } | null>(null)
  const toastCountRef = useRef(0)

  const videoActivoRef = useRef(videoActivo)
  useEffect(() => { videoActivoRef.current = videoActivo }, [videoActivo])

  // Detectar fin de video YouTube via postMessage
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!['https://www.youtube.com', 'https://www.youtube-nocookie.com'].includes(event.origin)) return
      try {
        const data = JSON.parse(event.data)
        if (data.event === 'onStateChange' && data.info === 0) {
          const current = videoActivoRef.current
          if (!current) return
          completeResource(current.url, 'video').then(result => {
            if (result && !result.ya_completado) {
              setToast({ pts: result.puntos_ganados, subioNivel: result.subio_nivel ?? false, id: ++toastCountRef.current })
            }
          })
        }
      } catch {}
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [completeResource])

  const handleOpenResource = useCallback(async (url: string, tipo: string) => {
    const result = await completeResource(url, tipo)
    if (result && !result.ya_completado) {
      setToast({ pts: result.puntos_ganados, subioNivel: result.subio_nivel ?? false, id: ++toastCountRef.current })
    }
  }, [completeResource])

  const handleVariableChange = useCallback((name: string, value: unknown) => {
    const isTrue = value === true || String(value).toLowerCase() === 'true'
    if (name === 'isInClass')     flushSync(() => setIsInClass(isTrue))
    if (name === 'isOutingClass') flushSync(() => setIsOutingClass(isTrue))
  }, [])

  const clase  = CLASES_CONFIG.find(c => c.id === instrumento)
  const curso  = CURSOS.find(c => c.id === clase?.cursoId)
  const modulo = curso?.modulos.find(m => m.id === moduloId)

  const cerrarPanel = () => { setSeccionesOpen(false); setSeccionActiva(null) }

  return (
    <main style={{ width: '100vw', height: '100vh', background: '#0a0a1a', overflow: 'hidden', position: 'relative' }}>

      <SplineScene scene={SCENE_CLASSROOM} onVariableChange={handleVariableChange} />

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

      {/* ── Nombre del módulo (top center) ── */}
      {modulo && (
        <div
          className="mod-label absolute top-5 left-1/2 -translate-x-1/2 z-20"
          style={{
            background: 'rgba(10,10,26,0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 999,
            padding: '8px 20px',
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          {clase?.emoji} {modulo.nombre}
        </div>
      )}

      {/* ── Hint: pisa el tapete ── */}
      <AnimatePresence>
        {!isInClass && !seccionesOpen && (
          <motion.p
            key="hint-tapete"
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

      {/* ── Botón Tomar Lecciones (isInClass) ── */}
      <AnimatePresence>
        {isInClass && !seccionesOpen && (
          <motion.button
            key="lecciones-btn"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            whileHover={{ scale: 1.06, boxShadow: '0 0 48px rgba(236,72,138,0.55)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSeccionesOpen(true)}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 cursor-pointer"
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
              padding: '14px 36px', borderRadius: 999, border: 'none',
              background: 'linear-gradient(135deg, var(--om-pink) 0%, var(--om-purple) 100%)',
              color: '#fff', boxShadow: '0 0 32px rgba(236,72,138,0.4)', letterSpacing: '0.02em',
            }}
          >
            Tomar Lecciones →
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Botón Volver al Mapa (isOutingClass) → abre panel salida ── */}
      <AnimatePresence>
        {isOutingClass && !seccionesOpen && !salidaOpen && (
          <motion.button
            key="volver-btn"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            whileHover={{ scale: 1.06, boxShadow: '0 0 48px rgba(61,184,250,0.55)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSalidaOpen(true)}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 cursor-pointer"
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
              padding: '14px 36px', borderRadius: 999, border: 'none',
              background: 'linear-gradient(135deg, var(--om-blue) 0%, var(--om-purple) 100%)',
              color: '#fff', boxShadow: '0 0 32px rgba(61,184,250,0.4)', letterSpacing: '0.02em',
            }}
          >
            ← Volver al Mapa
          </motion.button>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          PANEL DE SECCIONES
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {seccionesOpen && (
          <>
            <motion.div
              key="secciones-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={cerrarPanel}
              className="absolute inset-0 z-20"
              style={{ background: 'rgba(10,10,26,0.72)', backdropFilter: 'blur(10px)' }}
            />

            <AnimatePresence mode="wait">

              {/* Lista de secciones */}
              {!seccionActiva && (
                <motion.div
                  key="panel-secciones"
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl overflow-y-auto"
                  style={{ background: 'rgba(12,12,28,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)', maxHeight: '78vh', padding: '20px 24px 44px' }}
                >
                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>
                        {modulo?.nombre ?? 'Secciones'}
                      </h2>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                        Elige una sección
                      </p>
                    </div>
                    <button onClick={cerrarPanel} className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', fontSize: 14 }}><X size={14} strokeWidth={1.5} /></button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {(modulo?.secciones ?? []).filter(s => s.zona !== 'gym' && !s.nombre.toLowerCase().includes('práctica')).map((seccion, i) => (
                      <motion.button
                        key={seccion.nombre}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setSeccionActiva(seccion)}
                        className="flex items-center justify-between rounded-2xl px-5 py-4 text-left w-full cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 flex items-center justify-center rounded-full font-bold"
                            style={{ width: 34, height: 34, background: clase?.color ?? 'rgba(255,255,255,0.1)', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13 }}>
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

              {/* Recursos de la sección */}
              {seccionActiva && (
                <motion.div
                  key="panel-recursos"
                  initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl overflow-y-auto"
                  style={{ background: 'rgba(12,12,28,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)', maxHeight: '78vh', padding: '20px 24px 44px' }}
                >
                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />
                  <div className="flex items-center gap-3 mb-5">
                    <motion.button whileHover={{ x: -3 }} onClick={() => setSeccionActiva(null)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                      ← Secciones
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
                            handleOpenResource(recurso.url, recurso.tipo)
                            window.open(recurso.url, '_blank', 'noopener,noreferrer')
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
          PANEL SALIR DEL SALÓN
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {salidaOpen && (
          <>
            <motion.div key="salida-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSalidaOpen(false)}
              className="absolute inset-0 z-40"
              style={{ background: 'rgba(10,10,26,0.75)', backdropFilter: 'blur(10px)' }}
            />
            <motion.div key="salida-panel"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-y-auto"
              style={{ background: 'rgba(12,12,28,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)', maxHeight: '80vh', padding: '20px 24px 44px' }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>
                    {clase?.emoji} {clase?.nombre}
                  </h2>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>¿A dónde quieres ir?</p>
                </div>
                <button onClick={() => setSalidaOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', fontSize: 14 }}><X size={14} strokeWidth={1.5} /></button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 32px rgba(61,184,250,0.35)' }} whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/escuela')}
                className="w-full rounded-2xl flex items-center gap-4 px-5 py-4 cursor-pointer mb-5"
                style={{ background: 'linear-gradient(135deg, var(--om-blue) 0%, var(--om-purple) 100%)', border: 'none' }}
              >
                <span style={{ fontSize: 24 }}>🗺️</span>
                <div className="text-left">
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff' }}>Volver al Mapa</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>Salir al mapa principal</p>
                </div>
              </motion.button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>O CAMBIA DE NIVEL</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>

              <div className="flex flex-col gap-2">
                {(CURSOS.find(c => c.id === clase?.cursoId)?.modulos ?? [])
                  .filter(mod => !mod.nombre.toLowerCase().includes('práctica'))
                  .map((mod, i) => {
                  const esActual = mod.id === moduloId
                  return (
                    <motion.button key={mod.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      whileHover={!esActual ? { x: 4 } : {}} whileTap={!esActual ? { scale: 0.98 } : {}}
                      onClick={() => { if (!esActual) router.push(`/escuela/clase/${instrumento}/${mod.id}`) }}
                      className="flex items-center justify-between rounded-2xl px-5 py-4 text-left w-full"
                      style={{
                        background: esActual ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
                        border: esActual ? `1px solid ${clase?.glow ?? 'rgba(255,255,255,0.2)'}` : '1px solid rgba(255,255,255,0.07)',
                        cursor: esActual ? 'default' : 'pointer',
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center rounded-full font-bold"
                          style={{ width: 32, height: 32, background: esActual ? (clase?.color ?? 'rgba(255,255,255,0.2)') : 'rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 12 }}>
                          {i + 1}
                        </div>
                        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: esActual ? '#fff' : 'rgba(255,255,255,0.6)', lineHeight: 1.2 }}>
                          {mod.nombre}
                        </p>
                      </div>
                      {esActual
                        ? <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>AQUÍ</span>
                        : <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>›</span>
                      }
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          OVERLAY — YOUTUBE PLAYER
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {videoActivo && (
          <>
            <motion.div key="video-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setVideoActivo(null)}
              className="absolute inset-0 z-50"
              style={{ background: 'rgba(5,5,18,0.92)', backdropFilter: 'blur(16px)' }}
            />
            <motion.div key="video-player"
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="absolute z-50"
              style={{ inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', pointerEvents: 'none' }}
            >
              <div className="w-full flex flex-col gap-3" style={{ maxWidth: 720, pointerEvents: 'auto' }}>
                <div className="flex items-center justify-between">
                  {videoActivo.label && (
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff' }}>
                      {videoActivo.label}
                    </p>
                  )}
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setVideoActivo(null)}
                    className="ml-auto w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 14 }}>
                    <X size={14} strokeWidth={1.5} />
                  </motion.button>
                </div>
                <div className="w-full rounded-3xl overflow-hidden"
                  style={{ aspectRatio: '16/9', boxShadow: '0 0 80px rgba(236,72,138,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${getYouTubeId(videoActivo.url)}?autoplay=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen className="w-full h-full" style={{ border: 'none', display: 'block' }}
                  />
                </div>
              </div>
            </motion.div>
          </>
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

      {/* ── Toast +pts ── */}
      <AnimatePresence>
        {toast && (
          <PtsToast
            key={toast.id}
            pts={toast.pts}
            subioNivel={toast.subioNivel}
            onDone={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 640px) {
          .mod-label { max-width: calc(100vw - 140px) !important; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        }
      `}</style>
    </main>
  )
}
