'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Clock, X, Check } from 'lucide-react'
import type { VideoCard, CardTipo } from '@/types'


function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function parseTime(str: string): number {
  const parts = str.split(':')
  if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1])
  return parseInt(str) || 0
}

// ── Card form by type ──────────────────────────────────────────
function CardForm({
  card,
  onChange,
}: {
  card: Partial<VideoCard> & { tipo: CardTipo; id: string; tiempo: number }
  onChange: (updated: VideoCard) => void
}) {
  const base = { id: card.id, tiempo: card.tiempo }

  if (card.tipo === 'texto') {
    return (
      <textarea
        value={(card as { texto?: string }).texto ?? ''}
        onChange={e => onChange({ ...base, tipo: 'texto', texto: e.target.value })}
        placeholder="Texto / instrucción para el alumno..."
        rows={3}
        style={inputStyle}
      />
    )
  }

  if (card.tipo === 'boton') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <textarea
          value={(card as { texto?: string }).texto ?? ''}
          onChange={e => onChange({ ...base, tipo: 'boton', texto: e.target.value, boton_label: (card as { boton_label?: string }).boton_label ?? 'Listo' })}
          placeholder="Mensaje para el alumno..."
          rows={2}
          style={inputStyle}
        />
        <input
          value={(card as { boton_label?: string }).boton_label ?? ''}
          onChange={e => onChange({ ...base, tipo: 'boton', texto: (card as { texto?: string }).texto ?? '', boton_label: e.target.value })}
          placeholder="Texto del botón (ej: ¡Listo!)"
          style={inputStyle}
        />
      </div>
    )
  }

  if (card.tipo === 'countdown') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <textarea
          value={(card as { instruccion?: string }).instruccion ?? ''}
          onChange={e => onChange({ ...base, tipo: 'countdown', instruccion: e.target.value, duracion: (card as { duracion?: number }).duracion ?? 60 })}
          placeholder="Instrucción (ej: Practica este patrón rítmico...)"
          rows={2}
          style={inputStyle}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={labelStyle}>Duración (segundos)</label>
          <input
            type="number"
            min={5}
            max={3600}
            value={(card as { duracion?: number }).duracion ?? 60}
            onChange={e => onChange({ ...base, tipo: 'countdown', instruccion: (card as { instruccion?: string }).instruccion ?? '', duracion: parseInt(e.target.value) || 60 })}
            style={{ ...inputStyle, width: 90 }}
          />
        </div>
      </div>
    )
  }

  if (card.tipo === 'quiz') {
    const q = card as { pregunta?: string; opciones?: string[]; respuesta_correcta?: number | null }
    const opciones = q.opciones ?? ['', '', '', '']
    const correct = q.respuesta_correcta ?? null

    const update = (fields: Partial<{ pregunta: string; opciones: string[]; respuesta_correcta: number | null }>) =>
      onChange({ ...base, tipo: 'quiz', pregunta: q.pregunta ?? '', opciones, respuesta_correcta: correct, ...fields })

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          value={q.pregunta ?? ''}
          onChange={e => update({ pregunta: e.target.value })}
          placeholder="Pregunta para el alumno..."
          style={inputStyle}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Opciones (selecciona la correcta — opcional)</label>
          {opciones.map((op, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => update({ respuesta_correcta: correct === i ? null : i })}
                title={correct === i ? 'Respuesta correcta' : 'Marcar como correcta'}
                style={{
                  width: 24, height: 24, borderRadius: '50%', border: `2px solid ${correct === i ? '#34d399' : 'rgba(255,255,255,0.2)'}`,
                  background: correct === i ? 'rgba(52,211,153,0.2)' : 'transparent',
                  cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {correct === i && <Check size={12} color="#34d399" />}
              </button>
              <input
                value={op}
                onChange={e => {
                  const next = [...opciones]; next[i] = e.target.value; update({ opciones: next })
                }}
                placeholder={`Opción ${String.fromCharCode(65 + i)}`}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
          ))}
        </div>
        {correct !== null && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#34d399' }}>
            ✓ Respuesta correcta: opción {String.fromCharCode(65 + correct)}
          </p>
        )}
      </div>
    )
  }

  return null
}

// ── Styles ─────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#fff',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  outline: 'none',
  resize: 'vertical' as const,
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  color: 'rgba(255,255,255,0.4)',
}

const TIPO_LABELS: Record<CardTipo, string> = {
  texto: '💬 Texto',
  boton: '🔘 Botón',
  countdown: '⏱️ Timer',
  quiz: '❓ Quiz',
}

const TIPO_COLORS: Record<CardTipo, string> = {
  texto:     'rgba(61,184,250,0.2)',
  boton:     'rgba(236,72,138,0.2)',
  countdown: 'rgba(255,167,55,0.2)',
  quiz:      'rgba(155,84,249,0.2)',
}

const TIPO_BORDERS: Record<CardTipo, string> = {
  texto:     'rgba(61,184,250,0.4)',
  boton:     'rgba(236,72,138,0.4)',
  countdown: 'rgba(255,167,55,0.4)',
  quiz:      'rgba(155,84,249,0.4)',
}

// ── Main component ─────────────────────────────────────────────
export default function VideoCardEditor({
  recursoUrl,
  token,
  onClose,
}: {
  recursoUrl: string
  token: string
  onClose: () => void
}) {
  const ytId = getYouTubeId(recursoUrl) ?? ''
  const playerTargetRef = useRef<HTMLDivElement>(null)
  const playerRef       = useRef<YTPlayer | null>(null)

  const [cards, setCards]     = useState<VideoCard[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Draft cards for editing
  const [draftCards, setDraftCards] = useState<VideoCard[]>([])

  // Load existing cards
  useEffect(() => {
    fetch(`/api/admin/video-cards?url=${encodeURIComponent(recursoUrl)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(({ cards }) => {
        const sorted = (cards ?? []).sort((a: VideoCard, b: VideoCard) => a.tiempo - b.tiempo)
        setCards(sorted)
        setDraftCards(sorted)
      })
      .finally(() => setLoading(false))
  }, [recursoUrl, token])

  // Init YouTube Player
  const initPlayer = useCallback(() => {
    if (!playerTargetRef.current || playerRef.current) return
    playerRef.current = new window.YT.Player(playerTargetRef.current, {
      videoId: ytId,
      width: '100%',
      height: '100%',
      playerVars: { rel: 0, modestbranding: 1, enablejsapi: 1 },
    })
  }, [ytId])

  useEffect(() => {
    if (window.YT?.Player) {
      initPlayer()
    } else {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { prev?.(); initPlayer() }
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement('script')
        s.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(s)
      }
    }
    return () => { playerRef.current?.destroy(); playerRef.current = null }
  }, [initPlayer])

  // Capture current timestamp and add a new card
  const addCardAtCurrentTime = () => {
    const tiempo = playerRef.current
      ? Math.floor(playerRef.current.getCurrentTime())
      : 0
    const newCard: VideoCard = {
      id: crypto.randomUUID(),
      tiempo,
      tipo: 'texto',
      texto: '',
    }
    const next = [...draftCards, newCard].sort((a, b) => a.tiempo - b.tiempo)
    setDraftCards(next)
    setExpandedId(newCard.id)
    playerRef.current?.pauseVideo()
  }

  const updateCard = (updated: VideoCard) => {
    setDraftCards(prev =>
      prev.map(c => c.id === updated.id ? updated : c)
        .sort((a, b) => a.tiempo - b.tiempo)
    )
  }

  const deleteCard = (id: string) => {
    setDraftCards(prev => prev.filter(c => c.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const changeTiempo = (id: string, raw: string) => {
    const tiempo = parseTime(raw)
    setDraftCards(prev =>
      prev.map(c => c.id === id ? { ...c, tiempo } : c)
        .sort((a, b) => a.tiempo - b.tiempo)
    )
  }

  const changeTipo = (id: string, tipo: CardTipo) => {
    setDraftCards(prev => prev.map(c => {
      if (c.id !== id) return c
      const base = { id: c.id, tiempo: c.tiempo }
      switch (tipo) {
        case 'texto':     return { ...base, tipo, texto: '' }
        case 'boton':     return { ...base, tipo, texto: '', boton_label: 'Listo' }
        case 'countdown': return { ...base, tipo, instruccion: '', duracion: 60 }
        case 'quiz':      return { ...base, tipo, pregunta: '', opciones: ['', '', '', ''], respuesta_correcta: null }
      }
    }))
  }

  const saveAll = async () => {
    setSaving(true); setErr(null)
    try {
      const res = await fetch('/api/admin/video-cards', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ recurso_url: recursoUrl, cards: draftCards }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      setCards(draftCards)
      onClose()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = JSON.stringify(cards) !== JSON.stringify(draftCards)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        style={{
          background: 'rgba(10,10,26,0.98)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
          width: '100%', maxWidth: 900, maxHeight: '92vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
        }}>
          <span style={{ fontSize: 18 }}>🃏</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
              Cartas interactivas
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              El video se pausa y muestra la carta al llegar al tiempo configurado
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body: video left + cards right */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* Video panel */}
          <div style={{ flex: '0 0 55%', padding: '16px 12px 16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              width: '100%', borderRadius: 12, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)', background: '#000',
              aspectRatio: '16/9',
            }}>
              <div ref={playerTargetRef} style={{ width: '100%', height: '100%' }} />
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={addCardAtCurrentTime}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                padding: '10px 18px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, var(--om-pink), var(--om-purple))',
                color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <Clock size={14} />
              Agregar carta en este momento
            </motion.button>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.5 }}>
              Reproduce el video, pausa en el momento que quieras y presiona el botón.
            </p>
          </div>

          {/* Cards panel */}
          <div style={{
            flex: 1, padding: '16px 20px 16px 12px',
            overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#fff' }}>
                Cartas ({draftCards.length})
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const newCard: VideoCard = { id: crypto.randomUUID(), tiempo: 0, tipo: 'texto', texto: '' }
                  setDraftCards(prev => [...prev, newCard])
                  setExpandedId(newCard.id)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 8, border: '1px solid rgba(236,72,138,0.3)',
                  background: 'rgba(236,72,138,0.1)', color: '#ec488a',
                  fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer',
                }}
              >
                <Plus size={12} /> Nueva carta
              </motion.button>
            </div>

            {loading && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 20 }}>
                Cargando...
              </p>
            )}

            {!loading && draftCards.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '32px 16px',
                border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12, marginTop: 8,
              }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
                  Sin cartas configuradas
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
                  Reproduce el video y presiona el botón para agregar una carta en ese momento.
                </p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {draftCards.map(card => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6, height: 0, marginBottom: 0 }}
                  style={{
                    border: `1px solid ${expandedId === card.id ? TIPO_BORDERS[card.tipo] : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 12, overflow: 'hidden',
                    background: expandedId === card.id ? `${TIPO_COLORS[card.tipo]}` : 'rgba(255,255,255,0.03)',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                >
                  {/* Card header */}
                  <div
                    onClick={() => setExpandedId(expandedId === card.id ? null : card.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 12px', cursor: 'pointer',
                    }}
                  >
                    {/* Tiempo input */}
                    <div
                      onClick={e => e.stopPropagation()}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'rgba(0,0,0,0.3)', borderRadius: 7,
                        padding: '3px 8px', flexShrink: 0,
                      }}
                    >
                      <Clock size={11} color="rgba(255,255,255,0.4)" />
                      <input
                        value={formatTime(card.tiempo)}
                        onChange={e => changeTiempo(card.id, e.target.value)}
                        style={{
                          background: 'none', border: 'none', outline: 'none',
                          color: '#fff', fontFamily: 'var(--font-display)', fontSize: 12,
                          fontWeight: 700, width: 36, textAlign: 'center',
                        }}
                      />
                    </div>

                    {/* Tipo badge */}
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: 11,
                      color: 'rgba(255,255,255,0.55)', flex: 1,
                    }}>
                      {TIPO_LABELS[card.tipo]}
                    </span>

                    <motion.button
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={e => { e.stopPropagation(); deleteCard(card.id) }}
                      style={{
                        width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(255,82,82,0.25)',
                        background: 'rgba(255,82,82,0.08)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Trash2 size={11} color="#ff6b6b" />
                    </motion.button>
                  </div>

                  {/* Expanded edit area */}
                  <AnimatePresence initial={false}>
                    {expandedId === card.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ padding: '0 12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {/* Tipo selector */}
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            {(Object.keys(TIPO_LABELS) as CardTipo[]).map(t => (
                              <button
                                key={t}
                                onClick={() => changeTipo(card.id, t)}
                                style={{
                                  padding: '4px 10px', borderRadius: 7, cursor: 'pointer',
                                  border: `1px solid ${card.tipo === t ? TIPO_BORDERS[t] : 'rgba(255,255,255,0.1)'}`,
                                  background: card.tipo === t ? TIPO_COLORS[t] : 'transparent',
                                  color: card.tipo === t ? '#fff' : 'rgba(255,255,255,0.45)',
                                  fontFamily: 'var(--font-body)', fontSize: 11,
                                  transition: 'all 0.15s',
                                }}
                              >
                                {TIPO_LABELS[t]}
                              </button>
                            ))}
                          </div>

                          <CardForm card={card} onChange={updateCard} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
        }}>
          {err && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#ff5252' }}>{err}</p>
          )}
          {!err && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
              {hasChanges ? '● Cambios sin guardar' : `${cards.length} cartas guardadas`}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 18px', borderRadius: 9, cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)', fontSize: 13,
              }}
            >
              Cancelar
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={saveAll}
              disabled={saving}
              style={{
                padding: '8px 22px', borderRadius: 9, cursor: saving ? 'not-allowed' : 'pointer',
                border: 'none', background: 'linear-gradient(135deg, var(--om-pink), var(--om-purple))',
                color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: 13, opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Guardando...' : 'Guardar cartas'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
