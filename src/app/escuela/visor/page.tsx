'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { motion } from 'framer-motion'

const TIPO_ICON: Record<string, string> = {
  drive: '📂', juego: '🎮', pdf: '📄',
  imagen: '🖼️', herramienta: '🛠️', otro: '🔗',
}

function getDriveEmbedUrl(url: string): string {
  return url
    .replace(/\/view(\?.*)?$/, '/preview')
    .replace(/\/edit(\?.*)?$/, '/preview')
}

function getEmbedUrl(url: string, tipo: string): string {
  if (tipo === 'drive' || url.includes('drive.google.com')) return getDriveEmbedUrl(url)
  return url
}

function VisorContent() {
  const params = useSearchParams()
  const router = useRouter()

  const url   = params.get('url')   ?? ''
  const label = params.get('label') ?? 'Recurso'
  const tipo  = params.get('tipo')  ?? 'otro'
  const embedUrl = getEmbedUrl(url, tipo)

  return (
    <main
      style={{
        width: '100vw', height: '100dvh',
        background: '#0a0a1a',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px', flexShrink: 0,
          background: 'rgba(10,10,26,0.97)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <motion.button
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 999,
            padding: '7px 16px',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'rgba(255,255,255,0.75)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ← Volver
        </motion.button>

        <span style={{ fontSize: 18, flexShrink: 0 }}>{TIPO_ICON[tipo] ?? '🔗'}</span>

        <p
          style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
            color: '#fff', flex: 1, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {label}
        </p>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
            padding: '6px 14px', borderRadius: 999,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}
        >
          ↗ Abrir en Drive
        </a>
      </div>

      {/* ── Contenido ── */}
      <div style={{ flex: 1, overflow: 'hidden', background: '#fff' }}>
        <iframe
          src={embedUrl}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    </main>
  )
}

export default function VisorPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: '100vw', height: '100dvh', background: '#0a0a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
            Cargando...
          </p>
        </div>
      }
    >
      <VisorContent />
    </Suspense>
  )
}
