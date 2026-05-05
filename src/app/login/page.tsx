'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LoginForm from '@/components/auth/LoginForm'
import RegisterForm from '@/components/auth/RegisterForm'
import { useAuth } from '@/hooks/useAuth'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const { login, register, loading, error, isAuthenticated } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')

  useEffect(() => {
    if (!isAuthenticated) return
    const stored = localStorage.getItem('user')
    const u = stored ? JSON.parse(stored) : null
    router.replace(u?.role === 'admin' ? '/admin' : u?.role === 'teacher' ? '/teacher' : '/escuela')
  }, [isAuthenticated, router])

  const handleLogin = async (credentials: { email: string; password: string }) => {
    const ok = await login(credentials)
    if (ok) {
      const stored = localStorage.getItem('user')
      const u = stored ? JSON.parse(stored) : null
      router.push(u?.role === 'admin' ? '/admin' : u?.role === 'teacher' ? '/teacher' : '/escuela')
    }
    return ok
  }

  const handleRegister = async (data: { email: string; password: string; nombre?: string }) => {
    return register(data)
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

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative w-full max-w-sm rounded-3xl p-6 sm:p-10"
          style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
        >
          {mode === 'login' ? (
            <>
              <LoginForm onSubmit={handleLogin} loading={loading} serverError={error} />
              <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--om-text)', opacity: 0.6, marginTop: 16 }}>
                ¿No Tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  style={{ color: 'var(--om-purple)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Registrate
                </button>
              </p>
            </>
          ) : (
            <RegisterForm
              onSubmit={handleRegister}
              onSwitchToLogin={() => setMode('login')}
              loading={loading}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  )
}
