'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingAdmins, setCheckingAdmins] = useState(true)
  const [hasAdmins, setHasAdmins] = useState(false)
  const [passwordMinLength, setPasswordMinLength] = useState(6)
  const router = useRouter()

  useEffect(() => {
    async function checkAdminsAndSettings() {
      const supabase = createClient()

      // Check if there are existing admins
      const { count } = await supabase
        .from('admin_users')
        .select('*', { count: 'exact', head: true })

      setHasAdmins((count ?? 0) > 0)

      // Fetch password settings
      const { data: settings } = await supabase
        .from('app_settings')
        .select('password_min_length')
        .eq('id', 1)
        .single()

      if (settings?.password_min_length) {
        setPasswordMinLength(settings.password_min_length)
      }

      setCheckingAdmins(false)
    }
    checkAdminsAndSettings()
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < passwordMinLength) {
      setError(`Password must be at least ${passwordMinLength} characters`)
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (!authData.user) {
      setError('Failed to create account')
      setLoading(false)
      return
    }

    const { error: adminError } = await supabase
      .from('admin_users')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        role: 'super_admin',
      })

    if (adminError) {
      setError('Failed to create admin account: ' + adminError.message)
      setLoading(false)
      return
    }

    router.push('/admin/students')
    router.refresh()
  }

  if (checkingAdmins) {
    return (
      <div className="signup-container">
        <div className="signup-backdrop" />
        <div className="signup-card">
          <div className="card-inner">
            <div className="loading-state">
              <div className="loading-spinner" />
              <span>Checking setup status...</span>
            </div>
          </div>
        </div>
        {/* Styles are in globals.css to prevent FOUC */}
      </div>
    )
  }

  if (hasAdmins) {
    return (
      <div className="signup-container">
        <div className="signup-backdrop" />
        <div className="signup-card">
          <div className="card-inner">
            <div className="logo-section">
              <div className="logo-badge">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.2"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="logo-container">
                <Image
                  src="https://www.aldersgatechristian.com/wp-content/uploads/2020/09/aca-logo-blue.png"
                  alt="Aldersgate Christian Academy"
                  width={200}
                  height={70}
                  className="logo"
                  priority
                />
              </div>
            </div>

            <div className="header-section">
              <div className="status-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Already Configured
              </div>
              <h1>Admin Exists</h1>
              <p className="subtitle">
                An administrator account has already been created for this system.
                Please contact an existing admin for an invitation.
              </p>
            </div>

            <Link href="/admin/login" className="btn btn-primary btn-full">
              <span>Go to Login</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          <div className="card-footer">
            <Link href="/" className="back-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0, display: 'inline-block', verticalAlign: '-2px', marginRight: 8 }}>
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to Scanner</span>
            </Link>
          </div>
        </div>

        {/* Styles are in globals.css to prevent FOUC */}
      </div>
    )
  }

  return (
    <div className="signup-container">
      <div className="signup-backdrop" />

      <div className="signup-card">
        <div className="card-inner">
          <div className="logo-section">
            <div className="logo-badge">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.2"/>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="logo-container">
              <Image
                src="https://www.aldersgatechristian.com/wp-content/uploads/2020/09/aca-logo-blue.png"
                alt="Aldersgate Christian Academy"
                width={200}
                height={70}
                className="logo"
                priority
              />
            </div>
          </div>

          <div className="header-section">
            <div className="setup-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Initial Setup
            </div>
            <h1>Create Admin Account</h1>
            <p className="subtitle">Set up the first administrator for the lunch management system</p>
          </div>

          <form onSubmit={handleSignup}>
            {error && (
              <div className="error-message">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@aldersgatechristian.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <input
                  id="confirmPassword"
                  type="password"
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Admin Account</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="divider">
            <span>or</span>
          </div>

          <p className="login-link">
            Already have an account? <Link href="/admin/login">Sign in</Link>
          </p>
        </div>

        <div className="card-footer">
          <Link href="/" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0, display: 'inline-block', verticalAlign: '-2px', marginRight: 8 }}>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Scanner</span>
          </Link>
        </div>
      </div>

      {/* Styles are in globals.css to prevent FOUC */}
    </div>
  )
}
