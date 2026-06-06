/**
 * Factory de mock para getSupabaseAdmin.
 *
 * Devuelve { db, chain } donde:
 *   - db.from(table) siempre retorna `chain`
 *   - chain.single / chain.maybeSingle son jest.fn() configurables con mockResolvedValueOnce
 *   - Awaitar la cadena directamente (ej. queries de count o delete) invoca chain.then,
 *     que también es un jest.fn() configurable con mockImplementationOnce
 *
 * Uso típico en un test file:
 *
 *   jest.mock('@/lib/supabase', () => ({ getSupabaseAdmin: jest.fn() }))
 *   import { getSupabaseAdmin } from '@/lib/supabase'
 *   import { createDbMock } from '../setup/supabaseMock'
 *
 *   let db: ReturnType<typeof createDbMock>['db']
 *   let chain: ReturnType<typeof createDbMock>['chain']
 *
 *   beforeEach(() => {
 *     const mock = createDbMock()
 *     db = mock.db
 *     chain = mock.chain
 *     ;(getSupabaseAdmin as jest.Mock).mockReturnValue(db)
 *   })
 */
export function createDbMock(directDefault: { data: unknown; error: unknown; count?: number } = {
  data: null,
  error: null,
  count: 0,
}) {
  const chain: Record<string, jest.Mock> & {
    single: jest.Mock
    maybeSingle: jest.Mock
    then: jest.Mock
  } = {
    select:      jest.fn(() => chain),
    insert:      jest.fn(() => chain),
    update:      jest.fn(() => chain),
    delete:      jest.fn(() => chain),
    eq:          jest.fn(() => chain),
    neq:         jest.fn(() => chain),
    order:       jest.fn(() => chain),
    limit:       jest.fn(() => chain),
    single:      jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    // Para queries directas: await db.from('X').select(...) o await db.from('X').delete()...
    then: jest.fn((resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(directDefault).then(resolve, reject)
    ),
  }

  const db = { from: jest.fn(() => chain) }
  return { db, chain }
}
