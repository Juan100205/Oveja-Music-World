'use client'

import { useState, useEffect } from 'react'
import { LEVEL_CONFIG, type LevelConfig } from '@/types'

/**
 * Configuración de niveles (puntos requeridos por nivel) con prioridad DB
 * y fallback a LEVEL_CONFIG. Igual patrón que useInstrumentos.
 *
 * Si se pasa `instrumento`, carga la config de ese instrumento
 * (fallback a la global en el server).
 */
export function useNivelesConfig(token: string | null, instrumento?: string | null) {
  const [config, setConfig] = useState<LevelConfig[]>(LEVEL_CONFIG)

  useEffect(() => {
    if (!token) return
    let alive = true

    const qs = instrumento ? `?instrumento=${encodeURIComponent(instrumento)}` : ''
    fetch(`/api/niveles${qs}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : null))
      .then((data: { niveles?: LevelConfig[] } | null) => {
        if (!alive) return
        if (Array.isArray(data?.niveles) && data.niveles.length > 0) {
          setConfig(data.niveles)
        }
      })
      .catch(() => { /* fallback silencioso al estático */ })

    return () => { alive = false }
  }, [token, instrumento])

  return config
}
