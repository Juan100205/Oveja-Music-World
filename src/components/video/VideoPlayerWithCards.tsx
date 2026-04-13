'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { VideoCard } from '@/types'


// ── Helpers ────────────────────────────────────────────────────
function formatTime(totalSecs: number) {
  const m = Math.floor(totalSecs / 60)
  const s = totalSecs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

// ── Sub-components for each card type ─────────────────────────

function ContinuarBtn({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        padding: '12px 28px', borderRadius: 999, border: 'none',
        background: 'linear-gradient(135deg, var(--om-pink), var(--om-purple))',
        color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
        cursor: 'pointer',
      }}
    >
      Continuar →
    </motion.button>
  )
}

function CardTexto({ texto, onDone }: { texto: string; onDone: () => void }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 420, width: '100%' }}>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(255,255,255,0.88)',
        lineHeight: 1.7, marginBottom: 28, whiteSpace: 'pre-wrap',
      }}>
        {texto}
      </p>
      <ContinuarBtn onClick={onDone} />
    </div>
  )
}

function CardBoton({ texto, botonLabel, onDone }: { texto: string; botonLabel: string; onDone: () => void }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 420, width: '100%' }}>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(255,255,255,0.88)',
        lineHeight: 1.7, marginBottom: 28, whiteSpace: 'pre-wrap',
      }}>
        {texto}
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={onDone}
        style={{
          padding: '12px 28px', borderRadius: 999, border: 'none',
          background: 'linear-gradient(135deg, var(--om-pink), var(--om-purple))',
          color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
          cursor: 'pointer',
        }}
      >
        {botonLabel}
      </motion.button>
    </div>
  )
}

function CardCountdown({ instruccion, duracion, onDone }: {
  instruccion: string; duracion: number; onDone: () => void
}) {
  const [timeLeft, setTimeLeft] = useState(duracion)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (!running || timeLeft <= 0) return
    const t = setTimeout(() => {
      const next = timeLeft - 1
      setTimeLeft(next)
      if (next <= 0) { setRunning(false); setFinished(true) }
    }, 1000)
    return () => clearTimeout(t)
  }, [running, timeLeft])

  const progress = 1 - timeLeft / duracion
  const circumference = 2 * Math.PI * 42

  return (
    <div style={{ textAlign: 'center', maxWidth: 400, width: '100%' }}>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(255,255,255,0.85)',
        lineHeight: 1.6, marginBottom: 24, whiteSpace: 'pre-wrap',
      }}>
        {instruccion}
      </p>

      {/* Circular timer */}
      <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 24px' }}>
        <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
          <circle
            cx="50" cy="50" r="42" fill="none"
            stroke={finished ? '#34d399' : 'var(--om-pink)'}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22,
          color: finished ? '#34d399' : '#fff',
        }}>
          {finished ? '✓' : formatTime(timeLeft)}
        </div>
      </div>

      {!running && !finished && (
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setRunning(true)}
          style={{
            padding: '10px 24px', borderRadius: 999, border: 'none',
            background: 'linear-gradient(135deg, var(--om-pink), var(--om-purple))',
            color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
            cursor: 'pointer', display: 'block', margin: '0 auto 12px',
          }}
        >
          ▶ Iniciar timer
        </motion.button>
      )}

      {finished && <ContinuarBtn onClick={onDone} />}

      {running && (
        <button
          onClick={onDone}
          style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
            fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer',
          }}
        >
          Saltar
        </button>
      )}
    </div>
  )
}

function CardQuiz({ pregunta, opciones, respuestaCorrecta, onDone }: {
  pregunta: string; opciones: string[]; respuestaCorrecta: number | null; onDone: () => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  const hasCorrect = respuestaCorrecta !== null

  const handleSelect = (i: number) => {
    if (revealed) return
    setSelected(i)
    if (hasCorrect) setRevealed(true)
  }

  const canContinue = revealed || (!hasCorrect && selected !== null)

  return (
    <div style={{ maxWidth: 460, width: '100%' }}>
      <p style={{
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
        color: '#fff', marginBottom: 18, lineHeight: 1.45,
      }}>
        {pregunta}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
        {opciones.map((op, i) => {
          let bg = 'rgba(255,255,255,0.06)'
          let border = 'rgba(255,255,255,0.11)'
          let color = 'rgba(255,255,255,0.8)'

          if (revealed) {
            if (i === selected && (!hasCorrect || i === respuestaCorrecta)) {
              bg = 'rgba(52,211,153,0.18)'; border = 'rgba(52,211,153,0.45)'; color = '#34d399'
            } else if (i === selected && i !== respuestaCorrecta) {
              bg = 'rgba(255,82,82,0.18)'; border = 'rgba(255,82,82,0.45)'; color = '#ff6b6b'
            } else if (hasCorrect && i === respuestaCorrecta) {
              bg = 'rgba(52,211,153,0.1)'; border = 'rgba(52,211,153,0.3)'; color = '#34d399'
            }
          } else if (selected === i) {
            bg = 'rgba(236,72,138,0.15)'; border = 'rgba(236,72,138,0.4)'
          }

          return (
            <motion.button
              key={i}
              whileHover={!revealed ? { scale: 1.01 } : {}}
              whileTap={!revealed ? { scale: 0.99 } : {}}
              onClick={() => handleSelect(i)}
              style={{
                padding: '11px 14px', borderRadius: 10, textAlign: 'left',
                border: `1px solid ${border}`, background: bg, color,
                fontFamily: 'var(--font-body)', fontSize: 13,
                cursor: revealed ? 'default' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontWeight: 700, marginRight: 8 }}>
                {String.fromCharCode(65 + i)}.
              </span>
              {op}
            </motion.button>
          )
        })}
      </div>

      {revealed && hasCorrect && selected !== null && (
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 13, textAlign: 'center', marginBottom: 16,
          color: selected === respuestaCorrecta ? '#34d399' : '#ff6b6b',
        }}>
          {selected === respuestaCorrecta
            ? '¡Correcto! 🎉'
            : `Incorrecto. La respuesta correcta es: "${opciones[respuestaCorrecta!]}"`}
        </p>
      )}

      {canContinue && (
        <div style={{ textAlign: 'center' }}>
          <ContinuarBtn onClick={onDone} />
        </div>
      )}

      {!hasCorrect && selected === null && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onDone}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
              fontFamily: 'var(--font-body)', fontSize: 12, cursor: 'pointer',
            }}
          >
            Omitir
          </button>
        </div>
      )}
    </div>
  )
}

// ── Card overlay dispatch ──────────────────────────────────────
function CardOverlay({ card, onDone }: { card: VideoCard; onDone: () => void }) {
  return (
    <motion.div
      key={card.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 10,
        background: 'rgba(8,8,22,0.93)', backdropFilter: 'blur(18px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', damping: 26, stiffness: 280 }}
        style={{
          background: 'rgba(12,12,28,0.98)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20,
          padding: '28px 24px', maxWidth: 500, width: '100%',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {card.tipo === 'texto' && (
          <CardTexto texto={card.texto} onDone={onDone} />
        )}
        {card.tipo === 'boton' && (
          <CardBoton texto={card.texto} botonLabel={card.boton_label} onDone={onDone} />
        )}
        {card.tipo === 'countdown' && (
          <CardCountdown instruccion={card.instruccion} duracion={card.duracion} onDone={onDone} />
        )}
        {card.tipo === 'quiz' && (
          <CardQuiz
            pregunta={card.pregunta}
            opciones={card.opciones}
            respuestaCorrecta={card.respuesta_correcta}
            onDone={onDone}
          />
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────
interface VideoPlayerWithCardsProps {
  videoUrl: string
  label?: string
  onVideoEnd?: () => void
  onClose: () => void
}

export default function VideoPlayerWithCards({
  videoUrl, label, onVideoEnd, onClose,
}: VideoPlayerWithCardsProps) {
  const ytId = getYouTubeId(videoUrl) ?? ''
  const playerTargetRef = useRef<HTMLDivElement>(null)
  const playerRef        = useRef<YTPlayer | null>(null)
  const pollRef          = useRef<ReturnType<typeof setInterval> | null>(null)
  const shownCardsRef    = useRef<Set<string>>(new Set())
  const cardsRef         = useRef<VideoCard[]>([])

  const [cards, setCards]           = useState<VideoCard[]>([])
  const [activeCard, setActiveCard] = useState<VideoCard | null>(null)

  // Keep cardsRef in sync
  useEffect(() => { cardsRef.current = cards }, [cards])

  // Load cards for this video
  useEffect(() => {
    fetch(`/api/video-cards?url=${encodeURIComponent(videoUrl)}`)
      .then(r => r.json())
      .then(({ cards }) => setCards(cards ?? []))
      .catch(() => {})
  }, [videoUrl])

  // Polling: check current time vs card timestamps
  const startPolling = useCallback(() => {
    if (pollRef.current) return
    pollRef.current = setInterval(() => {
      const player = playerRef.current
      if (!player) return
      const currentSec = Math.floor(player.getCurrentTime())
      for (const card of cardsRef.current) {
        if (shownCardsRef.current.has(card.id)) continue
        if (Math.abs(currentSec - card.tiempo) <= 1) {
          player.pauseVideo()
          shownCardsRef.current.add(card.id)
          setActiveCard(card)
          break
        }
      }
    }, 500)
  }, [])

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  // Init YouTube Player
  const initPlayer = useCallback(() => {
    if (!playerTargetRef.current || playerRef.current) return
    playerRef.current = new window.YT.Player(playerTargetRef.current, {
      videoId: ytId,
      width: '100%',
      height: '100%',
      playerVars: { autoplay: 1, rel: 0, modestbranding: 1, enablejsapi: 1 },
      events: {
        onStateChange: (e) => {
          if (e.data === window.YT.PlayerState.PLAYING)  startPolling()
          if (e.data === window.YT.PlayerState.PAUSED)   stopPolling()
          if (e.data === window.YT.PlayerState.ENDED) {
            stopPolling()
            onVideoEnd?.()
          }
        },
      },
    })
  }, [ytId, startPolling, stopPolling, onVideoEnd])

  useEffect(() => {
    if (window.YT?.Player) {
      initPlayer()
    } else {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        initPlayer()
      }
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement('script')
        s.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(s)
      }
    }
    return () => {
      stopPolling()
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [initPlayer, stopPolling])

  const handleCardDone = useCallback(() => {
    setActiveCard(null)
    playerRef.current?.playVideo()
  }, [])

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="vp-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: 'rgba(5,5,18,0.95)', backdropFilter: 'blur(20px)',
        }}
      />

      {/* Player container */}
      <motion.div
        key="vp-container"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        style={{
          position: 'absolute', inset: 16, zIndex: 51,
          display: 'flex', flexDirection: 'column', gap: 12,
          pointerEvents: 'none',
        }}
      >
        {/* Header */}
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: 'rgba(236,72,138,0.15)', border: '1px solid rgba(236,72,138,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
            }}
          >
            ▶
          </div>
          <p style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
            color: '#fff', flex: 1, lineHeight: 1.2,
          }}>
            {label ?? 'Video'}
          </p>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 14,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ✕
          </motion.button>
        </div>

        {/* Video + card overlay */}
        <div style={{
          flex: 1, pointerEvents: 'auto', position: 'relative',
          borderRadius: 16, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)', minHeight: 0,
        }}>
          <div ref={playerTargetRef} style={{ width: '100%', height: '100%' }} />

          <AnimatePresence>
            {activeCard && (
              <CardOverlay card={activeCard} onDone={handleCardDone} />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  )
}
