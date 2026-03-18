// --- User ---
export type UserRole = 'student' | 'teacher' | 'admin'

export interface User {
  id: string
  email: string
  role: UserRole
  nivel: number
  puntos: number
  nombre?: string
  created_at: string
}

// --- Zone ---
export interface Zone {
  id: string
  nombre: string
  nivel_requerido: number
  spline_object_id: string   // nombre del objeto en la escena Spline
  descripcion?: string
}

// --- Video ---
export interface Video {
  id: string
  titulo: string
  url: string
  nivel_requerido: number
  zona_id: string
  duracion_segundos?: number
  puntos_al_completar: number
}

// --- Auth ---
export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: Omit<User, 'password_hash'>
}

export interface JWTPayload {
  sub: string        // user id
  email: string
  role: UserRole
  nivel: number
  iat?: number
  exp?: number
}

// --- Gamification ---
export interface LevelConfig {
  nivel: number
  puntos_requeridos: number
  nombre: string
}

export const LEVEL_CONFIG: LevelConfig[] = [
  { nivel: 1, puntos_requeridos: 0,   nombre: 'Principiante' },
  { nivel: 2, puntos_requeridos: 100, nombre: 'Aprendiz' },
  { nivel: 3, puntos_requeridos: 300, nombre: 'Intermedio' },
  { nivel: 4, puntos_requeridos: 600, nombre: 'Avanzado' },
  { nivel: 5, puntos_requeridos: 1000, nombre: 'Maestro' },
]

export const PUNTOS_POR_VIDEO = 20

// --- API responses ---
export interface ApiError {
  error: string
  status: number
}
