'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (!data.session) {
        setError('Failed to create session')
        setLoading(false)
        return
      }

      window.location.href = '/admin/students'
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-backdrop" />

      <div className="login-card">
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
            <h1>Welcome Back</h1>
            <p className="subtitle">Sign in to the lunch management system</p>
          </div>

          <form onSubmit={handleLogin}>
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
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
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
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="divider">
            <span>or</span>
          </div>

          <p className="signup-link">
            First time setting up? <Link href="/admin/signup">Create admin account</Link>
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
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          background: var(--aca-navy);
        }

        .login-backdrop {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(ellipse at 30% 20%, rgba(0, 177, 193, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(255, 200, 46, 0.08) 0%, transparent 50%);
          pointer-events: none;
        }

        .login-card {
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

        .signup-link {
          text-align: center;
          font-size: 14px;
          color: var(--gray-500);
          margin: 0;
        }

        .signup-link :global(a) {
          color: var(--aca-teal);
          text-decoration: none;
          font-weight: 700;
          transition: color var(--transition-base);
        }

        .signup-link :global(a):hover {
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
      `}</style>
    </div>
  )
}
