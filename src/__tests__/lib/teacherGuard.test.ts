import { canAccess } from '@/lib/teacherGuard'

describe('canAccess', () => {
  it('admin (cursosAcceso = null) puede acceder a cualquier curso', () => {
    expect(canAccess(null, 'piano')).toBe(true)
    expect(canAccess(null, 'guitarra')).toBe(true)
    expect(canAccess(null, 'cualquier-cosa')).toBe(true)
  })

  it('docente con lista puede acceder a cursos asignados', () => {
    const acceso = ['piano', 'bateria']
    expect(canAccess(acceso, 'piano')).toBe(true)
    expect(canAccess(acceso, 'bateria')).toBe(true)
  })

  it('docente con lista no puede acceder a cursos no asignados', () => {
    const acceso = ['piano', 'bateria']
    expect(canAccess(acceso, 'guitarra')).toBe(false)
    expect(canAccess(acceso, 'violin')).toBe(false)
  })

  it('lista vacía no permite acceso a ningún curso', () => {
    expect(canAccess([], 'piano')).toBe(false)
    expect(canAccess([], '')).toBe(false)
  })

  it('es case-sensitive: "Piano" !== "piano"', () => {
    expect(canAccess(['Piano'], 'piano')).toBe(false)
    expect(canAccess(['piano'], 'Piano')).toBe(false)
  })
})
