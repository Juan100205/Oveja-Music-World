'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Settings } from 'lucide-react'
import type { User } from '@/types'

export default function PanelButton({ user, delay = 0.5 }: { user: User | null; delay?: number }) {
  const router = useRouter()
  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) return null
  const isAdmin = user.role === 'admin'
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileHover={{ scale: 1.08, boxShadow: '0 0 24px rgba(155,84,249,0.6)' }}
      whileTap={{ scale: 0.94 }}
      onClick={() => router.push(isAdmin ? '/admin' : '/teacher')}
      className="cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, #9b54f9, #ec488a)',
        border: 'none', borderRadius: 999,
        padding: '9px 18px',
        color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
        boxShadow: '0 0 16px rgba(155,84,249,0.4)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}
    >
      <Settings size={14} strokeWidth={1.5} />
      <span>{isAdmin ? 'Admin' : 'Docente'}</span>
    </motion.button>
  )
}