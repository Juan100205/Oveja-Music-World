/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import type { VideoCard } from '@/types'

// ── Mocks ─────────────────────────────────────────────────────
const mockSingle      = jest.fn()
const mockMaybeSingle = jest.fn()
const mockSelect      = jest.fn()
const mockEq          = jest.fn()
const mockUpsert      = jest.fn()

// Encadenamiento fluent del cliente Supabase
mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle })
mockSelect.mockReturnValue({ eq: mockEq })
mockUpsert.mockReturnValue({ select: () => ({ single: mockSingle }) })

const mockFrom = jest.fn((table: string) => {
  if (table === 'video_cards') {
    return { select: mockSelect, upsert: mockUpsert }
  }
  return {}
})

jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}))

const mockExtractToken = jest.fn()
const mockVerifyToken  = jest.fn()

jest.mock('@/lib/auth', () => ({
  extractTokenFromHeader: (...args: unknown[]) => mockExtractToken(...args),
  verifyToken:            (...args: unknown[]) => mockVerifyToken(...args),
}))

// ── Import routes after mocks ─────────────────────────────────
import { GET, POST } from '@/app/api/admin/video-cards/route'

// ── Fixtures ──────────────────────────────────────────────────
const VIDEO_URL = 'https://www.youtube.com/watch?v=TEST123'

const STORED_CARDS: VideoCard[] = [
  { id: 'c1', tiempo: 30,  tipo: 'texto',     texto: 'Instrucción del profe' },
  { id: 'c2', tiempo: 90,  tipo: 'countdown', instruccion: 'Practica', duracion: 60 },
]

function makeRequest(
  method: 'GET' | 'POST',
  url: string,
  token: string | null,
  body?: unknown
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  return new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeGetReq(videoUrl?: string, token: string | null = 'valid-token') {
  const url = videoUrl
    ? `http://localhost/api/admin/video-cards?url=${encodeURIComponent(videoUrl)}`
    : 'http://localhost/api/admin/video-cards'
  return makeRequest('GET', url, token)
}

function makePostReq(body: unknown, token: string | null = 'valid-token') {
  return makeRequest('POST', 'http://localhost/api/admin/video-cards', token, body)
}

beforeEach(() => {
  jest.clearAllMocks()
  mockExtractToken.mockReturnValue('some-token')
})

// ── Auth Guard ────────────────────────────────────────────────
describe('Auth guard — GET y POST', () => {
  it('bloquea requests sin token', async () => {
    mockExtractToken.mockReturnValue(null)

    const getRes  = await GET(makeGetReq(VIDEO_URL, null))
    const postRes = await POST(makePostReq({ recurso_url: VIDEO_URL, cards: [] }, null))

    expect(getRes.status).toBe(403)
    expect(postRes.status).toBe(403)
    expect((await getRes.json()).error).toBe('Sin permisos')
    expect((await postRes.json()).error).toBe('Sin permisos')
  })

  it('bloquea estudiante (role: student)', async () => {
    mockVerifyToken.mockReturnValue({ role: 'student', sub: 'u1', email: 'stu@test.com', nivel: 1 })

    const res = await GET(makeGetReq(VIDEO_URL))
    expect(res.status).toBe(403)
  })

  it('permite admin (role: admin)', async () => {
    mockVerifyToken.mockReturnValue({ role: 'admin', sub: 'u2', email: 'admin@test.com', nivel: 5 })
    mockMaybeSingle.mockResolvedValue({ data: { cards: STORED_CARDS }, error: null })

    const res = await GET(makeGetReq(VIDEO_URL))
    expect(res.status).toBe(200)
  })

  it('permite teacher (role: teacher)', async () => {
    mockVerifyToken.mockReturnValue({ role: 'teacher', sub: 'u3', email: 'profe@test.com', nivel: 3 })
    mockMaybeSingle.mockResolvedValue({ data: { cards: STORED_CARDS }, error: null })

    const res = await GET(makeGetReq(VIDEO_URL))
    expect(res.status).toBe(200)
  })

  it('bloquea token inválido / expirado', async () => {
    mockVerifyToken.mockReturnValue(null)

    const res = await POST(makePostReq({ recurso_url: VIDEO_URL, cards: [] }))
    expect(res.status).toBe(403)
  })
})

// ── GET /api/admin/video-cards ────────────────────────────────
describe('GET /api/admin/video-cards', () => {
  beforeEach(() => {
    mockVerifyToken.mockReturnValue({ role: 'admin', sub: 'u1', email: 'a@a.com', nivel: 5 })
  })

  it('retorna cartas para la URL dada', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { cards: STORED_CARDS }, error: null })

    const res  = await GET(makeGetReq(VIDEO_URL))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.cards).toEqual(STORED_CARDS)
  })

  it('retorna [] si no hay cartas para esa URL', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const res  = await GET(makeGetReq(VIDEO_URL))
    const body = await res.json()

    expect(body.cards).toEqual([])
  })

  it('retorna [] si no se pasa url', async () => {
    const res  = await GET(makeGetReq(undefined))
    const body = await res.json()

    expect(body.cards).toEqual([])
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

// ── POST /api/admin/video-cards ───────────────────────────────
describe('POST /api/admin/video-cards', () => {
  beforeEach(() => {
    mockVerifyToken.mockReturnValue({ role: 'teacher', sub: 'u3', email: 't@t.com', nivel: 3 })
  })

  it('guarda cartas con upsert y retorna 200', async () => {
    const savedRow = { recurso_url: VIDEO_URL, cards: STORED_CARDS }
    mockSingle.mockResolvedValue({ data: savedRow, error: null })

    const res  = await POST(makePostReq({ recurso_url: VIDEO_URL, cards: STORED_CARDS }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual(savedRow)
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ recurso_url: VIDEO_URL, cards: STORED_CARDS }),
      { onConflict: 'recurso_url' }
    )
  })

  it('devuelve 400 si no se pasa recurso_url', async () => {
    const res  = await POST(makePostReq({ cards: STORED_CARDS }))
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toContain('recurso_url')
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('devuelve 400 si recurso_url es string vacío', async () => {
    const res = await POST(makePostReq({ recurso_url: '   ', cards: [] }))
    expect(res.status).toBe(400)
  })

  it('guarda array vacío correctamente (borrar todas las cartas)', async () => {
    mockSingle.mockResolvedValue({ data: { recurso_url: VIDEO_URL, cards: [] }, error: null })

    const res  = await POST(makePostReq({ recurso_url: VIDEO_URL, cards: [] }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.cards).toEqual([])
  })

  it('devuelve 500 si Supabase falla', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const res  = await POST(makePostReq({ recurso_url: VIDEO_URL, cards: STORED_CARDS }))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('DB error')
  })

  it('upsert: segunda llamada con misma URL actualiza (no duplica)', async () => {
    const updatedCards = [{ ...STORED_CARDS[0], texto: 'Texto actualizado' }]
    mockSingle.mockResolvedValue({
      data: { recurso_url: VIDEO_URL, cards: updatedCards },
      error: null,
    })

    const res  = await POST(makePostReq({ recurso_url: VIDEO_URL, cards: updatedCards }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data.cards[0].texto).toBe('Texto actualizado')
    // Solo 1 llamada a upsert, no 2 inserts
    expect(mockUpsert).toHaveBeenCalledTimes(1)
  })

  it('el campo updated_at se envía en el upsert', async () => {
    mockSingle.mockResolvedValue({ data: { recurso_url: VIDEO_URL, cards: [] }, error: null })

    await POST(makePostReq({ recurso_url: VIDEO_URL, cards: [] }))

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ updated_at: expect.any(String) }),
      expect.anything()
    )
  })

  it('trim en recurso_url: elimina espacios antes de guardar', async () => {
    mockSingle.mockResolvedValue({ data: { recurso_url: VIDEO_URL, cards: [] }, error: null })

    await POST(makePostReq({ recurso_url: `  ${VIDEO_URL}  `, cards: [] }))

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ recurso_url: VIDEO_URL }),
      expect.anything()
    )
  })
})
