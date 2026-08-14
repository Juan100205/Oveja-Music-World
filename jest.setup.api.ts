import { TextEncoder, TextDecoder } from 'util'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

/** DOM-compatible init for Jest Response mock (Next no longer exports ResponseInit from next/server). */
type ResponseInit = {
  status?: number
  statusText?: string
  headers?: HeadersInit
}

global.TextEncoder = TextEncoder as typeof globalThis.TextEncoder
global.TextDecoder = TextDecoder as typeof globalThis.TextDecoder

global.Request = class Request {
  constructor(url: string, init?: RequestInit) {
    // defineProperty (no asignación directa): NextRequest extiende el Request
    // nativo cuyo `url` es getter-only en el prototipo, y `super()` correría
    // este constructor con `this` = instancia de NextRequest.
    Object.defineProperty(this, 'url', { value: url, writable: true })
    Object.defineProperty(this, 'init', { value: init, writable: true })
    // NextRequest construye RequestCookies(this.headers) → necesita .get()
    Object.defineProperty(this, 'headers', {
      value: new MockHeaders(init?.headers as Record<string, string> | undefined),
      writable: true,
    })
    // json/text como props propias: NextRequest hereda del Request nativo
    // (body stream vacío), así que las instancias NO deben delegar en él.
    Object.defineProperty(this, 'json', {
      value: async () => {
        const body = init?.body
        if (body === undefined) throw new TypeError('Request body is empty')
        return typeof body === 'string' ? JSON.parse(body) : body
      },
      writable: true,
    })
    Object.defineProperty(this, 'text', {
      value: async () => (typeof init?.body === 'string' ? init.body : ''),
      writable: true,
    })
  }
} as unknown as typeof Request

class MockHeaders {
  private store = new Map<string, string>()
  constructor(init?: Record<string, string> | Headers) {
    if (init) {
      const entries =
        typeof (init as Headers).entries === 'function'
          ? [...(init as Headers).entries()]
          : Object.entries(init as Record<string, string>)
      for (const [k, v] of entries) this.store.set(k.toLowerCase(), v)
    }
  }
  get(name: string) { return this.store.get(name.toLowerCase()) }
  has(name: string) { return this.store.has(name.toLowerCase()) }
  entries() { return this.store.entries() }
}

global.Response = class Response {
  constructor(
    body?: BodyInit | null,
    init?: ResponseInit
  ) {
    Object.defineProperty(this, 'body', { value: body ?? null, writable: true })
    Object.defineProperty(this, 'headers', {
      value: new MockHeaders(init?.headers as Record<string, string> | undefined),
      writable: true,
    })
    const status = init?.status ?? 200
    Object.defineProperty(this, 'status', { value: status, writable: true })
    Object.defineProperty(this, 'ok', { value: status >= 200 && status < 300, writable: true })
  }
  static json<T>(data: T, init?: ResponseInit): Response {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
    })
  }
  async json() {
    const body = (this as unknown as { body?: BodyInit | null }).body
    if (body == null) throw new TypeError('Response has no body')
    return typeof body === 'string' ? JSON.parse(body) : body
  }
} as unknown as typeof Response

jest.setTimeout(60000)

if (process.env.LOG_LEVEL === 'debug') {
  const originalConsoleLog = console.log
  const originalConsoleError = console.error
  const originalConsoleWarn = console.warn

  console.log = (...args: unknown[]) => {
    originalConsoleLog(`[LOG ${new Date().toISOString()}]`, ...args)
  }
  console.error = (...args: unknown[]) => {
    originalConsoleError(`[ERROR ${new Date().toISOString()}]`, ...args)
  }
  console.warn = (...args: unknown[]) => {
    originalConsoleWarn(`[WARN ${new Date().toISOString()}]`, ...args)
  }
}