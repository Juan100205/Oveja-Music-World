import { render, screen, fireEvent } from '@testing-library/react'
import ZoneCard from '@/components/school/ZoneCard'
import type { Zone } from '@/types'

const zone: Zone = {
  id: 'piano',
  nombre: 'Sala de Piano',
  nivel_requerido: 1,
  spline_object_id: 'piano_room',
  descripcion: 'Aprende piano desde cero',
}

const lockedZone: Zone = {
  id: 'jazz',
  nombre: 'Sala de Jazz',
  nivel_requerido: 3,
  spline_object_id: 'jazz_room',
}

describe('ZoneCard', () => {
  it('muestra nombre y descripción de la zona', () => {
    render(<ZoneCard zone={zone} nivelUsuario={1} onClick={jest.fn()} />)
    expect(screen.getByText('Sala de Piano')).toBeInTheDocument()
    expect(screen.getByText('Aprende piano desde cero')).toBeInTheDocument()
  })

  it('llama onClick al hacer click en zona accesible', () => {
    const onClick = jest.fn()
    render(<ZoneCard zone={zone} nivelUsuario={1} onClick={onClick} />)
    fireEvent.click(screen.getByTestId('zone-card-piano'))
    expect(onClick).toHaveBeenCalledWith(zone)
  })

  it('no llama onClick en zona bloqueada', () => {
    const onClick = jest.fn()
    render(<ZoneCard zone={lockedZone} nivelUsuario={1} onClick={onClick} />)
    fireEvent.click(screen.getByTestId('zone-card-jazz'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('muestra mensaje de bloqueo con nivel requerido', () => {
    render(<ZoneCard zone={lockedZone} nivelUsuario={1} onClick={jest.fn()} />)
    expect(screen.getByText(/Requiere nivel 3/i)).toBeInTheDocument()
  })

  it('muestra disponible cuando el nivel alcanza', () => {
    render(<ZoneCard zone={lockedZone} nivelUsuario={3} onClick={jest.fn()} />)
    expect(screen.getByText(/Disponible/i)).toBeInTheDocument()
  })
})
