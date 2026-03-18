import {
  calcularNivel,
  calcularPuntosParaSiguienteNivel,
  puedeAccederZona,
  calcularProgreso,
} from '@/lib/gamification'

describe('calcularNivel', () => {
  it('nivel 1 con 0 puntos', () => {
    expect(calcularNivel(0)).toBe(1)
  })

  it('nivel 1 con 99 puntos', () => {
    expect(calcularNivel(99)).toBe(1)
  })

  it('nivel 2 con exactamente 100 puntos', () => {
    expect(calcularNivel(100)).toBe(2)
  })

  it('nivel 3 con 300 puntos', () => {
    expect(calcularNivel(300)).toBe(3)
  })

  it('nivel 5 (máximo) con 1000 o más puntos', () => {
    expect(calcularNivel(1000)).toBe(5)
    expect(calcularNivel(5000)).toBe(5)
  })
})

describe('calcularPuntosParaSiguienteNivel', () => {
  it('retorna puntos faltantes para nivel 2', () => {
    expect(calcularPuntosParaSiguienteNivel(50)).toBe(50)
  })

  it('retorna 0 cuando ya está en nivel máximo', () => {
    expect(calcularPuntosParaSiguienteNivel(1000)).toBe(0)
  })

  it('retorna correcto con puntos exactos de nivel', () => {
    expect(calcularPuntosParaSiguienteNivel(100)).toBe(200) // de nivel 2, faltan 200 para nivel 3
  })
})

describe('puedeAccederZona', () => {
  it('permite acceso cuando nivel usuario >= nivel requerido', () => {
    expect(puedeAccederZona(3, 3)).toBe(true)
    expect(puedeAccederZona(5, 1)).toBe(true)
  })

  it('bloquea acceso cuando nivel usuario < nivel requerido', () => {
    expect(puedeAccederZona(1, 3)).toBe(false)
    expect(puedeAccederZona(2, 5)).toBe(false)
  })
})

describe('calcularProgreso', () => {
  it('retorna 0% al inicio del nivel', () => {
    expect(calcularProgreso(0)).toBe(0)
  })

  it('retorna 50% a la mitad del nivel', () => {
    expect(calcularProgreso(50)).toBe(50)
  })

  it('retorna 100% al completar nivel máximo', () => {
    expect(calcularProgreso(1000)).toBe(100)
  })
})
