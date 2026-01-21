'use client'

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client'

// Check which auth provider is being used
// This is determined at build time from env
const authProvider = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'supabase'

export const isNextAuth = authProvider === 'nextauth'

interface SignInResult {
  success: boolean
  error?: string
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  if (authProvider === 'nextauth') {
    const result = await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false
    })

    if (result?.error) {
      return { success: false, error: 'Invalid credentials' }
    }

    return { success: true }
  } else {
    // Supabase auth
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.session) {
      return { success: false, error: 'Failed to create session' }
    }

    return { success: true }
  }
}

export async function signOut(): Promise<void> {
  if (authProvider === 'nextauth') {
    await nextAuthSignOut({ redirect: false })
  } else {
    const supabase = createClient()
    await supabase.auth.signOut()
  }
}

interface SignUpResult {
  success: boolean
  error?: string
  userId?: string
}

export async function signUp(email: string, password: string): Promise<SignUpResult> {
  if (authProvider === 'nextauth') {
    // For NextAuth, use the API route
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error }
    }

    return { success: true, userId: data.user?.id }
  } else {
    // Supabase auth
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (!data.user) {
      return { success: false, error: 'Failed to create account' }
    }

    // Create admin user record
    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        role: 'super_admin'
      })

    if (adminError) {
      return { success: false, error: adminError.message }
    }

    return { success: true, userId: data.user.id }
  }
}

export async function checkSetup(): Promise<{ hasAdmins: boolean; passwordMinLength: number }> {
  if (authProvider === 'nextauth') {
    // Use API route
    const response = await fetch('/api/auth/check-setup')
    const data = await response.json()
    return {
      hasAdmins: data.hasAdmins ?? false,
      passwordMinLength: data.passwordMinLength ?? 6
    }
  } else {
    // Direct Supabase query
    const supabase = createClient()

    const { count } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })

    const { data: settings } = await supabase
      .from('app_settings')
      .select('password_min_length')
      .eq('id', 1)
      .single()

    return {
      hasAdmins: (count ?? 0) > 0,
      passwordMinLength: settings?.password_min_length ?? 6
    }
  }
}
