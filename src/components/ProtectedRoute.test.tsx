import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../test/test-utils'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'

vi.mock('../contexts/AuthContext')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: vi.fn(() => null),
  }
})

describe('ProtectedRoute', () => {
  const mockUseAuth = vi.mocked(useAuth)
  const mockNavigate = vi.mocked(Navigate)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { sub: 'auth0|123', email: 'test@example.com' },
      userId: 'auth0|123',
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('should show loading state while checking authentication', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: undefined,
      userId: null,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText(/Laden/i)).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: undefined,
      userId: null,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    })

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(mockNavigate).toHaveBeenCalledTimes(1)
    const callArgs = mockNavigate.mock.calls[0][0]
    expect(callArgs.to).toBe('/login')
    expect(callArgs.state).toHaveProperty('from')
    expect(callArgs.replace).toBe(true)
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should pass through additional props to children', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { sub: 'auth0|123', email: 'test@example.com' },
      userId: 'auth0|123',
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    })

    const TestComponent = ({ testProp }: { testProp: string }) => (
      <div>{testProp}</div>
    )

    render(
      <ProtectedRoute>
        <TestComponent testProp="Test Value" />
      </ProtectedRoute>
    )

    expect(screen.getByText('Test Value')).toBeInTheDocument()
  })

  it('should handle custom loading component', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: undefined,
      userId: null,
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
    })

    const CustomLoader = () => <div>Custom Loading...</div>

    render(
      <ProtectedRoute loadingComponent={<CustomLoader />}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Custom Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })
})