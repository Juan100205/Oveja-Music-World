import '@testing-library/jest-dom'

// ── Framer-motion: render children directly, skip animations ────
// AnimatePresence exit animations never fire in JSDOM, causing elements
// to stay in the DOM after state changes. This mock makes it synchronous.
jest.mock('framer-motion', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react')

  const strippedProps = new Set([
    'animate', 'initial', 'exit', 'transition', 'variants',
    'whileHover', 'whileTap', 'whileFocus', 'whileDrag', 'whileInView',
    'onAnimationStart', 'onAnimationComplete', 'onUpdate',
    'layoutId', 'layout', 'drag', 'dragConstraints',
  ])

  const makeMotion = (tag: string) =>
    React.forwardRef(({ children, ...props }: Record<string, unknown>, ref: unknown) => {
      const safe: Record<string, unknown> = { ref }
      for (const k in props) {
        if (!strippedProps.has(k)) safe[k] = props[k]
      }
      return React.createElement(tag, safe, children)
    })

  const motion = new Proxy({} as Record<string, unknown>, {
    get: (_, tag: string) => makeMotion(tag),
  })

  return {
    __esModule: true,
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn(), set: jest.fn() }),
    useMotionValue: (v: unknown) => ({ get: () => v, set: jest.fn(), onChange: jest.fn() }),
    useTransform: () => ({ get: jest.fn() }),
    useInView: () => true,
  }
})
