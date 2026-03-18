import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from '@/components/auth/LoginForm'

const mockOnSubmit = jest.fn().mockResolvedValue(true)

beforeEach(() => {
  mockOnSubmit.mockClear()
})

describe('LoginForm', () => {
  it('renderiza campos de email y password', () => {
    render(<LoginForm onSubmit={mockOnSubmit} />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument()
  })

  it('muestra error si email inválido', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />)
    await userEvent.type(screen.getByLabelText(/email/i), 'no-es-email')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'secret123')
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Email inválido')
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('muestra error si password muy corto', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />)
    await userEvent.type(screen.getByLabelText(/email/i), 'juan@test.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), '123')
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('al menos 6 caracteres')
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('llama onSubmit con credenciales válidas', async () => {
    render(<LoginForm onSubmit={mockOnSubmit} />)
    await userEvent.type(screen.getByLabelText(/email/i), 'juan@test.com')
    await userEvent.type(screen.getByLabelText(/contraseña/i), 'secret123')
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }))
    await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'juan@test.com',
      password: 'secret123',
    }))
  })

  it('muestra error del servidor', () => {
    render(<LoginForm onSubmit={mockOnSubmit} serverError="Credenciales inválidas" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Credenciales inválidas')
  })

  it('deshabilita el botón cuando loading=true', () => {
    render(<LoginForm onSubmit={mockOnSubmit} loading={true} />)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button')).toHaveTextContent('Ingresando...')
  })
})
