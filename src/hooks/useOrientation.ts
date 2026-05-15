'use client'

import { useState, useEffect } from 'react'

interface OrientationState {
  isMobile: boolean
  isPortrait: boolean
  isLandscape: boolean
}

export function useOrientation(): OrientationState {
  const [state, setState] = useState<OrientationState>({
    isMobile: false,
    isPortrait: false,
    isLandscape: true,
  })

  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 1024
      const portrait = window.innerHeight > window.innerWidth
      setState({ isMobile: mobile, isPortrait: portrait, isLandscape: !portrait })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return state
}
