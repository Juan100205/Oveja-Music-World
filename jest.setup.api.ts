import { TextEncoder, TextDecoder } from 'util'

/** DOM-compatible init for Jest Response mock (Next no longer exports ResponseInit from next/server). */
type ResponseInit = {
  status?: number
  statusText?: string
  headers?: HeadersInit
}

global.TextEncoder = TextEncoder as typeof globalThis.TextEncoder
global.TextDecoder = TextDecoder as typeof globalThis.TextDecoder

global.Request = class Request {
  constructor(
    public url: string,
    public init?: RequestInit
  ) {}
} as unknown as typeof Request

global.Response = class Response {
  constructor(
    public body?: BodyInit | null,
    public init?: ResponseInit
  ) {}
  static json<T>(data: T, init?: ResponseInit): Response {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
    })
  }
} as unknown as typeof Response

jest.setTimeout(15000)

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