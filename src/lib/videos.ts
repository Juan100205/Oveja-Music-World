import type { Video } from '@/types'

/** Retorna los videos accesibles para el nivel del usuario */
export function filtrarVideosPorNivel(videos: Video[], nivelUsuario: number): Video[] {
  return videos.filter(v => v.nivel_requerido <= nivelUsuario)
}

/** Retorna los videos de una zona específica */
export function filtrarVideosPorZona(videos: Video[], zonaId: string): Video[] {
  return videos.filter(v => v.zona_id === zonaId)
}

/** Filtra por zona y nivel */
export function filtrarVideos(videos: Video[], zonaId: string, nivelUsuario: number): Video[] {
  return filtrarVideosPorNivel(filtrarVideosPorZona(videos, zonaId), nivelUsuario)
}
