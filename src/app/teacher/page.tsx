'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Users, BookOpen, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import ContentManager from '@/app/admin/ContentManager'
import { useInstrumentos } from '@/hooks/useInstrumentos'
import { usePageScroll } from '@/hooks/usePageScroll'

// ── Tipos ──────────────────────────────────────────────────────
interface Student {
  id: string
  email: string
  nombre: string | null
  nivel: number
  puntos: number
  cursos_acceso: string[]
  clases_acceso?: string[]
  created_at: string
}

interface Draft {
  nivel: number
  puntos: number
  clases: string[]
}

// ── Helpers visuales ───────────────────────────────────────────
const NIVEL_LABELS = ['', 'Principiante', 'Aprendiz', 'Intermedio', 'Avanzado', 'Maestro']
const NIVEL_COLORS = ['', '#aaa', '#3db8fa', '#ffa737', '#9b54f9', '#ec488a']

function initials(s: Student) {
  if (s.nombre) return s.nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  return s.email[0].toUpperCase()
}

function avatarColor(email: string) {
  const colors = ['#ec488a', '#3db8fa', '#9b54f9', '#ffa737']
  let hash = 0
  for (const c of email) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return colors[hash % colors.length]
}

// ── Barra de progreso de nivel ──────────────────────────────────
const PUNTOS_NIVEL = [0, 100, 300, 600, 1000]
function NivelBar({ nivel, puntos }: { nivel: number; puntos: number }) {
  const ptsActual = PUNTOS_NIVEL[nivel - 1] ?? 0
  const ptsSig    = PUNTOS_NIVEL[nivel] ?? puntos
  const progress  = ptsSig > ptsActual ? Math.min((puntos - ptsActual) / (ptsSig - ptsActual), 1) : 1
  const color     = NIVEL_COLORS[nivel] ?? '#aaa'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: 11,
        color, background: `${color}22`,
        border: `1px solid ${color}44`,
        borderRadius: 20, padding: '2px 9px', whiteSpace: 'nowrap',
      }}>
        {NIVEL_LABELS[nivel]}
      </span>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 4, minWidth: 60 }}>
        <div style={{ height: '100%', width: `${progress * 100}%`, background: color, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
        {puntos} pts
      </span>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function TeacherPage() {
  usePageScroll()
  const { user, token, loading, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const { clases } = useInstrumentos(token ?? null)
  const [tab, setTab] = useState<'clases' | 'estudiantes'>('clases')
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [errorStudents, setErrorStudents] = useState<string | null>(null)

  // ── Edit state ────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<Record<string, string>>({})

  // Guard: redirigir a login si no hay sesión, o a escuela si no es teacher/admin
  useEffect(() => {
    if (loading) return
    if (!isAuthenticated) { router.replace('/login'); return }
    if (user && user.role !== 'teacher' && user.role !== 'admin') {
      router.replace('/escuela')
    }
  }, [loading, isAuthenticated, user, router])

  const fetchStudents = useCallback(async () => {
    if (!token) return
    setLoadingStudents(true)
    setErrorStudents(null)
    try {
      const res = await fetch('/api/teacher/students', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStudents(data.students ?? [])
    } catch (e) {
      setErrorStudents(e instanceof Error ? e.message : 'Error al cargar estudiantes')
    } finally {
      setLoadingStudents(false)
    }
  }, [token])

  useEffect(() => {
    if (tab === 'estudiantes') fetchStudents()
  }, [tab, fetchStudents])

  function openEdit(s: Student) {
    if (editingId === s.id) { setEditingId(null); return }
    setEditingId(s.id)
    setSaveError(prev => { const n = { ...prev }; delete n[s.id]; return n })
    setDrafts(prev => ({
      ...prev,
      [s.id]: {
        nivel:  s.nivel,
        puntos: s.puntos,
        clases: s.clases_acceso ? [...s.clases_acceso] : [],
      },
    }))
  }

  function patchDraft(id: string, patch: Partial<Draft>) {
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  async function saveStudent(id: string) {
    if (!token) return
    const draft = drafts[id]
    if (!draft) return
    setSaving(id)
    setSaveError(prev => { const n = { ...prev }; delete n[id]; return n })
    try {
      const res = await fetch(`/api/teacher/students/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nivel:          draft.nivel,
          puntos:         draft.puntos,
          clases_acceso:  draft.clases,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar')
      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...data.student } : s))
      setEditingId(null)
    } catch (e) {
      setSaveError(prev => ({
        ...prev,
        [id]: e instanceof Error ? e.message : 'Error al guardar',
      }))
    } finally {
      setSaving(null)
    }
  }

  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) return null

  const tabs = [
    { id: 'clases',       label: 'Mis Clases',      Icon: BookOpen },
    { id: 'estudiantes',  label: 'Mis Estudiantes',  Icon: Users },
  ] as const

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff' }}>

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="teacher-topbar" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,26,0.96)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px', height: 56, flexWrap: 'wrap',
      }}>
        <div className="teacher-brand" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GraduationCap size={18} strokeWidth={1.5} style={{ color: '#ec488a' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#ec488a' }}>Panel Docente</span>
        </div>

        {/* Tabs */}
        <div className="teacher-tabs" style={{ display: 'flex', gap: 4, flex: 1 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                background: tab === t.id ? 'rgba(236,72,138,0.15)' : 'transparent',
                color: tab === t.id ? '#ec488a' : 'rgba(255,255,255,0.45)',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <t.Icon size={14} strokeWidth={1.5} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); router.push('/login') }}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '5px 12px', color: 'rgba(255,255,255,0.5)',
            fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          }}
        >
          <LogOut size={13} strokeWidth={1.5} /> <span className="teacher-logout-label">Salir</span>
        </button>
      </div>

      {/* ── Contenido ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {tab === 'clases' && (
          <motion.div
            key="clases"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {token && (
              <ContentManager
                token={token}
                apiBase="/api/teacher/content"
                allowedCursoIds={user.cursos_acceso ?? []}
              />
            )}
          </motion.div>
        )}

        {tab === 'estudiantes' && (
          <motion.div
            key="estudiantes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ padding: '24px 16px', maxWidth: 900, margin: '0 auto' }}
          >
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: 0 }}>
                Mis Estudiantes
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                Estudiantes con acceso a tus cursos
              </p>
            </div>

            {loadingStudents && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(236,72,138,0.3)', borderTopColor: '#ec488a', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}

            {errorStudents && (
              <p style={{ color: '#ff5252', fontFamily: 'var(--font-body)', fontSize: 14 }}>{errorStudents}</p>
            )}

            {!loadingStudents && !errorStudents && students.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-body)' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <Users size={24} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.2)' }} />
                </div>
                <p>No hay estudiantes en tus cursos todavía.</p>
              </div>
            )}

            {!loadingStudents && !errorStudents && students.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Header — oculto en móvil */}
                <div className="student-header" style={{
                  display: 'grid', gridTemplateColumns: '1fr 180px 80px',
                  padding: '8px 16px',
                  fontFamily: 'var(--font-body)', fontSize: 11,
                  color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  <span>Estudiante</span>
                  <span>Progreso</span>
                  <span style={{ textAlign: 'right' }}>Cursos</span>
                </div>

                {students.map(s => {
                  const isEditing = editingId === s.id
                  const draft = drafts[s.id]
                  const isSaving = saving === s.id
                  return (
                  <motion.div
                    key={s.id}
                    className="student-row"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isEditing ? 'rgba(236,72,138,0.3)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 14, padding: '14px 16px',
                    }}
                  >
                    {/* ── Main row ── */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 180px 80px',
                      alignItems: 'center', gap: 16,
                    }}>
                      {/* Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                          background: `${avatarColor(s.email)}22`,
                          border: `1px solid ${avatarColor(s.email)}44`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
                          color: avatarColor(s.email),
                        }}>
                          {initials(s)}
                        </div>
                        <div>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, margin: 0 }}>
                            {s.nombre ?? '—'}
                          </p>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                            {s.email}
                          </p>
                        </div>
                      </div>

                      {/* Nivel y puntos */}
                      <NivelBar nivel={s.nivel} puntos={s.puntos} />

                      {/* Editar */}
                      <div style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => openEdit(s)}
                          style={{
                            padding: '4px 12px', borderRadius: 8,
                            border: '1px solid rgba(236,72,138,0.3)',
                            background: isEditing ? 'rgba(236,72,138,0.15)' : 'transparent',
                            color: '#ec488a', cursor: 'pointer',
                            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500,
                          }}
                        >
                          Editar
                        </button>
                      </div>
                    </div>

                    {/* ── Edit panel ── */}
                    {isEditing && draft && (
                      <div data-testid={`edit-panel-${s.id}`} style={{
                        marginTop: 16, padding: '16px', borderRadius: 10,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        display: 'flex', flexDirection: 'column', gap: 16,
                      }}>
                        {/* Nivel */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.5)', width: 60 }}>Nivel</span>
                          <button
                            data-testid={`nivel-down-${s.id}`}
                            disabled={draft.nivel <= 1}
                            onClick={() => patchDraft(s.id, { nivel: Math.max(1, draft.nivel - 1) })}
                            style={{
                              width: 30, height: 30, borderRadius: 6,
                              border: '1px solid rgba(255,255,255,0.15)',
                              background: 'rgba(255,255,255,0.05)',
                              color: draft.nivel <= 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                              cursor: draft.nivel <= 1 ? 'not-allowed' : 'pointer',
                              fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1,
                            }}
                          >−</button>
                          <span
                            data-testid={`nivel-value-${s.id}`}
                            style={{
                              fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
                              color: NIVEL_COLORS[draft.nivel] ?? '#fff',
                              minWidth: 24, textAlign: 'center',
                            }}
                          >{draft.nivel}</span>
                          <button
                            data-testid={`nivel-up-${s.id}`}
                            disabled={draft.nivel >= 5}
                            onClick={() => patchDraft(s.id, { nivel: Math.min(5, draft.nivel + 1) })}
                            style={{
                              width: 30, height: 30, borderRadius: 6,
                              border: '1px solid rgba(255,255,255,0.15)',
                              background: 'rgba(255,255,255,0.05)',
                              color: draft.nivel >= 5 ? 'rgba(255,255,255,0.2)' : '#fff',
                              cursor: draft.nivel >= 5 ? 'not-allowed' : 'pointer',
                              fontFamily: 'var(--font-body)', fontSize: 16, lineHeight: 1,
                            }}
                          >+</button>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                            {NIVEL_LABELS[draft.nivel]}
                          </span>
                        </div>

                        {/* Puntos */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.5)', width: 60 }}>Puntos</span>
                          <button
                            data-testid={`puntos-down-${s.id}`}
                            onClick={() => patchDraft(s.id, { puntos: Math.max(0, draft.puntos - 10) })}
                            style={{
                              width: 30, height: 30, borderRadius: 6,
                              border: '1px solid rgba(255,255,255,0.15)',
                              background: 'rgba(255,255,255,0.05)',
                              color: '#fff', cursor: 'pointer',
                              fontFamily: 'var(--font-body)', fontSize: 13,
                            }}
                          >−10</button>
                          <input
                            data-testid={`puntos-input-${s.id}`}
                            type="number"
                            min={0}
                            value={draft.puntos}
                            onChange={e => {
                              const v = parseInt(e.target.value, 10)
                              patchDraft(s.id, { puntos: isNaN(v) ? 0 : Math.max(0, v) })
                            }}
                            style={{
                              width: 80, padding: '4px 8px', borderRadius: 6,
                              border: '1px solid rgba(255,255,255,0.15)',
                              background: 'rgba(255,255,255,0.05)',
                              color: '#fff', fontFamily: 'var(--font-body)', fontSize: 14,
                              textAlign: 'center',
                            }}
                          />
                          <button
                            data-testid={`puntos-up-${s.id}`}
                            onClick={() => patchDraft(s.id, { puntos: draft.puntos + 10 })}
                            style={{
                              width: 30, height: 30, borderRadius: 6,
                              border: '1px solid rgba(255,255,255,0.15)',
                              background: 'rgba(255,255,255,0.05)',
                              color: '#fff', cursor: 'pointer',
                              fontFamily: 'var(--font-body)', fontSize: 13,
                            }}
                          >+10</button>
                        </div>

                        {/* Clases chips */}
                        <div>
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 8 }}>
                            Clases acceso
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {clases.map(c => {
                              const active = draft.clases.includes(c.id)
                              return (
                                <button
                                  key={c.id}
                                  data-testid={`clase-chip-${c.id}`}
                                  data-active={active ? 'true' : 'false'}
                                  onClick={() => {
                                    const next = active
                                      ? draft.clases.filter(x => x !== c.id)
                                      : [...draft.clases, c.id]
                                    patchDraft(s.id, { clases: next })
                                  }}
                                  style={{
                                    padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                                    border: `1px solid ${active ? '#ec488a' : 'rgba(255,255,255,0.12)'}`,
                                    background: active ? 'rgba(236,72,138,0.18)' : 'rgba(255,255,255,0.04)',
                                    color: active ? '#ec488a' : 'rgba(255,255,255,0.4)',
                                    fontFamily: 'var(--font-body)', fontSize: 12,
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  {c.emoji} {c.nombre}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Error */}
                        {saveError[s.id] && (
                          <p data-testid={`edit-error-${s.id}`} style={{
                            fontFamily: 'var(--font-body)', fontSize: 13,
                            color: '#ff5252', margin: 0,
                          }}>
                            {saveError[s.id]}
                          </p>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            onClick={() => saveStudent(s.id)}
                            disabled={isSaving}
                            style={{
                              padding: '7px 20px', borderRadius: 8, cursor: isSaving ? 'not-allowed' : 'pointer',
                              border: 'none',
                              background: isSaving ? 'rgba(236,72,138,0.3)' : '#ec488a',
                              color: '#fff', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
                            }}
                          >
                            {isSaving ? 'Guardando…' : 'Guardar'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            style={{
                              padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
                              border: '1px solid rgba(255,255,255,0.12)',
                              background: 'transparent',
                              color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)', fontSize: 13,
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 640px) {
          .teacher-topbar {
            height: auto !important;
            padding: 10px 14px !important;
            row-gap: 8px !important;
          }
          .teacher-brand { flex: 1 !important; }
          .teacher-tabs {
            order: 3;
            flex: none !important;
            width: 100% !important;
            border-top: 1px solid rgba(255,255,255,0.06);
            padding-top: 8px;
          }
          .teacher-tabs button { flex: 1; justify-content: center !important; }
          .student-header { display: none !important; }
          .student-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
