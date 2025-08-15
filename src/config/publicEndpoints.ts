// List of public API endpoints that don't require authentication
export const PUBLIC_ENDPOINTS = [
  '/health',
  '/status',
  '/version',
  // Add more public endpoints as needed
]

export const isPublicEndpoint = (endpoint: string): boolean => {
  return PUBLIC_ENDPOINTS.some(publicEndpoint => 
    endpoint.startsWith(publicEndpoint)
  )
}