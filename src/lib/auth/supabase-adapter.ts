import { createClient } from '@/lib/supabase/server'
import type { AuthAdapter, AuthSession, AuthUser, SignInResult, SignUpResult } from './types'

export const supabaseAuthAdapter: AuthAdapter = {
  async getSession(): Promise<AuthSession | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Verify user is an admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('id', user.id)
      .single()

    if (!adminUser) return null

    return {
      user: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role as 'admin' | 'super_admin'
      }
    }
  },

  async signIn(email: string, password: string): Promise<SignInResult> {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.session || !data.user) {
      return { success: false, error: 'Failed to create session' }
    }

    // Verify user is an admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, email, role')
      .eq('id', data.user.id)
      .single()

    if (!adminUser) {
      return { success: false, error: 'User is not an administrator' }
    }

    return {
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role as 'admin' | 'super_admin'
      }
    }
  },

  async signOut(): Promise<void> {
    const supabase = await createClient()
    await supabase.auth.signOut()
  },

  async createUser(email: string, password: string, role: 'admin' | 'super_admin' = 'admin'): Promise<SignUpResult> {
    const supabase = await createClient()

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create user' }
    }

    // Create admin user record
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        id: data.user.id,
        email,
        role
      })

    if (adminError) {
      return { success: false, error: adminError.message }
    }

    return {
      success: true,
      user: {
        id: data.user.id,
        email,
        role
      }
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const session = await this.getSession()
    return session?.user ?? null
  },

  async getAdminCount(): Promise<number> {
    const supabase = await createClient()
    const { count } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })

    return count ?? 0
  }
}
