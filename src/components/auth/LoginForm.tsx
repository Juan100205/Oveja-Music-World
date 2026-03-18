'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { validateLoginCredentials } from '@/lib/auth'
import type { LoginCredentials } from '@/types'

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<boolean>
  loading?: boolean
  serverError?: string | null
}

export default function LoginForm({ onSubmit, loading = false, serverError }: LoginFormProps) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setClientError(null)
    const validation = validateLoginCredentials({ email, password })
    if (!validation.valid) { setClientError(validation.error ?? null); return }
    await onSubmit({ email, password })
  }

  const error = clientError ?? serverError

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full" data-testid="login-form">

      {/* Logo */}
      <div className="text-center mb-2">
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--om-pink)', fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>
          Oveja Music
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--om-text)', fontSize: 14, marginTop: 4 }}>
          Accede a tu escuela de música
        </p>
      </div>

      {/* Error */}
      {error && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-center py-2 px-3 rounded-xl"
          style={{ background: 'rgba(236,72,138,0.1)', color: 'var(--om-pink)', border: '1px solid rgba(236,72,138,0.25)' }}
        >
          {error}
        </motion.p>
      )}

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--om-text)' }}>
          Email
        </label>
        <input
          id="email"
          type="text"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.com"
          disabled={loading}
          className="w-full px-4 py-3 rounded-2xl outline-none disabled:opacity-50 transition-all"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            border: '2px solid #e8eaf0',
            background: '#fff',
            color: 'var(--om-text)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--om-blue)'}
          onBlur={e => e.target.style.borderColor = '#e8eaf0'}
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--om-text)' }}>
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••"
          disabled={loading}
          className="w-full px-4 py-3 rounded-2xl outline-none disabled:opacity-50 transition-all"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            border: '2px solid #e8eaf0',
            background: '#fff',
            color: 'var(--om-text)',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--om-blue)'}
          onBlur={e => e.target.style.borderColor = '#e8eaf0'}
        />
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="w-full py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontWeight: 700,
          background: 'linear-gradient(135deg, var(--om-pink) 0%, var(--om-purple) 100%)',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(236,72,138,0.35)',
          border: 'none',
        }}
      >
        {loading ? 'Ingresando...' : 'INGRESAR →'}
      </motion.button>

    </form>
  )
}
