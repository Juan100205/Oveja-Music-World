// YouTube IFrame API — tipos globales compartidos
interface YTPlayer {
  pauseVideo(): void
  playVideo(): void
  getCurrentTime(): number
  getDuration(): number
  destroy(): void
}

interface YTPlayerOptions {
  videoId: string
  width?: string | number
  height?: string | number
  playerVars?: Record<string, unknown>
  events?: {
    onReady?: (e: { target: YTPlayer }) => void
    onStateChange?: (e: { data: number }) => void
  }
}

interface Window {
  YT: {
    Player: new (el: HTMLElement | string, opts: YTPlayerOptions) => YTPlayer
    PlayerState: {
      ENDED: number
      PLAYING: number
      PAUSED: number
      BUFFERING: number
    }
  }
  onYouTubeIframeAPIReady?: () => void
}
