import { filtrarVideosPorNivel, filtrarVideosPorZona } from '@/lib/videos'
import type { Video } from '@/types'

const mockVideos: Video[] = [
  { id: '1', titulo: 'Escalas básicas',     url: 'https://cdn/v1.mp4', nivel_requerido: 1, zona_id: 'piano',    puntos_al_completar: 20, duracion_segundos: 300 },
  { id: '2', titulo: 'Acordes intermedios', url: 'https://cdn/v2.mp4', nivel_requerido: 3, zona_id: 'piano',    puntos_al_completar: 20, duracion_segundos: 600 },
  { id: '3', titulo: 'Improvisación jazz',  url: 'https://cdn/v3.mp4', nivel_requerido: 5, zona_id: 'jazz',     puntos_al_completar: 20, duracion_segundos: 900 },
  { id: '4', titulo: 'Ritmos básicos',      url: 'https://cdn/v4.mp4', nivel_requerido: 1, zona_id: 'percusion',puntos_al_completar: 20, duracion_segundos: 400 },
]

describe('filtrarVideosPorNivel', () => {
  it('usuario nivel 1 solo ve videos de nivel 1', () => {
    const result = filtrarVideosPorNivel(mockVideos, 1)
    expect(result).toHaveLength(2)
    expect(result.map(v => v.id)).toEqual(['1', '4'])
  })

  it('usuario nivel 3 ve videos de nivel 1, 2 y 3', () => {
    const result = filtrarVideosPorNivel(mockVideos, 3)
    expect(result).toHaveLength(3)
  })

  it('usuario nivel 5 ve todos los videos', () => {
    const result = filtrarVideosPorNivel(mockVideos, 5)
    expect(result).toHaveLength(4)
  })
})

describe('filtrarVideosPorZona', () => {
  it('filtra videos de zona piano', () => {
    const result = filtrarVideosPorZona(mockVideos, 'piano')
    expect(result).toHaveLength(2)
    expect(result.every(v => v.zona_id === 'piano')).toBe(true)
  })

  it('retorna vacío para zona inexistente', () => {
    const result = filtrarVideosPorZona(mockVideos, 'no-existe')
    expect(result).toHaveLength(0)
  })
})
