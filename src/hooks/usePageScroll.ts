'use client'

import { useEffect } from 'react'

/**
 * Habilita scroll en html/body para páginas sin Spline.
 * Restaura overflow:hidden al desmontar (al navegar a otra página).
 */
export function usePageScroll() {
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    html.style.overflowY = 'auto'
    body.style.overflowY = 'auto'
    return () => {
      html.style.overflowY = ''
      body.style.overflowY = ''
    }
  }, [])
}
