'use client'

import { motion } from 'framer-motion'

interface PageTransitionProps {
  children: React.ReactNode
  direction?: 'up' | 'down'
}

export default function PageTransition({ children, direction = 'up' }: PageTransitionProps) {
  const offset = direction === 'up' ? 40 : -40

  return (
    <motion.div
      className="w-full h-full"
      initial={{ opacity: 0, y: offset }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }}
      exit={{ opacity: 0, y: -offset, transition: { duration: 0.3, ease: 'easeIn' } }}
    >
      {children}
    </motion.div>
  )
}
