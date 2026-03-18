'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { PUNTOS_POR_VIDEO } from '@/lib/gamification'
import { isYoutubeUrl, getYoutubeEmbedUrl } from '@/lib/youtube'
import type { Video } from '@/types'

interface VideoPlayerProps {
  video: Video
  token: string
  onComplete?: (puntos: number) => void
}

export default function VideoPlayer({ video, token, onComplete }: VideoPlayerProps) {
  const [completed, setCompleted] = useState(false)
  const completedRef = useRef(false)
  const videoRef     = useRef<HTMLVideoElement>(null)
  const isYT         = isYoutubeUrl(video.url)
  const embedUrl     = isYT ? getYoutubeEmbedUrl(video.url) : null

  /* ── Tracking para video HTML5 ── */
  const handleTimeUpdate = () => {
    const el = videoRef.current
    if (!el || completedRef.current || !el.duration) return
    if (el.currentTime / el.duration >= 0.9) markComplete()
  }

  /* ── Para YouTube usamos un botón manual "Marcar completado" ── */
  const markComplete = () => {
    if (completedRef.current) return
    completedRef.current = true
    setCompleted(true)
    awardPoints()
  }

  const awardPoints = async () => {
    try {
      await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ puntos: PUNTOS_POR_VIDEO }),
      })
      onComplete?.(PUNTOS_POR_VIDEO)
    } catch { /* silent */ }
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl overflow-hidden"
      data-testid="video-player"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* ── Player ── */}
      <div className="relative w-full aspect-video bg-black">
        {isYT && embedUrl ? (
          <iframe
            src={embedUrl}
            title={video.titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            style={{ border: 'none' }}
          />
        ) : (
          <video
            ref={videoRef}
            src={video.url}
            controls
            controlsList="nodownload"
            disablePictureInPicture
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
          />
        )}
      </div>

      {/* ── Info + acciones ── */}
      <div className="px-4 pb-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff' }}>
            {video.titulo}
          </h3>
          {video.duracion_segundos && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
              {Math.round(video.duracion_segundos / 60)} min
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Botón "Marcar completado" solo para YouTube */}
          {isYT && !completed && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={markComplete}
              className="text-xs px-3 py-1.5 rounded-full cursor-pointer transition-colors"
              style={{
                background: 'rgba(61,184,250,0.12)',
                color: 'var(--om-blue)',
                border: '1px solid rgba(61,184,250,0.25)',
                fontFamily: 'var(--font-body)',
              }}
            >
              ✓ Marcar completado
            </motion.button>
          )}

          {completed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(61,184,250,0.15)',
                color: 'var(--om-blue)',
                border: '1px solid rgba(61,184,250,0.3)',
                fontFamily: 'var(--font-body)',
              }}
            >
              ✓ +{PUNTOS_POR_VIDEO} pts
            </motion.div>
          ) : (
            <span
              className="text-xs px-3 py-1.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.4)',
                fontFamily: 'var(--font-body)',
              }}
            >
              +{PUNTOS_POR_VIDEO} pts
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
