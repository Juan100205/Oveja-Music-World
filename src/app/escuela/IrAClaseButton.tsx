'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function IrAClaseButton() {
  const router = useRouter()

  return (
    <motion.button
      onClick={() => router.push('/escuela/clase')}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.45, ease: 'easeOut' }}
      whileHover={{ scale: 1.06, boxShadow: '0 0 48px rgba(236,72,138,0.55)' }}
      whileTap={{ scale: 0.95 }}
      className="cursor-pointer"
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 16,
        padding: '14px 36px',
        borderRadius: 999,
        border: 'none',
        background: 'linear-gradient(135deg, var(--om-pink) 0%, var(--om-purple) 100%)',
        color: '#fff',
        boxShadow: '0 0 32px rgba(236,72,138,0.4)',
        letterSpacing: '0.02em',
      }}
    >
      Ir a Clase →
    </motion.button>
  )
}
