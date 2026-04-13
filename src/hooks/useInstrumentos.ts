'use client'

import { useState, useEffect, useRef } from 'react'
import { CLASES_CONFIG, type ClaseConfig } from '@/data/clases'
import { GYM_INSTRUMENTOS, type GymInstrumento } from '@/data/gym'

export interface CursoMapEntry {
  cursoId: string
  claseId: string
  label: string
  emoji: string
  color: string
}

interface ApiInstrumento {
  id: string
  nombre: string
  emoji: string
  descripcion: string | null
  color: string
  glow: string
  zona: string
  curso_id: string | null
}

function extractColor(color: string): string {
  const match = color.match(/#[0-9a-fA-F]{6}/)
  return match ? match[0] : color
}

const STATIC_IDS_CLASE = new Set(CLASES_CONFIG.map(c => c.id))
const STATIC_IDS_GYM   = new Set(GYM_INSTRUMENTOS.map(g => g.id))

const BLOCKED_IDS = new Set(['ukelele', 'ukulele'])

const STATIC_CURSOS_MAP: CursoMapEntry[] = CLASES_CONFIG.map(c => ({
  cursoId: c.cursoId,
  claseId: c.id,
  label:   c.nombre,
  emoji:   c.emoji,
  color:   extractColor(c.color),
}))

/**
 * Fetches dynamic instruments from /api/instrumentos and merges them with
 * the static CLASES_CONFIG and GYM_INSTRUMENTOS arrays.
 *
 * Returns:
 *  - clases:    full merged list (ClaseConfig[])
 *  - gym:       full merged list (GymInstrumento[])
 *  - cursosMap: full merged course map for access chips (CursoMapEntry[])
 */
export function useInstrumentos(token: string | null) {
  const [dynClases, setDynClases] = useState<ClaseConfig[]>([])
  const [dynGym,    setDynGym]    = useState<GymInstrumento[]>([])
  const [dynCursos, setDynCursos] = useState<CursoMapEntry[]>([])
  const [loading,   setLoading]   = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!token || fetchedRef.current) return
    fetchedRef.current = true
    setLoading(true)

    fetch('/api/instrumentos', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then((data: { instrumentos: ApiInstrumento[] } | null) => {
        const items = data?.instrumentos ?? []

        setDynClases(items
          .filter(i => !STATIC_IDS_CLASE.has(i.id) && !BLOCKED_IDS.has(i.id) && (i.zona === 'clase' || i.zona === 'ambos'))
          .map(i => ({
            id:          i.id,
            nombre:      i.nombre,
            emoji:       i.emoji,
            descripcion: i.descripcion ?? '',
            color:       i.color,
            glow:        i.glow,
            cursoId:     i.curso_id ?? i.id,
          }))
        )

        setDynGym(items
          .filter(i => !STATIC_IDS_GYM.has(i.id) && !BLOCKED_IDS.has(i.id) && (i.zona === 'gym' || i.zona === 'ambos'))
          .map(i => ({
            id:          i.id,
            nombre:      i.nombre,
            emoji:       i.emoji,
            descripcion: i.descripcion ?? '',
            color:       i.color,
            glow:        i.glow,
            modulos:     [],
          }))
        )

        setDynCursos(items
          .filter(i => !STATIC_IDS_CLASE.has(i.id) && !BLOCKED_IDS.has(i.id))
          .map(i => ({
            cursoId: i.curso_id ?? i.id,
            claseId: i.id,
            label:   i.nombre,
            emoji:   i.emoji,
            color:   i.color,
          }))
        )
      })
      .catch(() => { /* fallback silencioso a datos estáticos */ })
      .finally(() => setLoading(false))
  }, [token])

  return {
    clases:    [...CLASES_CONFIG, ...dynClases] as ClaseConfig[],
    gym:       [...GYM_INSTRUMENTOS, ...dynGym] as GymInstrumento[],
    cursosMap: [...STATIC_CURSOS_MAP, ...dynCursos] as CursoMapEntry[],
    loading,
  }
}
