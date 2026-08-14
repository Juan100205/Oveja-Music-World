'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { LEVEL_CONFIG, type LevelConfig } from '@/types'

interface InstrumentoOption {
  id: string
  nombre: string
  emoji: string
}

interface Props {
  token: string
  apiBase: string            // '/api/admin/niveles' | '/api/teacher/niveles'
  instruments: InstrumentoOption[]
  allowGlobal?: boolean
}

const NIVEL_COLORS = ['#34d399', '#facc15', '#3db8fa', '#ffa737', '#9b54f9']

/**
 * Editor de niveles (puntos requeridos + nombre) por instrumento.
 * Reutilizado por el panel docente y el panel admin.
 */
export function NivelesEditor({ token, apiBase, instruments, allowGlobal = true }: Props) {
  const [instrumento, setInstrumento]     = useState<string>(allowGlobal ? '' : (instruments[0]?.id ?? ''))
  const [niveles,     setNiveles]         = useState<LevelConfig[]>(LEVEL_CONFIG)
  const [fetching,    setFetching]        = useState(false)
  const [saving,      setSaving]          = useState(false)
  const [error,       setError]           = useState<string | null>(null)
  const [saved,       setSaved]           = useState(false)

  const fetchConfig = useCallback(async (inst: string) => {
    if (!token) return
    setFetching(true)
    setError(null)
    try {
      const qs = inst ? `?instrumento=${encodeURIComponent(inst)}` : ''
      const res = await fetch(`${apiBase}${qs}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al cargar'); return }
      if (Array.isArray(data.niveles) && data.niveles.length > 0) {
        setNiveles(data.niveles)
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setFetching(false)
    }
  }, [token, apiBase])

  useEffect(() => {
    setSaved(false)
    fetchConfig(instrumento)
  }, [instrumento, fetchConfig])

  const dirty = JSON.stringify(niveles) !== JSON.stringify(LEVEL_CONFIG)

  const handleSave = async () => {
    setError(null)
    setSaved(false)

    const sorted = [...niveles].sort((a, b) => a.nivel - b.nivel)
    if (sorted.length < 2) { setError('Se necesitan al menos 2 niveles'); return }
    if (sorted[0]?.puntos_requeridos !== 0) { setError('El nivel 1 debe requerir 0 puntos'); return }
    if (sorted.some((l, i) => l.nivel !== i + 1)) { setError('Los niveles deben ser contiguos desde 1'); return }
    if (sorted.some(l => !l.nombre.trim())) { setError('Todos los niveles necesitan un nombre'); return }
    for (let i = 1; i < sorted.length; i++) {
      if (!Number.isInteger(sorted[i].puntos_requeridos) || sorted[i].puntos_requeridos < 0) {
        setError('Los puntos deben ser números enteros mayores o iguales a 0'); return
      }
      if (sorted[i].puntos_requeridos <= sorted[i - 1].puntos_requeridos) {
        setError('Los puntos deben ser estrictamente crecientes entre niveles'); return
      }
    }

    setSaving(true)
    try {
      const qs = instrumento ? `?instrumento=${encodeURIComponent(instrumento)}` : ''
      const res = await fetch(`${apiBase}${qs}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ niveles: sorted }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setNiveles(data.niveles)
      setSaved(true)
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setError(null)
    setSaved(false)
    setNiveles(LEVEL_CONFIG.map(l => ({ ...l })))
  }

  const options = allowGlobal
    ? [{ id: '', nombre: 'Global (predeterminado)', emoji: '🌐' }, ...instruments]
    : instruments

  return (
    <div>
      {/* Selector de instrumento */}
      {options.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em', marginBottom: 8,
          }}>
            Instrumento
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {options.map(o => (
              <button
                key={o.id}
                onClick={() => setInstrumento(o.id)}
                style={{
                  padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
                  fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
                  border: `1px solid ${instrumento === o.id ? 'var(--om-purple)' : 'rgba(255,255,255,0.14)'}`,
                  background: instrumento === o.id ? 'rgba(155,84,249,0.18)' : 'rgba(255,255,255,0.04)',
                  color: instrumento === o.id ? 'var(--om-purple)' : 'rgba(255,255,255,0.55)',
                  transition: 'all 0.15s',
                }}
              >
                {o.emoji} {o.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Encabezado de la config */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#fff', margin: 0 }}>
          Puntos por nivel
        </h3>
        {dirty && (
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={handleReset}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 13px', borderRadius: 999, cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.55)',
              fontFamily: 'var(--font-body)', fontSize: 12,
            }}
          >
            <RotateCcw size={13} strokeWidth={1.5} /> Restablecer
          </motion.button>
        )}
      </div>

      {fetching ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-body)' }}>
          Cargando niveles...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...niveles].sort((a, b) => a.nivel - b.nivel).map((l, i) => {
            const prev = [...niveles].sort((a, b) => a.nivel - b.nivel)[i - 1]
            const okPoints = Number.isInteger(l.puntos_requeridos) && l.puntos_requeridos >= 0 &&
              (i === 0 ? l.puntos_requeridos === 0 : l.puntos_requeridos > (prev?.puntos_requeridos ?? -1))
            const okNombre = l.nombre.trim().length > 0
            const color = NIVEL_COLORS[(l.nivel - 1) % NIVEL_COLORS.length]

            return (
              <motion.div
                key={l.nivel}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div style={{
                  minWidth: 58, textAlign: 'center', flexShrink: 0,
                  background: `${color}1a`, border: `1px solid ${color}44`,
                  borderRadius: 10, padding: '8px 6px',
                }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color, margin: 0 }}>
                    Nv.{l.nivel}
                  </p>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    value={l.nombre}
                    onChange={e => {
                      setSaved(false)
                      setNiveles(prev => prev.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))
                    }}
                    placeholder="Nombre del nivel"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.06)',
                      border: `1px solid ${okNombre ? 'rgba(255,255,255,0.12)' : 'rgba(236,72,138,0.5)'}`,
                      borderRadius: 10, padding: '9px 12px',
                      color: '#fff', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none',
                    }}
                  />
                </div>

                <div style={{ flexShrink: 0 }}>
                  <input
                    type="number"
                    min={0}
                    disabled={l.nivel === 1}
                    value={l.puntos_requeridos}
                    onChange={e => {
                      setSaved(false)
                      setNiveles(prev => prev.map((x, j) => (j === i ? { ...x, puntos_requeridos: parseInt(e.target.value, 10) || 0 } : x)))
                    }}
                    style={{
                      width: 96, textAlign: 'center', boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.06)',
                      border: `1px solid ${okPoints ? 'rgba(255,255,255,0.12)' : 'rgba(236,72,138,0.5)'}`,
                      borderRadius: 10, padding: '9px 8px',
                      color: l.nivel === 1 ? 'rgba(255,255,255,0.3)' : '#fff',
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, outline: 'none',
                      opacity: l.nivel === 1 ? 0.6 : 1,
                    }}
                  />
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 9, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0', textAlign: 'center' }}>
                    pts
                  </p>
                </div>
              </motion.div>
            )
          })}

          {error && (
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13, color: '#ff7eb3',
              background: 'rgba(236,72,138,0.08)', border: '1px solid rgba(236,72,138,0.25)',
              borderRadius: 10, padding: '10px 14px', margin: 0,
            }}>
              {error}
            </p>
          )}

          {saved && (
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13, color: '#34d399',
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)',
              borderRadius: 10, padding: '10px 14px', margin: 0,
            }}>
              Configuración guardada. Se aplica al calcular el nivel de este instrumento.
            </p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            style={{
              marginTop: 8, padding: '13px 0', borderRadius: 999,
              border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              background: saving ? 'rgba(155,84,249,0.3)' : 'linear-gradient(135deg, #ec488a, #9b54f9)',
              color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
              opacity: dirty ? 1 : 0.55,
              boxShadow: dirty ? '0 0 24px rgba(236,72,138,0.3)' : 'none',
            }}
          >
            {saving ? 'Guardando...' : dirty ? 'Guardar cambios' : 'Sin cambios'}
          </motion.button>
        </div>
      )}
    </div>
  )
}
