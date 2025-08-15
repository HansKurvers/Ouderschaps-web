import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initializeAuth } from './authInitializer'
import { initializeAuthService } from '../services/auth.service'
import { useAuth0 } from '@auth0/auth0-react'

vi.mock('@auth0/auth0-react')
vi.mock('../services/auth.service')

describe('authInitializer', () => {
  const mockUseAuth0 = vi.mocked(useAuth0)
  const mockInitializeAuthService = vi.mocked(initializeAuthService)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize auth service with Auth0 client', () => {
    const mockAuth0Client = {
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
      getAccessTokenSilently: vi.fn(),
      getUser: vi.fn(),
      isAuthenticated: vi.fn(),
    }

    mockUseAuth0.mockReturnValue(mockAuth0Client as any)

    initializeAuth()

    expect(mockInitializeAuthService).toHaveBeenCalledWith(mockAuth0Client)
  })

  it('should return the auth service instance', () => {
    const mockAuth0Client = {
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
      getAccessTokenSilently: vi.fn(),
      getUser: vi.fn(),
      isAuthenticated: vi.fn(),
    }

    const mockAuthService = { 
      login: vi.fn(),
      logout: vi.fn(),
      getAccessToken: vi.fn(),
      getUserId: vi.fn(),
      isAuthenticated: vi.fn(),
      getUser: vi.fn(),
    }

    mockUseAuth0.mockReturnValue(mockAuth0Client as any)
    mockInitializeAuthService.mockReturnValue(mockAuthService as any)

    const result = initializeAuth()

    expect(result).toBe(mockAuthService)
  })

  it('should handle Auth0 not being ready', () => {
    mockUseAuth0.mockReturnValue({
      isLoading: true,
      loginWithRedirect: undefined,
      logout: undefined,
      getAccessTokenSilently: undefined,
      getUser: undefined,
      isAuthenticated: undefined,
    } as any)

    const result = initializeAuth()

    expect(mockInitializeAuthService).not.toHaveBeenCalled()
    expect(result).toBeNull()
  })
})