const API_URL = import.meta.env.VITE_API_URL || 'https://ouderschaps-api-fvgbfwachxabawgs.westeurope-01.azurewebsites.net'

// Hardcoded user ID voor nu
const USER_ID = '1'

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | undefined>
}

class ApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = API_URL
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options
    
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

    // Add default headers
    const headers = new Headers(fetchOptions.headers || {})
    // Alleen Content-Type toevoegen voor POST/PUT requests
    if (fetchOptions.method && ['POST', 'PUT'].includes(fetchOptions.method)) {
      headers.set('Content-Type', 'application/json')
    }
    headers.set('x-user-id', USER_ID) //TODO update when auth is implemented

    try {
      const response = await fetch(url.toString(), {
        ...fetchOptions,
        headers,
      })

      const responseData = await response.json()
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(responseData)}`)
      }

      // Als de response een success field heeft, check deze
      if ('success' in responseData && !responseData.success) {
        throw new Error(responseData.error || 'API request failed')
      }

      // Return de data direct of de hele response
      return responseData.data !== undefined ? responseData.data : responseData
    } catch (error) {
      console.error('API Request failed:', error)
      throw error
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
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