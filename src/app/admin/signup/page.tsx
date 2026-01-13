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

    // Sign up the user
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

    // Create admin user record (first user becomes super_admin)
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
      <div className="login-container">
        <div className="login-card card">
          <p>Loading...</p>
        </div>
        <style jsx>{`
          .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .login-card {
            text-align: center;
          }
        `}</style>
      </div>
    )
  }

  if (hasAdmins) {
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

          <h1>Admin Already Exists</h1>
          <p className="subtitle">
            An admin account has already been created.
            Please contact an existing admin for an invitation.
          </p>

          <Link href="/admin/login" className="btn btn-primary btn-full">
            Go to Login
          </Link>
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
            font-size: 24px;
            margin: 0 0 8px 0;
            color: var(--aca-navy);
          }

          .subtitle {
            color: var(--gray-400);
            margin: 0 0 32px 0;
          }

          .btn-full {
            width: 100%;
            display: inline-flex;
          }
        `}</style>
      </div>
    )
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

        <h1>Create Admin Account</h1>
        <p className="subtitle">Set up the first administrator</p>

        <form onSubmit={handleSignup}>
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
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Admin Account'}
          </button>
        </form>

        <p className="signup-link">
          Already have an account? <Link href="/admin/login">Sign in</Link>
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
