export interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'super_admin'
}

export interface AuthSession {
  user: AuthUser
  expiresAt?: Date
}

export interface SignInResult {
  success: boolean
  error?: string
  user?: AuthUser
}

export interface SignUpResult {
  success: boolean
  error?: string
  user?: AuthUser
}

export interface AuthAdapter {
  // Session management
  getSession(): Promise<AuthSession | null>

  // Authentication
  signIn(email: string, password: string): Promise<SignInResult>
  signOut(): Promise<void>

  // User management
  createUser(email: string, password: string, role?: 'admin' | 'super_admin'): Promise<SignUpResult>
  getCurrentUser(): Promise<AuthUser | null>

  // Admin count (for initial setup)
  getAdminCount(): Promise<number>
}
