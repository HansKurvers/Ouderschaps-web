import { User } from '@auth0/auth0-react'

export interface IAuthService {
  login(returnPath?: string): Promise<void>
  logout(returnTo?: string): void
  getAccessToken(options?: any): Promise<string>
  getUserId(): Promise<string | null>
  isAuthenticated(): Promise<boolean>
  getUser(): Promise<User | undefined>
}

export interface IAuth0Client {
  loginWithRedirect(options?: any): Promise<void>
  logout(options?: any): void
  getAccessTokenSilently(options?: any): Promise<string>
  getUser?(): Promise<User | undefined>
  user?: User
  isAuthenticated: (() => Promise<boolean>) | boolean
}

export class AuthService implements IAuthService {
  constructor(private auth0Client: IAuth0Client) {}

  async login(returnPath?: string): Promise<void> {
    await this.auth0Client.loginWithRedirect({
      appState: { returnTo: returnPath || window.location.pathname }
    })
  }

  logout(returnTo?: string): void {
    this.auth0Client.logout({
      logoutParams: {
        returnTo: returnTo || window.location.origin
      }
    })
  }

  async getAccessToken(options?: any): Promise<string> {
    return await this.auth0Client.getAccessTokenSilently(options)
  }

  async getUserId(): Promise<string | null> {
    if (this.auth0Client.getUser) {
      const user = await this.auth0Client.getUser()
      return user?.sub || null
    }
    return this.auth0Client.user?.sub || null
  }

  async isAuthenticated(): Promise<boolean> {
    const auth = this.auth0Client.isAuthenticated
    if (typeof auth === 'boolean') {
      return auth
    }
    return await auth()
  }

  async getUser(): Promise<User | undefined> {
    if (this.auth0Client.getUser) {
      return await this.auth0Client.getUser()
    }
    return this.auth0Client.user
  }
}

let authServiceInstance: AuthService | null = null

export const initializeAuthService = (auth0Client: IAuth0Client): AuthService => {
  authServiceInstance = new AuthService(auth0Client)
  return authServiceInstance
}

export const getAuthService = (): AuthService => {
  if (!authServiceInstance) {
    throw new Error('AuthService not initialized. Call initializeAuthService first.')
  }
  return authServiceInstance
}