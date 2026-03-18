import SplineScene from '@/components/spline/SplineScene'
import IrAClaseButton from './IrAClaseButton'

export default function MapaPage() {
  return (
    <main
      className="relative w-full overflow-hidden"
      style={{ width: '100vw', height: '100vh', background: '#0a0a1a' }}
    >
      <SplineScene scene="https://prod.spline.design/WpjnQukgytAKxnYq/scene.splinecode" />

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
        <IrAClaseButton />
      </div>
    </main>
  )
}
