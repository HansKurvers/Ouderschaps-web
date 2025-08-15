import { ReactNode } from 'react'
import { vi } from 'vitest'

export interface MockAuth0User {
  sub: string
  name?: string
  email?: string
  picture?: string
  [key: string]: any
}

export interface MockAuth0ContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  user?: MockAuth0User
  error?: Error
  loginWithRedirect: (() => Promise<void>) | ReturnType<typeof vi.fn>
  logout: (() => void) | ReturnType<typeof vi.fn>
  getAccessTokenSilently: (() => Promise<string>) | ReturnType<typeof vi.fn>
  getIdTokenClaims: (() => Promise<any>) | ReturnType<typeof vi.fn>
}

export const createMockAuth0Context = (overrides?: Partial<MockAuth0ContextValue>): MockAuth0ContextValue => ({
  isAuthenticated: false,
  isLoading: false,
  user: undefined,
  error: undefined,
  loginWithRedirect: vi.fn(),
  logout: vi.fn(),
  getAccessTokenSilently: vi.fn().mockResolvedValue('mock-access-token'),
  getIdTokenClaims: vi.fn().mockResolvedValue({ sub: 'mock-user-id' }),
  ...overrides,
})

export const mockAuthenticatedUser: MockAuth0User = {
  sub: 'auth0|123456789',
  name: 'Test User',
  email: 'test@example.com',
  picture: 'https://example.com/picture.jpg',
}

export const MockAuth0Provider = ({ children }: { children: ReactNode; value?: Partial<MockAuth0ContextValue> }) => {
  return <>{children}</>
}