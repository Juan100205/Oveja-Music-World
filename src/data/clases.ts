export interface ClaseConfig {
  id: string
  nombre: string
  emoji: string
  descripcion: string
  color: string
  glow: string
  cursoId: string // referencia a CURSOS en cursos.ts
}

export const CLASES_CONFIG: ClaseConfig[] = [
  {
    id: 'bateria',
    nombre: 'Batería',
    emoji: '🥁',
    descripcion: 'Ritmo, técnica y coordinación percusiva',
    color: 'linear-gradient(135deg, #3db8fa, #6dd5ff)',
    glow: 'rgba(61,184,250,0.45)',
    cursoId: 'bateria',
  },
  {
    id: 'piano',
    nombre: 'Piano',
    emoji: '🎹',
    descripcion: 'Teoría aplicada, lectura y repertorio',
    color: 'linear-gradient(135deg, #ec488a, #ff7eb3)',
    glow: 'rgba(236,72,138,0.45)',
    cursoId: 'piano',
  },
  {
    id: 'guitarra',
    nombre: 'Guitarra',
    emoji: '🎸',
    descripcion: 'Acordes, ritmo y canciones progresivas',
    color: 'linear-gradient(135deg, #ffa737, #ffcc80)',
    glow: 'rgba(255,167,55,0.45)',
    cursoId: 'guitarra-adultos',
  },
  {
    id: 'canto',
    nombre: 'Canto',
    emoji: '🎤',
    descripcion: 'Técnica vocal, respiración y repertorio',
    color: 'linear-gradient(135deg, #9b54f9, #c084ff)',
    glow: 'rgba(155,84,249,0.45)',
    cursoId: 'canto',
  },
  {
    id: 'introduccion',
    nombre: 'Introducción Musical',
    emoji: '🎵',
    descripcion: 'Fundamentos del lenguaje musical',
    color: 'linear-gradient(135deg, #3db8fa, #9b54f9)',
    glow: 'rgba(100,150,255,0.45)',
    cursoId: 'ciudad-musical',
  },
  {
    id: 'violin',
    nombre: 'Violín',
    emoji: '🎻',
    descripcion: 'Postura, arco y técnica de cuerdas',
    color: 'linear-gradient(135deg, #ec488a, #ffa737)',
    glow: 'rgba(236,72,138,0.45)',
    cursoId: 'violin',
  },
]
