import { getPublicEnv, getServerEnv, validateRequiredEnv } from '@/lib/env'

describe('env helpers', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('lee variables requeridas cuando estan presentes', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    process.env.JWT_SECRET = 'super-secret-value'

    expect(getPublicEnv('NEXT_PUBLIC_SUPABASE_URL')).toBe('https://test.supabase.co')
    expect(getPublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')).toBe('anon-key')
    expect(getServerEnv('SUPABASE_SERVICE_ROLE_KEY')).toBe('service-role-key')
    expect(getServerEnv('JWT_SECRET')).toBe('super-secret-value')
    expect(() => validateRequiredEnv()).not.toThrow()
  })

  it('lanza un error claro cuando falta una variable requerida', () => {
    delete process.env.JWT_SECRET

    expect(() => getServerEnv('JWT_SECRET')).toThrow(
      'Missing required environment variable JWT_SECRET. Add it to .env.local and restart the Next.js server.'
    )
  })
})
