/** Extrae el video ID de cualquier formato de URL de YouTube */
export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&#]+)/,
    /youtu\.be\/([^?&#]+)/,
    /youtube\.com\/embed\/([^?&#]+)/,
    /youtube\.com\/shorts\/([^?&#]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/** Retorna la URL de embed de YouTube con parámetros óptimos */
export function getYoutubeEmbedUrl(url: string): string | null {
  const id = extractYoutubeId(url)
  if (!id) return null
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`
}

export function isYoutubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url)
}
