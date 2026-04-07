'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'

// ── Tipos ──────────────────────────────────────────────────────
interface AdminUser {
  id: string
  email: string
  nombre: string | null
  role: 'student' | 'teacher' | 'admin'
  nivel: number
  puntos: number
  cursos_acceso: string[]
  clases_acceso: string[]
  created_at: string
}

// ── Mapa de cursos disponibles ─────────────────────────────────
const CURSOS_MAP = [
  { cursoId: 'piano',          claseId: 'piano',        label: 'Piano',      emoji: '🎹', color: '#ec488a' },
  { cursoId: 'bateria',        claseId: 'bateria',      label: 'Batería',    emoji: '🥁', color: '#3db8fa' },
  { cursoId: 'guitarra-adultos', claseId: 'guitarra',   label: 'Guitarra',   emoji: '🎸', color: '#ffa737' },
  { cursoId: 'violin',         claseId: 'violin',       label: 'Violín',     emoji: '🎻', color: '#9b54f9' },
  { cursoId: 'ciudad-musical', claseId: 'introduccion', label: 'Iniciación', emoji: '🎵', color: '#3db8fa' },
  { cursoId: 'canto',          claseId: 'canto',        label: 'Canto',      emoji: '🎤', color: '#ffa737' },
]

const ROLES = [
  { value: 'student', label: 'Estudiante' },
  { value: 'teacher', label: 'Profesor' },
  { value: 'admin',   label: 'Admin' },
]

// ── Helpers visuales ───────────────────────────────────────────
function initials(u: AdminUser) {
  if (u.nombre) return u.nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  return u.email[0].toUpperCase()
}

function avatarColor(email: string) {
  const colors = ['#ec488a', '#3db8fa', '#9b54f9', '#ffa737']
  let hash = 0
  for (const c of email) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return colors[hash % colors.length]
}

function roleBadge(role: string) {
  if (role === 'admin')   return { label: 'Admin',    bg: 'rgba(155,84,249,0.25)', color: '#c084ff' }
  if (role === 'teacher') return { label: 'Profesor', bg: 'rgba(61,184,250,0.2)',  color: '#3db8fa' }
  return { label: 'Estudiante', bg: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }
}

// ── Input reutilizable ─────────────────────────────────────────
function Field({
  label, type = 'text', value, onChange, placeholder, required,
}: {
  label: string; type?: string; value: string
  onChange: (v: string) => void; placeholder?: string; required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>
        {label}{required && <span style={{ color: '#ec488a' }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: '10px 14px',
          color: '#fff',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          outline: 'none',
          width: '100%',
        }}
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// PANEL ADMIN
// ══════════════════════════════════════════════════════════════
export default function AdminPage() {
  const { user, token, loading, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  const [users,      setUsers]      = useState<AdminUser[]>([])
  const [fetching,   setFetching]   = useState(true)
  const [saving,     setSaving]     = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId,   setDeleteId]   = useState<string | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [showLogout, setShowLogout] = useState(false)

  // ── Form crear usuario ─────────────────────────────────────
  const emptyForm = { nombre: '', email: '', password: '', role: 'student', cursos: [] as string[] }
  const [form,      setForm]      = useState(emptyForm)
  const [creating,  setCreating]  = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // ── Auth guard ─────────────────────────────────────────────
  useEffect(() => {
    if (loading) return
    if (!isAuthenticated) { router.replace('/login'); return }
    if (user?.role !== 'admin') { router.replace('/escuela'); return }
  }, [loading, isAuthenticated, user, router])

  // ── Fetch users ────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    if (!token) return
    setFetching(true)
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setUsers(data.users)
      else setError(data.error)
    } catch {
      setError('Error de conexión')
    } finally {
      setFetching(false)
    }
  }, [token])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') fetchUsers()
  }, [isAuthenticated, user, fetchUsers])

  // ── Toggle curso ───────────────────────────────────────────
  const toggleCurso = useCallback(async (userId: string, cursoId: string, claseId: string) => {
    setSaving(userId)
    const target = users.find(u => u.id === userId)
    if (!target) return

    const hasCurso = target.cursos_acceso?.includes(cursoId)
    const newCursos = hasCurso
      ? target.cursos_acceso.filter(c => c !== cursoId)
      : [...(target.cursos_acceso ?? []), cursoId]
    const newClases = hasCurso
      ? target.clases_acceso.filter(c => c !== claseId)
      : [...(target.clases_acceso ?? []), claseId]

    // Optimistic update
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, cursos_acceso: newCursos, clases_acceso: newClases } : u
    ))

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cursos_acceso: newCursos, clases_acceso: newClases }),
      })
      if (!res.ok) {
        // Revertir
        setUsers(prev => prev.map(u => u.id === userId ? target : u))
        setError('Error al guardar')
      }
    } catch {
      setUsers(prev => prev.map(u => u.id === userId ? target : u))
      setError('Error de conexión')
    } finally {
      setSaving(null)
    }
  }, [users, token])

  // ── Cambiar rol ────────────────────────────────────────────
  const changeRole = useCallback(async (userId: string, role: string) => {
    setSaving(userId)
    const target = users.find(u => u.id === userId)
    if (!target) return

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role as AdminUser['role'] } : u))

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? target : u))
        setError('Error al guardar')
      }
    } catch {
      setUsers(prev => prev.map(u => u.id === userId ? target : u))
    } finally {
      setSaving(null)
    }
  }, [users, token])

  // ── Crear usuario ──────────────────────────────────────────
  const handleCreate = async () => {
    setFormError(null)
    if (!form.email || !form.password) { setFormError('Email y contraseña son requeridos'); return }
    if (form.password.length < 6) { setFormError('La contraseña debe tener al menos 6 caracteres'); return }

    const cursos_acceso = form.cursos
    const clases_acceso = CURSOS_MAP.filter(c => form.cursos.includes(c.cursoId)).map(c => c.claseId)

    setCreating(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, cursos_acceso, clases_acceso }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error); return }
      setUsers(prev => [...prev, data.user])
      setShowCreate(false)
      setForm(emptyForm)
    } catch {
      setFormError('Error de conexión')
    } finally {
      setCreating(false)
    }
  }

  // ── Eliminar usuario ───────────────────────────────────────
  const handleDelete = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId))
        setDeleteId(null)
      } else {
        const d = await res.json()
        setError(d.error)
      }
    } catch {
      setError('Error de conexión')
    }
  }

  if (loading || !isAuthenticated || user?.role !== 'admin') return null

  // ── Render ─────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff' }}>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,26,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.button
            whileHover={{ x: -3 }} whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/escuela')}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 999, padding: '6px 14px',
              color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer',
            }}
          >
            ← Escuela
          </motion.button>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff' }}>
              Panel Admin
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
              {users.length} usuarios
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 32px rgba(236,72,138,0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowCreate(true); setFormError(null); setForm(emptyForm) }}
            style={{
              background: 'linear-gradient(135deg, #ec488a, #9b54f9)',
              border: 'none', borderRadius: 999,
              padding: '10px 20px',
              color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 14, cursor: 'pointer',
              boxShadow: '0 0 20px rgba(236,72,138,0.35)',
            }}
          >
            + Nuevo usuario
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLogout(true)}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 999, padding: '10px 16px',
              color: 'rgba(255,255,255,0.55)',
              fontFamily: 'var(--font-body)', fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Salir
          </motion.button>
        </div>
      </div>

      {/* ── Error global ─────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              margin: '16px 20px 0',
              background: 'rgba(236,72,138,0.15)', border: '1px solid rgba(236,72,138,0.3)',
              borderRadius: 12, padding: '10px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#ff7eb3' }}>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lista de usuarios ─────────────────────────────────── */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800, margin: '0 auto' }}>

        {fetching ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
            Cargando usuarios...
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
            No hay usuarios todavía
          </div>
        ) : (
          users.map(u => {
            const badge = roleBadge(u.role)
            const isSaving = saving === u.id
            return (
              <motion.div
                key={u.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 20,
                  padding: '16px 20px',
                  position: 'relative',
                  opacity: isSaving ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {/* ── Cabecera usuario ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: avatarColor(u.email),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff',
                    flexShrink: 0,
                  }}>
                    {initials(u)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.nombre ?? '—'}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.email}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Selector de rol */}
                    <select
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value)}
                      disabled={isSaving}
                      style={{
                        background: badge.bg, border: `1px solid ${badge.color}44`,
                        borderRadius: 999, padding: '4px 10px',
                        color: badge.color, fontFamily: 'var(--font-body)', fontSize: 12,
                        cursor: 'pointer', outline: 'none',
                      }}
                    >
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    {/* Eliminar */}
                    {u.id !== user?.id && (
                      <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setDeleteId(u.id)}
                        style={{
                          background: 'rgba(236,72,138,0.12)', border: '1px solid rgba(236,72,138,0.2)',
                          borderRadius: 999, width: 28, height: 28,
                          color: '#ec488a', cursor: 'pointer', fontSize: 13,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        ×
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* ── Stat row ── */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                  {[
                    { label: 'Nivel',  value: u.nivel },
                    { label: 'Puntos', value: u.puntos },
                  ].map(s => (
                    <div key={s.label} style={{
                      background: 'rgba(255,255,255,0.04)', borderRadius: 10,
                      padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{s.label}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#fff' }}>{s.value}</span>
                    </div>
                  ))}
                </div>

                {/* ── Cursos toggles ── */}
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8, letterSpacing: '0.04em' }}>
                    CURSOS CON ACCESO
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {CURSOS_MAP.map(c => {
                      const active = u.cursos_acceso?.includes(c.cursoId)
                      return (
                        <motion.button
                          key={c.cursoId}
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => toggleCurso(u.id, c.cursoId, c.claseId)}
                          disabled={isSaving}
                          style={{
                            border: `1px solid ${active ? c.color : 'rgba(255,255,255,0.1)'}`,
                            background: active ? `${c.color}22` : 'rgba(255,255,255,0.04)',
                            borderRadius: 999,
                            padding: '5px 12px',
                            color: active ? c.color : 'rgba(255,255,255,0.3)',
                            fontFamily: 'var(--font-body)', fontSize: 12,
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: 5,
                            transition: 'all 0.18s ease',
                          }}
                        >
                          <span>{c.emoji}</span>
                          <span>{c.label}</span>
                          {active && <span style={{ fontSize: 9, opacity: 0.7 }}>●</span>}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Saving indicator */}
                {isSaving && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)',
                  }}>
                    guardando...
                  </div>
                )}
              </motion.div>
            )
          })
        )}
      </div>

      {/* ════════════════════════════════════════
          MODAL — Crear usuario
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              key="backdrop-create"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCreate(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,26,0.75)', backdropFilter: 'blur(8px)', zIndex: 100 }}
            />
            <motion.div
              key="modal-create"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
                background: 'rgba(14,14,32,0.99)',
                backdropFilter: 'blur(24px)',
                borderTop: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '24px 24px 0 0',
                padding: '20px 20px 40px',
                maxHeight: '92vh', overflowY: 'auto',
              }}
            >
              {/* Handle */}
              <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 99, margin: '0 auto 20px' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: '#fff' }}>
                  Nuevo usuario
                </h2>
                <button onClick={() => setShowCreate(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 999, width: 32, height: 32, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14 }}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 480, margin: '0 auto' }}>
                <Field label="Nombre" value={form.nombre} onChange={v => setForm(f => ({ ...f, nombre: v }))} placeholder="María García" />
                <Field label="Email" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="maria@ejemplo.com" required />
                <Field label="Contraseña" type="password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} placeholder="mínimo 6 caracteres" required />

                {/* Rol */}
                <div className="flex flex-col gap-1">
                  <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>ROL</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {ROLES.map(r => (
                      <button
                        key={r.value}
                        onClick={() => setForm(f => ({ ...f, role: r.value }))}
                        style={{
                          flex: 1, padding: '9px 0', borderRadius: 12,
                          border: `1px solid ${form.role === r.value ? '#9b54f9' : 'rgba(255,255,255,0.1)'}`,
                          background: form.role === r.value ? 'rgba(155,84,249,0.2)' : 'rgba(255,255,255,0.04)',
                          color: form.role === r.value ? '#c084ff' : 'rgba(255,255,255,0.4)',
                          fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cursos */}
                <div>
                  <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em', display: 'block', marginBottom: 10 }}>
                    CURSOS CON ACCESO
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {CURSOS_MAP.map(c => {
                      const active = form.cursos.includes(c.cursoId)
                      return (
                        <motion.button
                          key={c.cursoId}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => setForm(f => ({
                            ...f,
                            cursos: active ? f.cursos.filter(id => id !== c.cursoId) : [...f.cursos, c.cursoId],
                          }))}
                          style={{
                            border: `1px solid ${active ? c.color : 'rgba(255,255,255,0.12)'}`,
                            background: active ? `${c.color}25` : 'rgba(255,255,255,0.05)',
                            borderRadius: 999, padding: '8px 16px',
                            color: active ? c.color : 'rgba(255,255,255,0.4)',
                            fontFamily: 'var(--font-body)', fontSize: 13,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>{c.emoji}</span>
                          <span>{c.label}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Error de formulario */}
                <AnimatePresence>
                  {formError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#ff7eb3', textAlign: 'center' }}
                    >
                      {formError}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 32px rgba(236,72,138,0.45)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCreate}
                  disabled={creating}
                  style={{
                    background: creating ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #ec488a, #9b54f9)',
                    border: 'none', borderRadius: 999,
                    padding: '14px 0', width: '100%',
                    color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                    cursor: creating ? 'not-allowed' : 'pointer',
                    boxShadow: creating ? 'none' : '0 0 20px rgba(236,72,138,0.3)',
                    marginTop: 4,
                  }}
                >
                  {creating ? 'Creando...' : 'Crear usuario'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          MODAL — Confirmar eliminar
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {deleteId && (
          <>
            <motion.div
              key="backdrop-del"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,26,0.8)', backdropFilter: 'blur(8px)', zIndex: 200 }}
            />
            <motion.div
              key="modal-del"
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                zIndex: 201, background: 'rgba(14,14,32,0.99)',
                border: '1px solid rgba(236,72,138,0.25)', borderRadius: 20,
                padding: '28px 24px', width: 'min(340px, 90vw)', textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 32, marginBottom: 12 }}>⚠️</p>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 8 }}>
                ¿Eliminar usuario?
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 24, lineHeight: 1.5 }}>
                Esta acción no se puede deshacer. Se eliminarán también su progreso y completions.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setDeleteId(null)}
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
                  onClick={() => handleDelete(deleteId)}
                  style={{
                    flex: 1, padding: '11px 0', borderRadius: 999,
                    background: 'linear-gradient(135deg, #ec488a, #c0355f)',
                    border: 'none',
                    color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  Eliminar
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          MODAL — Confirmar logout
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {showLogout && (
          <>
            <motion.div
              key="backdrop-logout"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLogout(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,26,0.8)', backdropFilter: 'blur(8px)', zIndex: 200 }}
            />
            <motion.div
              key="modal-logout"
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                zIndex: 201, background: 'rgba(14,14,32,0.99)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
                padding: '28px 24px', width: 'min(320px, 90vw)', textAlign: 'center',
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
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.15)',
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

    </main>
  )
}
