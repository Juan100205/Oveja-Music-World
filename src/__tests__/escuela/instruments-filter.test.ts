/**
 * TDD — Lógica de visibilidad de instrumentos en /escuela
 *
 * Verifica el comportamiento de filtrado que usa escuela/page.tsx:
 *
 *  Admin:
 *   - Ve TODOS los instrumentos de DB (clase + gym)
 *   - No necesita clases_acceso
 *
 *  Estudiante:
 *   - Solo ve instrumentos cuyo id está en su clases_acceso
 *   - Sin acceso asignado → no ve ningún instrumento
 *
 *  Zona:
 *   - zona='clase' → aparece solo en clases
 *   - zona='gym'   → aparece solo en gym
 *   - zona='ambos' → aparece en ambos
 *
 *  DB vacía:
 *   - Admin y estudiante ven listas vacías
 */

// ── Tipos mínimos que refleja la lógica del page ───────────────
interface Instr { id: string; zona?: string }

// ── Lógica extraída de escuela/page.tsx ────────────────────────
function filterClasesVisibles<T extends Instr>(
  dbClases: T[], isAdmin: boolean, acceso: string[]
): T[] {
  return isAdmin ? dbClases : dbClases.filter(c => acceso.includes(c.id))
}

function filterGymVisibles<T extends Instr>(
  dbGym: T[], isAdmin: boolean, acceso: string[]
): T[] {
  return isAdmin ? dbGym : dbGym.filter(g => g.id === 'gym-general' || acceso.includes(g.id))
}

function splitByZone<T extends { id: string; zona: string }>(all: T[]) {
  const dbClases = all.filter(i => i.zona === 'clase' || i.zona === 'ambos')
  const dbGym    = all.filter(i => i.zona === 'gym'   || i.zona === 'ambos')
  return { dbClases, dbGym }
}

// ── Datos de prueba ────────────────────────────────────────────
const DB_INSTRUMENTOS = [
  { id: 'bateria',      zona: 'ambos' },
  { id: 'piano',        zona: 'ambos' },
  { id: 'guitarra',     zona: 'ambos' },
  { id: 'canto',        zona: 'ambos' },
  { id: 'violin',       zona: 'ambos' },
  { id: 'introduccion', zona: 'ambos' },
]

// ══════════════════════════════════════════════════════════════
// Zona splitting
// ══════════════════════════════════════════════════════════════
describe('splitByZone — distribución de instrumentos por zona', () => {
  it('zona=ambos aparece en clases Y gym', () => {
    const { dbClases, dbGym } = splitByZone(DB_INSTRUMENTOS)
    expect(dbClases).toHaveLength(6)
    expect(dbGym).toHaveLength(6)
  })

  it('zona=clase solo aparece en clases', () => {
    const data = [{ id: 'x', zona: 'clase' }]
    const { dbClases, dbGym } = splitByZone(data)
    expect(dbClases).toHaveLength(1)
    expect(dbGym).toHaveLength(0)
  })

  it('zona=gym solo aparece en gym', () => {
    const data = [{ id: 'x', zona: 'gym' }]
    const { dbClases, dbGym } = splitByZone(data)
    expect(dbClases).toHaveLength(0)
    expect(dbGym).toHaveLength(1)
  })

  it('DB vacía → ambas listas vacías', () => {
    const { dbClases, dbGym } = splitByZone([])
    expect(dbClases).toHaveLength(0)
    expect(dbGym).toHaveLength(0)
  })
})

// ══════════════════════════════════════════════════════════════
// Admin
// ══════════════════════════════════════════════════════════════
describe('filterClasesVisibles — admin', () => {
  const { dbClases } = splitByZone(DB_INSTRUMENTOS)

  it('admin ve todos los instrumentos de clase (sin importar acceso)', () => {
    const result = filterClasesVisibles(dbClases, true, [])
    expect(result).toHaveLength(6)
  })

  it('admin ve todos aunque su acceso esté vacío', () => {
    const result = filterClasesVisibles(dbClases, true, [])
    expect(result).toEqual(dbClases)
  })

  it('admin ve todos aunque su acceso sea parcial', () => {
    const result = filterClasesVisibles(dbClases, true, ['bateria'])
    expect(result).toHaveLength(6)
  })
})

describe('filterGymVisibles — admin', () => {
  const { dbGym } = splitByZone(DB_INSTRUMENTOS)

  it('admin ve todos los instrumentos del gym', () => {
    const result = filterGymVisibles(dbGym, true, [])
    expect(result).toHaveLength(6)
  })
})

// ══════════════════════════════════════════════════════════════
// Estudiante
// ══════════════════════════════════════════════════════════════
describe('filterClasesVisibles — estudiante', () => {
  const { dbClases } = splitByZone(DB_INSTRUMENTOS)

  it('sin acceso → no ve ningún instrumento', () => {
    const result = filterClasesVisibles(dbClases, false, [])
    expect(result).toHaveLength(0)
  })

  it('con acceso a bateria → solo ve bateria', () => {
    const result = filterClasesVisibles(dbClases, false, ['bateria'])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('bateria')
  })

  it('con acceso a bateria + piano → ve ambos', () => {
    const result = filterClasesVisibles(dbClases, false, ['bateria', 'piano'])
    expect(result).toHaveLength(2)
    expect(result.map(r => r.id)).toEqual(expect.arrayContaining(['bateria', 'piano']))
  })

  it('acceso a id que no existe en DB → lista vacía', () => {
    const result = filterClasesVisibles(dbClases, false, ['instrumento-inexistente'])
    expect(result).toHaveLength(0)
  })

  it('con acceso completo → ve los 6 instrumentos', () => {
    const acceso = DB_INSTRUMENTOS.map(i => i.id)
    const result = filterClasesVisibles(dbClases, false, acceso)
    expect(result).toHaveLength(6)
  })
})

describe('filterGymVisibles — estudiante', () => {
  const { dbGym } = splitByZone(DB_INSTRUMENTOS)

  it('sin acceso → no ve ningún instrumento de gym', () => {
    const result = filterGymVisibles(dbGym, false, [])
    expect(result).toHaveLength(0)
  })

  it('gym-general siempre es visible para cualquier estudiante', () => {
    const gymConGeneral = [...dbGym, { id: 'gym-general', zona: 'gym' }]
    const result = filterGymVisibles(gymConGeneral, false, [])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('gym-general')
  })

  it('con acceso a bateria → ve bateria en gym', () => {
    const result = filterGymVisibles(dbGym, false, ['bateria'])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('bateria')
  })

  it('instrumento zona=ambos: acceso clase concede acceso gym del mismo instrumento', () => {
    const result = filterGymVisibles(dbGym, false, ['piano', 'canto'])
    expect(result).toHaveLength(2)
  })
})

// ══════════════════════════════════════════════════════════════
// DB vacía
// ══════════════════════════════════════════════════════════════
describe('visibilidad con DB vacía', () => {
  it('admin ve listas vacías si DB no tiene instrumentos', () => {
    const { dbClases, dbGym } = splitByZone([])
    expect(filterClasesVisibles(dbClases, true, [])).toHaveLength(0)
    expect(filterGymVisibles(dbGym, true, [])).toHaveLength(0)
  })

  it('estudiante ve listas vacías si DB no tiene instrumentos', () => {
    const { dbClases, dbGym } = splitByZone([])
    expect(filterClasesVisibles(dbClases, false, ['bateria'])).toHaveLength(0)
    expect(filterGymVisibles(dbGym, false, ['bateria'])).toHaveLength(0)
  })
})
