'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Mail, Lock, User, CheckCircle } from 'lucide-react'

interface RegisterFormProps {
  onSubmit: (data: { email: string; password: string; nombre?: string }) => Promise<{ ok: boolean; error?: string }>
  onSwitchToLogin: () => void
  loading?: boolean
}

export default function RegisterForm({ onSubmit, onSwitchToLogin, loading = false }: RegisterFormProps) {
  const [nombre, setNombre]         = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresá un email válido'); return
    }
    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres'); return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden'); return
    }

    const result = await onSubmit({ email, password, nombre: nombre.trim() || undefined })
    if (result.ok) {
      setSuccess(true)
    } else {
      setError(result.error ?? 'Error al registrar')
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5 py-4 text-center"
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(61,184,250,0.12)' }}>
          <CheckCircle size={32} style={{ color: 'var(--om-blue)' }} strokeWidth={1.5} />
        </div>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--om-purple)', fontSize: 22, fontWeight: 700 }}>
            ¡Cuenta creada!
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--om-text)', fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
            Tu cuenta fue creada exitosamente.<br />
            El administrador te asignará acceso a los cursos en breve.
          </p>
        </div>
        <motion.button
          onClick={onSwitchToLogin}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-2xl font-semibold"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--om-blue) 0%, var(--om-purple) 100%)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(61,184,250,0.35)',
            border: 'none',
          }}
        >
          Ir al login
        </motion.button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">

      {/* Logo */}
      <div className="text-center mb-1">
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--om-pink)', fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>
          Oveja Music
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--om-text)', fontSize: 14, marginTop: 4 }}>
          Creá tu cuenta gratuita
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

      {/* Nombre */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-nombre" style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--om-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <User size={13} strokeWidth={1.5} style={{ opacity: 0.5 }} /> Nombre <span style={{ opacity: 0.4, fontSize: 11 }}>(opcional)</span>
        </label>
        <input
          id="reg-nombre"
          type="text"
          autoComplete="name"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Tu nombre"
          disabled={loading}
          className="w-full px-4 py-3 rounded-2xl outline-none disabled:opacity-50 transition-all"
          style={{ fontFamily: 'var(--font-body)', fontSize: 14, border: '2px solid #e8eaf0', background: '#fff', color: 'var(--om-text)' }}
          onFocus={e => e.target.style.borderColor = 'var(--om-blue)'}
          onBlur={e => e.target.style.borderColor = '#e8eaf0'}
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-email" style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--om-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Mail size={13} strokeWidth={1.5} style={{ opacity: 0.5 }} /> Email
        </label>
        <input
          id="reg-email"
          type="text"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.com"
          disabled={loading}
          className="w-full px-4 py-3 rounded-2xl outline-none disabled:opacity-50 transition-all"
          style={{ fontFamily: 'var(--font-body)', fontSize: 14, border: '2px solid #e8eaf0', background: '#fff', color: 'var(--om-text)' }}
          onFocus={e => e.target.style.borderColor = 'var(--om-blue)'}
          onBlur={e => e.target.style.borderColor = '#e8eaf0'}
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-password" style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--om-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lock size={13} strokeWidth={1.5} style={{ opacity: 0.5 }} /> Contraseña
        </label>
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          disabled={loading}
          className="w-full px-4 py-3 rounded-2xl outline-none disabled:opacity-50 transition-all"
          style={{ fontFamily: 'var(--font-body)', fontSize: 14, border: '2px solid #e8eaf0', background: '#fff', color: 'var(--om-text)' }}
          onFocus={e => e.target.style.borderColor = 'var(--om-blue)'}
          onBlur={e => e.target.style.borderColor = '#e8eaf0'}
        />
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reg-confirm" style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: 'var(--om-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lock size={13} strokeWidth={1.5} style={{ opacity: 0.5 }} /> Confirmar contraseña
        </label>
        <input
          id="reg-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Repetí tu contraseña"
          disabled={loading}
          className="w-full px-4 py-3 rounded-2xl outline-none disabled:opacity-50 transition-all"
          style={{ fontFamily: 'var(--font-body)', fontSize: 14, border: '2px solid #e8eaf0', background: '#fff', color: 'var(--om-text)' }}
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
        className="w-full py-3 rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity mt-1"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontWeight: 700,
          background: 'linear-gradient(135deg, var(--om-blue) 0%, var(--om-purple) 100%)',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(61,184,250,0.35)',
          border: 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? 'Creando cuenta...' : <><span>Crear cuenta</span><ArrowRight size={15} strokeWidth={1.5} /></>}
        </span>
      </motion.button>

      {/* Switch to login */}
      <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--om-text)', opacity: 0.6, marginTop: 2 }}>
        ¿Ya Tienes cuenta?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={{ color: 'var(--om-purple)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Ingresar
        </button>
      </p>

    </form>
  )
}
