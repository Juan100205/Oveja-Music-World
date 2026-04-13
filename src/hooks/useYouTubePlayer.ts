'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { InteractionPoint } from '@/types'

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
  // ── onVideoEnded stored in a ref so the YT player closure always reads the latest value ──
  const onVideoEndedRef    = useRef<(() => void) | null>(null)

  const [playerReady,        setPlayerReady]        = useState(false)
  const [interactionPending, setInteractionPending] = useState<InteractionPoint | null>(null)
  // Exposed as state so consumers can read it, but we drive it from the ref
  const [onVideoEnded,       _setOnVideoEnded]      = useState<(() => void) | null>(null)

  const setOnVideoEnded = useCallback((cb: (() => void) | null) => {
    onVideoEndedRef.current = cb   // always up-to-date in the player closure
    _setOnVideoEnded(() => cb)     // keep state in sync for consumers
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
              // Lee siempre el callback más reciente desde el ref (evita stale closure)
              const cb = onVideoEndedRef.current
              console.log('[YT] 🎬 video ENDED — videoCompleted callback registrado:', !!cb)
              cb?.()
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
