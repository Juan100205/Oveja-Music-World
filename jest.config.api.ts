import type { Config } from 'jest'

const config: Config = {
  displayName: 'API Tests',
  testEnvironment: 'node',
  testMatch: ['**/src/__tests__/api/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
  },
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/app/api/**/*.ts',
    'src/lib/**/*.ts',
    '!src/**/*.d.ts',
  ],
  setupFiles: ['<rootDir>/jest.setup.api.ts'],
  testTimeout: 60000,
  verbose: true,
}

export default config