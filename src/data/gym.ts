import { CURSOS } from './cursos'
import type { Modulo } from './cursos'

export interface GymInstrumento {
  id: string
  nombre: string
  emoji: string
  descripcion: string
  color: string
  glow: string
  modulos: Modulo[]
}

// Helpers para extraer módulos específicos por id
function getModulos(cursoId: string, moduloIds?: string[]): Modulo[] {
  const curso = CURSOS.find(c => c.id === cursoId)
  if (!curso) return []
  if (!moduloIds) return curso.modulos
  return curso.modulos.filter(m => moduloIds.includes(m.id))
}

export const GYM_INSTRUMENTOS: GymInstrumento[] = [
  {
    id: 'bateria',
    nombre: 'Batería',
    emoji: '🥁',
    descripcion: 'Recursos, práctica y material complementario',
    color: 'linear-gradient(135deg, #3db8fa, #6dd5ff)',
    glow: 'rgba(61,184,250,0.45)',
    // Secciones de práctica dentro del nivel 1
    modulos: getModulos('bateria', ['bateria-nivel-1']),
  },
  {
    id: 'piano',
    nombre: 'Piano',
    emoji: '🎹',
    descripcion: 'Juegos, repertorio y obras de repaso',
    color: 'linear-gradient(135deg, #ec488a, #ff7eb3)',
    glow: 'rgba(236,72,138,0.45)',
    // Solo módulos de práctica (3, 5, 9, 11, 13)
    modulos: getModulos('piano', [
      'piano-modulo-3',
      'piano-modulo-5',
      'piano-modulo-9',
      'piano-modulo-11',
      'piano-modulo-13',
    ]),
  },
  {
    id: 'violin',
    nombre: 'Violín',
    emoji: '🎻',
    descripcion: 'Ejercicios técnicos y repertorio',
    color: 'linear-gradient(135deg, #ec488a, #ffa737)',
    glow: 'rgba(236,72,138,0.45)',
    // Módulos de práctica (3 y 5)
    modulos: getModulos('violin', ['violin-modulo-3', 'violin-modulo-5']),
  },
  {
    id: 'canto',
    nombre: 'Canto',
    emoji: '🎤',
    descripcion: 'Calentamiento, repertorio y karaoke',
    color: 'linear-gradient(135deg, #9b54f9, #c084ff)',
    glow: 'rgba(155,84,249,0.45)',
    // Módulo de práctica (3)
    modulos: getModulos('canto', ['canto-modulo-3']),
  },
  {
    id: 'guitarra',
    nombre: 'Guitarra',
    emoji: '🎸',
    descripcion: 'Videos, ejercicios y Scratch interactivo',
    color: 'linear-gradient(135deg, #ffa737, #ffcc80)',
    glow: 'rgba(255,167,55,0.45)',
    // Nivel 1 de guitarra niños (tiene Scratch + videos de práctica)
    modulos: getModulos('guitarra-ninos', ['guitarra-ninos-nivel-1']),
  },
  {
    id: 'introduccion',
    nombre: 'Introducción Musical',
    emoji: '🎵',
    descripcion: 'Ejercicios de ritmo y teoría musical',
    color: 'linear-gradient(135deg, #3db8fa, #9b54f9)',
    glow: 'rgba(100,150,255,0.45)',
    // Módulos de práctica de Ciudad Musical
    modulos: getModulos('ciudad-musical'),
  },
]
