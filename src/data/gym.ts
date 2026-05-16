import type { Modulo, Seccion } from './cursos'

export interface GymInstrumento {
  id: string
  nombre: string
  emoji: string
  descripcion: string
  color: string
  glow: string
  modulos: Modulo[]
  cursoId?: string
}

/** Todas las secciones de práctica de un instrumento (excluye zona='clase') */
export function getSecciones(instr: GymInstrumento): Seccion[] {
  return instr.modulos.flatMap(m => m.secciones).filter(s => s.zona !== 'clase')
}

export const GYM_INSTRUMENTOS: GymInstrumento[] = []
