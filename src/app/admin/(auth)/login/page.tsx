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

  const handleLogin = async (e: React.FormEvent) => {
    const supabase = createClient()
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
    <div className="auth-container">
      {/* Left Panel - Decorative */}
      <div className="brand-panel">
        <div className="brand-bg">
          <div className="gradient-orb orb-1" />
          <div className="gradient-orb orb-2" />
          <div className="gradient-orb orb-3" />
          <div className="noise-overlay" />
        </div>

        <div className="brand-content">
          <div className="logo-wrapper">
            <Image
              src="https://www.aldersgatechristian.com/wp-content/uploads/2017/12/ACA-Logo_Horizontal_White_small.png"
              alt="Aldersgate Christian Academy"
              width={220}
              height={55}
              className="brand-logo"
              priority
            />
          </div>

          <div className="brand-text">
            <h1 className="brand-title">Lunch Management System</h1>
            <p className="brand-tagline">Streamlined cafeteria operations for better student care</p>
          </div>

          <div className="brand-features">
            <div className="feature">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span>Quick barcode scanning</span>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span>Student & parent management</span>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span>Real-time balance tracking</span>
            </div>
          </div>
        </div>

        <div className="brand-footer">
          <Link href="/" className="back-home">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, minWidth: 16, minHeight: 16, maxWidth: 16, maxHeight: 16, flexShrink: 0, display: 'inline-block', verticalAlign: '-2px', marginRight: 8 }}>
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Back to Scanner</span>
          </Link>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="form-panel">
        <div className="form-container">
          <div className="form-header">
            <div className="welcome-badge">Admin Portal</div>
            <h2>Welcome back</h2>
            <p>Sign in to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {error && (
              <div className="error-alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Email address</label>
              <div className="input-group">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@aldersgatechristian.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="input-group">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="form-divider">
            <span>or</span>
          </div>

          <p className="signup-prompt">
            First time setup? <Link href="/admin/signup">Create admin account</Link>
          </p>
        </div>

        <div className="form-panel-footer">
          <p>&copy; {new Date().getFullYear()} Aldersgate Christian Academy</p>
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap');

        .auth-container {
          display: flex;
          min-height: 100vh;
          min-height: 100dvh;
        }

        /* Brand Panel - Left Side */
        .brand-panel {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 48px;
          overflow: hidden;
          background: var(--aca-navy);
        }

        .brand-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.6;
          animation: float 20s ease-in-out infinite;
        }

        .orb-1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(0, 177, 193, 0.4) 0%, transparent 70%);
          top: -20%;
          left: -10%;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255, 200, 46, 0.25) 0%, transparent 70%);
          bottom: -15%;
          right: -5%;
          animation-delay: -7s;
        }

        .orb-3 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(0, 177, 193, 0.3) 0%, transparent 70%);
          top: 40%;
          right: 20%;
          animation-delay: -14s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.05); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(20px, 10px) scale(1.02); }
        }

        .noise-overlay {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
        }

        .brand-content {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .logo-wrapper {
          margin-bottom: 48px;
          animation: fadeInUp 0.6s ease-out;
        }

        :global(.brand-logo) {
          height: auto;
          width: auto;
          max-height: 60px;
        }

        .brand-text {
          margin-bottom: 48px;
          animation: fadeInUp 0.6s ease-out 0.1s both;
        }

        .brand-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 42px;
          font-weight: 600;
          color: white;
          line-height: 1.15;
          margin: 0 0 16px 0;
          letter-spacing: -0.02em;
        }

        .brand-tagline {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.5;
          max-width: 380px;
        }

        .brand-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: fadeInUp 0.6s ease-out 0.2s both;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 14px;
          color: rgba(255, 255, 255, 0.85);
          font-size: 15px;
          font-weight: 500;
        }

        .feature-icon {
          width: 36px;
          height: 36px;
          background: rgba(255, 200, 46, 0.15);
          border: 1px solid rgba(255, 200, 46, 0.25);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .feature-icon svg {
          width: 18px;
          height: 18px;
          color: var(--aca-gold);
        }

        .brand-footer {
          position: relative;
          z-index: 1;
          animation: fadeInUp 0.6s ease-out 0.3s both;
        }

        .back-home {
          display: inline-flex;
          flex-direction: row;
          flex-wrap: nowrap;
          align-items: center;
          gap: 10px;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          padding: 12px 20px;
          border-radius: 8px;
          transition: all 0.25s ease;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          white-space: nowrap;
        }

        .back-home:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .back-home svg {
          width: 16px;
          height: 16px;
          min-width: 16px;
          min-height: 16px;
          max-width: 16px;
          max-height: 16px;
          flex-shrink: 0;
          margin-right: 8px;
          transition: transform 0.25s ease;
        }

        .back-home:hover svg {
          transform: translateX(-3px);
        }

        /* Form Panel - Right Side */
        .form-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px;
          background: white;
          position: relative;
        }

        .form-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--aca-gold) 0%, var(--aca-teal) 100%);
        }

        .form-container {
          width: 100%;
          max-width: 380px;
          margin: 0 auto;
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-header {
          text-align: center;
          margin-bottom: 36px;
        }

        .welcome-badge {
          display: inline-block;
          padding: 6px 14px;
          background: var(--aca-navy);
          color: white;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-radius: 20px;
          margin-bottom: 20px;
        }

        .form-header h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 32px;
          font-weight: 600;
          color: var(--aca-navy);
          margin: 0 0 8px 0;
        }

        .form-header p {
          color: var(--gray-400);
          margin: 0;
          font-size: 15px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: var(--error-bg);
          border: 1px solid var(--error-border);
          border-radius: 10px;
          color: var(--error);
          font-size: 14px;
          font-weight: 500;
          animation: shake 0.4s ease;
        }

        .error-alert svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field label {
          font-size: 13px;
          font-weight: 700;
          color: var(--gray-600);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .input-group {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          color: var(--gray-300);
          pointer-events: none;
          transition: color 0.2s ease;
        }

        .input-group:focus-within .input-icon {
          color: var(--aca-teal);
        }

        .input-group input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          font-size: 15px;
          font-family: inherit;
          border: 2px solid var(--gray-200);
          border-radius: 10px;
          background: white;
          color: var(--gray-700);
          transition: all 0.2s ease;
        }

        .input-group input:hover {
          border-color: var(--gray-300);
        }

        .input-group input:focus {
          outline: none;
          border-color: var(--aca-teal);
          box-shadow: 0 0 0 4px var(--aca-teal-subtle);
        }

        .input-group input::placeholder {
          color: var(--gray-400);
        }

        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 16px 24px;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: var(--aca-gold);
          color: var(--aca-navy);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.25s ease;
          margin-top: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          background: var(--aca-gold-dark);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(255, 200, 46, 0.35);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .submit-btn svg {
          width: 18px;
          height: 18px;
          transition: transform 0.25s ease;
        }

        .submit-btn:hover:not(:disabled) svg {
          transform: translateX(3px);
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(0, 44, 95, 0.2);
          border-top-color: var(--aca-navy);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .form-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 28px 0;
          color: var(--gray-300);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .form-divider::before,
        .form-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--gray-200);
        }

        .signup-prompt {
          text-align: center;
          font-size: 14px;
          color: var(--gray-500);
          margin: 0;
        }

        .signup-prompt a {
          color: var(--aca-teal);
          font-weight: 700;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .signup-prompt a:hover {
          color: var(--aca-teal-dark);
          text-decoration: underline;
        }

        .form-panel-footer {
          position: absolute;
          bottom: 32px;
          left: 48px;
          right: 48px;
          text-align: center;
        }

        .form-panel-footer p {
          margin: 0;
          font-size: 12px;
          color: var(--gray-300);
        }

        /* Mobile Responsive */
        @media (max-width: 900px) {
          .auth-container {
            flex-direction: column;
          }

          .brand-panel {
            flex: none;
            padding: 32px 24px;
            min-height: auto;
          }

          .brand-content {
            flex: none;
          }

          .logo-wrapper {
            margin-bottom: 24px;
          }

          :global(.brand-logo) {
            max-height: 48px;
          }

          .brand-title {
            font-size: 28px;
            margin-bottom: 10px;
          }

          .brand-tagline {
            font-size: 15px;
          }

          .brand-text {
            margin-bottom: 24px;
          }

          .brand-features {
            display: none;
          }

          .brand-footer {
            display: none;
          }

          .form-panel {
            flex: 1;
            padding: 32px 24px 80px;
            justify-content: flex-start;
            padding-top: 40px;
          }

          .form-panel::before {
            display: none;
          }

          .form-container {
            max-width: 100%;
          }

          .form-header {
            margin-bottom: 28px;
          }

          .form-header h2 {
            font-size: 26px;
          }

          .welcome-badge {
            font-size: 10px;
            padding: 5px 12px;
          }

          .field label {
            font-size: 12px;
          }

          .input-group input {
            padding: 12px 14px 12px 44px;
            font-size: 16px;
          }

          .submit-btn {
            padding: 14px 20px;
            font-size: 14px;
          }

          .form-panel-footer {
            bottom: 24px;
            left: 24px;
            right: 24px;
          }
        }

        @media (max-width: 480px) {
          .brand-panel {
            padding: 24px 20px;
          }

          .brand-title {
            font-size: 24px;
          }

          .form-panel {
            padding: 28px 20px 72px;
          }

          .form-header h2 {
            font-size: 24px;
          }

          .login-form {
            gap: 16px;
          }
        }
      `}</style>
    </div>
  )
}
