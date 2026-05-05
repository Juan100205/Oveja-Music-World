'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Users, BookOpen, UserPlus, X, AlertTriangle, LogOut, Trash2, Music, Pencil, KeyRound, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import ContentManager from './ContentManager'

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

// ── Tipos y constantes de instrumentos ────────────────────────
interface Instrumento {
  id: string; nombre: string; emoji: string; descripcion: string | null
  color: string; glow: string; zona: string; curso_id: string | null
  orden: number; activo: boolean
}

const COLOR_PRESETS = [
  { color: '#ec488a', glow: 'rgba(236,72,138,0.4)',  label: 'Rosa'     },
  { color: '#3db8fa', glow: 'rgba(61,184,250,0.4)',   label: 'Azul'     },
  { color: '#9b54f9', glow: 'rgba(155,84,249,0.4)',   label: 'Púrpura'  },
  { color: '#ffa737', glow: 'rgba(255,167,55,0.4)',   label: 'Naranja'  },
  { color: '#34d399', glow: 'rgba(52,211,153,0.4)',   label: 'Verde'    },
  { color: '#f43f5e', glow: 'rgba(244,63,94,0.4)',    label: 'Rojo'     },
  { color: '#facc15', glow: 'rgba(250,204,21,0.4)',   label: 'Amarillo' },
  { color: '#64748b', glow: 'rgba(100,116,139,0.4)',  label: 'Gris'     },
]

const EMPTY_INSTR_FORM = {
  id: '', nombre: '', emoji: '🎵', descripcion: '', color: '#ec488a',
  glow: 'rgba(236,72,138,0.4)', zona: 'clase', curso_id: '',
  crear_curso_vacio: true,
}

// ── Mapa de cursos disponibles ─────────────────────────────────
const CURSOS_MAP = [
  { cursoId: 'piano',          claseId: 'piano',        label: 'Piano',      emoji: '🎹', color: '#ec488a' },
  { cursoId: 'bateria',        claseId: 'bateria',      label: 'Batería',    emoji: '🥁', color: '#3db8fa' },
  { cursoId: 'guitarra-adultos', claseId: 'guitarra',   label: 'Guitarra',   emoji: '🎸', color: '#ffa737' },
  { cursoId: 'violin',         claseId: 'violin',       label: 'Violín',     emoji: '🎻', color: '#9b54f9' },
  { cursoId: 'ciudad-musical', claseId: 'introduccion', label: 'Iniciación', emoji: '🎵', color: '#3db8fa' },
  { cursoId: 'canto',          claseId: 'canto',        label: 'Canto',      emoji: '🎤', color: '#ffa737' },
  { cursoId: 'ukelele',        claseId: 'ukelele',      label: 'Ukelele',    emoji: '🎶', color: '#34d399' },
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

  const [activeTab,   setActiveTab]   = useState<'usuarios' | 'contenido' | 'instrumentos' | 'manual'>('usuarios')
  const [users,      setUsers]      = useState<AdminUser[]>([])
  const [fetching,   setFetching]   = useState(true)
  const [saving,     setSaving]     = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId,   setDeleteId]   = useState<string | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [changePwdId,      setChangePwdId]      = useState<string | null>(null)
  const [newPwd,           setNewPwd]           = useState('')
  const [changePwdSaving,  setChangePwdSaving]  = useState(false)
  const [changePwdError,   setChangePwdError]   = useState<string | null>(null)
  const [showLogout, setShowLogout] = useState(false)

  // ── Instrumentos ───────────────────────────────────────────
  const [instrumentos,    setInstrumentos]    = useState<Instrumento[]>([])
  const [fetchingInstrs,  setFetchingInstrs]  = useState(false)
  const [hasFetchedInstrs,setHasFetchedInstrs]= useState(false)   // ← evita loop infinito con tabla vacía
  const [showNewInstr,    setShowNewInstr]    = useState(false)
  const [instrForm,       setInstrForm]       = useState(EMPTY_INSTR_FORM)
  const [creatingInstr,   setCreatingInstr]   = useState(false)
  const [instrFormError,  setInstrFormError]  = useState<string | null>(null)
  const [instrToDelete, setInstrToDelete] = useState<Instrumento | null>(null)
  const [confirmDeleteText, setConfirmDeleteText] = useState('')

  const fetchInstrumentos = useCallback(async () => {
    if (!token) return
    setFetchingInstrs(true)
    try {
      const res = await fetch('/api/admin/instrumentos', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) setInstrumentos(data.instrumentos ?? [])
    } catch { /* ignore */ }
    finally {
      setFetchingInstrs(false)
      setHasFetchedInstrs(true)   // marcar como cargado aunque esté vacío
    }
  }, [token])

  // Cargar instrumentos al autenticarse (necesario para CURSOS_MAP dinámico en la pestaña usuarios)
  // hasFetchedInstrs evita recargas innecesarias
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin' && !hasFetchedInstrs && !fetchingInstrs) {
      fetchInstrumentos()
    }
  }, [isAuthenticated, user, hasFetchedInstrs, fetchingInstrs, fetchInstrumentos])

  const handleSaveInstr = async () => {
    setInstrFormError(null)
    if (!instrForm.nombre.trim()) { setInstrFormError('El nombre es requerido'); return }
    setCreatingInstr(true)
    try {
      const isEdit = !!instrForm.id && instrumentos.some(i => i.id === instrForm.id)
      const url = isEdit ? `/api/admin/instrumentos/${instrForm.id}` : '/api/admin/instrumentos'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nombre:      instrForm.nombre,
          emoji:       instrForm.emoji || '🎵',
          descripcion: instrForm.descripcion || null,
          color:       instrForm.color,
          glow:        instrForm.glow,
          zona:        instrForm.zona,
          curso_id:    instrForm.curso_id || null,
          crear_curso_vacio: isEdit ? false : instrForm.crear_curso_vacio,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setInstrFormError(data.error); return }
      
      if (isEdit) {
        setInstrumentos(prev => prev.map(i => i.id === instrForm.id ? data.instrumento : i))
      } else {
        setInstrumentos(prev => [...prev, data.instrumento])
      }
      
      setShowNewInstr(false)
      setInstrForm(EMPTY_INSTR_FORM)
    } catch { setInstrFormError('Error de conexión') }
    finally { setCreatingInstr(false) }
  }

  const handleDeleteInstr = async () => {
    if (!instrToDelete) return
    if (confirmDeleteText !== instrToDelete.nombre) {
      setError('El nombre no coincide')
      return
    }
    try {
      const res = await fetch(`/api/admin/instrumentos/${instrToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setInstrumentos(prev => prev.filter(i => i.id !== instrToDelete.id))
        setInstrToDelete(null)
        setConfirmDeleteText('')
      }
      else setError('Error al eliminar instrumento')
    } catch { setError('Error de conexión') }
  }

  const cancelDeleteInstr = () => {
    setInstrToDelete(null)
    setConfirmDeleteText('')
  }

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

  // ── Instrumentos consolidados (Estáticos + DB) ───────
  const mergeInstrs = (staticList: any[], dynamicList: Instrumento[]): Instrumento[] => {
    const dynIds = new Set(dynamicList.map(d => d.id))
    const filteredStatic = staticList.map(s => ({
      id: s.id || s.claseId,
      nombre: s.nombre || s.label,
      emoji: s.emoji,
      descripcion: s.descripcion || '',
      color: s.color?.includes('gradient') ? s.color.match(/#[0-9a-fA-F]{6}/)?.[0] ?? '#ec488a' : s.color,
      glow: s.glow || 'rgba(255,255,255,0.2)',
      zona: 'clase',
      curso_id: s.cursoId || s.claseId,
      orden: 0,
      activo: true
    })).filter(s => !dynIds.has(s.id))
    return [...filteredStatic, ...dynamicList]
  }

  // Usamos el listado de clases estáticas base para asegurar que siempre aparezcan
  const allInstrumentos = mergeInstrs(CURSOS_MAP, instrumentos)

  const activeCursosMap = allInstrumentos.map(i => ({
    cursoId: i.curso_id ?? i.id,
    claseId: i.id,
    label:   i.nombre,
    emoji:   i.emoji,
    color:   i.color
  }))

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
    const clases_acceso = activeCursosMap.filter(c => form.cursos.includes(c.cursoId)).map(c => c.claseId)

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

  // ── Cambiar contraseña ────────────────────────────────────
  const handleChangePwd = async () => {
    setChangePwdError(null)
    if (!newPwd || newPwd.length < 6) { setChangePwdError('Mínimo 6 caracteres'); return }
    if (!changePwdId) return
    setChangePwdSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${changePwdId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) { setChangePwdError(data.error); return }
      setChangePwdId(null)
      setNewPwd('')
    } catch {
      setChangePwdError('Error de conexión')
    } finally {
      setChangePwdSaving(false)
    }
  }

  if (loading || !isAuthenticated || user?.role !== 'admin') return null

  // ── Render ─────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff' }}>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="admin-topbar" style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,26,0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8,
      }}>
        <div className="admin-brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button
            whileHover={{ x: -3 }} whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/escuela')}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 999, padding: '6px 12px',
              color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <ArrowLeft size={13} strokeWidth={1.5} /> <span className="admin-back-label">Escuela</span>
          </motion.button>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#fff', margin: 0 }}>
              Panel Admin
            </h1>
            <p className="admin-subtitle" style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
              {activeTab === 'usuarios' ? `${users.length} usuarios` : activeTab === 'contenido' ? 'Gestión de contenido' : activeTab === 'manual' ? 'Manual de uso' : `${instrumentos.length} instrumento${instrumentos.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <div className="admin-tabs" style={{
          display: 'flex', gap: 4,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 4,
        }}>
          {(['usuarios', 'contenido', 'instrumentos', 'manual'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '7px 16px', borderRadius: 9, border: 'none',
                background: activeTab === tab ? 'rgba(236,72,138,0.2)' : 'transparent',
                color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.4)',
                fontFamily: 'var(--font-display)', fontWeight: activeTab === tab ? 700 : 400,
                fontSize: 13, cursor: 'pointer',
                borderBottom: activeTab === tab ? '2px solid #ec488a' : '2px solid transparent',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {tab === 'usuarios'     ? <><Users    size={14} strokeWidth={1.5} /> Usuarios</>
             : tab === 'contenido'   ? <><BookOpen  size={14} strokeWidth={1.5} /> Contenido</>
             : tab === 'manual'      ? <><FileText  size={14} strokeWidth={1.5} /> Manual</>
             :                         <><Music     size={14} strokeWidth={1.5} /> Instrumentos</>
              }
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {activeTab === 'usuarios' && (
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 32px rgba(236,72,138,0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowCreate(true); setFormError(null); setForm(emptyForm) }}
            style={{
              background: 'linear-gradient(135deg, #ec488a, #9b54f9)',
              border: 'none', borderRadius: 999,
              padding: '9px 16px',
              color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 13, cursor: 'pointer',
              boxShadow: '0 0 20px rgba(236,72,138,0.35)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <UserPlus size={14} strokeWidth={1.5} /> <span className="admin-new-label">Nuevo usuario</span>
          </motion.button>
          )}

          {activeTab === 'instrumentos' && (
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 32px rgba(155,84,249,0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowNewInstr(true); setInstrFormError(null); setInstrForm(EMPTY_INSTR_FORM) }}
            style={{
              background: 'linear-gradient(135deg, #9b54f9, #3db8fa)',
              border: 'none', borderRadius: 999,
              padding: '9px 16px',
              color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 13, cursor: 'pointer',
              boxShadow: '0 0 20px rgba(155,84,249,0.35)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Music size={14} strokeWidth={1.5} /> <span className="admin-new-label">Nuevo instrumento</span>
          </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLogout(true)}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 999, padding: '9px 14px',
              color: 'rgba(255,255,255,0.55)',
              fontFamily: 'var(--font-body)', fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Salir
          </motion.button>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .admin-topbar { padding: 10px 14px !important; }
          .admin-brand { flex: 1 !important; min-width: 0; }
          .admin-subtitle { display: none !important; }
          .admin-tabs { order: 3; width: 100% !important; justify-content: stretch !important; }
          .admin-tabs button { flex: 1 !important; justify-content: center !important; }
          .admin-new-label { display: none !important; }
        }
      `}</style>

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
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={14} strokeWidth={1.5} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tab: Manual ──────────────────────────────────────── */}
      {activeTab === 'manual' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Manual de uso · Oveja Music World v1.0
            </span>
            <a
              href="/manual.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 999,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.55)',
                fontFamily: 'var(--font-body)', fontSize: 12,
                textDecoration: 'none', cursor: 'pointer',
              }}
            >
              <FileText size={13} strokeWidth={1.5} /> Abrir en nueva pestaña
            </a>
          </div>
          <iframe
            src="/manual.html"
            style={{ flex: 1, border: 'none', width: '100%' }}
            title="Manual de uso"
          />
        </div>
      )}

      {/* ── Tab: Contenido ───────────────────────────────────── */}
      {activeTab === 'contenido' && token && (
        <ContentManager token={token} />
      )}

      {/* ── Tab: Instrumentos ────────────────────────────────── */}
      {activeTab === 'instrumentos' && (
        <div style={{ padding: '24px 20px', maxWidth: 860, margin: '0 auto' }}>

          {fetchingInstrs ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)' }}>
              Cargando instrumentos...
            </div>
          ) : instrumentos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎵</div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
                No hay instrumentos registrados todavía.
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>
                Usa el botón &quot;Nuevo instrumento&quot; para agregar.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {allInstrumentos.map(inst => {
                const isStaticOnly = !instrumentos.some(i => i.id === inst.id)
                return (
                  <motion.div
                    key={inst.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 18px', borderRadius: 14,
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${inst.color}33`,
                      opacity: isStaticOnly ? 0.7 : 1,
                    }}
                  >
                    {/* Emoji + color dot */}
                    <div style={{
                      width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                      background: `${inst.color}18`,
                      border: `1px solid ${inst.color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22,
                    }}>
                      {inst.emoji}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff', margin: 0 }}>
                          {inst.nombre}
                        </p>
                        <span style={{
                          padding: '2px 8px', borderRadius: 999, fontSize: 10, fontFamily: 'var(--font-body)',
                          background: inst.zona === 'clase' ? 'rgba(61,184,250,0.15)' : inst.zona === 'gym' ? 'rgba(155,84,249,0.15)' : 'rgba(255,255,255,0.08)',
                          color: inst.zona === 'clase' ? '#3db8fa' : inst.zona === 'gym' ? '#c084ff' : 'rgba(255,255,255,0.5)',
                          border: `1px solid ${inst.zona === 'clase' ? 'rgba(61,184,250,0.3)' : inst.zona === 'gym' ? 'rgba(155,84,249,0.3)' : 'rgba(255,255,255,0.1)'}`,
                        }}>
                          {inst.zona === 'clase' ? '🏫 Clase' : inst.zona === 'gym' ? '🏋️ Gym' : '↔ Ambos'}
                        </span>
                        {isStaticOnly && (
                          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                            Código estático
                          </span>
                        )}
                      </div>
                      {inst.descripcion && (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '3px 0 0' }}>
                          {inst.descripcion}
                        </p>
                      )}
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.2)', margin: '3px 0 0' }}>
                        id: {inst.id}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setInstrForm({
                            id: inst.id,
                            nombre: inst.nombre,
                            emoji: inst.emoji,
                            descripcion: inst.descripcion ?? '',
                            color: inst.color,
                            glow: inst.glow,
                            zona: inst.zona,
                            curso_id: inst.curso_id ?? '',
                            crear_curso_vacio: false
                          })
                          setShowNewInstr(true)
                        }}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Pencil size={13} strokeWidth={1.5} />
                      </motion.button>

                      {!isStaticOnly && (
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setInstrToDelete(inst)}
                          style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.2)',
                            color: 'rgba(255,82,82,0.7)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={13} strokeWidth={1.5} />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Nuevo Instrumento ──────────────────────────── */}
      <AnimatePresence>
        {showNewInstr && (
          <>
            <motion.div
              key="instr-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowNewInstr(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(5,5,18,0.85)', backdropFilter: 'blur(12px)' }}
            />
            <motion.div
              key="instr-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="fixed inset-0 m-auto h-fit z-[101]"
              style={{
                width: 'min(480px, 90vw)',
                background: 'rgba(12,12,28,0.99)',
                border: '1px solid rgba(155,84,249,0.25)',
                borderRadius: 20, padding: '28px 24px',
                boxShadow: '0 0 60px rgba(155,84,249,0.2)',
                maxHeight: '92vh', overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff', margin: 0 }}>
                  🎵 Nuevo Instrumento
                </h2>
                <button onClick={() => setShowNewInstr(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Nombre */}
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
                    Nombre <span style={{ color: '#ec488a' }}>*</span>
                  </label>
                  <input
                    value={instrForm.nombre}
                    onChange={e => setInstrForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej: Ukulele, Saxofón, Flauta..."
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 12, boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
                    }}
                  />
                </div>

                {/* Emoji */}
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
                    Emoji
                  </label>
                  <input
                    value={instrForm.emoji}
                    onChange={e => setInstrForm(f => ({ ...f, emoji: e.target.value }))}
                    placeholder="🎵"
                    style={{
                      width: 80, padding: '10px 14px', borderRadius: 12, textAlign: 'center',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontFamily: 'var(--font-body)', fontSize: 22, outline: 'none',
                    }}
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
                    Descripción corta
                  </label>
                  <input
                    value={instrForm.descripcion}
                    onChange={e => setInstrForm(f => ({ ...f, descripcion: e.target.value }))}
                    placeholder="Ej: Técnica, ritmo y melodía"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 12, boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
                    }}
                  />
                </div>

                {/* Color */}
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
                    Color <span style={{ color: '#ec488a' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {COLOR_PRESETS.map(p => (
                      <button
                        key={p.color}
                        onClick={() => setInstrForm(f => ({ ...f, color: p.color, glow: p.glow }))}
                        title={p.label}
                        style={{
                          width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
                          background: p.color,
                          boxShadow: instrForm.color === p.color ? `0 0 14px ${p.glow}, 0 0 0 3px rgba(255,255,255,0.8)` : `0 0 8px ${p.glow}`,
                          transform: instrForm.color === p.color ? 'scale(1.15)' : 'scale(1)',
                          transition: 'all 0.15s',
                        }}
                      />
                    ))}
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
                    Seleccionado: <span style={{ color: instrForm.color }}>{instrForm.color}</span>
                  </p>
                </div>

                {/* Zona */}
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
                    Zona <span style={{ color: '#ec488a' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['clase', 'gym', 'ambos'] as const).map(z => (
                      <button
                        key={z}
                        onClick={() => setInstrForm(f => ({ ...f, zona: z }))}
                        style={{
                          padding: '7px 16px', borderRadius: 999, cursor: 'pointer',
                          fontFamily: 'var(--font-body)', fontSize: 12,
                          background: instrForm.zona === z
                            ? (z === 'clase' ? 'rgba(61,184,250,0.25)' : z === 'gym' ? 'rgba(155,84,249,0.25)' : 'rgba(255,255,255,0.12)')
                            : 'rgba(255,255,255,0.05)',
                          color: instrForm.zona === z
                            ? (z === 'clase' ? '#3db8fa' : z === 'gym' ? '#c084ff' : '#fff')
                            : 'rgba(255,255,255,0.35)',
                          border: `1px solid ${instrForm.zona === z ? (z === 'clase' ? 'rgba(61,184,250,0.4)' : z === 'gym' ? 'rgba(155,84,249,0.4)' : 'rgba(255,255,255,0.2)') : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        {z === 'clase' ? '🏫 Clase' : z === 'gym' ? '🏋️ Gym' : '↔ Ambos'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Curso ID (opcional) */}
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
                    ID de Curso (opcional)
                  </label>
                  <input
                    value={instrForm.curso_id}
                    onChange={e => setInstrForm(f => ({ ...f, curso_id: e.target.value }))}
                    placeholder="Ej: ukulele-adultos"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 12, boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none',
                    }}
                  />
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                    Si lo dejas vacío y marcas la opción de abajo, se genera un id de curso desde el nombre.
                  </p>
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={instrForm.crear_curso_vacio}
                    onChange={e => setInstrForm(f => ({ ...f, crear_curso_vacio: e.target.checked }))}
                    style={{ marginTop: 3, accentColor: '#9b54f9' }}
                  />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.45 }}>
                    <strong style={{ color: '#fff' }}>Crear curso vacío en Contenido</strong>
                    <br />
                    Se crea la fila en la base de datos para que en la pestaña Contenido puedas añadir módulos y recursos desde cero. Desmárcalo solo si ya existe un curso y lo enlazas arriba.
                  </span>
                </label>

                {/* Preview */}
                <div style={{
                  padding: '12px 16px', borderRadius: 12,
                  background: `${instrForm.color}12`,
                  border: `1px solid ${instrForm.color}33`,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `${instrForm.color}20`, border: `1px solid ${instrForm.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                  }}>
                    {instrForm.emoji || '🎵'}
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff', margin: 0 }}>
                      {instrForm.nombre || 'Nombre del instrumento'}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>
                      {instrForm.descripcion || 'Descripción'}
                    </p>
                  </div>
                </div>

                {instrFormError && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#ff7eb3', margin: 0 }}>
                    {instrFormError}
                  </p>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleSaveInstr}
                    disabled={creatingInstr}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                      background: creatingInstr ? 'rgba(155,84,249,0.3)' : 'linear-gradient(135deg, #9b54f9, #3db8fa)',
                      color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700,
                      fontSize: 14, cursor: creatingInstr ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {creatingInstr ? 'Creando...' : '✓ Crear Instrumento'}
                  </motion.button>
                  <button
                    onClick={() => setShowNewInstr(false)}
                    style={{
                      padding: '12px 20px', borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: 'rgba(255,255,255,0.4)',
                      fontFamily: 'var(--font-body)', fontSize: 13, cursor: 'pointer',
                    }}
                  >Cancelar</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Tab: Usuarios ─────────────────────────────────────── */}
      {activeTab === 'usuarios' && (
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
                    {/* Cambiar contraseña */}
                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => { setChangePwdId(u.id); setNewPwd(''); setChangePwdError(null) }}
                      style={{
                        background: 'rgba(61,184,250,0.1)', border: '1px solid rgba(61,184,250,0.2)',
                        borderRadius: 999, width: 28, height: 28,
                        color: '#3db8fa', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <KeyRound size={13} strokeWidth={1.5} />
                    </motion.button>
                    {/* Eliminar */}
                    {u.id !== user?.id && (
                      <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setDeleteId(u.id)}
                        style={{
                          background: 'rgba(236,72,138,0.12)', border: '1px solid rgba(236,72,138,0.2)',
                          borderRadius: 999, width: 28, height: 28,
                          color: '#ec488a', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Trash2 size={13} strokeWidth={1.5} />
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
                    {activeCursosMap.map(c => {
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
      )} {/* fin activeTab === 'usuarios' */}

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
                <button onClick={() => setShowCreate(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 999, width: 32, height: 32, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} strokeWidth={1.5} /></button>
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
                    {activeCursosMap.map(c => {
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
              className="fixed inset-0 m-auto h-fit z-[201]"
              style={{
                background: 'rgba(14,14,32,0.99)',
                border: '1px solid rgba(236,72,138,0.25)', borderRadius: 20,
                padding: '28px 24px', width: 'min(340px, 90vw)', textAlign: 'center',
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(236,72,138,0.1)', border: '1px solid rgba(236,72,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <AlertTriangle size={24} strokeWidth={1.5} style={{ color: '#ec488a' }} />
              </div>
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
          MODAL — Cambiar contraseña
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {changePwdId && (
          <>
            <motion.div
              key="backdrop-pwd"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setChangePwdId(null); setNewPwd('') }}
              className="fixed inset-0 z-[200]"
              style={{ background: 'rgba(10,10,26,0.7)', backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              key="modal-pwd"
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="fixed inset-0 m-auto h-fit z-[201]"
              style={{
                background: 'rgba(14,14,32,0.99)',
                border: '1px solid rgba(61,184,250,0.25)', borderRadius: 20,
                padding: '28px 24px', width: 'min(340px, 90vw)', textAlign: 'center',
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(61,184,250,0.1)', border: '1px solid rgba(61,184,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <KeyRound size={24} strokeWidth={1.5} style={{ color: '#3db8fa' }} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 4 }}>
                Cambiar contraseña
              </h3>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20, lineHeight: 1.5 }}>
                {users.find(u => u.id === changePwdId)?.email}
              </p>

              {changePwdError && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#ec488a', marginBottom: 12, background: 'rgba(236,72,138,0.08)', borderRadius: 10, padding: '8px 12px' }}>
                  {changePwdError}
                </p>
              )}

              <input
                type="password"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChangePwd()}
                placeholder="Nueva contraseña"
                autoFocus
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(61,184,250,0.25)', borderRadius: 12,
                  padding: '11px 14px', color: '#fff',
                  fontFamily: 'var(--font-body)', fontSize: 14,
                  outline: 'none', marginBottom: 20, boxSizing: 'border-box',
                }}
              />

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setChangePwdId(null); setNewPwd('') }}
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
                  onClick={handleChangePwd}
                  disabled={changePwdSaving}
                  style={{
                    flex: 1, padding: '11px 0', borderRadius: 999,
                    background: 'linear-gradient(135deg, #3db8fa, #9b54f9)',
                    border: 'none', opacity: changePwdSaving ? 0.6 : 1,
                    color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  {changePwdSaving ? 'Guardando...' : 'Guardar'}
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
              className="fixed inset-0 m-auto h-fit z-[201]"
              style={{
                background: 'rgba(14,14,32,0.99)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
                padding: '28px 24px', width: 'min(320px, 90vw)', textAlign: 'center',
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
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

      {/* ════════════════════════════════════════
          MODAL — Confirmar eliminar instrumento (tipo GitHub)
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {instrToDelete && (
          <>
            <motion.div
              key="backdrop-del-instr"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={cancelDeleteInstr}
              style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,26,0.85)', backdropFilter: 'blur(10px)', zIndex: 200 }}
            />
            <motion.div
              key="modal-del-instr"
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-0 m-auto h-fit z-[201]"
              style={{
                background: 'linear-gradient(180deg, rgba(18,18,35,0.99) 0%, rgba(14,14,32,0.99) 100%)',
                border: '1px solid rgba(255,82,82,0.3)', borderRadius: 16,
                padding: '32px 28px', width: 'min(420px, 90vw)',
              }}
            >
              {/* Header con icono */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <AlertTriangle size={22} strokeWidth={1.5} style={{ color: '#ff5252' }} />
                </div>
                <div>
                  <h3 style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#fff', margin: 0,
                  }}>
                    Eliminar instrumento
                  </h3>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0',
                  }}>
                    Esta acción es irreversible
                  </p>
                </div>
              </div>

              {/* Alert box */}
              <div style={{
                padding: '14px 16px', borderRadius: 10,
                background: 'rgba(255,82,82,0.06)', border: '1px solid rgba(255,82,82,0.15)',
                marginBottom: 20,
              }}>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.7)',
                  margin: 0, lineHeight: 1.5,
                }}>
                  <strong style={{ color: '#ff5252' }}>Atención:</strong> Se eliminarán todos los datos asociados a <strong style={{ color: '#fff' }}>{instrToDelete.nombre}</strong>, incluyendo su configuración y curso vinculado.
                </p>
              </div>

              {/* Input de confirmación */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block', fontFamily: 'var(--font-body)', fontSize: 13,
                  color: 'rgba(255,255,255,0.6)', marginBottom: 8,
                }}>
                  Escribe <strong style={{ color: '#ff5252', fontFamily: 'var(--font-display)' }}>{instrToDelete.nombre}</strong> para confirmar:
                </label>
                <input
                  type="text"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                  placeholder={instrToDelete.nombre}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 10,
                    background: 'rgba(0,0,0,0.3)', border: `1px solid ${confirmDeleteText === instrToDelete.nombre ? 'rgba(255,82,82,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    color: '#fff', fontFamily: 'var(--font-body)', fontSize: 14,
                    outline: 'none', transition: 'border-color 0.2s',
                  }}
                  autoFocus
                />
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={cancelDeleteInstr}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 999,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)', fontSize: 14,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={confirmDeleteText === instrToDelete.nombre ? { scale: 1.02 } : {}}
                  whileTap={confirmDeleteText === instrToDelete.nombre ? { scale: 0.98 } : {}}
                  onClick={handleDeleteInstr}
                  disabled={confirmDeleteText !== instrToDelete.nombre}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 999,
                    background: confirmDeleteText === instrToDelete.nombre
                      ? 'linear-gradient(135deg, #ff5252, #c03535)'
                      : 'rgba(255,82,82,0.2)',
                    border: 'none',
                    color: confirmDeleteText === instrToDelete.nombre ? '#fff' : 'rgba(255,255,255,0.4)',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
                    cursor: confirmDeleteText === instrToDelete.nombre ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                  }}
                >
                  Eliminar permanentemente
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </main>
  )
}
