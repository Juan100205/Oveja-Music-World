/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'

// ── Mocks ─────────────────────────────────────────────────────
const mockMaybeSingle = jest.fn()
const mockEq          = jest.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockSelect      = jest.fn(() => ({ eq: mockEq }))
const mockFrom        = jest.fn(() => ({ select: mockSelect }))

jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}))

// ── Tests ──────────────────────────────────────────────────────
import { GET } from '@/app/api/video-cards/route'

const VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
const STORED_CARDS = [
  { id: 'c1', tiempo: 30,  tipo: 'texto',     texto: 'Recuerda el tempo' },
  { id: 'c2', tiempo: 60,  tipo: 'boton',     texto: 'Instrucción', boton_label: 'Listo' },
  { id: 'c3', tiempo: 90,  tipo: 'countdown', instruccion: 'Practica', duracion: 60 },
  { id: 'c4', tiempo: 120, tipo: 'quiz',      pregunta: '¿Qué compás?', opciones: ['4/4', '3/4'], respuesta_correcta: 0 },
]

function makeGetRequest(url?: string) {
  const urlStr = url
    ? `http://localhost/api/video-cards?url=${encodeURIComponent(url)}`
    : 'http://localhost/api/video-cards'
  return new NextRequest(urlStr)
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ── GET /api/video-cards ──────────────────────────────────────
describe('GET /api/video-cards', () => {
  it('retorna las cartas guardadas para una URL existente', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { cards: STORED_CARDS }, error: null })

    const res = await GET(makeGetRequest(VIDEO_URL))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.cards).toEqual(STORED_CARDS)
    expect(mockFrom).toHaveBeenCalledWith('video_cards')
    expect(mockEq).toHaveBeenCalledWith('recurso_url', VIDEO_URL)
  })

  it('retorna array vacío si no existe la URL en la BD', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })

    const res = await GET(makeGetRequest(VIDEO_URL))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.cards).toEqual([])
  })

  it('retorna array vacío si no se pasa URL', async () => {
    const res = await GET(makeGetRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.cards).toEqual([])
    // No debe consultar la BD
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('retorna array vacío si la BD devuelve cards: null', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { cards: null }, error: null })

    const res = await GET(makeGetRequest(VIDEO_URL))
    const body = await res.json()

    expect(body.cards).toEqual([])
  })

  it('URLs diferentes retornan cartas diferentes (aislamiento)', async () => {
    const url1 = 'https://youtube.com/watch?v=video1'
    const url2 = 'https://youtube.com/watch?v=video2'
    const cardsUrl1 = [{ id: 'a', tiempo: 10, tipo: 'texto', texto: 'Video 1' }]
    const cardsUrl2 = [{ id: 'b', tiempo: 20, tipo: 'texto', texto: 'Video 2' }]

    mockMaybeSingle
      .mockResolvedValueOnce({ data: { cards: cardsUrl1 }, error: null })
      .mockResolvedValueOnce({ data: { cards: cardsUrl2 }, error: null })

    const res1 = await GET(makeGetRequest(url1))
    const res2 = await GET(makeGetRequest(url2))
    const body1 = await res1.json()
    const body2 = await res2.json()

    expect(body1.cards).toEqual(cardsUrl1)
    expect(body2.cards).toEqual(cardsUrl2)
    expect(body1.cards).not.toEqual(body2.cards)
  })

  it('múltiples usuarios consultando la misma URL reciben las mismas cartas', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { cards: STORED_CARDS }, error: null })

    const [r1, r2, r3] = await Promise.all([
      GET(makeGetRequest(VIDEO_URL)),
      GET(makeGetRequest(VIDEO_URL)),
      GET(makeGetRequest(VIDEO_URL)),
    ])

    const [b1, b2, b3] = await Promise.all([r1.json(), r2.json(), r3.json()])

    expect(b1.cards).toEqual(STORED_CARDS)
    expect(b2.cards).toEqual(STORED_CARDS)
    expect(b3.cards).toEqual(STORED_CARDS)
  })
})
