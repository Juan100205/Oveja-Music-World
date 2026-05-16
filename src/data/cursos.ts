export type TipoRecurso = 'video' | 'drive' | 'juego' | 'pdf' | 'imagen' | 'herramienta' | 'otro'

export interface Recurso {
  url: string
  label?: string
  tipo: TipoRecurso
}

export interface Seccion {
  nombre: string
  recursos: Recurso[]
  zona?: 'clase' | 'gym'
}

export interface Modulo {
  id: string
  nombre: string
  zona?: 'clase' | 'gym'
  secciones: Seccion[]
}

export interface Curso {
  id: string
  nombre: string
  emoji: string
  modulos: Modulo[]
}

export const CURSOS: Curso[] = []
