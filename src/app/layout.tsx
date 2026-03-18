import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Oveja Music — Escuela de Música',
  description: 'Aprende música en un mundo 3D interactivo',
}

const SPLINE_SCENE = 'https://prod.spline.design/WpjnQukgytAKxnYq/scene.splinecode'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Establece conexión con el CDN de Spline desde el primer render */}
        <link rel="preconnect" href="https://prod.spline.design" />
        {/* Descarga el modelo 3D en segundo plano mientras el usuario hace login */}
        <link rel="prefetch" href={SPLINE_SCENE} crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
