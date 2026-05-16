'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight, Settings, LogOut, X } from 'lucide-react'
import SplineScene from '@/components/spline/SplineScene'
import TapeteCard from '@/components/ui/TapeteCard'
import RotateScreen from '@/components/ui/RotateScreen'
import type { ClaseConfig } from '@/data/clases'
import type { Modulo, Seccion } from '@/data/cursos'
import type { GymInstrumento } from '@/data/gym'
import { useAuth } from '@/hooks/useAuth'
import { useInstrumentos } from '@/hooks/useInstrumentos'
import { useOrientation } from '@/hooks/useOrientation'

function WasdKey({ label, wide, width, height }: { label: React.ReactNode; wide?: boolean; width?: number; height?: number }) {
  return (
    <div
      style={{
        width: width ?? (wide ? 72 : 44),
        height: height ?? 44,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 4px 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: wide ? 12 : 16,
        color: '#fff',
        textShadow: '0 0 10px rgba(61,184,250,0.8)',
        letterSpacing: '0.04em',
        userSelect: 'none',
      }}
    >
      {label}
    </div>
  )
}

function WasdTutorialCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="wasd-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-40"
        style={{ background: 'rgba(10,10,26,0.65)', backdropFilter: 'blur(6px)' }}
      />

      {/* Contenedor de centrado */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          key="wasd-card"
          initial={{ opacity: 0, scale: 0.88, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="pointer-events-auto relative"
          style={{
            width: 'min(340px, 88vw)',
            background: 'rgba(10,10,26,0.97)',
            border: '1px solid rgba(61,184,250,0.22)',
            borderRadius: 24,
            boxShadow: '0 0 60px rgba(61,184,250,0.12), 0 0 100px rgba(155,84,249,0.08)',
            padding: '36px 32px 28px',
            textAlign: 'center',
            overflow: 'hidden',
          }}
        >
        {/* Glow accent top */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 200, height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(61,184,250,0.7), transparent)',
        }} />

        {/* Sheep + title */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 44, lineHeight: 1, marginBottom: 12 }}
        >
          🐑
        </motion.div>

        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
          color: '#fff', marginBottom: 4, letterSpacing: '0.02em',
        }}>
          ¡Mueve la oveja!
        </h2>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 13,
          color: 'rgba(255,255,255,0.45)', marginBottom: 24, lineHeight: 1.5,
        }}>
          Usa el teclado para explorar el mundo
        </p>

        {/* WASD keyboard */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, marginBottom: 28 }}>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
            {/* WASD */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                <WasdKey label="W" width={38} height={38} />
              </div>
              <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                <WasdKey label="A" width={38} height={38} />
                <WasdKey label="S" width={38} height={38} />
                <WasdKey label="D" width={38} height={38} />
              </div>
            </div>

            <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.08)' }} />

            {/* Arrows */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                <WasdKey label="↑" width={38} height={38} />
              </div>
              <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                <WasdKey label="←" width={38} height={38} />
                <WasdKey label="↓" width={38} height={38} />
                <WasdKey label="→" width={38} height={38} />
              </div>
            </div>
          </div>

          {/* Label */}
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
            WASD o flechas para moverte
          </p>

          {/* Divider */}
          <div style={{ width: '60%', height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />

          {/* Spacebar */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            <WasdKey label="ESPACIO" wide width={180} height={38} />
          </div>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
            Barra espaciadora para saltar
          </p>
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(61,184,250,0.45)' }}
          whileTap={{ scale: 0.97 }}
          onClick={onDismiss}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, var(--om-blue) 0%, var(--om-purple) 100%)',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            boxShadow: '0 0 24px rgba(61,184,250,0.3)',
            letterSpacing: '0.03em',
          }}
        >
          ¡A jugar! 🎮
        </motion.button>
        </motion.div>
      </div>
    </>
  )
}

// ── Botón reutilizable ─────────────────────────────────────────
function PillButton({
  onClick, children, gradient, glow,
}: {
  onClick: () => void
  children: React.ReactNode
  gradient: string
  glow: string
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06, boxShadow: `0 0 48px ${glow}` }}
      whileTap={{ scale: 0.95 }}
      className="cursor-pointer"
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 16,
        padding: '14px 36px',
        borderRadius: 999,
        border: 'none',
        background: gradient,
        color: '#fff',
        boxShadow: `0 0 32px ${glow}`,
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </motion.button>
  )
}

// ── Panel base ─────────────────────────────────────────────────
function PanelBase({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 z-20"
        style={{ background: 'rgba(10,10,26,0.72)', backdropFilter: 'blur(10px)' }}
      />
      {children}
    </>
  )
}

// ── Card de instrumento ────────────────────────────────────────
function InstrCard({
  emoji, nombre, descripcion, color, glow, delay, onClick,
}: {
  emoji: string; nombre: string; descripcion: string
  color: string; glow: string; delay: number; onClick: () => void
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: 'easeOut' }}
      whileHover={{ scale: 1.04, boxShadow: `0 8px 32px ${glow}` }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl p-4 text-left cursor-pointer"
      style={{ background: color, border: 'none', minHeight: 110 }}
    >
      <div className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%)' }} />
      <div className="text-3xl mb-2 relative">{emoji}</div>
      <h3 className="relative" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1.2 }}>
        {nombre}
      </h3>
      <p className="relative mt-1" style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.3 }}>
        {descripcion}
      </p>
    </motion.button>
  )
}

// ── Lista de módulos ───────────────────────────────────────────
function ModulosList({
  modulos, color, onSelect,
}: { modulos: Modulo[]; color: string; onSelect: (m: Modulo) => void }) {
  return (
    <div className="flex flex-col gap-3">
      {modulos.map((modulo, i) => (
        <motion.button
          key={modulo.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.045 }}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(modulo)}
          className="flex items-center justify-between rounded-2xl px-5 py-4 text-left w-full cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 flex items-center justify-center rounded-full font-bold"
              style={{ width: 34, height: 34, background: color, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13 }}>
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
          <ChevronRight size={16} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
        </motion.button>
      ))}
    </div>
  )
}

function isPracticeModule(nombre: string): boolean {
  const normalized = nombre.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  return normalized.includes('practica')
}

function getTutorialCount(userId: string): number {
  return parseInt(localStorage.getItem(`tutorial_wasd_${userId}`) ?? '0', 10)
}

function incrementTutorialCount(userId: string): void {
  const count = getTutorialCount(userId)
  localStorage.setItem(`tutorial_wasd_${userId}`, String(count + 1))
}

// ══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function MapaPage() {
  const router = useRouter()
  const { user, logout, token } = useAuth()

  // Spline hover
  const [overGym, setOverGym] = useState(false)
  const [overSchool, setOverSchool] = useState(false)

  // Panel clases
  const [clasesOpen, setClasesOpen] = useState(false)
  const [claseSeleccionada, setClaseSeleccionada] = useState<ClaseConfig | null>(null)
  const [modulosDb, setModulosDb] = useState<Record<string, Modulo[]>>({})

  // Panel gym
  const [gymOpen, setGymOpen] = useState(false)
  const [gymInstrSeleccionado, setGymInstrSeleccionado] = useState<GymInstrumento | null>(null)
  const [gymDbSecciones, setGymDbSecciones] = useState<Record<string, Seccion[]>>({})

  // Logout
  const [showLogout, setShowLogout] = useState(false)

  const { isMobile, isPortrait } = useOrientation()

  // Delayed close refs — prevent mobile touch-release from instantly closing panels
  const gymCloseRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const claseCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Tapete hint: persist dismissal in localStorage so it doesn't repeat on every navigation
  const [showTapeteHint, setShowTapeteHint] = useState(false)
  useEffect(() => {
    const dismissed = localStorage.getItem('tapete_dismissed_mapa')
    if (!dismissed) setShowTapeteHint(true)
  }, [])

  const [showTutorial, setShowTutorial] = useState(false)

  const dismissTapeteHint = useCallback(() => {
    setShowTapeteHint(false)
    localStorage.setItem('tapete_dismissed_mapa', '1')
    const count = user?.id ? getTutorialCount(user.id) : 0
    if (count < 5) setShowTutorial(true)
  }, [user?.id])

  const dismissTutorial = useCallback(() => {
    setShowTutorial(false)
    if (user?.id) incrementTutorialCount(user.id)
  }, [user?.id])

  const handleVariableChange = useCallback((name: string, value: unknown) => {
    const isTrue = value === true || String(value).toLowerCase() === 'true'
    if (name === 'IsOverGym') {
      flushSync(() => setOverGym(isTrue))
      if (isTrue) {
        if (gymCloseRef.current) clearTimeout(gymCloseRef.current)
        if (!gymOpen && !clasesOpen) setGymOpen(true)
      } else {
        // Small delay before closing — prevents mobile touch-release from instantly closing
        if (gymCloseRef.current) clearTimeout(gymCloseRef.current)
        gymCloseRef.current = setTimeout(() => { setGymOpen(false); setGymInstrSeleccionado(null) }, 600)
      }
    }
    if (name === 'IsOverSchool') {
      flushSync(() => setOverSchool(isTrue))
      if (isTrue) {
        if (claseCloseRef.current) clearTimeout(claseCloseRef.current)
        if (!clasesOpen && !gymOpen) setClasesOpen(true)
      } else {
        if (claseCloseRef.current) clearTimeout(claseCloseRef.current)
        claseCloseRef.current = setTimeout(() => {
          setClasesOpen(false)
          setClaseSeleccionada(null)
        }, 600)
      }
    }
  }, [clasesOpen, gymOpen])

  const anyOpen = clasesOpen || gymOpen

  const cerrarClases = () => { setClasesOpen(false); setClaseSeleccionada(null) }
  const cerrarGym = () => { setGymOpen(false); setGymInstrSeleccionado(null) }

  useEffect(() => {
    if (!token || !claseSeleccionada?.cursoId || modulosDb[claseSeleccionada.cursoId]) return

    const cursoId = claseSeleccionada.cursoId

    fetch(`/api/content?id=${cursoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then((data: { modulos?: Modulo[] } | null) => {
        const modulos = data?.modulos
        if (!Array.isArray(modulos)) return
        setModulosDb(prev => ({ ...prev, [cursoId]: modulos }))
      })
      .catch(() => { /* fallback silencioso a datos estaticos */ })
  }, [token, claseSeleccionada?.cursoId, modulosDb])

  // Fetch gym sections from DB when an instrument is selected
  useEffect(() => {
    if (!token || !gymInstrSeleccionado) return
    const cursoId = gymInstrSeleccionado.cursoId ?? gymInstrSeleccionado.id
    if (gymDbSecciones[cursoId]) return
    fetch(`/api/content?id=${cursoId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const allSecs = (data?.modulos ?? []).flatMap(
          (m: { secciones?: Seccion[] }) => m.secciones ?? []
        )
        const gymSecs = allSecs.filter((s: Seccion) => s.zona !== 'clase')
        if (gymSecs.length > 0) {
          setGymDbSecciones(prev => ({ ...prev, [cursoId]: gymSecs }))
        }
      })
      .catch(() => {})
  }, [token, gymInstrSeleccionado?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Solo DB
  const modulosClaseVista = claseSeleccionada
    ? (modulosDb[claseSeleccionada.cursoId] ?? []).filter(m => !isPracticeModule(m.nombre))
    : []

  const { dbClases, dbGym, loading: instrLoading } = useInstrumentos(token ?? null)

  // Solo DB
  const gymSeccionesVista = gymInstrSeleccionado
    ? gymDbSecciones[gymInstrSeleccionado.cursoId ?? gymInstrSeleccionado.id] ?? []
    : []

  // Filtrar por acceso — admins ven todo
  const isAdmin = user?.role === 'admin'
  const acceso = user?.clases_acceso ?? []

  const clasesVisibles = isAdmin
    ? dbClases
    : dbClases.filter(c => acceso.includes(c.id))
  const gymVisibles = isAdmin
    ? dbGym
    : dbGym.filter(g => g.id === 'gym-general' || acceso.includes(g.id))

  return (
    <main className="relative w-full overflow-hidden"
      style={{ width: '100vw', height: '100dvh', background: '#0a0a1a' }}>

      {/* Spline siempre montado — RotateScreen lo cubre en portrait como overlay */}
      <SplineScene
        scene="https://prod.spline.design/WpjnQukgytAKxnYq/scene.splinecode"
        onVariableChange={handleVariableChange}
      />
      {isMobile && isPortrait && <RotateScreen />}

      <TapeteCard show={showTapeteHint} onDismiss={dismissTapeteHint} sala="mapa" />

      {/* Los paneles se abren automáticamente al hacer hover en Spline via handleVariableChange */}

      {/* ════════════════════════════════════════
          PANEL — CLASES
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {clasesOpen && (
          <PanelBase onClose={cerrarClases}>
            <AnimatePresence mode="wait">

              {/* Paso 1: instrumentos */}
              {!claseSeleccionada && (
                <motion.div key="cl-instrs"
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl overflow-y-auto"
                  style={{ background: 'rgba(12,12,28,0.98)', backdropFilter: 'blur(24px)', padding: '20px 24px 44px', borderTop: '1px solid rgba(255,255,255,0.07)', maxHeight: '78vh' }}>

                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#fff' }}>¿A qué clase vas hoy?</h2>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>Elige tu instrumento</p>
                    </div>
                    <button onClick={cerrarClases} className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} strokeWidth={1.5} /></button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {instrLoading ? (
                      <p className="col-span-2 text-center py-8" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
                        Cargando clases...
                      </p>
                    ) : clasesVisibles.length === 0 ? (
                      <p className="col-span-2 text-center py-8" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
                        Sin clases disponibles
                      </p>
                    ) : clasesVisibles.map((c, i) => (
                      <InstrCard key={c.id} {...c} delay={i * 0.055} onClick={() => setClaseSeleccionada(c)} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Paso 2: módulos */}
              {claseSeleccionada && (
                <motion.div key="cl-modulos"
                  initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl overflow-y-auto"
                  style={{ background: 'rgba(12,12,28,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)', maxHeight: '78vh', padding: '20px 24px 44px' }}>

                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />
                  <div className="flex items-center gap-3 mb-6">
                    <motion.button whileHover={{ x: -3 }} onClick={() => setClaseSeleccionada(null)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ArrowLeft size={13} strokeWidth={1.5} /> Clases
                    </motion.button>
                    <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff', flex: 1 }}>
                      {claseSeleccionada.emoji} {claseSeleccionada.nombre}
                    </h2>
                    <button onClick={cerrarClases} className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} strokeWidth={1.5} /></button>
                  </div>
                  {modulosClaseVista.length === 0
                    ? <p className="text-center py-10" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Contenido próximamente</p>
                    : <ModulosList
                      modulos={modulosClaseVista}
                      color={claseSeleccionada.color}
                      onSelect={(m) => router.push(`/escuela/clase/${claseSeleccionada.id}/${m.id}`)}
                    />
                  }
                </motion.div>
              )}

            </AnimatePresence>
          </PanelBase>
        )}
      </AnimatePresence>

      {/* ── Botones top-right ── */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        {user?.role === 'admin' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.08, boxShadow: '0 0 24px rgba(155,84,249,0.6)' }}
            whileTap={{ scale: 0.94 }}
            onClick={() => router.push('/admin')}
            className="cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #9b54f9, #ec488a)',
              border: 'none', borderRadius: 999,
              padding: '9px 18px',
              color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
              boxShadow: '0 0 16px rgba(155,84,249,0.4)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Settings size={14} strokeWidth={1.5} />
            <span>Admin</span>
          </motion.button>
        )}

        <motion.button
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setShowLogout(true)}
          className="cursor-pointer"
          style={{
            background: 'rgba(10,10,26,0.6)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 999, padding: '9px 16px',
            color: 'rgba(255,255,255,0.55)',
            fontFamily: 'var(--font-body)', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <LogOut size={14} strokeWidth={1.5} />
          <span>Salir</span>
        </motion.button>
      </div>

      {/* ── Modal logout ── */}
      <AnimatePresence>
        {showLogout && (
          <>
            <motion.div
              key="backdrop-logout"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLogout(false)}
              className="absolute inset-0 z-40"
              style={{ background: 'rgba(10,10,26,0.3)', backdropFilter: 'blur(3px)' }}
            />
            <motion.div
              key="modal-logout"
              initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              className="absolute z-50"
              style={{
                top: 70, right: 0,
                background: 'rgba(14,14,32,0.98)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
                borderRight: 'none',
                borderTopLeftRadius: 20,
                borderBottomLeftRadius: 20,
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                boxShadow: '-8px 12px 40px rgba(0,0,0,0.6)',
                padding: '24px 24px', width: 'min(280px, 85vw)', textAlign: 'center',
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <LogOut size={24} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.6)' }} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 8 }}>
                ¿Cerrar sesión?
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
                Volverás a la pantalla de login.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowLogout(false)}
                  style={{
                    flex: 1, padding: '11px 0', borderRadius: 999,
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)', fontSize: 14, cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => { logout(); router.replace('/login') }}
                  style={{
                    flex: 1, padding: '11px 0', borderRadius: 999,
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  Salir
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          PANEL — GYM
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {gymOpen && (
          <PanelBase onClose={cerrarGym}>
            <AnimatePresence mode="wait">

              {/* Paso 1: instrumentos */}
              {!gymInstrSeleccionado && (
                <motion.div key="gym-instrs"
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl overflow-y-auto"
                  style={{ background: 'rgba(12,12,28,0.98)', backdropFilter: 'blur(24px)', padding: '20px 24px 44px', borderTop: '1px solid rgba(255,255,255,0.07)', maxHeight: '78vh' }}>

                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#fff' }}>¿Qué vas a practicar?</h2>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>Elige tu instrumento</p>
                    </div>
                    <button onClick={cerrarGym} className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} strokeWidth={1.5} /></button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {instrLoading ? (
                      <p className="col-span-2 text-center py-8" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
                        Cargando instrumentos...
                      </p>
                    ) : gymVisibles.length === 0 ? (
                      <p className="col-span-2 text-center py-8" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
                        Sin instrumentos disponibles
                      </p>
                    ) : gymVisibles.map((g, i) => (
                      <InstrCard key={g.id} {...g} delay={i * 0.055} onClick={() => setGymInstrSeleccionado(g)} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Paso 2: secciones */}
              {gymInstrSeleccionado && (
                <motion.div key="gym-secciones"
                  initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl overflow-y-auto"
                  style={{ background: 'rgba(12,12,28,0.98)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.07)', maxHeight: '78vh', padding: '20px 24px 44px' }}>

                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />
                  <div className="flex items-center gap-3 mb-6">
                    <motion.button whileHover={{ x: -3 }} onClick={() => setGymInstrSeleccionado(null)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ArrowLeft size={13} strokeWidth={1.5} /> Instrumentos
                    </motion.button>
                    <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff', flex: 1 }}>
                      {gymInstrSeleccionado.emoji} {gymInstrSeleccionado.nombre}
                    </h2>
                    <button onClick={cerrarGym} className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} strokeWidth={1.5} /></button>
                  </div>

                  {gymSeccionesVista.length === 0
                    ? <p className="text-center py-10" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Contenido próximamente</p>
                    : (
                      <div className="flex flex-col gap-3">
                        {gymSeccionesVista.map((sec, i) => (
                          <motion.button key={i}
                            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.045 }}
                            whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                            onClick={() => router.push(`/escuela/gym/${gymInstrSeleccionado.id}/${i}`)}
                            className="flex items-center justify-between rounded-2xl px-5 py-4 text-left w-full cursor-pointer"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0 flex items-center justify-center rounded-full font-bold"
                                style={{ width: 34, height: 34, background: gymInstrSeleccionado.color, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13 }}>
                                {i + 1}
                              </div>
                              <div>
                                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', lineHeight: 1.2 }}>{sec.nombre}</p>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                                  {sec.recursos.length} {sec.recursos.length === 1 ? 'recurso' : 'recursos'}
                                </p>
                              </div>
                            </div>
                            <ChevronRight size={16} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
                          </motion.button>
                        ))}
                      </div>
                    )
                  }
                </motion.div>
              )}

            </AnimatePresence>
          </PanelBase>
        )}
      </AnimatePresence>

      {/* ── Navegación directa en móvil landscape ── */}
      <AnimatePresence>
        {isMobile && !isPortrait && !clasesOpen && !gymOpen && (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-10 left-0 right-0 z-20 flex justify-center gap-4 px-6"
          >
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setClasesOpen(true)}
              className="flex-1 flex items-center justify-center gap-3 rounded-2xl py-4 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--om-blue) 0%, var(--om-purple) 100%)', border: 'none', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff', boxShadow: '0 0 28px rgba(61,184,250,0.3)' }}
            >
              <span>📚</span> Clases
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setGymOpen(true)}
              className="flex-1 flex items-center justify-center gap-3 rounded-2xl py-4 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--om-pink) 0%, var(--om-purple) 100%)', border: 'none', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff', boxShadow: '0 0 28px rgba(236,72,138,0.3)' }}
            >
              <span>🏋️</span> Gym
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── WASD Tutorial ── */}
      <AnimatePresence>
        {showTutorial && (
          <WasdTutorialCard onDismiss={dismissTutorial} />
        )}
      </AnimatePresence>

    </main>
  )
}
