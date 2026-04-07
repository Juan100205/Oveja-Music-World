'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface Props {
  label: string
  href: string
}

export default function IrAClaseButton({ label, href }: Props) {
  const router = useRouter()

  return (
    <motion.button
      onClick={() => router.push(href)}
      initial={false}
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
      {label}
    </motion.button>
  )
}
