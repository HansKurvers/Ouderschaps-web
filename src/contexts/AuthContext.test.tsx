import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('@auth0/auth0-react')

describe('AuthContext', () => {
  const mockUseAuth0 = vi.mocked(useAuth0)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      mockUseAuth0.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: undefined,
        loginWithRedirect: vi.fn(),
        logout: vi.fn(),
        getAccessTokenSilently: vi.fn(),
      } as any)

      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')
    })

    it('should provide auth state when authenticated', async () => {
      const mockUser = {
        sub: 'auth0|123456',
        email: 'test@example.com',
        name: 'Test User',
      }

      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: mockUser,
        loginWithRedirect: vi.fn(),
        logout: vi.fn(),
        getAccessTokenSilently: vi.fn().mockResolvedValue('mock-token'),
      } as any)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.userId).toBe('auth0|123456')
    })

    it('should provide auth state when not authenticated', () => {
      mockUseAuth0.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: undefined,
        loginWithRedirect: vi.fn(),
        logout: vi.fn(),
        getAccessTokenSilently: vi.fn(),
      } as any)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeUndefined()
      expect(result.current.userId).toBeNull()
    })

    it('should handle loading state', () => {
      mockUseAuth0.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: undefined,
        loginWithRedirect: vi.fn(),
        logout: vi.fn(),
        getAccessTokenSilently: vi.fn(),
      } as any)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should call loginWithRedirect', async () => {
      const mockLoginWithRedirect = vi.fn()
      
      mockUseAuth0.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: undefined,
        loginWithRedirect: mockLoginWithRedirect,
        logout: vi.fn(),
        getAccessTokenSilently: vi.fn(),
      } as any)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      await result.current.login()

      expect(mockLoginWithRedirect).toHaveBeenCalledWith({
        appState: { returnTo: window.location.pathname }
      })
    })

    it('should call logout with correct parameters', () => {
      const mockLogout = vi.fn()
      
      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { sub: 'auth0|123' },
        loginWithRedirect: vi.fn(),
        logout: mockLogout,
        getAccessTokenSilently: vi.fn(),
      } as any)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      result.current.logout()

      expect(mockLogout).toHaveBeenCalledWith({
        logoutParams: {
          returnTo: window.location.origin
        }
      })
    })

    it('should get access token', async () => {
      const mockGetAccessTokenSilently = vi.fn().mockResolvedValue('mock-access-token')
      
      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { sub: 'auth0|123' },
        loginWithRedirect: vi.fn(),
        logout: vi.fn(),
        getAccessTokenSilently: mockGetAccessTokenSilently,
      } as any)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      const token = await result.current.getAccessToken()

      expect(token).toBe('mock-access-token')
      expect(mockGetAccessTokenSilently).toHaveBeenCalled()
    })

    it('should handle error when getting access token', async () => {
      const mockError = new Error('Failed to get token')
      const mockGetAccessTokenSilently = vi.fn().mockRejectedValue(mockError)
      
      mockUseAuth0.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { sub: 'auth0|123' },
        loginWithRedirect: vi.fn(),
        logout: vi.fn(),
        getAccessTokenSilently: mockGetAccessTokenSilently,
      } as any)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      await expect(result.current.getAccessToken()).rejects.toThrow('Failed to get token')
    })
  })
})