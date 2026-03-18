'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import LoginForm from '@/components/auth/LoginForm'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { login, loading, error, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) router.replace('/escuela')
  }, [isAuthenticated, router])

  const handleLogin = async (credentials: { email: string; password: string }) => {
    const ok = await login(credentials)
    if (ok) router.push('/escuela')
    return ok
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #3db8fa 0%, #9b54f9 50%, #ec488a 100%)' }}
    >
      {/* Círculos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20" style={{ background: 'var(--om-pink)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20" style={{ background: 'var(--om-blue)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10" style={{ background: 'var(--om-purple)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-sm rounded-3xl p-12"
        style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
      >
        <LoginForm onSubmit={handleLogin} loading={loading} serverError={error} />
      </motion.div>
    </main>
  )
}
