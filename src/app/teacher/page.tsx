'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Users, BookOpen, Music, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import ContentManager from '@/app/admin/ContentManager'

// ── Tipos ──────────────────────────────────────────────────────
interface Student {
  id: string
  email: string
  nombre: string | null
  nivel: number
  puntos: number
  cursos_acceso: string[]
  created_at: string
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
  const { user, token, logout } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'clases' | 'estudiantes'>('clases')
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [errorStudents, setErrorStudents] = useState<string | null>(null)

  // Guard: solo docentes y admins
  useEffect(() => {
    if (!user) return
    if (user.role !== 'teacher' && user.role !== 'admin') {
      router.replace('/escuela')
    }
  }, [user, router])

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

                {students.map(s => (
                  <motion.div
                    key={s.id}
                    className="student-row"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 14, padding: '14px 16px',
                      display: 'grid', gridTemplateColumns: '1fr 180px 80px',
                      alignItems: 'center', gap: 16,
                    }}
                  >
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

                    {/* Cantidad de cursos */}
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontFamily: 'var(--font-body)', fontSize: 12,
                        color: 'rgba(255,255,255,0.35)',
                      }}>
                        {(s.cursos_acceso ?? []).length} curso{(s.cursos_acceso ?? []).length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </motion.div>
                ))}
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
