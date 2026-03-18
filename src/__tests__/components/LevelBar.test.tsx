import { render, screen } from '@testing-library/react'
import LevelBar from '@/components/school/LevelBar'

describe('LevelBar', () => {
  it('muestra nivel 1 con 0 puntos', () => {
    render(<LevelBar puntos={0} />)
    expect(screen.getByText(/Nivel 1/i)).toBeInTheDocument()
    expect(screen.getByText(/Principiante/i)).toBeInTheDocument()
  })

  it('muestra nivel 2 con 100 puntos', () => {
    render(<LevelBar puntos={100} />)
    expect(screen.getByText(/Nivel 2/i)).toBeInTheDocument()
    expect(screen.getByText(/Aprendiz/i)).toBeInTheDocument()
  })

  it('la barra de progreso tiene el valor correcto', () => {
    render(<LevelBar puntos={50} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '50')
  })

  it('muestra puntos faltantes cuando no es nivel máximo', () => {
    render(<LevelBar puntos={0} />)
    expect(screen.getByText(/100 puntos para el siguiente nivel/i)).toBeInTheDocument()
  })

  it('no muestra faltantes en nivel máximo', () => {
    render(<LevelBar puntos={1000} />)
    expect(screen.queryByText(/puntos para el siguiente nivel/i)).not.toBeInTheDocument()
  })
})
