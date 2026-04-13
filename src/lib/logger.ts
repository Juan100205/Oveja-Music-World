const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  module?: string
  [key: string]: unknown
}

class Logger {
  private level: LogLevel
  private context: LogContext

  constructor(defaultLevel: LogLevel = 'info') {
    this.level = process.env.LOG_LEVEL?.toLowerCase() as LogLevel || defaultLevel
    this.context = { module: 'app' }
  }

  setContext(ctx: Partial<LogContext>) {
    this.context = { ...this.context, ...ctx }
  }

  setLevel(level: LogLevel) {
    this.level = level
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level]
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString()
    const levelStr = level.toUpperCase().padEnd(5)
    const moduleStr = (this.context.module || 'app').padEnd(12)
    const dataStr = data ? ` ${JSON.stringify(data)}` : ''
    return `[${timestamp}] [${levelStr}] [${moduleStr}] ${message}${dataStr}`
  }

  debug(message: string, data?: unknown) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, data))
    }
  }

  info(message: string, data?: unknown) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, data))
    }
  }

  warn(message: string, data?: unknown) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data))
    }
  }

  error(message: string, error?: Error | unknown, data?: unknown) {
    if (this.shouldLog('error')) {
      const errorData =
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              ...(data !== null &&
              data !== undefined &&
              typeof data === 'object'
                ? (data as Record<string, unknown>)
                : {}),
            }
          : data
      console.error(this.formatMessage('error', message, errorData))
    }
  }

  trace(message: string, data?: unknown) {
    if (this.shouldLog('debug')) {
      console.trace(this.formatMessage('debug', `TRACE: ${message}`, data))
    }
  }
}

export const logger = new Logger(process.env.LOG_LEVEL as LogLevel || 'info')

export function createLogger(module: string): Logger {
  const modLogger = new Logger()
  modLogger.setContext({ module })
  return modLogger
}

export const REQUEST_LOGGER = createLogger('api')
export const AUTH_LOGGER = createLogger('auth')
export const DB_LOGGER = createLogger('db')
export const VIDEO_LOGGER = createLogger('video')
export const PROGRESS_LOGGER = createLogger('progress')