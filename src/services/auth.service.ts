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
  getUser(): Promise<User | undefined>
  isAuthenticated(): Promise<boolean>
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
    const user = await this.auth0Client.getUser()
    return user?.sub || null
  }

  async isAuthenticated(): Promise<boolean> {
    return await this.auth0Client.isAuthenticated()
  }

  async getUser(): Promise<User | undefined> {
    return await this.auth0Client.getUser()
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