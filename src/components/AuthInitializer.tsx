import { useEffect } from 'react'
import { initializeAuth } from '../utils/authInitializer'

export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const authService = initializeAuth()
    if (authService) {
      console.debug('Auth service initialized')
    }
  }, [])

  return <>{children}</>
}