'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Piano, Drum, Guitar, Mic, Music2, BookOpen,
  GraduationCap, Dumbbell,
  Trash2, Pencil, ChevronRight, ChevronDown, Plus, X, Check,
  Play, FolderOpen, Gamepad2, FileText, Image, Wrench, Link, LayoutList,
  Zap, Clock,
  type LucideIcon,
} from 'lucide-react'
import VideoCardEditor from './VideoCardEditor'

// ── Tipos ──────────────────────────────────────────────────────
interface InteractionPoint {
  id:         string
  at_seconds: number
  mensaje:    string
  tipo:       'practica' | 'reflexion' | 'reto'
}

interface Recurso {
  id:            string
  url:           string
  tipo:          string
  label:         string | null
  orden:         number
  interacciones: InteractionPoint[]
}

interface Seccion {
  id: string
  nombre: string
  zona: 'clase' | 'gym' | null
  orden: number
  recursos: Recurso[]
}

interface Modulo {
  id: string
  nombre: string
  orden: number
  secciones: Seccion[]
}

interface Curso {
  id: string
  nombre: string
  emoji: string
}

interface CursoCompleto extends Curso {
  modulos: Modulo[]
}

const TIPOS = ['video', 'drive', 'juego', 'pdf', 'imagen', 'herramienta', 'otro'] as const
type Tipo = typeof TIPOS[number]

const TIPO_ICON: Record<string, LucideIcon> = {
  video:       Play,
  drive:       FolderOpen,
  juego:       Gamepad2,
  pdf:         FileText,
  imagen:      Image,
  herramienta: Wrench,
  otro:        Link,
}

const TIPO_COLOR: Record<string, string> = {
  video:       '#ec488a',
  drive:       '#3db8fa',
  juego:       '#9b54f9',
  pdf:         '#ff5252',
  imagen:      '#4caf50',
  herramienta: '#ffa737',
  otro:        'rgba(255,255,255,0.35)',
}

const ZONA_LABELS: Record<string, string> = {
  '': 'Ambas', clase: 'Solo clase', gym: 'Solo gym',
}

const ZONA_COLOR: Record<string, string> = {
  '': 'rgba(255,255,255,0.15)',
  clase: 'rgba(61,184,250,0.25)',
  gym: 'rgba(155,84,249,0.25)',
}

const ZONA_TEXT: Record<string, string> = {
  '': 'rgba(255,255,255,0.5)',
  clase: '#3db8fa',
  gym: '#c084ff',
}

// ── Selector de zona custom (portal — no se corta por overflow:hidden) ──
function ZonaSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen]   = useState(false)
  const [pos,  setPos]    = useState({ top: 0, left: 0, width: 0 })
  const btnRef            = useRef<HTMLButtonElement>(null)

  const openDropdown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPos({ top: r.bottom + 6, left: r.right - 140, width: 140 })
    setOpen(o => !o)
  }

  // Cerrar al hacer scroll
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    return () => window.removeEventListener('scroll', close, true)
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onClick={openDropdown}
        style={{
          background: ZONA_COLOR[value],
          border: `1px solid ${ZONA_TEXT[value]}55`,
          borderRadius: 8,
          padding: '4px 10px',
          color: ZONA_TEXT[value],
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          whiteSpace: 'nowrap' as const,
          transition: 'all 0.15s',
        }}
      >
        {ZONA_LABELS[value]}
        <ChevronDown size={10} strokeWidth={1.5} style={{ opacity: 0.6 }} />
      </button>

      {open && createPortal(
        <>
          {/* Overlay invisible para cerrar */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            onClick={e => { e.stopPropagation(); setOpen(false) }}
          />
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                width: pos.width,
                zIndex: 9999,
                background: 'rgba(12,12,28,0.98)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 12,
                padding: 6,
                boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {Object.entries(ZONA_LABELS).map(([v, label]) => (
                <button
                  key={v}
                  onClick={e => { e.stopPropagation(); onChange(v); setOpen(false) }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: value === v ? ZONA_COLOR[v] : 'transparent',
                    color: value === v ? ZONA_TEXT[v] : 'rgba(255,255,255,0.65)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'block',
                  }}
                  onMouseEnter={e => {
                    if (value !== v) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)'
                  }}
                  onMouseLeave={e => {
                    if (value !== v) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
                >
                  {label}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </>,
        document.body
      )}
    </>
  )
}

// ── Estilos base ───────────────────────────────────────────────
const glass = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
}

const glassStrong = {
  background: 'rgba(12,12,28,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 20,
}

function SmallBtn({
  icon: Icon, label, onClick,
  color = 'rgba(255,255,255,0.07)', danger = false, disabled = false,
}: {
  icon?: LucideIcon
  label?: string
  onClick: () => void
  color?: string
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        background: danger ? 'rgba(255,82,82,0.1)' : color,
        border: `1px solid ${danger ? 'rgba(255,82,82,0.25)' : 'rgba(255,255,255,0.09)'}`,
        borderRadius: 8,
        padding: label && Icon ? '4px 10px' : Icon ? '5px' : '4px 10px',
        color: danger ? '#ff6b6b' : 'rgba(255,255,255,0.6)',
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        whiteSpace: 'nowrap' as const,
      }}
    >
      {Icon && <Icon size={13} strokeWidth={1.5} />}
      {label && <span>{label}</span>}
    </motion.button>
  )
}

function InlineEdit({
  value, onSave, placeholder,
}: {
  value: string
  onSave: (v: string) => Promise<void>
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  const commit = async () => {
    if (draft.trim() === value || !draft.trim()) { setEditing(false); setDraft(value); return }
    setSaving(true)
    await onSave(draft.trim())
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <span
        onClick={() => { setEditing(true); setDraft(value) }}
        title="Clic para editar"
        style={{ cursor: 'text', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: 1 }}
      >
        {value}
      </span>
    )
  }

  return (
    <input
      autoFocus
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setDraft(value) } }}
      placeholder={placeholder}
      disabled={saving}
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(236,72,138,0.5)',
        borderRadius: 6,
        padding: '2px 8px',
        color: '#fff',
        fontFamily: 'var(--font-body)',
        fontSize: 'inherit',
        outline: 'none',
        minWidth: 180,
      }}
    />
  )
}

// ── Helpers para InteractionPoints ────────────────────────────
const INTERACTION_TIPOS = ['practica', 'reflexion', 'reto'] as const
type InteractionTipo = typeof INTERACTION_TIPOS[number]

const INTERACTION_COLOR: Record<InteractionTipo, string> = {
  practica:  '#ec488a',
  reflexion: '#3db8fa',
  reto:      '#ffa737',
}

const INTERACTION_EMOJI: Record<InteractionTipo, string> = {
  practica:  '🎵',
  reflexion: '🧘',
  reto:      '🔥',
}

const MENSAJES_DEFAULT: Record<InteractionTipo, string> = {
  practica:  '¡Pausa! Ahora practica lo que acabas de ver 🎵',
  reflexion: '¿Entendiste el concepto? Tómate un momento para asimilar esto 🧘',
  reto:      '🔥 Reto: ¿Puedes hacerlo sin ver el video?',
}

function isYouTubeUrl(url: string) {
  return /youtube\.com|youtu\.be/.test(url)
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

// ── Modal Editar/Crear Recurso ─────────────────────────────────
function RecursoModal({
  recurso,
  seccionId,
  onSave,
  onClose,
  authHeaders,
}: {
  recurso?: Recurso
  seccionId: string
  onSave: (data: { url: string; tipo: Tipo; label: string; interacciones: InteractionPoint[] }) => Promise<void>
  onClose: () => void
  authHeaders: Record<string, string>
}) {
  const [url,   setUrl]   = useState(recurso?.url   ?? '')
  const [tipo,  setTipo]  = useState<Tipo>((recurso?.tipo as Tipo) ?? 'video')
  const [label, setLabel] = useState(recurso?.label ?? '')
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState<string | null>(null)

  // ── Interaction points state ───────────────────────────────
  const [interactions, setInteractions] = useState<InteractionPoint[]>(
    recurso?.interacciones ?? []
  )
  const [newAt,      setNewAt]      = useState<string>('')
  const [newMensaje, setNewMensaje] = useState<string>('')
  const [newTipoInt, setNewTipoInt] = useState<InteractionTipo>('practica')
  const [autoLoading, setAutoLoading] = useState(false)

  const isYT   = useMemo(() => tipo === 'video' && isYouTubeUrl(url), [tipo, url])
  const sorted = useMemo(
    () => [...interactions].sort((a, b) => a.at_seconds - b.at_seconds),
    [interactions]
  )

  const addInteraction = () => {
    const secs = parseInt(newAt, 10)
    if (!newAt || isNaN(secs) || secs < 0) return
    const msg = newMensaje.trim() || MENSAJES_DEFAULT[newTipoInt]
    setInteractions(prev => [
      ...prev,
      { id: crypto.randomUUID(), at_seconds: secs, mensaje: msg, tipo: newTipoInt },
    ])
    setNewAt('')
    setNewMensaje('')
  }

  const removeInteraction = (id: string) =>
    setInteractions(prev => prev.filter(p => p.id !== id))

  const handleSave = async () => {
    if (!url.trim()) { setErr('La URL es requerida'); return }
    setSaving(true)
    try {
      await onSave({ url: url.trim(), tipo, label: label.trim(), interacciones: interactions })
      onClose()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleAutoGenerate = async () => {
    setAutoLoading(true)
    try {
      const res = await fetch('/api/admin/content/recursos/auto-interact', {
        method: 'POST',
        headers: authHeaders,
      })
      const data = await res.json()
      if (res.ok) {
        alert(`✅ Auto-generado: ${data.updated} videos actualizados, ${data.skipped} ya tenían interacciones`)
      } else {
        alert(`Error: ${data.error}`)
      }
    } finally {
      setAutoLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ ...glassStrong, padding: 28, width: '100%', maxWidth: 480 }}
      >
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#fff', marginBottom: 20 }}>
          {recurso ? 'Editar recurso' : 'Nuevo recurso'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* URL */}
          <div>
            <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6 }}>
              URL <span style={{ color: '#ec488a' }}>*</span>
            </label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              style={{
                width: '100%', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                padding: '10px 14px', color: '#fff',
                fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
              }}
            />
          </div>

          {/* Tipo */}
          <div>
            <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6 }}>
              Tipo
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TIPOS.map(t => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  style={{
                    padding: '6px 12px', borderRadius: 8,
                    border: `1px solid ${tipo === t ? TIPO_COLOR[t] : 'rgba(255,255,255,0.1)'}`,
                    background: tipo === t ? `${TIPO_COLOR[t]}22` : 'transparent',
                    color: tipo === t ? TIPO_COLOR[t] : 'rgba(255,255,255,0.5)',
                    fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer',
                  }}
                >
                  {(() => { const Icon = TIPO_ICON[t]; return Icon ? <Icon size={12} style={{ display: 'inline', marginRight: 4 }} /> : null; })()} {t}
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div>
            <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 6 }}>
              Etiqueta (opcional)
            </label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Nombre visible del recurso..."
              style={{
                width: '100%', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                padding: '10px 14px', color: '#fff',
                fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
              }}
            />
          </div>

          {/* ── Interaction Points (solo para videos YouTube) ── */}
          {isYT && (
            <div style={{
              background: 'rgba(236,72,138,0.06)',
              border: '1px solid rgba(236,72,138,0.2)',
              borderRadius: 12, padding: 16,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Zap size={14} color="#ec488a" strokeWidth={1.8} />
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#fff' }}>
                    Interacciones del video
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.4)',
                    background: 'rgba(255,255,255,0.07)', borderRadius: 999, padding: '2px 7px',
                  }}>
                    {sorted.length}
                  </span>
                </div>
                {/* Auto-generar para todos */}
                <motion.button
                  type="button"
                  title="Usa subtítulos de YouTube: coloca interacciones en los huecos largos sin texto (pausas / silencio). Aplica a todos los videos del sitio que aún no tengan interacciones."
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={handleAutoGenerate}
                  disabled={autoLoading}
                  style={{
                    background: 'rgba(155,84,249,0.15)',
                    border: '1px solid rgba(155,84,249,0.4)',
                    borderRadius: 8, padding: '4px 10px',
                    color: '#c084ff', fontFamily: 'var(--font-body)', fontSize: 11,
                    cursor: autoLoading ? 'not-allowed' : 'pointer', opacity: autoLoading ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <Zap size={11} strokeWidth={1.8} />
                  {autoLoading ? 'Generando...' : 'Auto-generar todos'}
                </motion.button>
              </div>

              {/* List of configured interactions */}
              {sorted.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {sorted.map(pt => (
                    <div key={pt.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 8, padding: '7px 10px',
                    }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>
                        {INTERACTION_EMOJI[pt.tipo as InteractionTipo] ?? '⚡'}
                      </span>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                        background: `${INTERACTION_COLOR[pt.tipo as InteractionTipo]}22`,
                        border: `1px solid ${INTERACTION_COLOR[pt.tipo as InteractionTipo]}44`,
                        borderRadius: 6, padding: '2px 7px',
                      }}>
                        <Clock size={10} color={INTERACTION_COLOR[pt.tipo as InteractionTipo]} />
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: INTERACTION_COLOR[pt.tipo as InteractionTipo] }}>
                          {formatSeconds(pt.at_seconds)}
                        </span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.7)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pt.mensaje}
                      </span>
                      <button
                        onClick={() => removeInteraction(pt.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,82,82,0.6)', flexShrink: 0, padding: 2 }}
                      >
                        <X size={12} strokeWidth={1.8} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new interaction */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>
                  Agregar pausa interactiva:
                </p>

                {/* Tipo selector */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {INTERACTION_TIPOS.map(t => (
                    <button
                      key={t}
                      onClick={() => setNewTipoInt(t)}
                      style={{
                        padding: '4px 10px', borderRadius: 7,
                        border: `1px solid ${newTipoInt === t ? INTERACTION_COLOR[t] : 'rgba(255,255,255,0.1)'}`,
                        background: newTipoInt === t ? `${INTERACTION_COLOR[t]}20` : 'transparent',
                        color: newTipoInt === t ? INTERACTION_COLOR[t] : 'rgba(255,255,255,0.4)',
                        fontFamily: 'var(--font-body)', fontSize: 11, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <span>{INTERACTION_EMOJI[t]}</span> {t}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {/* Tiempo mm:ss helper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <Clock size={12} color="rgba(255,255,255,0.4)" />
                    <input
                      type="number"
                      value={newAt}
                      onChange={e => setNewAt(e.target.value)}
                      placeholder="seg"
                      min={0}
                      style={{
                        width: 68, background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
                        padding: '7px 10px', color: '#fff',
                        fontFamily: 'var(--font-body)', fontSize: 12, outline: 'none',
                      }}
                    />
                    {newAt && !isNaN(parseInt(newAt)) && (
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        = {formatSeconds(parseInt(newAt))}
                      </span>
                    )}
                  </div>
                  {/* Mensaje */}
                  <input
                    value={newMensaje}
                    onChange={e => setNewMensaje(e.target.value)}
                    placeholder={MENSAJES_DEFAULT[newTipoInt]}
                    style={{
                      flex: 1, background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
                      padding: '7px 10px', color: '#fff',
                      fontFamily: 'var(--font-body)', fontSize: 12, outline: 'none',
                    }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                    onClick={addInteraction}
                    style={{
                      background: 'rgba(236,72,138,0.2)',
                      border: '1px solid rgba(236,72,138,0.4)',
                      borderRadius: 8, padding: '7px 12px',
                      color: '#ec488a', cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    <Plus size={14} strokeWidth={1.8} />
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {err && (
            <p style={{ color: '#ff5252', fontFamily: 'var(--font-body)', fontSize: 13 }}>{err}</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <SmallBtn icon={X} label="Cancelar" onClick={onClose} />
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={handleSave}
            disabled={saving}
            style={{
              background: 'linear-gradient(135deg, #ec488a, #9b54f9)',
              border: 'none', borderRadius: 10, padding: '10px 20px',
              color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Fila de recurso ────────────────────────────────────────────
function RecursoRow({
  recurso,
  token,
  onEdit,
  onDelete,
}: {
  recurso: Recurso
  token: string
  onEdit: () => void
  onDelete: () => void
}) {
  const shortUrl = recurso.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 55)
  const TipoIcon = TIPO_ICON[recurso.tipo] ?? Link
  const [editingCards, setEditingCards] = useState(false)

  const isVideo = recurso.tipo === 'video'

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10, padding: '8px 12px',
      }}>
        {/* Icono tipo — stroke, sin relleno */}
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          border: `1px solid ${TIPO_COLOR[recurso.tipo]}44`,
          background: `${TIPO_COLOR[recurso.tipo]}12`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <TipoIcon size={13} strokeWidth={1.8} color={TIPO_COLOR[recurso.tipo]} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {recurso.label && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#fff', marginBottom: 1, fontWeight: 500 }}>
              {recurso.label}
            </p>
          )}
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 11,
            color: 'rgba(255,255,255,0.3)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {shortUrl}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {isVideo && (
            <SmallBtn
              icon={LayoutList}
              label="Cartas"
              onClick={() => setEditingCards(true)}
              color="rgba(155,84,249,0.12)"
            />
          )}
          <SmallBtn icon={Pencil} onClick={onEdit} />
          <SmallBtn icon={Trash2} onClick={onDelete} danger />
        </div>
      </div>

      {editingCards && (
        <VideoCardEditor
          recursoUrl={recurso.url}
          token={token}
          onClose={() => setEditingCards(false)}
        />
      )}
    </>
  )
}

// ── Panel de sección ───────────────────────────────────────────
function SeccionPanel({
  seccion,
  token,
  apiBase,
  onUpdate,
  onDelete,
}: {
  seccion: Seccion
  token: string
  apiBase: string
  onUpdate: (updated: Seccion) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [editingRecurso, setEditingRecurso] = useState<Recurso | 'new' | null>(null)

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const renameSec = useCallback(async (nombre: string) => {
    const res = await fetch(`${apiBase}/secciones/${seccion.id}`, {
      method: 'PATCH', headers: authHeaders, body: JSON.stringify({ nombre }),
    })
    if (res.ok) onUpdate({ ...seccion, nombre })
  }, [apiBase, seccion, onUpdate, authHeaders])

  const changeZona = useCallback(async (zona: string) => {
    const res = await fetch(`${apiBase}/secciones/${seccion.id}`, {
      method: 'PATCH', headers: authHeaders, body: JSON.stringify({ zona }),
    })
    if (res.ok) onUpdate({ ...seccion, zona: (zona || null) as Seccion['zona'] })
  }, [apiBase, seccion, onUpdate, authHeaders])

  const handleSaveRecurso = useCallback(async (data: { url: string; tipo: Tipo; label: string; interacciones: InteractionPoint[] }) => {
    if (editingRecurso === 'new') {
      const res = await fetch(`${apiBase}/recursos`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ seccion_id: seccion.id, ...data }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errData.error || `Error al crear recurso: ${res.status}`)
      }
      const { recurso } = await res.json()
      onUpdate({ ...seccion, recursos: [...seccion.recursos, recurso] })
    } else if (editingRecurso) {
      const res = await fetch(`${apiBase}/recursos/${editingRecurso.id}`, {
        method: 'PATCH', headers: authHeaders, body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errData.error || `Error al actualizar recurso: ${res.status}`)
      }
      const { recurso } = await res.json()
      onUpdate({ ...seccion, recursos: seccion.recursos.map(r => r.id === recurso.id ? recurso : r) })
    }
  }, [apiBase, editingRecurso, seccion, onUpdate, authHeaders])

  const deleteRecurso = useCallback(async (id: string) => {
    if (!confirm('¿Eliminar este recurso?')) return
    const res = await fetch(`${apiBase}/recursos/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) onUpdate({ ...seccion, recursos: seccion.recursos.filter(r => r.id !== id) })
  }, [apiBase, seccion, onUpdate, token])

  return (
    <div style={{ ...glass, overflow: 'hidden', marginBottom: 6 }}>
      {/* Header sección */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', cursor: 'pointer',
        }}
        onClick={() => setOpen(o => !o)}
      >
        <ChevronRight size={13} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.25)', transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'none', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.85)', flex: 1 }}
          onClick={e => e.stopPropagation()}>
          <InlineEdit value={seccion.nombre} onSave={renameSec} placeholder="Nombre de sección" />
        </span>

        {/* Zona selector */}
        <div onClick={e => e.stopPropagation()}>
          <ZonaSelect value={seccion.zona ?? ''} onChange={changeZona} />
        </div>

        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          {seccion.recursos.length} rec.
        </span>

        <SmallBtn icon={Trash2} onClick={onDelete} danger />
      </div>

      {/* Recursos */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 14px 14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                {seccion.recursos.map(r => (
                  <RecursoRow
                    key={r.id}
                    recurso={r}
                    token={token}
                    onEdit={() => setEditingRecurso(r)}
                    onDelete={() => deleteRecurso(r.id)}
                  />
                ))}
              </div>
              <SmallBtn icon={Plus} label="Recurso" onClick={() => setEditingRecurso('new')} color="rgba(236,72,138,0.12)" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal recurso */}
      {editingRecurso && (
        <RecursoModal
          recurso={editingRecurso === 'new' ? undefined : editingRecurso}
          seccionId={seccion.id}
          onSave={handleSaveRecurso}
          authHeaders={authHeaders}
          onClose={() => setEditingRecurso(null)}
        />
      )}
    </div>
  )
}

// ── Panel de módulo ────────────────────────────────────────────
function ModuloPanel({
  modulo,
  token,
  apiBase,
  zonaFilter,
  onUpdate,
  onDelete,
}: {
  modulo: Modulo
  token: string
  apiBase: string
  zonaFilter: 'escuela' | 'gym'
  onUpdate: (updated: Modulo) => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [addingSeccion, setAddingSeccion] = useState(false)
  const [newSecNombre, setNewSecNombre] = useState('')
  const [saving, setSaving] = useState(false)

  // Zona por defecto según el tab activo
  const defaultZona = zonaFilter === 'escuela' ? 'clase' : 'gym'
  const [newSecZona, setNewSecZona] = useState(defaultZona)

  // Filtrar secciones según la zona activa
  // escuela → zona='clase' o zona=null (ambas)
  // gym     → zona='gym'   o zona=null (ambas)
  const seccionesFiltradas = modulo.secciones.filter(s =>
    s.zona === null || s.zona === (zonaFilter === 'escuela' ? 'clase' : 'gym')
  )

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const renameModulo = useCallback(async (nombre: string) => {
    const res = await fetch(`${apiBase}/modulos/${modulo.id}`, {
      method: 'PATCH', headers: authHeaders, body: JSON.stringify({ nombre }),
    })
    if (res.ok) onUpdate({ ...modulo, nombre })
  }, [apiBase, modulo, onUpdate, authHeaders])

  const addSeccion = async () => {
    if (!newSecNombre.trim()) return
    setSaving(true)
    const res = await fetch(`${apiBase}/secciones`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ modulo_id: modulo.id, nombre: newSecNombre.trim(), zona: newSecZona || null }),
    })
    if (res.ok) {
      const { seccion } = await res.json()
      onUpdate({ ...modulo, secciones: [...modulo.secciones, seccion] })
      setNewSecNombre('')
      setNewSecZona(defaultZona)
      setAddingSeccion(false)
    }
    setSaving(false)
  }

  const updateSeccion = useCallback((updated: Seccion) => {
    onUpdate({ ...modulo, secciones: modulo.secciones.map(s => s.id === updated.id ? updated : s) })
  }, [modulo, onUpdate])

  const deleteSeccion = useCallback(async (id: string) => {
    if (!confirm('¿Eliminar esta sección y todos sus recursos?')) return
    const res = await fetch(`${apiBase}/secciones/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) onUpdate({ ...modulo, secciones: modulo.secciones.filter(s => s.id !== id) })
  }, [apiBase, modulo, onUpdate, token])

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, marginBottom: 8, overflow: 'hidden',
    }}>
      {/* Header módulo */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          style={{ fontSize: 12, color: '#ec488a', display: 'inline-block' }}
        >
          ▶
        </motion.span>

        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#fff', flex: 1, fontWeight: 600 }}
          onClick={e => e.stopPropagation()}>
          <InlineEdit value={modulo.nombre} onSave={renameModulo} placeholder="Nombre del módulo" />
        </span>

        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          {seccionesFiltradas.length} secc.
        </span>

        <SmallBtn icon={Trash2} onClick={onDelete} danger />
      </div>

      {/* Secciones */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px' }}>
              {seccionesFiltradas.length === 0 && !addingSeccion && (
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 12,
                  color: 'rgba(255,255,255,0.2)', padding: '8px 0 12px',
                  fontStyle: 'italic',
                }}>
                  Sin secciones en esta zona
                </p>
              )}

              {seccionesFiltradas.map(s => (
                <SeccionPanel
                  key={s.id}
                  seccion={s}
                  token={token}
                  apiBase={apiBase}
                  onUpdate={updateSeccion}
                  onDelete={() => deleteSeccion(s.id)}
                />
              ))}

              {/* Añadir sección */}
              {addingSeccion ? (
                <div style={{
                  ...glass, padding: '12px 14px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <input
                    autoFocus
                    value={newSecNombre}
                    onChange={e => setNewSecNombre(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addSeccion(); if (e.key === 'Escape') setAddingSeccion(false) }}
                    placeholder="Nombre de la sección..."
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 8, padding: '8px 12px',
                      color: '#fff', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <ZonaSelect value={newSecZona} onChange={setNewSecZona} />
                    <SmallBtn icon={Check} label={saving ? '...' : 'Crear'} onClick={addSeccion} disabled={saving} color="rgba(236,72,138,0.2)" />
                    <SmallBtn icon={X} onClick={() => { setAddingSeccion(false); setNewSecNombre('') }} />
                  </div>
                </div>
              ) : (
                <SmallBtn icon={Plus} label="Sección" onClick={() => { setAddingSeccion(true); setNewSecZona(defaultZona) }} color="rgba(61,184,250,0.1)" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Panel principal por curso ──────────────────────────────────
function CursoEditor({
  cursoId,
  cursoNombre,
  cursoEmoji,
  cursoColor,
  token,
  apiBase,
}: {
  cursoId: string
  cursoNombre: string
  cursoEmoji: string
  cursoColor: string
  token: string
  apiBase: string
}) {
  const [curso, setCurso] = useState<CursoCompleto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addingModulo, setAddingModulo] = useState(false)
  const [newModNombre, setNewModNombre] = useState('')
  const [saving, setSaving] = useState(false)
  const [zonaTab, setZonaTab] = useState<'escuela' | 'gym'>('escuela')
  const [autoLoading, setAutoLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token])

  useEffect(() => {
    console.log('[Frontend useEffect] Cargando curso:', cursoId)
    let cancelled = false
    fetch(`${apiBase}?id=${cursoId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        console.log('[Frontend useEffect] Respuesta status:', r.status)
        return r.json()
      })
      .then(d => {
        console.log('[Frontend useEffect] Datos recibidos:', d)
        console.log('[Frontend useEffect] Curso cargado con módulos:', d.curso?.modulos?.length || 0)
        if (!cancelled) setCurso(d.curso ?? null)
      })
      .catch((err) => {
        console.error('[Frontend useEffect] Error al cargar:', err)
        if (!cancelled) setError('Error al cargar')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [apiBase, cursoId, token])

  const addModulo = async () => {
    console.log('[Frontend addModulo] ===== INICIO =====')
    console.log('[Frontend addModulo] Nombre:', newModNombre.trim())
    console.log('[Frontend addModulo] Curso:', curso?.id)

    if (!newModNombre.trim() || !curso) {
      console.warn('[Frontend addModulo] Cancelado: falta nombre o curso')
      return
    }

    setSaving(true)
    const requestBody = { curso_id: curso.id, nombre: newModNombre.trim() }
    console.log('[Frontend addModulo] Enviando POST a:', `${apiBase}/modulos`)
    console.log('[Frontend addModulo] Body:', requestBody)

    try {
      const res = await fetch(`${apiBase}/modulos`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(requestBody),
      })

      console.log('[Frontend addModulo] Respuesta status:', res.status, res.statusText)

      if (res.ok) {
        const responseData = await res.json()
        console.log('[Frontend addModulo] Respuesta data:', responseData)
        const modulo = responseData.modulo
        console.log('[Frontend addModulo] Módulo recibido:', modulo)

        setCurso(c => {
          const newCurso = c ? { ...c, modulos: [...c.modulos, modulo] } : c
          console.log('[Frontend addModulo] Nuevo estado del curso:', newCurso)
          return newCurso
        })
        setNewModNombre('')
        setAddingModulo(false)
        console.log('[Frontend addModulo] ===== ÉXITO =====')
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('[Frontend addModulo] Error:', res.status, errorData)
        alert(`Error al crear módulo: ${errorData.error || res.statusText}`)
      }
    } catch (err) {
      console.error('[Frontend addModulo] Error de red:', err)
      alert('Error de conexión al crear el módulo')
    }
    setSaving(false)
  }

  const updateModulo = useCallback((updated: Modulo) => {
    setCurso(c => c ? { ...c, modulos: c.modulos.map(m => m.id === updated.id ? updated : m) } : c)
  }, [])

  const deleteModulo = useCallback(async (id: string) => {
    if (!confirm('¿Eliminar este módulo y todo su contenido?')) return
    try {
      const res = await fetch(`${apiBase}/modulos/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setCurso(c => c ? { ...c, modulos: c.modulos.filter(m => m.id !== id) } : c)
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('Error al eliminar módulo:', res.status, errorData)
        alert(`Error al eliminar módulo: ${errorData.error || res.statusText}`)
      }
    } catch (err) {
      console.error('Error de red al eliminar módulo:', err)
      alert('Error de conexión al eliminar el módulo')
    }
  }, [apiBase, token])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(236,72,138,0.3)', borderTopColor: '#ec488a', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (error) return (
    <p style={{ color: '#ff5252', fontFamily: 'var(--font-body)', fontSize: 14, padding: 20 }}>{error}</p>
  )

  // Curso no existe en DB todavía — ofrecer inicialización
  if (!curso) {
    const initCourse = async () => {
      setInitializing(true)
      try {
        const res = await fetch(`${apiBase}/cursos`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ nombre: cursoNombre, emoji: cursoEmoji, id: cursoId }),
        })
        const data = await res.json()
        if (res.ok) {
          setCurso({ ...data.curso, modulos: [] })
        } else if (res.status === 409) {
          // Ya existe — recargar
          const retry = await fetch(`${apiBase}?id=${cursoId}`, { headers: { Authorization: `Bearer ${token}` } })
          const rd = await retry.json()
          setCurso(rd.curso ?? null)
        } else {
          setError(data.error ?? 'Error al crear curso')
        }
      } catch { setError('Error de conexión') }
      finally { setInitializing(false) }
    }

    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', maxWidth: 400, margin: '0 auto' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>{cursoEmoji}</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#fff', marginBottom: 8 }}>
          {cursoNombre}
        </h2>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24, lineHeight: 1.6 }}>
          Este instrumento aún no tiene contenido en la base de datos.<br />
          Inicialízalo para empezar a agregar módulos y recursos.
        </p>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={initCourse}
          disabled={initializing}
          style={{
            padding: '12px 28px', borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #ec488a, #9b54f9)',
            color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 14, cursor: initializing ? 'wait' : 'pointer',
          }}
        >
          {initializing ? 'Creando…' : '+ Inicializar curso'}
        </motion.button>
      </div>
    )
  }

  // Módulos del curso - MOSTRAR TODOS (incluyendo vacíos)
  console.log('[Frontend render] Total módulos en curso:', curso?.modulos?.length || 0)
  console.log('[Frontend render] Módulos:', curso?.modulos)

  const modulosVisibles = (curso?.modulos ?? [])

  console.log('[Frontend render] Módulos a renderizar:', modulosVisibles.length)

  // Stats del tab actual (filtrar secciones por zona)
  const seccionesTab = modulosVisibles.reduce((a, m) =>
    a + (m.secciones || []).filter(s => s.zona === null || s.zona === (zonaTab === 'escuela' ? 'clase' : 'gym')).length, 0)
  const recursosTab = modulosVisibles.reduce((a, m) =>
    a + (m.secciones || [])
      .filter(s => s.zona === null || s.zona === (zonaTab === 'escuela' ? 'clase' : 'gym'))
      .reduce((b, s) => b + (s.recursos?.length || 0), 0), 0)

  return (
    <div>
      {/* ── Header instrumento ─────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, fontSize: 24,
            background: `${cursoColor}22`,
            border: `1px solid ${cursoColor}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {cursoEmoji}
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: '#fff', fontWeight: 700 }}>
              {cursoNombre}
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              {curso?.modulos.length ?? 0} módulos totales
            </p>
          </div>
        </div>

        {/* ── Tabs Escuela / Gym ─────────────────────────────── */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
          {([
            { id: 'escuela', label: 'Escuela', icon: '🏫', color: '#3db8fa' },
            { id: 'gym',     label: 'Gym',     icon: '🏋️', color: '#9b54f9' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setZonaTab(tab.id)}
              style={{
                flex: 1, padding: '12px 0',
                border: 'none',
                borderBottom: `2px solid ${zonaTab === tab.id ? tab.color : 'rgba(255,255,255,0.08)'}`,
                background: zonaTab === tab.id ? `${tab.color}11` : 'transparent',
                color: zonaTab === tab.id ? tab.color : 'rgba(255,255,255,0.35)',
                fontFamily: 'var(--font-display)',
                fontWeight: zonaTab === tab.id ? 700 : 400,
                fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                transition: 'all 0.15s',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {zonaTab === tab.id && (
                <span style={{
                  background: `${tab.color}22`, border: `1px solid ${tab.color}44`,
                  borderRadius: 20, padding: '1px 8px',
                  fontSize: 11, color: tab.color,
                }}>
                  {seccionesTab} secc · {recursosTab} rec
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Botón añadir módulo */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <motion.button
            type="button"
            title="Lee subtítulos del video y coloca interacciones en los tramos largos sin habla (según captions). Solo videos YouTube sin interacciones aún."
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={async () => {
              setAutoLoading(true)
              try {
                const res = await fetch('/api/admin/content/recursos/auto-interact', {
                  method: 'POST',
                  headers: authHeaders(),
                })
                const data = await res.json()
                if (res.ok) {
                  alert(`✅ Auto-generado: ${data.updated} videos actualizados, ${data.skipped} ya tenían interacciones`)
                } else {
                  alert(`Error: ${data.error}`)
                }
              } finally {
                setAutoLoading(false)
              }
            }}
            disabled={autoLoading}
            style={{
              background: 'rgba(155,84,249,0.15)',
              border: '1px solid rgba(155,84,249,0.4)',
              borderRadius: 10, padding: '9px 18px',
              color: '#c084ff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
              cursor: autoLoading ? 'not-allowed' : 'pointer', opacity: autoLoading ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Zap size={14} strokeWidth={1.8} />
            {autoLoading ? 'Generando...' : 'Auto-generar interacciones YouTube'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => setAddingModulo(true)}
            style={{
              background: 'linear-gradient(135deg, #ec488a, #9b54f9)',
              border: 'none', borderRadius: 10, padding: '9px 18px',
              color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 13, cursor: 'pointer',
            }}
          >
            + Módulo
          </motion.button>
        </div>
      </div>

      {/* ── Módulos filtrados por zona ─────────────────────── */}
      {modulosVisibles.length === 0 && !addingModulo && (
        <div style={{
          textAlign: 'center', padding: '48px 0',
          color: 'rgba(255,255,255,0.2)',
          fontFamily: 'var(--font-body)', fontSize: 14,
        }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>
            {zonaTab === 'escuela' ? '🏫' : '🏋️'}
          </p>
          <p>No hay contenido para {zonaTab === 'escuela' ? 'Escuela' : 'Gym'} todavía</p>
          <p style={{ fontSize: 12, marginTop: 6, opacity: 0.6 }}>
            Añade un módulo o cambia la zona de las secciones existentes
          </p>
        </div>
      )}

      {modulosVisibles.map(m => (
        <ModuloPanel
          key={m.id}
          modulo={m}
          token={token}
          apiBase={apiBase}
          zonaFilter={zonaTab}
          onUpdate={updateModulo}
          onDelete={() => deleteModulo(m.id)}
        />
      ))}

      {/* Añadir módulo */}
      <AnimatePresence>
        {addingModulo && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{ ...glass, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center' }}
          >
            <input
              autoFocus
              value={newModNombre}
              onChange={e => setNewModNombre(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addModulo(); if (e.key === 'Escape') setAddingModulo(false) }}
              placeholder="Nombre del módulo..."
              style={{
                flex: 1, background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
                padding: '8px 12px', color: '#fff',
                fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
              }}
            />
            <SmallBtn icon={Check} label={saving ? '...' : 'Crear'} onClick={addModulo} disabled={saving} color="rgba(236,72,138,0.2)" />
            <SmallBtn icon={X} onClick={() => { setAddingModulo(false); setNewModNombre('') }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Color estable para cursos sin entrada en la lista estática (metadata)
function colorFromId(id: string): string {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const hue = Math.abs(h) % 280 + 30
  return `hsl(${hue}, 52%, 58%)`
}

// ── Instrumentos principales (sidebar fijo) ───────────────────
const INSTRUMENTOS_PRINCIPALES = [
  { id: 'piano',            nombre: 'Piano',             Icon: Piano,       color: '#ec488a', emoji: '🎹' },
  { id: 'bateria',          nombre: 'Batería',            Icon: Drum,        color: '#3db8fa', emoji: '🥁' },
  { id: 'guitarra-adultos', nombre: 'Guitarra',           Icon: Guitar,      color: '#ffa737', emoji: '🎸' },
  { id: 'violin',           nombre: 'Violín',             Icon: Music2,      color: '#9b54f9', emoji: '🎻' },
  { id: 'canto',            nombre: 'Canto',              Icon: Mic,         color: '#ec488a', emoji: '🎤' },
  { id: 'ciudad-musical',   nombre: 'Iniciación Musical', Icon: BookOpen,    color: '#3db8fa', emoji: '🎵' },
  // Mismo id que CURSOS / tabla `cursos` (evita 404 si un instrumento en BD usa id autogenerado)
  { id: 'ukelele',          nombre: 'Ukelele',            Icon: Music2,      color: '#34d399', emoji: '🎶' },
]

// ══════════════════════════════════════════════════════════════
// CONTENT MANAGER — Componente raíz
// ══════════════════════════════════════════════════════════════
type SidebarInst = {
  id: string
  nombre: string
  emoji: string
  color: string
  Icon: LucideIcon
}

export default function ContentManager({
  token,
  apiBase = '/api/admin/content',
  allowedCursoIds,
}: {
  token: string
  apiBase?: string
  allowedCursoIds?: string[]
}) {
  const staticMeta = useMemo(() => new Map(INSTRUMENTOS_PRINCIPALES.map(s => [s.id, s])), [])

  // Fuente de verdad: tabla `instrumentos` en Supabase
  const [instrsApi, setInstrsApi] = useState<Array<{
    id: string; nombre: string; emoji: string; color: string
    curso_id: string | null; orden: number
  }>>([])
  const [listLoading, setListLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    setListLoading(true)
    fetch('/api/instrumentos', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { instrumentos: [] })
      .then(data => {
        if (!cancelled) setInstrsApi(Array.isArray(data.instrumentos) ? data.instrumentos : [])
      })
      .catch(() => { if (!cancelled) setInstrsApi([]) })
      .finally(() => { if (!cancelled) setListLoading(false) })
    return () => { cancelled = true }
  }, [token])

  // Sidebar basado ÚNICAMENTE en instrumentos de la tabla `instrumentos`
  const instrumentos: SidebarInst[] = useMemo(() => {
    const seen = new Set<string>()
    const out: SidebarInst[] = []

    const sorted = [...instrsApi].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    for (const ins of sorted) {
      const cid = (ins.curso_id?.trim()) || ins.id
      if (!cid || seen.has(cid)) continue
      seen.add(cid)
      const s = staticMeta.get(cid)
      out.push({
        id:     cid,
        nombre: ins.nombre,
        emoji:  ins.emoji,
        color:  ins.color || s?.color || colorFromId(cid),
        Icon:   s?.Icon ?? Music2,
      })
    }

    if (allowedCursoIds?.length) return out.filter(i => allowedCursoIds.includes(i.id))
    return out
  }, [instrsApi, staticMeta, allowedCursoIds])

  const [selectedId, setSelectedId] = useState('')
  useEffect(() => {
    if (instrumentos.length === 0) return
    setSelectedId(cur => (instrumentos.some(i => i.id === cur) ? cur : instrumentos[0].id))
  }, [instrumentos])

  const selected = instrumentos.find(i => i.id === selectedId) ?? instrumentos[0]

  if (listLoading && instrumentos.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.35)' }}>
        Cargando instrumentos…
      </div>
    )
  }

  if (!listLoading && instrumentos.length === 0) {
    return (
      <div style={{ padding: 40, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <Music2 size={24} strokeWidth={1.5} style={{ color: 'rgba(255,255,255,0.2)' }} />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
          No hay instrumentos registrados.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-body)', fontSize: 13 }}>
          Ve a <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Instrumentos</strong> y crea o importa los instrumentos del curso.
        </p>
      </div>
    )
  }

  return (
    <div className="cm-root" style={{ display: 'flex', gap: 0, minHeight: 'calc(100vh - 80px)' }}>

      {/* ── Sidebar — instrumentos ────────────────────────────── */}
      <div className="cm-sidebar" style={{
        width: 220, flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '20px 0',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 10,
          color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em',
          textTransform: 'uppercase', padding: '0 18px', marginBottom: 6,
        }}>
          Instrumentos
        </p>

        {listLoading && (
          <p style={{ padding: '0 18px', fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Cargando…</p>
        )}

        {instrumentos.map(inst => {
          const active = selectedId === inst.id
          return (
            <button
              key={inst.id}
              onClick={() => setSelectedId(inst.id)}
              style={{
                width: '100%', textAlign: 'left', padding: '11px 18px',
                border: 'none',
                borderLeft: `3px solid ${active ? inst.color : 'transparent'}`,
                background: active ? `${inst.color}14` : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                fontFamily: 'var(--font-body)', fontSize: 13,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                transition: 'all 0.15s',
              }}
            >
              <span style={{
                width: 30, height: 30, borderRadius: 8, fontSize: 15, flexShrink: 0,
                background: active ? `${inst.color}22` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${active ? inst.color + '44' : 'rgba(255,255,255,0.08)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {inst.emoji}
              </span>
              <span style={{ fontWeight: active ? 600 : 400 }}>{inst.nombre}</span>
            </button>
          )
        })}
      </div>

      {/* ── Editor principal ──────────────────────────────────── */}
      <div className="cm-main" style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
        {selected && (
          <CursoEditor
            key={selectedId}
            cursoId={selectedId}
            cursoNombre={selected.nombre}
            cursoEmoji={selected.emoji}
            cursoColor={selected.color}
            token={token}
            apiBase={apiBase}
          />
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 640px) {
          .cm-root { flex-direction: column !important; }
          .cm-sidebar {
            width: 100% !important;
            flex-direction: row !important;
            overflow-x: auto;
            overflow-y: hidden;
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.06) !important;
            padding: 10px 12px !important;
            gap: 6px !important;
            scrollbar-width: none;
          }
          .cm-sidebar::-webkit-scrollbar { display: none; }
          .cm-sidebar > p { display: none !important; }
          .cm-sidebar > button {
            flex-shrink: 0 !important;
            flex-direction: row !important;
            border-left: none !important;
            padding: 8px 14px !important;
            border-radius: 20px !important;
            white-space: nowrap;
          }
          .cm-main { padding: 16px !important; }
        }
      `}</style>
    </div>
  )
}


