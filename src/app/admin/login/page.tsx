'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/admin/students')
    router.refresh()
  }

  return (
    <div className="login-container">
      <div className="login-card card">
        <div className="logo-container">
          <Image
            src="https://www.aldersgatechristian.com/wp-content/uploads/2020/09/aca-logo-blue.png"
            alt="Aldersgate Christian Academy"
            width={180}
            height={60}
            className="logo"
            priority
          />
        </div>

        <h1>Admin Login</h1>
        <p className="subtitle">Sign in to manage lunch accounts</p>

        <form onSubmit={handleLogin}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@school.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="signup-link">
          First time? <Link href="/admin/signup">Create admin account</Link>
        </p>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: linear-gradient(135deg, var(--off-white) 0%, var(--gray-100) 100%);
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          text-align: center;
        }

        .logo-container {
          margin-bottom: 24px;
        }

        :global(.logo) {
          height: auto;
          width: auto;
          max-height: 60px;
        }

        h1 {
          font-size: 28px;
          margin: 0 0 8px 0;
          color: var(--aca-navy);
        }

        .subtitle {
          color: var(--gray-400);
          margin: 0 0 32px 0;
        }

        form {
          text-align: left;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          font-size: 14px;
          color: var(--gray-600);
          margin-bottom: 8px;
        }

        .error-message {
          background: var(--error-bg);
          color: var(--error);
          padding: 12px 16px;
          border-radius: var(--border-radius);
          margin-bottom: 20px;
          font-size: 14px;
        }

        .btn-full {
          width: 100%;
          margin-top: 8px;
        }

        .signup-link {
          margin-top: 24px;
          font-size: 14px;
          color: var(--gray-400);
        }

        .signup-link :global(a) {
          color: var(--aca-blue);
          text-decoration: none;
          font-weight: 600;
        }

        .signup-link :global(a):hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
