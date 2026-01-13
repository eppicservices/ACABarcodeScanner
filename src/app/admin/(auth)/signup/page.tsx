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
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAdmins() {
      const { count } = await supabase
        .from('admin_users')
        .select('*', { count: 'exact', head: true })

      setHasAdmins((count ?? 0) > 0)
      setCheckingAdmins(false)
    }
    checkAdmins()
  }, [supabase])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

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
        <style jsx>{`
          .signup-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
            background: var(--aca-navy);
          }
          .signup-backdrop {
            position: absolute;
            inset: 0;
            background-image:
              radial-gradient(ellipse at 30% 20%, rgba(0, 177, 193, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(255, 200, 46, 0.08) 0%, transparent 50%);
            pointer-events: none;
          }
          .signup-card {
            width: 100%;
            max-width: 420px;
            position: relative;
            z-index: 1;
          }
          .card-inner {
            background: var(--white);
            border-radius: var(--border-radius-lg);
            padding: 36px 32px;
            box-shadow: var(--shadow-xl);
          }
          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            padding: 40px 0;
            color: var(--gray-400);
          }
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid var(--gray-100);
            border-top-color: var(--aca-teal);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Scanner
            </Link>
          </div>
        </div>

        <style jsx>{`
          .signup-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
            background: var(--aca-navy);
          }

          .signup-backdrop {
            position: absolute;
            inset: 0;
            background-image:
              radial-gradient(ellipse at 30% 20%, rgba(0, 177, 193, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(255, 200, 46, 0.08) 0%, transparent 50%);
            pointer-events: none;
          }

          .signup-card {
            width: 100%;
            max-width: 420px;
            position: relative;
            z-index: 1;
            animation: fadeInUp 0.4s ease-out;
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(16px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .card-inner {
            background: var(--white);
            border-radius: var(--border-radius-lg);
            padding: 36px 32px;
            box-shadow: var(--shadow-xl);
            text-align: center;
          }

          .logo-section {
            margin-bottom: 24px;
          }

          .logo-badge {
            width: 52px;
            height: 52px;
            background: var(--aca-gold);
            border-radius: var(--border-radius-lg);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: var(--aca-navy);
            margin-bottom: 16px;
            box-shadow: 0 4px 12px rgba(255, 200, 46, 0.3);
          }

          .logo-container {
            display: flex;
            justify-content: center;
          }

          :global(.logo) {
            height: auto;
            width: auto;
            max-height: 48px;
          }

          .header-section {
            margin-bottom: 24px;
          }

          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--aca-gold-subtle);
            color: var(--aca-gold-dark);
            padding: 6px 14px;
            border-radius: var(--border-radius);
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 14px;
          }

          h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 10px 0;
            color: var(--aca-navy);
          }

          .subtitle {
            color: var(--gray-400);
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
          }

          .btn-full {
            width: 100%;
          }

          .card-footer {
            text-align: center;
            margin-top: 20px;
          }

          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: rgba(255, 255, 255, 0.6);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            padding: 8px 16px;
            border-radius: var(--border-radius);
            transition: all var(--transition-base);
          }

          .back-link:hover {
            color: var(--aca-gold);
            background: rgba(255, 255, 255, 0.08);
          }

          .back-link:hover svg {
            transform: translateX(-3px);
          }

          .back-link svg {
            transition: transform var(--transition-base);
          }
        `}</style>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Scanner
          </Link>
        </div>
      </div>

      <style jsx>{`
        .signup-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          background: var(--aca-navy);
        }

        .signup-backdrop {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(ellipse at 30% 20%, rgba(0, 177, 193, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(255, 200, 46, 0.08) 0%, transparent 50%);
          pointer-events: none;
        }

        .signup-card {
          width: 100%;
          max-width: 420px;
          position: relative;
          z-index: 1;
          animation: fadeInUp 0.4s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .card-inner {
          background: var(--white);
          border-radius: var(--border-radius-lg);
          padding: 36px 32px;
          box-shadow: var(--shadow-xl);
        }

        .logo-section {
          text-align: center;
          margin-bottom: 24px;
        }

        .logo-badge {
          width: 52px;
          height: 52px;
          background: var(--aca-gold);
          border-radius: var(--border-radius-lg);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--aca-navy);
          margin-bottom: 16px;
          box-shadow: 0 4px 12px rgba(255, 200, 46, 0.3);
        }

        .logo-container {
          display: flex;
          justify-content: center;
        }

        :global(.logo) {
          height: auto;
          width: auto;
          max-height: 48px;
        }

        .header-section {
          text-align: center;
          margin-bottom: 28px;
        }

        .setup-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--aca-teal-subtle);
          color: var(--aca-teal-dark);
          padding: 6px 14px;
          border-radius: var(--border-radius);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 14px;
        }

        h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 6px 0;
          color: var(--aca-navy);
        }

        .subtitle {
          color: var(--gray-400);
          margin: 0;
          font-size: 14px;
        }

        form {
          text-align: left;
        }

        .form-group {
          margin-bottom: 18px;
        }

        .form-group label {
          display: block;
          font-weight: 700;
          font-size: 13px;
          color: var(--gray-600);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .input-wrapper {
          position: relative;
        }

        .input-wrapper svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray-400);
          pointer-events: none;
          transition: color var(--transition-base);
        }

        .input-wrapper .input {
          padding-left: 42px;
        }

        .input-wrapper:focus-within svg {
          color: var(--aca-teal);
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--error-bg);
          color: var(--error);
          padding: 12px 14px;
          border-radius: var(--border-radius);
          margin-bottom: 18px;
          font-size: 14px;
          font-weight: 500;
          border: 1px solid var(--error-border);
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .btn-full {
          width: 100%;
          margin-top: 6px;
        }

        .btn-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(0, 0, 0, 0.2);
          border-top-color: var(--aca-navy);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 24px 0;
          color: var(--gray-300);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--gray-200);
        }

        .login-link {
          text-align: center;
          font-size: 14px;
          color: var(--gray-500);
          margin: 0;
        }

        .login-link :global(a) {
          color: var(--aca-teal);
          text-decoration: none;
          font-weight: 700;
          transition: color var(--transition-base);
        }

        .login-link :global(a):hover {
          color: var(--aca-teal-dark);
          text-decoration: underline;
        }

        .card-footer {
          text-align: center;
          margin-top: 20px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: var(--border-radius);
          transition: all var(--transition-base);
        }

        .back-link:hover {
          color: var(--aca-gold);
          background: rgba(255, 255, 255, 0.08);
        }

        .back-link svg {
          transition: transform var(--transition-base);
        }

        .back-link:hover svg {
          transform: translateX(-3px);
        }

        /* Mobile optimizations */
        @media (max-width: 480px) {
          .signup-container {
            padding: 16px;
            align-items: flex-start;
            padding-top: 40px;
          }

          .signup-card {
            max-width: 100%;
          }

          .card-inner {
            padding: 28px 20px;
          }

          .logo-badge {
            width: 46px;
            height: 46px;
          }

          :global(.logo) {
            max-height: 40px;
          }

          h1 {
            font-size: 22px;
          }

          .subtitle {
            font-size: 13px;
          }

          .setup-badge {
            font-size: 10px;
            padding: 5px 12px;
          }

          .form-group {
            margin-bottom: 16px;
          }

          .form-group label {
            font-size: 12px;
          }

          .input-wrapper .input {
            padding: 12px 12px 12px 40px;
            font-size: 16px;
          }

          .error-message {
            padding: 10px 12px;
            font-size: 13px;
          }

          .btn-full {
            padding: 14px 20px;
            font-size: 15px;
          }

          .divider {
            margin: 20px 0;
          }

          .login-link {
            font-size: 13px;
          }

          .card-footer {
            margin-top: 16px;
          }

          .back-link {
            font-size: 13px;
          }
        }

        @media (max-width: 360px) {
          .card-inner {
            padding: 24px 16px;
          }

          h1 {
            font-size: 20px;
          }

          .logo-badge {
            width: 42px;
            height: 42px;
          }

          .logo-section {
            margin-bottom: 20px;
          }

          .header-section {
            margin-bottom: 24px;
          }
        }
      `}</style>
    </div>
  )
}
