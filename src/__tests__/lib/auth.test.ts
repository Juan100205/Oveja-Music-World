import { validateLoginCredentials, hashPassword, verifyPassword } from '@/lib/auth'

describe('validateLoginCredentials', () => {
  it('acepta credenciales válidas', () => {
    const result = validateLoginCredentials({ email: 'juan@test.com', password: 'secret123' })
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('rechaza email inválido', () => {
    const result = validateLoginCredentials({ email: 'no-es-email', password: 'secret123' })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Email inválido')
  })

  it('rechaza password vacío', () => {
    const result = validateLoginCredentials({ email: 'juan@test.com', password: '' })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('La contraseña es requerida')
  })

  it('rechaza password menor a 6 caracteres', () => {
    const result = validateLoginCredentials({ email: 'juan@test.com', password: '123' })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('La contraseña debe tener al menos 6 caracteres')
  })

  it('rechaza email vacío', () => {
    const result = validateLoginCredentials({ email: '', password: 'secret123' })
    expect(result.valid).toBe(false)
    expect(result.error).toBe('El email es requerido')
  })
})

describe('hashPassword / verifyPassword', () => {
  it('hashea y verifica correctamente', async () => {
    const password = 'miPassword123'
    const hash = await hashPassword(password)
    expect(hash).not.toBe(password)
    const match = await verifyPassword(password, hash)
    expect(match).toBe(true)
  })

  it('falla con password incorrecto', async () => {
    const hash = await hashPassword('correcto')
    const match = await verifyPassword('incorrecto', hash)
    expect(match).toBe(false)
  })
})
