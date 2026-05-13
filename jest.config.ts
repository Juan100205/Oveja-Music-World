import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/node_modules/**',
    '!src/__tests__/**',
    '!src/types/**',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // @splinetool packages are ESM-only — redirect to a CJS stub for Jest
    '^@splinetool/(.*)$': '<rootDir>/src/__mocks__/splinetool/$1.js',
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testTimeout: 10000,
  verbose: true,
  maxWorkers: '50%',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
  ],
}

export default createJestConfig(config)