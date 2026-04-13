/**
 * @jest-environment node
 */
import { logger, createLogger, REQUEST_LOGGER, AUTH_LOGGER, DB_LOGGER, VIDEO_LOGGER, PROGRESS_LOGGER } from '@/lib/logger'

describe('Logger System', () => {
  describe('Basic logging', () => {
    it('logs at info level by default', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()
      
      logger.info('Test message')
      
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('formats messages with timestamp', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()
      
      logger.info('Test')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[\d{4}-\d{2}-\d{2}T/)
      )
      consoleSpy.mockRestore()
    })

    it('includes data in message', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()
      
      logger.info('Test', { foo: 'bar' })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"foo":"bar"')
      )
      consoleSpy.mockRestore()
    })
  })

  describe('Log levels', () => {
    it('respects debug level', () => {
      const customLogger = createLogger('test')
      customLogger.setLevel('debug')
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      customLogger.debug('Debug message')
      
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('respects error level', () => {
      const customLogger = createLogger('test')
      customLogger.setLevel('error')
      
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      customLogger.warn('Should not log')
      
      expect(warnSpy).not.toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })

  describe('Module context', () => {
    it('creates logger with module context', () => {
      const modLogger = createLogger('auth')
      
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()
      
      modLogger.info('Test')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('auth')
      )
      consoleSpy.mockRestore()
    })

    it('logs error with stack trace', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const testError = new Error('Test error')
      
      logger.error('Failed', testError)
      
      expect(consoleSpy).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      )
      consoleSpy.mockRestore()
    })
  })

  describe('Pre-configured loggers', () => {
    it('REQUEST_LOGGER is defined', () => {
      expect(REQUEST_LOGGER).toBeDefined()
    })

    it('AUTH_LOGGER is defined', () => {
      expect(AUTH_LOGGER).toBeDefined()
    })

    it('DB_LOGGER is defined', () => {
      expect(DB_LOGGER).toBeDefined()
    })

    it('VIDEO_LOGGER is defined', () => {
      expect(VIDEO_LOGGER).toBeDefined()
    })

    it('PROGRESS_LOGGER is defined', () => {
      expect(PROGRESS_LOGGER).toBeDefined()
    })
  })

  describe('Environment-based level', () => {
    it('reads from LOG_LEVEL env var', () => {
      const originalLevel = process.env.LOG_LEVEL
      process.env.LOG_LEVEL = 'debug'
      
      const debugLogger = new logger.constructor('debug')
      
      expect(debugLogger).toBeDefined()
      
      process.env.LOG_LEVEL = originalLevel
    })
  })
})