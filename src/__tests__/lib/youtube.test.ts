import { extractYoutubeId, getYoutubeEmbedUrl, isYoutubeUrl } from '@/lib/youtube'

describe('extractYoutubeId', () => {
  it('extrae ID de URL estándar con ?v=', () => {
    expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extrae ID de URL corta youtu.be', () => {
    expect(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extrae ID de URL de embed', () => {
    expect(extractYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extrae ID de URL de Shorts', () => {
    expect(extractYoutubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extrae ID ignorando parámetros adicionales', () => {
    expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s')).toBe('dQw4w9WgXcQ')
  })

  it('extrae ID de youtu.be con parámetros', () => {
    expect(extractYoutubeId('https://youtu.be/dQw4w9WgXcQ?t=10')).toBe('dQw4w9WgXcQ')
  })

  it('retorna null para URL no reconocida', () => {
    expect(extractYoutubeId('https://vimeo.com/123456')).toBeNull()
    expect(extractYoutubeId('https://cdn.example.com/video.mp4')).toBeNull()
    expect(extractYoutubeId('')).toBeNull()
  })
})

describe('getYoutubeEmbedUrl', () => {
  it('genera URL de embed correcta desde watch URL', () => {
    const result = getYoutubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1')
  })

  it('genera URL de embed desde youtu.be', () => {
    const result = getYoutubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')
    expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1')
  })

  it('retorna null para URL no de YouTube', () => {
    expect(getYoutubeEmbedUrl('https://vimeo.com/123456')).toBeNull()
    expect(getYoutubeEmbedUrl('')).toBeNull()
  })

  it('URL de embed incluye rel=0 y modestbranding=1', () => {
    const result = getYoutubeEmbedUrl('https://youtu.be/abc123')
    expect(result).toContain('rel=0')
    expect(result).toContain('modestbranding=1')
  })
})

describe('isYoutubeUrl', () => {
  it('reconoce URLs de youtube.com', () => {
    expect(isYoutubeUrl('https://www.youtube.com/watch?v=abc')).toBe(true)
    expect(isYoutubeUrl('https://youtube.com/embed/abc')).toBe(true)
  })

  it('reconoce URLs de youtu.be', () => {
    expect(isYoutubeUrl('https://youtu.be/abc')).toBe(true)
  })

  it('retorna false para URLs que no son YouTube', () => {
    expect(isYoutubeUrl('https://vimeo.com/123')).toBe(false)
    expect(isYoutubeUrl('https://cdn.example.com/v.mp4')).toBe(false)
    expect(isYoutubeUrl('')).toBe(false)
  })
})
