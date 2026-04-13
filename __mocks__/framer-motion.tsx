/**
 * Manual mock de framer-motion para tests Jest/jsdom
 *
 * Problema: AnimatePresence mode="wait" bloquea el montaje de nuevos
 * paneles hasta que completa la exit animation del anterior.
 * En jsdom las animaciones no corren → los nuevos paneles nunca montan.
 *
 * Solución: reemplazar motion.* y AnimatePresence con componentes simples
 * que renderizan inmediatamente sin aplicar estilos de animación.
 */
import React from 'react'

// Prop keys exclusivos de framer-motion — se filtran antes de pasar al DOM
const MOTION_PROPS = new Set([
  'initial', 'animate', 'exit', 'transition',
  'variants', 'whileHover', 'whileTap', 'whileFocus',
  'whileInView', 'whileDrag', 'drag', 'dragConstraints',
  'layout', 'layoutId', 'layoutDependency',
  'onAnimationStart', 'onAnimationComplete', 'onUpdate',
  'onHoverStart', 'onHoverEnd', 'onTapStart', 'onTap', 'onTapCancel',
  'onDragStart', 'onDrag', 'onDragEnd',
  'transformTemplate', 'custom',
])

function stripMotionProps(props: Record<string, unknown>) {
  const clean: Record<string, unknown> = {}
  for (const key in props) {
    if (!MOTION_PROPS.has(key)) {
      clean[key] = props[key]
    }
  }
  return clean
}

function makeMotionComponent(tag: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = React.forwardRef<HTMLElement, any>(({ children, ...props }, ref) => {
    const clean = stripMotionProps(props)
    return React.createElement(tag, { ...clean, ref }, children)
  })
  Component.displayName = `motion.${tag}`
  return Component
}

// Proxy que crea un componente para cualquier tag HTML/SVG
const motionProxy = new Proxy({} as Record<string, ReturnType<typeof makeMotionComponent>>, {
  get(cache, tag: string) {
    if (!cache[tag]) cache[tag] = makeMotionComponent(tag)
    return cache[tag]
  },
})

// AnimatePresence: renderiza hijos inmediatamente, sin exit animations
function AnimatePresence({ children }: { children?: React.ReactNode; mode?: string }) {
  return <>{children}</>
}
AnimatePresence.displayName = 'AnimatePresence'

// Hooks mínimos
function useAnimation() {
  return { start: jest.fn(), stop: jest.fn(), set: jest.fn() }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useMotionValue(initial: any) {
  return {
    get: () => initial,
    set: jest.fn(),
    onChange: jest.fn(),
    destroy: jest.fn(),
  }
}
function useTransform() {
  return { get: jest.fn(), set: jest.fn() }
}
function useCycle(...items: unknown[]) {
  const [idx, setIdx] = React.useState(0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return [items[idx], () => setIdx(i => (i + 1) % items.length)] as any
}
function useSpring(val: unknown) { return val }
function useScroll() { return { scrollY: { get: () => 0 } } }
function useInView() { return true }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function m(tag: string) { return makeMotionComponent(tag) }

export {
  motionProxy as motion,
  AnimatePresence,
  useAnimation,
  useMotionValue,
  useTransform,
  useCycle,
  useSpring,
  useScroll,
  useInView,
  m,
}
