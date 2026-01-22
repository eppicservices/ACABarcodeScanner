import type { AuthAdapter } from './types'
import { nextAuthAdapter } from './nextauth-adapter'

// Export the NextAuth adapter directly
export const auth: AuthAdapter = nextAuthAdapter

// For cases where we need the actual adapter instance
export function getAuthAdapter(): AuthAdapter {
  return nextAuthAdapter
}

// Re-export types
export type { AuthAdapter, AuthSession, AuthUser, SignInResult, SignUpResult } from './types'

// Always using NextAuth
export const isNextAuth = true
