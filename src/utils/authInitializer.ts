import { useAuth0 } from '@auth0/auth0-react'
import { initializeAuthService, AuthService } from '../services/auth.service'

export const initializeAuth = (): AuthService | null => {
  const auth0 = useAuth0()
  
  // Don't initialize if Auth0 is still loading
  if (auth0.isLoading) {
    return null
  }

  // Initialize the auth service with Auth0 client
  return initializeAuthService(auth0)
}