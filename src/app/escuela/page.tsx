'use client'

import { useState, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import SplineScene from '@/components/spline/SplineScene'
import { CLASES_CONFIG, type ClaseConfig } from '@/data/clases'
import { GYM_INSTRUMENTOS } from '@/data/gym'
import { CURSOS } from '@/data/cursos'
import type { Modulo } from '@/data/cursos'
import { useAuth } from '@/hooks/useAuth'

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
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 18 }}>›</span>
        </motion.button>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function MapaPage() {
  const router = useRouter()
  const { user, logout } = useAuth()

  // Spline hover
  const [overGym,    setOverGym]    = useState(false)
  const [overSchool, setOverSchool] = useState(false)

  // Panel clases
  const [clasesOpen,        setClasesOpen]        = useState(false)
  const [claseSeleccionada, setClaseSeleccionada] = useState<ClaseConfig | null>(null)

  // Panel gym
  const [gymOpen, setGymOpen] = useState(false)

  // Logout
  const [showLogout, setShowLogout] = useState(false)

  const handleVariableChange = useCallback((name: string, value: unknown) => {
    const isTrue = value === true || String(value).toLowerCase() === 'true'
    if (name === 'IsOverGym')    flushSync(() => setOverGym(isTrue))
    if (name === 'IsOverSchool') flushSync(() => setOverSchool(isTrue))
  }, [])

  const anyOpen = clasesOpen || gymOpen

  const cerrarClases = () => { setClasesOpen(false); setClaseSeleccionada(null) }
  const cerrarGym = () => setGymOpen(false)

  const modulosClase = claseSeleccionada
    ? (CURSOS.find(c => c.id === claseSeleccionada.cursoId)?.modulos ?? [])
        .filter(m => !m.nombre.toLowerCase().includes('práctica'))
    : []

  // Filtrar por acceso — admins ven todo
  const isAdmin = user?.role === 'admin'
  const clasesVisibles = isAdmin
    ? CLASES_CONFIG
    : CLASES_CONFIG.filter(c => user?.clases_acceso?.includes(c.id))
  const gymVisibles = isAdmin
    ? GYM_INSTRUMENTOS
    : GYM_INSTRUMENTOS.filter(g => g.id === 'gym-general' || user?.clases_acceso?.includes(g.id))

  return (
    <main className="relative w-full overflow-hidden"
      style={{ width: '100vw', height: '100vh', background: '#0a0a1a' }}>

      <SplineScene
        scene="https://prod.spline.design/WpjnQukgytAKxnYq/scene.splinecode"
        onVariableChange={handleVariableChange}
      />

      {/* ── Botón Gym ── */}
      <AnimatePresence>
        {overGym && !anyOpen && (
          <motion.div key="gym-btn" className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
            <PillButton
              onClick={() => setGymOpen(true)}
              gradient="linear-gradient(135deg, var(--om-blue) 0%, var(--om-purple) 100%)"
              glow="rgba(61,184,250,0.45)"
            >
              🏋️ Ir a Entrenar →
            </PillButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Botón Clases ── */}
      <AnimatePresence>
        {overSchool && !anyOpen && (
          <motion.div key="school-btn" className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
            <PillButton
              onClick={() => setClasesOpen(true)}
              gradient="linear-gradient(135deg, var(--om-pink) 0%, var(--om-purple) 100%)"
              glow="rgba(236,72,138,0.45)"
            >
              Ir a Clase →
            </PillButton>
          </motion.div>
        )}
      </AnimatePresence>

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
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl"
                  style={{ background: 'rgba(12,12,28,0.98)', backdropFilter: 'blur(24px)', padding: '20px 24px 44px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>

                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#fff' }}>¿A qué clase vas hoy?</h2>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>Elige tu instrumento</p>
                    </div>
                    <button onClick={cerrarClases} className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', fontSize: 14 }}>✕</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {clasesVisibles.length === 0 ? (
                      <p className="col-span-2 text-center py-8" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
                        Sin clases asignadas
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
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                      ← Clases
                    </motion.button>
                    <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff', flex: 1 }}>
                      {claseSeleccionada.emoji} {claseSeleccionada.nombre}
                    </h2>
                    <button onClick={cerrarClases} className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', fontSize: 14 }}>✕</button>
                  </div>
                  {modulosClase.length === 0
                    ? <p className="text-center py-10" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Contenido próximamente</p>
                    : <ModulosList
                        modulos={modulosClase}
                        color={claseSeleccionada.color}
                        onSelect={m => router.push(`/escuela/clase/${claseSeleccionada.id}/${m.id}`)}
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
            <span>⚙️</span>
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
          <span>↩</span>
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
              style={{ background: 'rgba(10,10,26,0.8)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              key="modal-logout"
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="absolute z-50"
              style={{
                top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                background: 'rgba(14,14,32,0.99)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
                padding: '28px 24px', width: 'min(300px, 90vw)', textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 32, marginBottom: 12 }}>👋</p>
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

              {/* Instrumentos */}
              <motion.div key="gym-instrs"
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl"
                  style={{ background: 'rgba(12,12,28,0.98)', backdropFilter: 'blur(24px)', padding: '20px 24px 44px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>

                  <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.18)' }} />
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#fff' }}>¿Qué vas a practicar?</h2>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>Elige tu instrumento</p>
                    </div>
                    <button onClick={cerrarGym} className="w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: 'none', fontSize: 14 }}>✕</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {gymVisibles.length === 0 ? (
                      <p className="col-span-2 text-center py-8" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
                        Sin instrumentos asignados
                      </p>
                    ) : gymVisibles.map((g, i) => (
                      <InstrCard key={g.id} {...g} delay={i * 0.055} onClick={() => router.push(`/escuela/gym/${g.id}`)} />
                    ))}
                  </div>
                </motion.div>

            </AnimatePresence>
          </PanelBase>
        )}
      </AnimatePresence>

    </main>
  )
}
