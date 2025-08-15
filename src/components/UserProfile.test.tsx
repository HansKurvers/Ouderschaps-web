import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '../test/test-utils'
import { UserProfile } from './UserProfile'
import { useAuth } from '../contexts/AuthContext'

vi.mock('../contexts/AuthContext')

describe('UserProfile', () => {
  const mockLogout = vi.fn()
  const mockUseAuth = vi.mocked(useAuth)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display user information when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        sub: 'auth0|123456',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg'
      },
      userId: 'auth0|123456',
      login: vi.fn(),
      logout: mockLogout,
      getAccessToken: vi.fn(),
    })

    render(<UserProfile />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('should display initials when no picture is available', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        sub: 'auth0|123456',
        email: 'test@example.com',
        name: 'Test User'
      },
      userId: 'auth0|123456',
      login: vi.fn(),
      logout: mockLogout,
      getAccessToken: vi.fn(),
    })

    render(<UserProfile />)

    expect(screen.getByText('TU')).toBeInTheDocument()
  })

  it('should display email as fallback when name is not available', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        sub: 'auth0|123456',
        email: 'test@example.com'
      },
      userId: 'auth0|123456',
      login: vi.fn(),
      logout: mockLogout,
      getAccessToken: vi.fn(),
    })

    render(<UserProfile />)

    expect(screen.getAllByText('test@example.com')).toHaveLength(2)
  })

  it('should call logout when logout button is clicked', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        sub: 'auth0|123456',
        email: 'test@example.com',
        name: 'Test User'
      },
      userId: 'auth0|123456',
      login: vi.fn(),
      logout: mockLogout,
      getAccessToken: vi.fn(),
    })

    render(<UserProfile />)

    const logoutButton = screen.getByRole('button', { name: /Uitloggen/i })
    fireEvent.click(logoutButton)

    expect(mockLogout).toHaveBeenCalled()
  })

  it('should not render when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: undefined,
      userId: null,
      login: vi.fn(),
      logout: mockLogout,
      getAccessToken: vi.fn(),
    })

    const { container } = render(<UserProfile />)

    // Check that the component renders nothing (empty or only style tags)
    const childNodes = Array.from(container.childNodes).filter(
      node => node.nodeName !== 'STYLE'
    )
    expect(childNodes).toHaveLength(0)
  })

  it('should handle compact mode', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        sub: 'auth0|123456',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg'
      },
      userId: 'auth0|123456',
      login: vi.fn(),
      logout: mockLogout,
      getAccessToken: vi.fn(),
    })

    render(<UserProfile compact />)

    // In compact mode, only avatar and name should be visible initially
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument()
  })

  it('should generate correct initials for different name formats', () => {
    const testCases = [
      { name: 'John Doe', expectedInitials: 'JD' },
      { name: 'Alice', expectedInitials: 'A' },
      { name: 'Bob Charlie David', expectedInitials: 'BC' },
      { name: undefined, email: 'test@example.com', expectedInitials: 'T' }
    ]

    testCases.forEach(({ name, email, expectedInitials }) => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: {
          sub: 'auth0|123456',
          email: email || 'default@example.com',
          name
        },
        userId: 'auth0|123456',
        login: vi.fn(),
        logout: mockLogout,
        getAccessToken: vi.fn(),
      })

      const { unmount } = render(<UserProfile />)
      expect(screen.getByText(expectedInitials)).toBeInTheDocument()
      unmount()
    })
  })
})