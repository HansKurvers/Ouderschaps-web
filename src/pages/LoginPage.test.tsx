import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '../test/test-utils'
import { LoginPage } from './LoginPage'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

vi.mock('../contexts/AuthContext')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

describe('LoginPage', () => {
  const mockLogin = vi.fn()
  const mockNavigate = vi.fn()
  const mockUseAuth = vi.mocked(useAuth)
  const mockUseNavigate = vi.mocked(useNavigate)

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseNavigate.mockReturnValue(mockNavigate)
  })

  it('should render login page when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: undefined,
      userId: null,
      login: mockLogin,
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    })

    render(<LoginPage />)

    expect(screen.getByText(/Welkom bij Ouderschaps/i)).toBeInTheDocument()
    expect(screen.getByText(/Inloggen/i)).toBeInTheDocument()
    expect(screen.getByText(/veilig in te loggen/i)).toBeInTheDocument()
  })

  it('should show loading state while checking authentication', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: undefined,
      userId: null,
      login: mockLogin,
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    })

    render(<LoginPage />)

    expect(screen.getByText(/Authenticatie controleren/i)).toBeInTheDocument()
  })

  it('should redirect to home when already authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { sub: 'auth0|123', email: 'test@example.com' },
      userId: 'auth0|123',
      login: mockLogin,
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    })

    render(<LoginPage />)

    expect(mockNavigate).toHaveBeenCalledWith('/dossiers', { replace: true })
  })

  it('should call login when login button is clicked', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: undefined,
      userId: null,
      login: mockLogin,
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    })

    render(<LoginPage />)

    const loginButton = screen.getByRole('button', { name: /Inloggen/i })
    fireEvent.click(loginButton)

    expect(mockLogin).toHaveBeenCalled()
  })

  it('should display features list', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: undefined,
      userId: null,
      login: mockLogin,
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    })

    render(<LoginPage />)

    expect(screen.getByText(/Beheer uw dossiers/i)).toBeInTheDocument()
    expect(screen.getByText(/contactpersonen/i)).toBeInTheDocument()
    expect(screen.getByText(/Genereer en beheer documenten/i)).toBeInTheDocument()
  })
})