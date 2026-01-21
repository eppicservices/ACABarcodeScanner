import type { AuthAdapter } from './types'

// Determine which auth provider to use
const provider = process.env.AUTH_PROVIDER || 'supabase'

// Lazy-load the appropriate adapter
let _adapter: AuthAdapter | null = null

async function getAuthAdapter(): Promise<AuthAdapter> {
  if (_adapter) return _adapter

  if (provider === 'nextauth') {
    const { nextAuthAdapter } = await import('./nextauth-adapter')
    _adapter = nextAuthAdapter
  } else {
    const { supabaseAuthAdapter } = await import('./supabase-adapter')
    _adapter = supabaseAuthAdapter
  }

  return _adapter
}

// Export a proxy that lazily loads the adapter
export const auth: AuthAdapter = new Proxy({} as AuthAdapter, {
  get(_target, prop: keyof AuthAdapter) {
    return async (...args: unknown[]) => {
      const adapter = await getAuthAdapter()
      const method = adapter[prop]
      if (typeof method === 'function') {
        return (method as (...args: unknown[]) => unknown).apply(adapter, args)
      }
      return method
    }
  }
})

// For cases where we need the actual adapter instance
export { getAuthAdapter }

// Re-export types
export type { AuthAdapter, AuthSession, AuthUser, SignInResult, SignUpResult } from './types'

// Helper to check if using NextAuth
export const isNextAuth = provider === 'nextauth'
