import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let authService: AuthService
  let mockAuth0Client: any

  beforeEach(() => {
    mockAuth0Client = {
      isAuthenticated: vi.fn(),
      loginWithRedirect: vi.fn(),
      logout: vi.fn(),
      getAccessTokenSilently: vi.fn(),
      getUser: vi.fn(),
    }
    
    authService = new AuthService(mockAuth0Client)
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should call loginWithRedirect with correct options', async () => {
      await authService.login()

      expect(mockAuth0Client.loginWithRedirect).toHaveBeenCalledWith({
        appState: { returnTo: window.location.pathname }
      })
    })

    it('should handle login with custom return path', async () => {
      await authService.login('/custom-path')

      expect(mockAuth0Client.loginWithRedirect).toHaveBeenCalledWith({
        appState: { returnTo: '/custom-path' }
      })
    })

    it('should handle login errors', async () => {
      const error = new Error('Login failed')
      mockAuth0Client.loginWithRedirect.mockRejectedValue(error)

      await expect(authService.login()).rejects.toThrow('Login failed')
    })
  })

  describe('logout', () => {
    it('should call logout with correct options', () => {
      authService.logout()

      expect(mockAuth0Client.logout).toHaveBeenCalledWith({
        logoutParams: {
          returnTo: window.location.origin
        }
      })
    })

    it('should handle custom return URL on logout', () => {
      authService.logout('https://custom.example.com')

      expect(mockAuth0Client.logout).toHaveBeenCalledWith({
        logoutParams: {
          returnTo: 'https://custom.example.com'
        }
      })
    })
  })

  describe('getAccessToken', () => {
    it('should return access token', async () => {
      mockAuth0Client.getAccessTokenSilently.mockResolvedValue('mock-token-123')

      const token = await authService.getAccessToken()

      expect(token).toBe('mock-token-123')
      expect(mockAuth0Client.getAccessTokenSilently).toHaveBeenCalled()
    })

    it('should pass options to getAccessTokenSilently', async () => {
      const options = { audience: 'https://api.example.com' }
      mockAuth0Client.getAccessTokenSilently.mockResolvedValue('mock-token')

      await authService.getAccessToken(options)

      expect(mockAuth0Client.getAccessTokenSilently).toHaveBeenCalledWith(options)
    })

    it('should handle token retrieval errors', async () => {
      const error = new Error('Token retrieval failed')
      mockAuth0Client.getAccessTokenSilently.mockRejectedValue(error)

      await expect(authService.getAccessToken()).rejects.toThrow('Token retrieval failed')
    })
  })

  describe('getUserId', () => {
    it('should return user ID when user is authenticated', async () => {
      const mockUser = { sub: 'auth0|123456' }
      mockAuth0Client.getUser.mockResolvedValue(mockUser)

      const userId = await authService.getUserId()

      expect(userId).toBe('auth0|123456')
    })

    it('should return null when no user is authenticated', async () => {
      mockAuth0Client.getUser.mockResolvedValue(undefined)

      const userId = await authService.getUserId()

      expect(userId).toBeNull()
    })

    it('should handle errors when getting user', async () => {
      const error = new Error('Failed to get user')
      mockAuth0Client.getUser.mockRejectedValue(error)

      await expect(authService.getUserId()).rejects.toThrow('Failed to get user')
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', async () => {
      mockAuth0Client.isAuthenticated.mockResolvedValue(true)

      const isAuth = await authService.isAuthenticated()

      expect(isAuth).toBe(true)
    })

    it('should return false when user is not authenticated', async () => {
      mockAuth0Client.isAuthenticated.mockResolvedValue(false)

      const isAuth = await authService.isAuthenticated()

      expect(isAuth).toBe(false)
    })
  })

  describe('getUser', () => {
    it('should return user object when authenticated', async () => {
      const mockUser = { 
        sub: 'auth0|123456',
        email: 'test@example.com',
        name: 'Test User'
      }
      mockAuth0Client.getUser.mockResolvedValue(mockUser)

      const user = await authService.getUser()

      expect(user).toEqual(mockUser)
    })

    it('should return undefined when not authenticated', async () => {
      mockAuth0Client.getUser.mockResolvedValue(undefined)

      const user = await authService.getUser()

      expect(user).toBeUndefined()
    })
  })
})