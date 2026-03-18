import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { LoginCredentials, JWTPayload } from '@/types'

const SALT_ROUNDS = 12
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
const JWT_EXPIRES_IN = '7d'

// --- Validation ---

interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateLoginCredentials(credentials: LoginCredentials): ValidationResult {
  const { email, password } = credentials

  if (!email || email.trim() === '') {
    return { valid: false, error: 'El email es requerido' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Email inválido' }
  }

  if (!password || password === '') {
    return { valid: false, error: 'La contraseña es requerida' }
  }

  if (password.length < 6) {
    return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  return { valid: true }
}

// --- Password ---

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// --- JWT ---

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}
