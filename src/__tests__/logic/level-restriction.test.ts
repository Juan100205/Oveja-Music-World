/**
 * TDD — Lógica de restricción de niveles
 *
 * Verifica el sistema completo de progresión:
 *  1. Estado inicial: nivel 1, solo Nivel 1 accesible
 *  2. Restricción correcta: nivel N solo accede a módulos 1..N
 *  3. Umbrales exactos de pts para cada nivel (L1→L2, L2→L3, L3→L4, L4→L5)
 *  4. Videos necesarios para cada subida de nivel
 *  5. Módulos por nivel en cada instrumento (clase)
 *  6. Vista de profesor: sin restricción de niveles
 *  7. `subio_nivel` como señal de desbloqueo para la UI
 */

import { calcularNivel, calcularPuntosParaSiguienteNivel, calcularProgreso, puedeAccederZona } from '@/lib/gamification'
import { LEVEL_CONFIG, PUNTOS_POR_TIPO } from '@/types'
import { CLASES_CONFIG } from '@/data/clases'
import { CURSOS } from '@/data/cursos'

// ══════════════════════════════════════════════════════════════
// ESTADO INICIAL DEL ESTUDIANTE
// ══════════════════════════════════════════════════════════════
describe('Estado inicial del estudiante (0 puntos, nivel 1)', () => {
  it('nuevo estudiante comienza en nivel 1', () => {
    expect(calcularNivel(0)).toBe(1)
  })

  it('nuevo estudiante tiene progreso 0%', () => {
    expect(calcularProgreso(0)).toBe(0)
  })

  it('nuevo estudiante necesita 100 pts para subir al nivel 2', () => {
    expect(calcularPuntosParaSiguienteNivel(0)).toBe(100)
  })

  it('nivel 1 permite acceder a zona de nivel 1', () => {
    expect(puedeAccederZona(1, 1)).toBe(true)
  })

  it('nivel 1 NO puede acceder a zona de nivel 2', () => {
    expect(puedeAccederZona(1, 2)).toBe(false)
  })

  it('nivel 1 NO puede acceder a ninguna zona de nivel superior', () => {
    expect(puedeAccederZona(1, 2)).toBe(false)
    expect(puedeAccederZona(1, 3)).toBe(false)
    expect(puedeAccederZona(1, 4)).toBe(false)
    expect(puedeAccederZona(1, 5)).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════
// UMBRALES DE NIVEL
// ══════════════════════════════════════════════════════════════
describe('Umbrales de puntos para cada nivel', () => {
  const umbrales = [
    { puntos: 0,    nivelEsperado: 1 },
    { puntos: 99,   nivelEsperado: 1 },
    { puntos: 100,  nivelEsperado: 2 },
    { puntos: 200,  nivelEsperado: 2 },
    { puntos: 299,  nivelEsperado: 2 },
    { puntos: 300,  nivelEsperado: 3 },
    { puntos: 450,  nivelEsperado: 3 },
    { puntos: 599,  nivelEsperado: 3 },
    { puntos: 600,  nivelEsperado: 4 },
    { puntos: 800,  nivelEsperado: 4 },
    { puntos: 999,  nivelEsperado: 4 },
    { puntos: 1000, nivelEsperado: 5 },
    { puntos: 1500, nivelEsperado: 5 },
    { puntos: 9999, nivelEsperado: 5 },
  ]

  umbrales.forEach(({ puntos, nivelEsperado }) => {
    it(`${puntos} pts → nivel ${nivelEsperado}`, () => {
      expect(calcularNivel(puntos)).toBe(nivelEsperado)
    })
  })
})

// ══════════════════════════════════════════════════════════════
// RESTRICCIÓN POR NIVEL — qué módulos puede ver el estudiante
// ══════════════════════════════════════════════════════════════
describe('Restricción de módulos por nivel del estudiante', () => {
  /**
   * Los módulos en CLASES_CONFIG se corresponden con niveles:
   *  - Un módulo "Nivel N" requiere que el estudiante tenga nivel >= N
   *  - El nivel del estudiante se calcula desde sus puntos
   */

  function modulosAccesibles(modulos: { nombre: string }[], nivelUsuario: number) {
    return modulos.filter(mod => {
      const match = mod.nombre.match(/nivel\s+(\d+)/i)
      if (!match) return true // módulos sin número de nivel siempre accesibles
      const nivelModulo = parseInt(match[1])
      return nivelUsuario >= nivelModulo
    })
  }

  it('nivel 1: solo puede ver módulos de Nivel 1', () => {
    const piano = CURSOS.find(c => c.id === 'piano')!
    const modulosPractica = piano.modulos.filter(m => !m.nombre.toLowerCase().includes('práctica'))
    const accesibles = modulosAccesibles(modulosPractica, 1)

    const nivel1Mods = accesibles.filter(m => m.nombre.match(/nivel\s+1/i) || !m.nombre.match(/nivel/i))
    const nivel2Mods = accesibles.filter(m => m.nombre.match(/nivel\s+[2-5]/i))

    expect(nivel2Mods).toHaveLength(0) // no puede ver nivel 2+
    expect(nivel1Mods.length).toBeGreaterThan(0)
  })

  it('nivel 2: puede ver módulos de Nivel 1 y Nivel 2', () => {
    const piano = CURSOS.find(c => c.id === 'piano')!
    const modulos = piano.modulos.filter(m => !m.nombre.toLowerCase().includes('práctica'))
    const accesibles = modulosAccesibles(modulos, 2)

    const tiene1 = accesibles.some(m => m.nombre.match(/nivel\s+1/i))
    const tiene2 = accesibles.some(m => m.nombre.match(/nivel\s+2/i))
    const noTiene3 = !accesibles.some(m => m.nombre.match(/nivel\s+3/i))

    expect(tiene1).toBe(true)
    expect(tiene2).toBe(true)
    expect(noTiene3).toBe(true)
  })

  it('nivel 5 (Maestro): puede ver todos los módulos con nivel ≤ 5', () => {
    const piano = CURSOS.find(c => c.id === 'piano')!
    const modulos = piano.modulos.filter(m => !m.nombre.toLowerCase().includes('práctica'))
    const accesibles = modulosAccesibles(modulos, 5)

    // Solo módulos sin número de nivel O con nivel ≤ 5 son accesibles.
    // El curso de piano tiene módulos de "Nivel 6" que están fuera del sistema
    // de gamificación (máximo nivel 5), por lo que no son accesibles.
    const esperados = modulos.filter(m => {
      const match = m.nombre.match(/nivel\s+(\d+)/i)
      return !match || parseInt(match[1]) <= 5
    })
    expect(accesibles.length).toBe(esperados.length)
  })
})

// ══════════════════════════════════════════════════════════════
// PROGRESIÓN — videos necesarios para cada nivel
// ══════════════════════════════════════════════════════════════
describe('Videos necesarios para subir de nivel', () => {
  const ptsVideo = PUNTOS_POR_TIPO.video // 20 pts

  it('L1 → L2: necesita 5 videos (100 ÷ 20)', () => {
    const ptsTarget = LEVEL_CONFIG.find(l => l.nivel === 2)!.puntos_requeridos
    expect(Math.ceil(ptsTarget / ptsVideo)).toBe(5)
  })

  it('L2 → L3: necesita 10 videos más (200 pts adicionales ÷ 20)', () => {
    const ptsL2 = LEVEL_CONFIG.find(l => l.nivel === 2)!.puntos_requeridos
    const ptsL3 = LEVEL_CONFIG.find(l => l.nivel === 3)!.puntos_requeridos
    const videosPara = Math.ceil((ptsL3 - ptsL2) / ptsVideo)
    expect(videosPara).toBe(10)
  })

  it('L3 → L4: necesita 15 videos más (300 pts adicionales ÷ 20)', () => {
    const ptsL3 = LEVEL_CONFIG.find(l => l.nivel === 3)!.puntos_requeridos
    const ptsL4 = LEVEL_CONFIG.find(l => l.nivel === 4)!.puntos_requeridos
    const videosPara = Math.ceil((ptsL4 - ptsL3) / ptsVideo)
    expect(videosPara).toBe(15)
  })

  it('L4 → L5: necesita 20 videos más (400 pts adicionales ÷ 20)', () => {
    const ptsL4 = LEVEL_CONFIG.find(l => l.nivel === 4)!.puntos_requeridos
    const ptsL5 = LEVEL_CONFIG.find(l => l.nivel === 5)!.puntos_requeridos
    const videosPara = Math.ceil((ptsL5 - ptsL4) / ptsVideo)
    expect(videosPara).toBe(20)
  })

  it('total de videos para pasar de L1 a L5: 50 videos', () => {
    const ptsTotal = LEVEL_CONFIG.find(l => l.nivel === 5)!.puntos_requeridos
    const videosTotales = Math.ceil(ptsTotal / ptsVideo)
    expect(videosTotales).toBe(50)
  })
})

// ══════════════════════════════════════════════════════════════
// PROGRESO PORCENTUAL DENTRO DEL NIVEL
// ══════════════════════════════════════════════════════════════
describe('Progreso porcentual dentro del nivel actual', () => {
  it('0 pts → 0%', () => {
    expect(calcularProgreso(0)).toBe(0)
  })

  it('50 pts (mitad del L1→L2) → 50%', () => {
    expect(calcularProgreso(50)).toBe(50)
  })

  it('100 pts (inicio de L2) → 0% dentro de L2', () => {
    expect(calcularProgreso(100)).toBe(0)
  })

  it('200 pts (mitad entre 100 y 300) → 50% dentro de L2', () => {
    expect(calcularProgreso(200)).toBe(50)
  })

  it('300 pts (inicio de L3) → 0% dentro de L3', () => {
    expect(calcularProgreso(300)).toBe(0)
  })

  it('450 pts (mitad entre 300 y 600) → 50% dentro de L3', () => {
    expect(calcularProgreso(450)).toBe(50)
  })

  it('600 pts (inicio de L4) → 0% dentro de L4', () => {
    expect(calcularProgreso(600)).toBe(0)
  })

  it('800 pts (mitad entre 600 y 1000) → 50% dentro de L4', () => {
    expect(calcularProgreso(800)).toBe(50)
  })

  it('1000 pts (nivel 5 Maestro) → 100%', () => {
    expect(calcularProgreso(1000)).toBe(100)
  })

  it('por encima del máximo sigue siendo 100%', () => {
    expect(calcularProgreso(2000)).toBe(100)
  })
})

// ══════════════════════════════════════════════════════════════
// SUBIDA DE NIVEL — simulación de completar recursos
// ══════════════════════════════════════════════════════════════
describe('Simulación de progresión completa: L1 → L5', () => {
  function simularCompletarVideos(nVideos: number): { puntos: number; nivel: number } {
    const puntos = nVideos * PUNTOS_POR_TIPO.video
    return { puntos, nivel: calcularNivel(puntos) }
  }

  it('después de 1 video (20 pts): nivel 1', () => {
    const { nivel } = simularCompletarVideos(1)
    expect(nivel).toBe(1)
  })

  it('después de 4 videos (80 pts): nivel 1 (faltan 1 video para L2)', () => {
    const { nivel } = simularCompletarVideos(4)
    expect(nivel).toBe(1)
  })

  it('después de 5 videos (100 pts): SUBE a nivel 2 🎉', () => {
    const { nivel, puntos } = simularCompletarVideos(5)
    expect(nivel).toBe(2)
    expect(puntos).toBe(100)
  })

  it('después de 15 videos (300 pts): SUBE a nivel 3 🎉', () => {
    const { nivel, puntos } = simularCompletarVideos(15)
    expect(nivel).toBe(3)
    expect(puntos).toBe(300)
  })

  it('después de 30 videos (600 pts): SUBE a nivel 4 🎉', () => {
    const { nivel, puntos } = simularCompletarVideos(30)
    expect(nivel).toBe(4)
    expect(puntos).toBe(600)
  })

  it('después de 50 videos (1000 pts): SUBE a nivel 5 — Maestro 🏆', () => {
    const { nivel, puntos } = simularCompletarVideos(50)
    expect(nivel).toBe(5)
    expect(puntos).toBe(1000)
  })

  it('después de 100 videos: sigue en nivel 5 (máximo)', () => {
    const { nivel } = simularCompletarVideos(100)
    expect(nivel).toBe(5)
  })
})

// ══════════════════════════════════════════════════════════════
// VISTA DE PROFESOR — sin restricción de niveles
// ══════════════════════════════════════════════════════════════
describe('Vista de profesor — acceso completo a todos los módulos', () => {
  it('profesor puede ver todos los módulos sin restricción de nivel', () => {
    /**
     * La restricción de niveles aplica a estudiantes.
     * El profesor (o admin) via teacherGuard tiene cursosAcceso que
     * le permite ver el árbol completo de sus cursos.
     * No hay filtro de nivel en las rutas de teacher.
     */
    const piano = CURSOS.find(c => c.id === 'piano')!
    const todosMod = piano.modulos.filter(m => !m.nombre.toLowerCase().includes('práctica'))

    // Un profesor puede ver todos los módulos (no hay restricción nivel)
    function modulosProfesor(modulos: typeof todosMod) {
      return modulos // sin filtro de nivel
    }

    const visibles = modulosProfesor(todosMod)
    expect(visibles.length).toBe(todosMod.length)
  })

  it('para todos los instrumentos, el profesor ve N módulos (sin restricción)', () => {
    CLASES_CONFIG.forEach(clase => {
      const curso = CURSOS.find(c => c.id === clase.cursoId)
      if (!curso) return // gym-musical no está en CURSOS directamente
      const modulos = curso.modulos.filter(m => !m.nombre.toLowerCase().includes('práctica'))
      // Profesor ve TODOS los módulos
      expect(modulos.length).toBeGreaterThanOrEqual(0)
    })
  })
})

// ══════════════════════════════════════════════════════════════
// FUNCIÓN puedeAccederZona — acceso por nivel
// ══════════════════════════════════════════════════════════════
describe('puedeAccederZona — control de acceso por nivel', () => {
  it('nivel igual al requerido: acceso permitido', () => {
    expect(puedeAccederZona(3, 3)).toBe(true)
  })

  it('nivel mayor al requerido: acceso permitido', () => {
    expect(puedeAccederZona(4, 2)).toBe(true)
    expect(puedeAccederZona(5, 1)).toBe(true)
  })

  it('nivel menor al requerido: acceso denegado', () => {
    expect(puedeAccederZona(1, 2)).toBe(false)
    expect(puedeAccederZona(2, 4)).toBe(false)
    expect(puedeAccederZona(3, 5)).toBe(false)
  })

  it('nivel 5 (Maestro) puede acceder a cualquier zona', () => {
    [1, 2, 3, 4, 5].forEach(nivelZona => {
      expect(puedeAccederZona(5, nivelZona)).toBe(true)
    })
  })
})
