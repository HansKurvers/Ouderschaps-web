import { createContext, useContext, ReactNode, useMemo, useEffect } from 'react'
import { useAuth0, User } from '@auth0/auth0-react'
import { initializeAuthService } from '../services/auth.service'

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | undefined
  userId: string | null
  login: () => Promise<void>
  logout: () => void
  getAccessToken: () => Promise<string>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const auth0 = useAuth0()
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = auth0

  // Initialize auth service when Auth0 is ready
  useEffect(() => {
    if (!isLoading) {
      try {
        initializeAuthService(auth0)
        console.debug('Auth service initialized')
      } catch (error) {
        console.error('Failed to initialize auth service:', error)
      }
    }
  }, [isLoading, auth0])

  const userId = useMemo(() => {
    return user?.sub || null
  }, [user])

  const login = async () => {
    await loginWithRedirect({
      appState: { returnTo: window.location.pathname }
    })
  }

  const logout = () => {
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    })
  }

  const getAccessToken = async (): Promise<string> => {
    return await getAccessTokenSilently()
  }

  const value: AuthContextValue = {
    isAuthenticated,
    isLoading,
    user,
    userId,
    login,
    logout,
    getAccessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}