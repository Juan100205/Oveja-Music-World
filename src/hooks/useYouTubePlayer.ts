'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { InteractionPoint } from '@/types'

// ── YT IFrame API types (minimal) ──────────────────────────────
declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string
          playerVars?: Record<string, unknown>
          events?: {
            onReady?: (e: { target: YTPlayer }) => void
            onStateChange?: (e: { data: number }) => void
          }
        }
      ) => YTPlayer
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  getCurrentTime(): number
  getDuration(): number
  destroy(): void
}

export interface UseYouTubePlayerReturn {
  containerRef:       React.RefObject<HTMLDivElement | null>
  playerReady:        boolean
  interactionPending: InteractionPoint | null
  dismissInteraction: () => void   // resumes video + clears pending
  onVideoEnded:       (() => void) | null
  setOnVideoEnded:    (cb: (() => void) | null) => void
}

// Load the YT iframe API script exactly once per page
let scriptLoaded  = false
let scriptLoading = false
const readyCallbacks: (() => void)[] = []

function loadYTScript(onReady: () => void) {
  if (scriptLoaded) { onReady(); return }
  readyCallbacks.push(onReady)
  if (scriptLoading) return

  scriptLoading = true
  const prev = window.onYouTubeIframeAPIReady
  window.onYouTubeIframeAPIReady = () => {
    scriptLoaded = true
    if (prev) prev()
    readyCallbacks.forEach(cb => cb())
    readyCallbacks.length = 0
  }
  const tag = document.createElement('script')
  tag.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(tag)
}

export function useYouTubePlayer(
  videoId: string | null,
  interacciones: InteractionPoint[]
): UseYouTubePlayerReturn {
  const containerRef       = useRef<HTMLDivElement | null>(null)
  const playerRef          = useRef<YTPlayer | null>(null)
  const intervalRef        = useRef<ReturnType<typeof setInterval> | null>(null)
  const firedRef           = useRef<Set<string>>(new Set())  // ids already triggered

  const [playerReady,        setPlayerReady]        = useState(false)
  const [interactionPending, setInteractionPending] = useState<InteractionPoint | null>(null)
  const [onVideoEnded,       _setOnVideoEnded]      = useState<(() => void) | null>(null)

  const setOnVideoEnded = useCallback((cb: (() => void) | null) => {
    _setOnVideoEnded(() => cb)
  }, [])

  const stopInterval = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [])

  const startPolling = useCallback(() => {
    stopInterval()
    intervalRef.current = setInterval(() => {
      const player = playerRef.current
      if (!player || interacciones.length === 0) return

      const currentTime = player.getCurrentTime()
      const duration    = player.getDuration()

      for (const punto of interacciones) {
        if (firedRef.current.has(punto.id)) continue
        // Only trigger if the video is long enough for this interaction point
        if (duration > 0 && punto.at_seconds >= duration) continue
        if (currentTime >= punto.at_seconds) {
          firedRef.current.add(punto.id)
          player.pauseVideo()
          setInteractionPending(punto)
          stopInterval()
          break
        }
      }
    }, 250)
  }, [interacciones, stopInterval])

  const dismissInteraction = useCallback(() => {
    setInteractionPending(null)
    playerRef.current?.playVideo()
    startPolling()
  }, [startPolling])

  // Build / rebuild player when videoId changes
  useEffect(() => {
    if (!videoId) return
    setPlayerReady(false)
    setInteractionPending(null)
    firedRef.current = new Set()
    stopInterval()

    const buildPlayer = () => {
      if (!containerRef.current) return

      // Destroy previous instance
      try { playerRef.current?.destroy() } catch { /* ignore */ }
      playerRef.current = null

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay:       1,
          rel:            0,
          modestbranding: 1,
          origin:         window.location.origin,
        },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (e) => {
            const { PLAYING, ENDED, PAUSED } = window.YT.PlayerState
            if (e.data === PLAYING)  startPolling()
            if (e.data === PAUSED)   stopInterval()
            if (e.data === ENDED)  {
              stopInterval()
              onVideoEnded?.()
            }
          },
        },
      })
    }

    loadYTScript(buildPlayer)

    return () => {
      stopInterval()
      try { playerRef.current?.destroy() } catch { /* ignore */ }
      playerRef.current = null
    }
    // onVideoEnded intentionally excluded — it's a stable callback reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

  // When interacciones update reactively (loaded async), re-sync fired set
  useEffect(() => {
    firedRef.current = new Set()
  }, [interacciones])

  return {
    containerRef,
    playerReady,
    interactionPending,
    dismissInteraction,
    onVideoEnded,
    setOnVideoEnded,
  }
}
