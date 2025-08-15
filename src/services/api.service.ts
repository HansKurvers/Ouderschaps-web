import { getAuthService } from './auth.service'

const API_URL = import.meta.env.VITE_API_URL || 'https://ouderschaps-api-fvgbfwachxabawgs.westeurope-01.azurewebsites.net'

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
  skipAuth?: boolean
}

export class ApiService {
  private baseUrl: string
  private isRetrying: boolean = false

  constructor() {
    this.baseUrl = API_URL
  }

  private async getAuthHeaders(): Promise<Headers> {
    const headers = new Headers()
    
    try {
      const authService = getAuthService()
      const isAuthenticated = await authService.isAuthenticated()
      
      if (isAuthenticated) {
        const [accessToken, userId] = await Promise.all([
          authService.getAccessToken(),
          authService.getUserId()
        ])
        
        if (accessToken) {
          headers.set('Authorization', `Bearer ${accessToken}`)
        }
        
        if (userId) {
          headers.set('x-user-id', userId)
        }
      }
    } catch (error: any) {
      // If auth service is not initialized or user is not authenticated,
      // continue without auth headers (for public endpoints)
      if (error.message?.includes('not initialized')) {
        console.debug('Auth service not yet initialized, proceeding without auth headers')
      } else {
        console.debug('Auth headers not available:', error)
      }
    }
    
    return headers
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, skipAuth = false, ...fetchOptions } = options
    
    // Build URL with query params
    const url = new URL(`${this.baseUrl}${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        // Skip undefined or null values
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })
    }

    // Get auth headers if not skipped
    const headers = skipAuth ? new Headers() : await this.getAuthHeaders()
    
    // Add any existing headers from options
    if (fetchOptions.headers) {
      const existingHeaders = new Headers(fetchOptions.headers)
      existingHeaders.forEach((value, key) => {
        headers.set(key, value)
      })
    }
    
    // Add Content-Type for POST/PUT requests
    if (fetchOptions.method && ['POST', 'PUT'].includes(fetchOptions.method)) {
      headers.set('Content-Type', 'application/json')
    }

    try {
      const response = await fetch(url.toString(), {
        ...fetchOptions,
        headers,
      })

      // Handle 401 Unauthorized - try to refresh token once
      if (response.status === 401 && !this.isRetrying && !skipAuth) {
        this.isRetrying = true
        try {
          // Try to get a fresh token
          const authService = getAuthService()
          await authService.getAccessToken()
          
          // Retry the request with new token
          const result = await this.request<T>(endpoint, options)
          this.isRetrying = false
          return result
        } catch (error) {
          this.isRetrying = false
          throw error
        }
      }

      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(responseData)}`)
      }

      // Check for success field in response
      if ('success' in responseData && !responseData.success) {
        throw new Error(responseData.error || 'API request failed')
      }

      // Return the data directly or the whole response
      return responseData.data !== undefined ? responseData.data : responseData
    } catch (error) {
      console.error('API Request failed:', error)
      throw error
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params })
  }

  // POST request
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // PUT request
  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiService = new ApiService()