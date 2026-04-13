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
  cursos_acceso?: string[]
  clases_acceso?: string[]
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

// --- Video Interactions ---
export type InteractionTipo = 'practica' | 'reflexion' | 'reto'

export interface InteractionPoint {
  id: string             // client-generated uuid, used for list key/delete
  at_seconds: number     // seconds from video start to trigger pause
  mensaje: string        // text shown in the overlay
  tipo: InteractionTipo  // visual variant
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

export const PUNTOS_POR_TIPO: Record<string, number> = {
  video:       20,
  juego:       10,
  drive:        5,
  pdf:          5,
  imagen:       5,
  herramienta:  5,
  otro:         5,
}

// --- API responses ---
export interface ApiError {
  error: string
  status: number
}

// --- Video Cards ---
export type CardTipo = 'texto' | 'boton' | 'countdown' | 'quiz'

interface VideoCardBase {
  id: string
  tiempo: number  // segundos dentro del video
  tipo: CardTipo
}

export interface VideoCardTexto extends VideoCardBase {
  tipo: 'texto'
  texto: string
}

export interface VideoCardBoton extends VideoCardBase {
  tipo: 'boton'
  texto: string
  boton_label: string
}

export interface VideoCardCountdown extends VideoCardBase {
  tipo: 'countdown'
  instruccion: string
  duracion: number  // segundos
}

export interface VideoCardQuiz extends VideoCardBase {
  tipo: 'quiz'
  pregunta: string
  opciones: string[]
  respuesta_correcta: number | null
}

export type VideoCard =
  | VideoCardTexto
  | VideoCardBoton
  | VideoCardCountdown
  | VideoCardQuiz
