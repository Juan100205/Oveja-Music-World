/**
 * TDD — Integridad de datos estáticos
 *
 * Verifica que:
 *  1. CLASES_CONFIG tiene los 6 instrumentos correctos con todos los campos
 *  2. Cada cursoId en CLASES_CONFIG apunta a un curso válido en CURSOS
 *  3. GYM_INSTRUMENTOS tiene los 7 instrumentos de gym
 *  4. getModulos retorna los módulos correctos para cada instrumento de gym
 *  5. Todos los CURSOS tienen estructura válida (modulos → secciones → recursos)
 *  6. Cada recurso tiene url y tipo válidos
 *  7. Instrumentos de clase y gym cubren todos los instrumentos del sistema
 */

import { CLASES_CONFIG } from '@/data/clases'
import { GYM_INSTRUMENTOS } from '@/data/gym'
import { CURSOS, type Recurso } from '@/data/cursos'
import { LEVEL_CONFIG, PUNTOS_POR_TIPO } from '@/types'

const TIPOS_VALIDOS = ['video', 'drive', 'juego', 'pdf', 'imagen', 'herramienta', 'otro'] as const

// ══════════════════════════════════════════════════════════════
// CLASES_CONFIG
// ══════════════════════════════════════════════════════════════
describe('CLASES_CONFIG — estructura e integridad', () => {
  it('tiene exactamente 6 instrumentos de clase', () => {
    expect(CLASES_CONFIG).toHaveLength(6)
  })

  it('contiene los 6 instrumentos esperados', () => {
    const ids = CLASES_CONFIG.map(c => c.id)
    expect(ids).toContain('bateria')
    expect(ids).toContain('piano')
    expect(ids).toContain('guitarra')
    expect(ids).toContain('canto')
    expect(ids).toContain('violin')
    expect(ids).toContain('introduccion')
  })

  it('todos los instrumentos tienen campos obligatorios', () => {
    CLASES_CONFIG.forEach(c => {
      expect(c.id).toBeTruthy()
      expect(c.nombre).toBeTruthy()
      expect(c.emoji).toBeTruthy()
      expect(c.descripcion).toBeTruthy()
      expect(c.color).toBeTruthy()
      expect(c.glow).toBeTruthy()
      expect(c.cursoId).toBeTruthy()
    })
  })

  it('no hay ids duplicados', () => {
    const ids = CLASES_CONFIG.map(c => c.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('cada cursoId apunta a un curso que existe en CURSOS', () => {
    const cursoIds = CURSOS.map(c => c.id)
    CLASES_CONFIG.forEach(clase => {
      expect(cursoIds).toContain(clase.cursoId)
    })
  })

  it('batería apunta al curso correcto', () => {
    const bateria = CLASES_CONFIG.find(c => c.id === 'bateria')
    expect(bateria?.cursoId).toBe('bateria')
  })

  it('piano apunta al curso correcto', () => {
    const piano = CLASES_CONFIG.find(c => c.id === 'piano')
    expect(piano?.cursoId).toBe('piano')
  })

  it('guitarra apunta al curso correcto (guitarra-adultos)', () => {
    const guitarra = CLASES_CONFIG.find(c => c.id === 'guitarra')
    expect(guitarra?.cursoId).toBe('guitarra-adultos')
  })

  it('violín apunta al curso correcto', () => {
    const violin = CLASES_CONFIG.find(c => c.id === 'violin')
    expect(violin?.cursoId).toBe('violin')
  })

  it('introducción musical apunta al curso correcto (ciudad-musical)', () => {
    const intro = CLASES_CONFIG.find(c => c.id === 'introduccion')
    expect(intro?.cursoId).toBe('ciudad-musical')
  })

  it('todos los campos color son strings (no vacíos)', () => {
    CLASES_CONFIG.forEach(c => {
      expect(typeof c.color).toBe('string')
      expect(c.color.length).toBeGreaterThan(0)
    })
  })
})

// ══════════════════════════════════════════════════════════════
// GYM_INSTRUMENTOS
// ══════════════════════════════════════════════════════════════
describe('GYM_INSTRUMENTOS — estructura e integridad', () => {
  it('tiene exactamente 7 instrumentos de gym', () => {
    expect(GYM_INSTRUMENTOS).toHaveLength(7)
  })

  it('contiene los 7 instrumentos esperados', () => {
    const ids = GYM_INSTRUMENTOS.map(g => g.id)
    expect(ids).toContain('gym-general')
    expect(ids).toContain('bateria')
    expect(ids).toContain('piano')
    expect(ids).toContain('violin')
    expect(ids).toContain('canto')
    expect(ids).toContain('guitarra')
    expect(ids).toContain('introduccion')
  })

  it('todos tienen campos obligatorios', () => {
    GYM_INSTRUMENTOS.forEach(g => {
      expect(g.id).toBeTruthy()
      expect(g.nombre).toBeTruthy()
      expect(g.emoji).toBeTruthy()
      expect(g.descripcion).toBeTruthy()
      expect(g.color).toBeTruthy()
      expect(g.glow).toBeTruthy()
      expect(Array.isArray(g.modulos)).toBe(true)
    })
  })

  it('no hay ids duplicados', () => {
    const ids = GYM_INSTRUMENTOS.map(g => g.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('batería gym tiene módulos cargados desde CURSOS', () => {
    const bateria = GYM_INSTRUMENTOS.find(g => g.id === 'bateria')
    expect(bateria?.modulos.length).toBeGreaterThan(0)
    expect(bateria?.modulos[0].id).toBe('bateria-nivel-1')
  })

  it('piano gym tiene módulos de práctica específicos', () => {
    const piano = GYM_INSTRUMENTOS.find(g => g.id === 'piano')
    expect(piano?.modulos.length).toBeGreaterThan(0)
    // Solo módulos de práctica (3, 5, 9, 11, 13)
    const moduloIds = piano?.modulos.map(m => m.id) ?? []
    expect(moduloIds.some(id => id.includes('piano-modulo'))).toBe(true)
  })

  it('cada módulo de gym tiene secciones con recursos', () => {
    GYM_INSTRUMENTOS.forEach(instr => {
      instr.modulos.forEach(mod => {
        expect(Array.isArray(mod.secciones)).toBe(true)
        mod.secciones.forEach(sec => {
          expect(Array.isArray(sec.recursos)).toBe(true)
        })
      })
    })
  })
})

// ══════════════════════════════════════════════════════════════
// CURSOS — estructura completa
// ══════════════════════════════════════════════════════════════
describe('CURSOS — estructura e integridad', () => {
  it('todos los cursos tienen id, nombre, emoji y modulos', () => {
    CURSOS.forEach(curso => {
      expect(curso.id).toBeTruthy()
      expect(curso.nombre).toBeTruthy()
      expect(curso.emoji).toBeTruthy()
      expect(Array.isArray(curso.modulos)).toBe(true)
    })
  })

  it('no hay cursos con id duplicado', () => {
    const ids = CURSOS.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('cada módulo tiene id y nombre', () => {
    CURSOS.forEach(curso => {
      curso.modulos.forEach(mod => {
        expect(mod.id).toBeTruthy()
        expect(mod.nombre).toBeTruthy()
        expect(Array.isArray(mod.secciones)).toBe(true)
      })
    })
  })

  it('cada sección tiene nombre y recursos', () => {
    CURSOS.forEach(curso => {
      curso.modulos.forEach(mod => {
        mod.secciones.forEach(sec => {
          expect(sec.nombre).toBeTruthy()
          expect(Array.isArray(sec.recursos)).toBe(true)
        })
      })
    })
  })

  it('cada recurso tiene url (no vacía) y tipo válido', () => {
    CURSOS.forEach(curso => {
      curso.modulos.forEach(mod => {
        mod.secciones.forEach(sec => {
          sec.recursos.forEach((rec: Recurso) => {
            expect(rec.url).toBeTruthy()
            expect(TIPOS_VALIDOS).toContain(rec.tipo)
          })
        })
      })
    })
  })

  it('batería existe en CURSOS', () => {
    const bateria = CURSOS.find(c => c.id === 'bateria')
    expect(bateria).toBeDefined()
    expect(bateria?.modulos.length).toBeGreaterThan(0)
  })

  it('piano existe en CURSOS y tiene múltiples módulos', () => {
    const piano = CURSOS.find(c => c.id === 'piano')
    expect(piano).toBeDefined()
    expect(piano!.modulos.length).toBeGreaterThan(5)
  })

  it('zona de sección es "clase", "gym" o undefined', () => {
    CURSOS.forEach(curso => {
      curso.modulos.forEach(mod => {
        mod.secciones.forEach(sec => {
          if (sec.zona !== undefined) {
            expect(['clase', 'gym']).toContain(sec.zona)
          }
        })
      })
    })
  })
})

// ══════════════════════════════════════════════════════════════
// GAMIFICATION — Level config y puntos por tipo
// ══════════════════════════════════════════════════════════════
describe('LEVEL_CONFIG — configuración de niveles', () => {
  it('tiene exactamente 5 niveles', () => {
    expect(LEVEL_CONFIG).toHaveLength(5)
  })

  it('los niveles van del 1 al 5', () => {
    const niveles = LEVEL_CONFIG.map(l => l.nivel)
    expect(niveles).toEqual([1, 2, 3, 4, 5])
  })

  it('nivel 1 empieza en 0 pts', () => {
    const n1 = LEVEL_CONFIG.find(l => l.nivel === 1)
    expect(n1?.puntos_requeridos).toBe(0)
  })

  it('nivel 2 requiere 100 pts', () => {
    const n2 = LEVEL_CONFIG.find(l => l.nivel === 2)
    expect(n2?.puntos_requeridos).toBe(100)
  })

  it('nivel 3 requiere 300 pts', () => {
    const n3 = LEVEL_CONFIG.find(l => l.nivel === 3)
    expect(n3?.puntos_requeridos).toBe(300)
  })

  it('nivel 4 requiere 600 pts', () => {
    const n4 = LEVEL_CONFIG.find(l => l.nivel === 4)
    expect(n4?.puntos_requeridos).toBe(600)
  })

  it('nivel 5 (Maestro) requiere 1000 pts', () => {
    const n5 = LEVEL_CONFIG.find(l => l.nivel === 5)
    expect(n5?.puntos_requeridos).toBe(1000)
    expect(n5?.nombre).toBe('Maestro')
  })

  it('cada nivel tiene nombre correcto', () => {
    const nombres = LEVEL_CONFIG.map(l => l.nombre)
    expect(nombres).toContain('Principiante')
    expect(nombres).toContain('Aprendiz')
    expect(nombres).toContain('Intermedio')
    expect(nombres).toContain('Avanzado')
    expect(nombres).toContain('Maestro')
  })

  it('videos necesarios para pasar de nivel 1 a 2 son 5', () => {
    // Nivel 1 → 2: 100 pts / 20 pts por video = 5 videos
    const ptsParaN2 = LEVEL_CONFIG.find(l => l.nivel === 2)!.puntos_requeridos
    const videosNecesarios = ptsParaN2 / PUNTOS_POR_TIPO.video
    expect(videosNecesarios).toBe(5)
  })

  it('videos acumulados para nivel 5 desde cero son 50', () => {
    // 1000 pts / 20 pts por video = 50 videos
    const ptsParaN5 = LEVEL_CONFIG.find(l => l.nivel === 5)!.puntos_requeridos
    const videosTotal = ptsParaN5 / PUNTOS_POR_TIPO.video
    expect(videosTotal).toBe(50)
  })
})

describe('PUNTOS_POR_TIPO — puntos por tipo de recurso', () => {
  it('video da 20 puntos (mayor incentivo)', () => {
    expect(PUNTOS_POR_TIPO.video).toBe(20)
  })

  it('juego da 10 puntos', () => {
    expect(PUNTOS_POR_TIPO.juego).toBe(10)
  })

  it('drive, pdf, imagen, herramienta y otro dan 5 puntos', () => {
    expect(PUNTOS_POR_TIPO.drive).toBe(5)
    expect(PUNTOS_POR_TIPO.pdf).toBe(5)
    expect(PUNTOS_POR_TIPO.imagen).toBe(5)
    expect(PUNTOS_POR_TIPO.herramienta).toBe(5)
    expect(PUNTOS_POR_TIPO.otro).toBe(5)
  })

  it('video da más puntos que cualquier otro tipo', () => {
    const maxOtroTipo = Math.max(
      PUNTOS_POR_TIPO.juego,
      PUNTOS_POR_TIPO.drive,
      PUNTOS_POR_TIPO.pdf,
    )
    expect(PUNTOS_POR_TIPO.video).toBeGreaterThan(maxOtroTipo)
  })
})

// ══════════════════════════════════════════════════════════════
// COBERTURA — todos los instrumentos de clase tienen gym (o no)
// ══════════════════════════════════════════════════════════════
describe('Cobertura de instrumentos — clase vs gym', () => {
  it('todos los ids de CLASES_CONFIG tienen un instrumento en GYM_INSTRUMENTOS (excepto gym-general)', () => {
    const gymIds = GYM_INSTRUMENTOS.map(g => g.id).filter(id => id !== 'gym-general')
    CLASES_CONFIG.forEach(clase => {
      expect(gymIds).toContain(clase.id)
    })
  })

  it('gym-general existe solo en GYM_INSTRUMENTOS (no en CLASES_CONFIG)', () => {
    const claseIds = CLASES_CONFIG.map(c => c.id)
    expect(claseIds).not.toContain('gym-general')

    const gymGeneral = GYM_INSTRUMENTOS.find(g => g.id === 'gym-general')
    expect(gymGeneral).toBeDefined()
  })
})
