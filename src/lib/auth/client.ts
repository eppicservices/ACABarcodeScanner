'use client'

import { signIn as nextAuthSignIn } from 'next-auth/react'

/**
 * Sign in with email and password using NextAuth credentials provider
 */
export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      return { success: false, error: result.error === 'CredentialsSignin' ? 'Invalid credentials' : result.error }
    }

    return { success: true }
  } catch (error) {
    console.error('Sign in error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Sign up (create first admin) and automatically sign in
 */
export async function signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Call signup API to create admin
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create account' }
    }

    // Auto sign in after successful signup
    return signIn(email, password)
  } catch (error) {
    console.error('Sign up error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Check if initial setup is complete (any admins exist)
 */
export async function checkSetup(): Promise<{ hasAdmins: boolean; passwordMinLength: number }> {
  try {
    const response = await fetch('/api/auth/check-setup')
    const data = await response.json()
    return {
      hasAdmins: data.hasAdmins ?? false,
      passwordMinLength: data.passwordMinLength ?? 6,
    }
  } catch {
    return { hasAdmins: false, passwordMinLength: 6 }
  }
}
