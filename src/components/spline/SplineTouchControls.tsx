'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LS_KEY = 'spline_touch_hints_dismissed'

export default function SplineTouchControls() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(LS_KEY)
    if (!dismissed) {
      const showTimer = setTimeout(() => setShow(true), 500)
      const autoDismiss = setTimeout(() => {
        setShow(false)
        localStorage.setItem(LS_KEY, '1')
      }, 4500)
      return () => { clearTimeout(showTimer); clearTimeout(autoDismiss) }
    }
  }, [])

  const dismiss = () => {
    setShow(false)
    localStorage.setItem(LS_KEY, '1')
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          onClick={dismiss}
          className="fixed z-30 bottom-6 left-1/2 -translate-x-1/2 flex lg:hidden cursor-pointer"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            background: 'rgba(10,10,26,0.88)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '10px 18px',
          }}>
            <div className="flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="12" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
                <path d="M8 10 L14 6 L20 10" stroke="rgba(255,255,255,0.8)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <animateTransform attributeName="transform" type="rotate" values="0 14 14;15 14 14;0 14 14" dur="2s" repeatCount="indefinite" />
                </path>
                <path d="M8 18 L14 22 L20 18" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <line x1="14" y1="6" x2="14" y2="22" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
              </svg>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
                Gira
              </span>
            </div>

            <div className="flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="12" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
                <circle cx="9" cy="12" r="3.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1" fill="none" />
                <circle cx="19" cy="16" r="3.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1" fill="none" />
                <line x1="11.5" y1="10.5" x2="16.5" y2="14.5" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
                <animateTransform attributeName="transform" type="translate" values="0 0;0 -1;0 0" dur="2s" repeatCount="indefinite" />
              </svg>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
                Zoom
              </span>
            </div>

            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)' }} />

            <motion.span
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}
            >
              Toca para cerrar
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
