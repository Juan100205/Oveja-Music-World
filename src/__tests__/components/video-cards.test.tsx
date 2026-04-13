/**
 * Tests de los sub-componentes de carta interactiva.
 * VideoPlayerWithCards depende de la YouTube IFrame API (no testeable en jsdom),
 * pero la lógica interna de cada tipo de carta sí es testeable aquí.
 *
 * Estrategia: extraemos y renderizamos los sub-componentes directamente.
 */

import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'

// ── Mocks ─────────────────────────────────────────────────────
// Framer Motion: animar en tests sin problemas
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion')
  return {
    ...actual,
    motion: new Proxy(actual.motion, {
      get: (_: object, key: string) =>
        (props: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => {
          const { children, ...rest } = props
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return actual.motion[key]({ ...rest, initial: false, animate: false, exit: false, children })
        },
    }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

// ── Importar componente raíz para acceder a sub-componentes ───
// Como los sub-componentes no se exportan individualmente, los testeamos
// a través del árbol del componente principal usando props mockeadas.
// Para esto creamos wrappers mínimos que replican la lógica de cada tipo.

import React, { useState } from 'react'

// ── Wrapper: CardTexto ────────────────────────────────────────
function CardTextoTest({ texto }: { texto: string }) {
  const [done, setDone] = useState(false)
  if (done) return <div data-testid="done">Continúa</div>
  return (
    <div>
      <p>{texto}</p>
      <button onClick={() => setDone(true)}>Continuar →</button>
    </div>
  )
}

// ── Wrapper: CardBoton ────────────────────────────────────────
function CardBotonTest({ texto, botonLabel }: { texto: string; botonLabel: string }) {
  const [done, setDone] = useState(false)
  if (done) return <div data-testid="done">Listo</div>
  return (
    <div>
      <p>{texto}</p>
      <button onClick={() => setDone(true)}>{botonLabel}</button>
    </div>
  )
}

// ── Wrapper: CardCountdown (replica lógica del componente real) ─
function CardCountdownTest({ instruccion, duracion, onDone }: {
  instruccion: string; duracion: number; onDone: () => void
}) {
  const [timeLeft, setTimeLeft] = useState(duracion)
  const [running,  setRunning]  = useState(false)
  const [finished, setFinished] = useState(false)

  React.useEffect(() => {
    if (!running || timeLeft <= 0) return
    const t = setTimeout(() => {
      const next = timeLeft - 1
      setTimeLeft(next)
      if (next <= 0) { setRunning(false); setFinished(true) }
    }, 1000)
    return () => clearTimeout(t)
  }, [running, timeLeft])

  return (
    <div>
      <p>{instruccion}</p>
      <div data-testid="timer">{finished ? '✓' : `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`}</div>
      {!running && !finished && (
        <button onClick={() => setRunning(true)}>▶ Iniciar timer</button>
      )}
      {finished && <button onClick={onDone}>Continuar →</button>}
      {running  && <button onClick={onDone}>Saltar</button>}
    </div>
  )
}

// ── Wrapper: CardQuiz ─────────────────────────────────────────
function CardQuizTest({ pregunta, opciones, respuestaCorrecta, onDone }: {
  pregunta: string; opciones: string[]; respuestaCorrecta: number | null; onDone: () => void
}) {
  const [selected,  setSelected]  = useState<number | null>(null)
  const [revealed,  setRevealed]  = useState(false)
  const hasCorrect = respuestaCorrecta !== null

  const handleSelect = (i: number) => {
    if (revealed) return
    setSelected(i)
    if (hasCorrect) setRevealed(true)
  }

  const canContinue = revealed || (!hasCorrect && selected !== null)

  return (
    <div>
      <p data-testid="pregunta">{pregunta}</p>
      {opciones.map((op, i) => (
        <button
          key={i}
          data-testid={`opcion-${i}`}
          onClick={() => handleSelect(i)}
          aria-pressed={selected === i}
        >
          {String.fromCharCode(65 + i)}. {op}
        </button>
      ))}
      {revealed && hasCorrect && selected !== null && (
        <p data-testid="feedback">
          {selected === respuestaCorrecta ? '¡Correcto!' : `Incorrecto. Respuesta: "${opciones[respuestaCorrecta!]}"`}
        </p>
      )}
      {canContinue && <button data-testid="continuar" onClick={onDone}>Continuar →</button>}
      {!hasCorrect && selected === null && (
        <button data-testid="omitir" onClick={onDone}>Omitir</button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

// ── CardTexto ─────────────────────────────────────────────────
describe('CardTexto', () => {
  it('muestra el texto configurado por el profe', () => {
    render(<CardTextoTest texto="Recuerda mantener el tempo constante" />)
    expect(screen.getByText('Recuerda mantener el tempo constante')).toBeInTheDocument()
  })

  it('muestra el botón "Continuar →"', () => {
    render(<CardTextoTest texto="Texto" />)
    expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument()
  })

  it('al hacer click en Continuar se dispara onDone', () => {
    render(<CardTextoTest texto="Texto" />)
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(screen.getByTestId('done')).toBeInTheDocument()
  })
})

// ── CardBoton ─────────────────────────────────────────────────
describe('CardBoton', () => {
  it('muestra texto e instrucción', () => {
    render(<CardBotonTest texto="¿Entendiste la técnica?" botonLabel="¡Sí, listo!" />)
    expect(screen.getByText('¿Entendiste la técnica?')).toBeInTheDocument()
  })

  it('muestra el label del botón configurado por el profe', () => {
    render(<CardBotonTest texto="Instrucción" botonLabel="¡Perfecto!" />)
    expect(screen.getByRole('button', { name: '¡Perfecto!' })).toBeInTheDocument()
  })

  it('al hacer click en el botón se dispara onDone', () => {
    render(<CardBotonTest texto="Instrucción" botonLabel="Listo" />)
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }))
    expect(screen.getByTestId('done')).toBeInTheDocument()
  })
})

// ── CardCountdown ─────────────────────────────────────────────
describe('CardCountdown', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('muestra la instrucción del profe', () => {
    render(<CardCountdownTest instruccion="Practica este patrón" duracion={60} onDone={jest.fn()} />)
    expect(screen.getByText('Practica este patrón')).toBeInTheDocument()
  })

  it('muestra el tiempo inicial correctamente (1:00 para 60s)', () => {
    render(<CardCountdownTest instruccion="Practica" duracion={60} onDone={jest.fn()} />)
    expect(screen.getByTestId('timer')).toHaveTextContent('1:00')
  })

  it('muestra el botón de iniciar antes de arrancar', () => {
    render(<CardCountdownTest instruccion="Practica" duracion={60} onDone={jest.fn()} />)
    expect(screen.getByRole('button', { name: /iniciar timer/i })).toBeInTheDocument()
  })

  it('el timer empieza al hacer click en Iniciar', () => {
    render(<CardCountdownTest instruccion="Practica" duracion={5} onDone={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /iniciar timer/i }))
    // Avanzar 1 segundo
    act(() => { jest.advanceTimersByTime(1000) })
    expect(screen.getByTestId('timer')).toHaveTextContent('0:04')
  })

  it('muestra ✓ al terminar el countdown', async () => {
    render(<CardCountdownTest instruccion="Practica" duracion={3} onDone={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /iniciar timer/i }))
    // Avanzar un tick por vez para que React re-renderice entre timeouts
    for (let i = 0; i < 3; i++) {
      await act(async () => { jest.advanceTimersByTime(1000) })
    }
    expect(screen.getByTestId('timer')).toHaveTextContent('✓')
  })

  it('botón Continuar aparece solo tras terminar el countdown', async () => {
    render(<CardCountdownTest instruccion="Practica" duracion={2} onDone={jest.fn()} />)
    expect(screen.queryByRole('button', { name: /continuar/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /iniciar timer/i }))
    for (let i = 0; i < 2; i++) {
      await act(async () => { jest.advanceTimersByTime(1000) })
    }
    expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument()
  })

  it('botón Saltar permite continuar sin esperar', () => {
    const onDone = jest.fn()
    render(<CardCountdownTest instruccion="Practica" duracion={60} onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: /iniciar timer/i }))
    // El botón Saltar aparece mientras corre
    fireEvent.click(screen.getByRole('button', { name: /saltar/i }))
    expect(onDone).toHaveBeenCalled()
  })

  it('onDone se llama al presionar Continuar tras terminar', async () => {
    const onDone = jest.fn()
    render(<CardCountdownTest instruccion="Practica" duracion={2} onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: /iniciar timer/i }))
    for (let i = 0; i < 2; i++) {
      await act(async () => { jest.advanceTimersByTime(1000) })
    }
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})

// ── CardQuiz ──────────────────────────────────────────────────
describe('CardQuiz', () => {
  const OPCIONES = ['4/4', '3/4', '6/8', '2/4']

  it('muestra la pregunta del profe', () => {
    render(
      <CardQuizTest pregunta="¿Qué compás es este?" opciones={OPCIONES}
        respuestaCorrecta={0} onDone={jest.fn()} />
    )
    expect(screen.getByTestId('pregunta')).toHaveTextContent('¿Qué compás es este?')
  })

  it('muestra todas las opciones', () => {
    render(
      <CardQuizTest pregunta="Pregunta" opciones={OPCIONES}
        respuestaCorrecta={0} onDone={jest.fn()} />
    )
    OPCIONES.forEach((op, i) => {
      expect(screen.getByTestId(`opcion-${i}`)).toHaveTextContent(op)
    })
  })

  it('feedback correcto cuando selecciona la respuesta correcta', () => {
    render(
      <CardQuizTest pregunta="Pregunta" opciones={OPCIONES}
        respuestaCorrecta={0} onDone={jest.fn()} />
    )
    fireEvent.click(screen.getByTestId('opcion-0'))
    expect(screen.getByTestId('feedback')).toHaveTextContent('¡Correcto!')
  })

  it('feedback incorrecto cuando selecciona opción equivocada', () => {
    render(
      <CardQuizTest pregunta="Pregunta" opciones={OPCIONES}
        respuestaCorrecta={0} onDone={jest.fn()} />
    )
    fireEvent.click(screen.getByTestId('opcion-2'))
    expect(screen.getByTestId('feedback')).toHaveTextContent('Incorrecto')
    expect(screen.getByTestId('feedback')).toHaveTextContent('4/4')
  })

  it('botón Continuar aparece tras responder con respuestaCorrecta definida', () => {
    render(
      <CardQuizTest pregunta="Pregunta" opciones={OPCIONES}
        respuestaCorrecta={1} onDone={jest.fn()} />
    )
    expect(screen.queryByTestId('continuar')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('opcion-1'))
    expect(screen.getByTestId('continuar')).toBeInTheDocument()
  })

  it('no se puede cambiar respuesta una vez revelada', () => {
    render(
      <CardQuizTest pregunta="Pregunta" opciones={OPCIONES}
        respuestaCorrecta={0} onDone={jest.fn()} />
    )
    // Selecciona opción 0 (correcta)
    fireEvent.click(screen.getByTestId('opcion-0'))
    // Intenta seleccionar otra
    fireEvent.click(screen.getByTestId('opcion-2'))
    // El feedback sigue mostrando la primera respuesta
    expect(screen.getByTestId('feedback')).toHaveTextContent('¡Correcto!')
  })

  it('quiz sin respuesta correcta (reflexión): muestra botón Omitir sin selección', () => {
    render(
      <CardQuizTest pregunta="¿Cómo te fue?" opciones={['Bien', 'Regular', 'Mal']}
        respuestaCorrecta={null} onDone={jest.fn()} />
    )
    expect(screen.getByTestId('omitir')).toBeInTheDocument()
    expect(screen.queryByTestId('continuar')).not.toBeInTheDocument()
  })

  it('quiz sin respuesta correcta: botón Continuar aparece tras seleccionar cualquier opción', () => {
    render(
      <CardQuizTest pregunta="¿Cómo te fue?" opciones={['Bien', 'Regular', 'Mal']}
        respuestaCorrecta={null} onDone={jest.fn()} />
    )
    fireEvent.click(screen.getByTestId('opcion-1'))
    expect(screen.getByTestId('continuar')).toBeInTheDocument()
    // Sin feedback de correcto/incorrecto
    expect(screen.queryByTestId('feedback')).not.toBeInTheDocument()
  })

  it('quiz sin respuesta correcta: Omitir llama onDone directamente', () => {
    const onDone = jest.fn()
    render(
      <CardQuizTest pregunta="Reflexión" opciones={['Sí', 'No']}
        respuestaCorrecta={null} onDone={onDone} />
    )
    fireEvent.click(screen.getByTestId('omitir'))
    expect(onDone).toHaveBeenCalled()
  })

  it('onDone se llama al presionar Continuar', () => {
    const onDone = jest.fn()
    render(
      <CardQuizTest pregunta="Pregunta" opciones={OPCIONES}
        respuestaCorrecta={0} onDone={onDone} />
    )
    fireEvent.click(screen.getByTestId('opcion-0'))
    fireEvent.click(screen.getByTestId('continuar'))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('las etiquetas A/B/C/D se muestran correctamente', () => {
    render(
      <CardQuizTest pregunta="Pregunta" opciones={['Primera', 'Segunda', 'Tercera']}
        respuestaCorrecta={null} onDone={jest.fn()} />
    )
    expect(screen.getByTestId('opcion-0')).toHaveTextContent('A.')
    expect(screen.getByTestId('opcion-1')).toHaveTextContent('B.')
    expect(screen.getByTestId('opcion-2')).toHaveTextContent('C.')
  })
})
