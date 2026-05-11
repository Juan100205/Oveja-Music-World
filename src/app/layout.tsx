import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Oveja Music — Escuela de Música',
  description: 'Aprende música en un mundo 3D interactivo',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

const SPLINE_MAP       = 'https://prod.spline.design/WpjnQukgytAKxnYq/scene.splinecode'
const SPLINE_CLASSROOM = 'https://prod.spline.design/646pGt79P6qgQp6p/scene.splinecode'
const SPLINE_GYM       = 'https://prod.spline.design/gYLTlZu92yz616yC/scene.splinecode'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://prod.spline.design" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://prod.spline.design" />
        {/* Map is the entry scene — preload (high priority) so it starts
            downloading immediately, even before Spline JS initialises. */}
        <link rel="preload" href={SPLINE_MAP} as="fetch" crossOrigin="anonymous" />
        {/* Classroom and gym are navigated to after the map — prefetch is
            enough: the browser loads them in the background while idle. */}
        <link rel="prefetch" href={SPLINE_CLASSROOM} crossOrigin="anonymous" />
        <link rel="prefetch" href={SPLINE_GYM}       crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
