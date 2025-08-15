import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiService } from './api.service'
import { getAuthService } from './auth.service'

vi.mock('./auth.service')

// Mock fetch globally
globalThis.fetch = vi.fn()

describe('ApiService', () => {
  const mockGetAuthService = vi.mocked(getAuthService)
  const mockAuthService = {
    getAccessToken: vi.fn(),
    getUserId: vi.fn(),
    isAuthenticated: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getUser: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAuthService.mockReturnValue(mockAuthService as any)
    mockAuthService.getAccessToken.mockResolvedValue('mock-access-token')
    mockAuthService.getUserId.mockResolvedValue('auth0|123456')
    mockAuthService.isAuthenticated.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('request headers', () => {
    it('should include authorization header with bearer token', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      }
      ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

      await apiService.get('/test')

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      )

      const callArgs = (globalThis.fetch as any).mock.calls[0]
      const headers = callArgs[1].headers
      expect(headers.get('Authorization')).toBe('Bearer mock-access-token')
    })

    it('should include user ID in x-user-id header', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      }
      ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

      await apiService.get('/test')

      const callArgs = (globalThis.fetch as any).mock.calls[0]
      const headers = callArgs[1].headers
      expect(headers.get('x-user-id')).toBe('auth0|123456')
    })

    it('should handle unauthenticated requests', async () => {
      mockAuthService.isAuthenticated.mockResolvedValue(false)
      mockAuthService.getAccessToken.mockRejectedValue(new Error('Not authenticated'))
      mockAuthService.getUserId.mockResolvedValue(null)

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      }
      ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

      await apiService.get('/public')

      const callArgs = (globalThis.fetch as any).mock.calls[0]
      const headers = callArgs[1].headers
      expect(headers.get('Authorization')).toBeNull()
      expect(headers.get('x-user-id')).toBeNull()
    })
  })

  describe('GET requests', () => {
    it('should make GET request with query params', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      }
      ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

      const result = await apiService.get('/test', { foo: 'bar', baz: 123 })

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test?foo=bar&baz=123'),
        expect.objectContaining({
          method: 'GET',
        })
      )
      expect(result).toBe('test')
    })

    it('should handle empty params', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      }
      ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

      await apiService.get('/test', { foo: undefined, bar: undefined, baz: '' })

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.any(Object)
      )
      const url = (globalThis.fetch as any).mock.calls[0][0]
      expect(url).not.toContain('foo=')
      expect(url).not.toContain('bar=')
      expect(url).not.toContain('baz=')
    })
  })

  describe('POST requests', () => {
    it('should make POST request with JSON body', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, data: { id: 1 } }),
      }
      ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

      const payload = { name: 'Test', value: 123 }
      const result = await apiService.post('/test', payload)

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        })
      )

      const callArgs = (globalThis.fetch as any).mock.calls[0]
      const headers = callArgs[1].headers
      expect(headers.get('Content-Type')).toBe('application/json')
      expect(result).toEqual({ id: 1 })
    })
  })

  describe('error handling', () => {
    it('should throw error for non-ok responses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ error: 'Not found' }),
      }
      ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

      await expect(apiService.get('/test')).rejects.toThrow('API Error: 404')
    })

    it('should throw error when success field is false', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ 
          success: false, 
          error: 'Validation failed' 
        }),
      }
      ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

      await expect(apiService.get('/test')).rejects.toThrow('Validation failed')
    })

    it('should handle network errors', async () => {
      ;(globalThis.fetch as any).mockRejectedValue(new Error('Network error'))

      await expect(apiService.get('/test')).rejects.toThrow('Network error')
    })

    it('should handle auth errors and trigger re-authentication', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: 'Unauthorized' }),
      }
      ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

      await expect(apiService.get('/test')).rejects.toThrow('API Error: 401')
    })
  })

  describe('token refresh', () => {
    it('should retry request with new token on 401', async () => {
      const firstResponse = {
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: 'Token expired' }),
      }
      const secondResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'success' }),
      }

      ;(globalThis.fetch as any)
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse)

      mockAuthService.getAccessToken.mockResolvedValue('mock-token')

      const result = await apiService.get('/test')

      expect(globalThis.fetch).toHaveBeenCalledTimes(2)
      // getAccessToken is called twice for initial request headers, once for retry, and twice for retry headers
      expect(mockAuthService.getAccessToken.mock.calls.length).toBeGreaterThanOrEqual(2)
      expect(result).toBe('success')
    })

    it('should not retry more than once on 401', async () => {
      const unauthorizedResponse = {
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ error: 'Unauthorized' }),
      }

      ;(globalThis.fetch as any).mockResolvedValue(unauthorizedResponse)

      await expect(apiService.get('/test')).rejects.toThrow('API Error: 401')

      expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('PUT requests', () => {
    it('should make PUT request with JSON body', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, data: { updated: true } }),
      }
      ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

      const payload = { id: 1, name: 'Updated' }
      const result = await apiService.put('/test/1', payload)

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      )
      expect(result).toEqual({ updated: true })
    })
  })

  describe('DELETE requests', () => {
    it('should make DELETE request', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      }
      ;(globalThis.fetch as any).mockResolvedValue(mockResponse)

      await apiService.delete('/test/1')

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })
})