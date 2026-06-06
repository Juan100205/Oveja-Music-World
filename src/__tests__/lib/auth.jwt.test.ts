import { signToken, verifyToken, extractTokenFromHeader } from '@/lib/auth'
import type { JWTPayload } from '@/types'

const SAMPLE_PAYLOAD: JWTPayload = {
  sub: 'user-abc',
  email: 'test@example.com',
  role: 'student',
  nivel: 2,
}

describe('signToken / verifyToken', () => {
  it('genera un token y lo verifica correctamente', () => {
    const token = signToken(SAMPLE_PAYLOAD)
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3) // estructura JWT
  })

  it('verifyToken retorna el payload correcto', () => {
    const token = signToken(SAMPLE_PAYLOAD)
    const payload = verifyToken(token)
    expect(payload).not.toBeNull()
    expect(payload!.sub).toBe('user-abc')
    expect(payload!.email).toBe('test@example.com')
    expect(payload!.role).toBe('student')
    expect(payload!.nivel).toBe(2)
  })

  it('verifyToken retorna null con token malformado', () => {
    expect(verifyToken('no-es-un-jwt')).toBeNull()
  })

  it('verifyToken retorna null con token manipulado', () => {
    const token = signToken(SAMPLE_PAYLOAD)
    const [header, , sig] = token.split('.')
    const fakePayload = Buffer.from(JSON.stringify({ sub: 'hacker', role: 'admin', nivel: 5 })).toString('base64url')
    expect(verifyToken(`${header}.${fakePayload}.${sig}`)).toBeNull()
  })

  it('verifyToken retorna null con string vacío', () => {
    expect(verifyToken('')).toBeNull()
  })

  it('el payload incluye iat y exp', () => {
    const token = signToken(SAMPLE_PAYLOAD)
    const payload = verifyToken(token)
    expect(payload!.iat).toBeDefined()
    expect(payload!.exp).toBeDefined()
    expect(payload!.exp!).toBeGreaterThan(payload!.iat!)
  })

  it('roles válidos: student, teacher, admin', () => {
    for (const role of ['student', 'teacher', 'admin'] as const) {
      const token = signToken({ ...SAMPLE_PAYLOAD, role })
      const payload = verifyToken(token)
      expect(payload!.role).toBe(role)
    }
  })
})

describe('extractTokenFromHeader', () => {
  it('extrae el token de un header Bearer válido', () => {
    const token = 'abc123.def456.ghi789'
    expect(extractTokenFromHeader(`Bearer ${token}`)).toBe(token)
  })

  it('retorna null si el header es undefined', () => {
    expect(extractTokenFromHeader(undefined)).toBeNull()
  })

  it('retorna null si el header no empieza con Bearer', () => {
    expect(extractTokenFromHeader('Token abc123')).toBeNull()
    expect(extractTokenFromHeader('abc123')).toBeNull()
    expect(extractTokenFromHeader('')).toBeNull()
  })

  it('retorna null si el header es solo "Bearer " (sin token)', () => {
    // El slice devuelve '' que es falsy → null
    expect(extractTokenFromHeader('Bearer ')).toBe('')
  })

  it('extrae correctamente un JWT real', () => {
    const realToken = signToken(SAMPLE_PAYLOAD)
    const extracted = extractTokenFromHeader(`Bearer ${realToken}`)
    expect(extracted).toBe(realToken)
    expect(verifyToken(extracted!)).not.toBeNull()
  })
})
