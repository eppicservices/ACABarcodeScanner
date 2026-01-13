'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function RequestLinkPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/parent-portal/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send link')
        setLoading(false)
        return
      }

      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div className="request-container">
      <div className="request-card">
        <div className="card-header">
          <Image
            src="https://www.aldersgatechristian.com/wp-content/uploads/2017/12/ACA-Logo_Horizontal_White_small.png"
            alt="Aldersgate Christian Academy"
            width={200}
            height={50}
            className="logo"
            priority
          />
        </div>

        {submitted ? (
          <div className="success-state">
            <div className="success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1>Check Your Email</h1>
            <p>
              If an account exists for <strong>{email}</strong>, you&apos;ll receive an email
              with a link to view your children&apos;s lunch balances.
            </p>
            <p className="hint">
              Don&apos;t see it? Check your spam folder or contact the school office.
            </p>
          </div>
        ) : (
          <>
            <div className="card-content">
              <h1>Request Balance Link</h1>
              <p>
                Enter your email address and we&apos;ll send you a link to view
                your children&apos;s lunch balances.
              </p>

              {error && (
                <div className="error-message">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    className="input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Link'}
                </button>
              </form>
            </div>
          </>
        )}

        <div className="card-footer">
          <p>
            Questions? Contact the school office at{' '}
            <a href="mailto:office@aldersgatechristian.com">office@aldersgatechristian.com</a>
          </p>
        </div>
      </div>

      <style jsx>{`
        .request-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: linear-gradient(135deg, #002c5f 0%, #1e4a7a 100%);
        }

        .request-card {
          width: 100%;
          max-width: 420px;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .card-header {
          background: #002c5f;
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px 12px 0 0;
        }

        .card-header :global(.logo) {
          height: 44px;
          width: auto;
        }

        .card-content {
          padding: 32px 24px;
        }

        h1 {
          margin: 0 0 8px 0;
          font-size: 22px;
          color: #1e293b;
          text-align: center;
        }

        .card-content p {
          margin: 0 0 24px 0;
          color: #64748b;
          font-size: 14px;
          text-align: center;
          line-height: 1.5;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fef2f2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
        }

        .input {
          width: 100%;
          padding: 12px 14px;
          font-size: 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .input:focus {
          border-color: #2e8bc0;
        }

        .btn {
          width: 100%;
          padding: 14px;
          font-size: 15px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #ffc82e 0%, #f59e0b 100%);
          color: #002c5f;
          border: none;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 200, 46, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .success-state {
          padding: 40px 24px;
          text-align: center;
        }

        .success-icon {
          color: #22c55e;
          margin-bottom: 16px;
        }

        .success-state p {
          margin: 0 0 16px 0;
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
        }

        .success-state .hint {
          color: #94a3b8;
          font-size: 13px;
        }

        .card-footer {
          padding: 16px 24px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .card-footer p {
          margin: 0;
          font-size: 13px;
          color: #64748b;
          text-align: center;
        }

        .card-footer a {
          color: #2e8bc0;
          text-decoration: none;
        }

        .card-footer a:hover {
          text-decoration: underline;
        }

        /* Mobile optimizations */
        @media (max-width: 480px) {
          .request-container {
            padding: 16px;
            align-items: flex-start;
            padding-top: 40px;
          }

          .request-card {
            max-width: 100%;
          }

          .card-header {
            padding: 20px 16px;
          }

          .card-header :global(.logo) {
            height: 38px;
          }

          .card-content {
            padding: 28px 20px;
          }

          h1 {
            font-size: 20px;
          }

          .card-content p {
            font-size: 13px;
          }

          .error-message {
            padding: 10px 14px;
            font-size: 13px;
          }

          .form-group {
            margin-bottom: 16px;
          }

          .form-group label {
            font-size: 12px;
          }

          .input {
            padding: 14px;
            font-size: 16px;
          }

          .btn {
            padding: 14px;
            font-size: 15px;
          }

          .success-state {
            padding: 32px 20px;
          }

          .success-state h1 {
            font-size: 20px;
          }

          .success-state p {
            font-size: 13px;
          }

          .success-state .hint {
            font-size: 12px;
          }

          .card-footer {
            padding: 14px 20px;
          }

          .card-footer p {
            font-size: 12px;
          }
        }

        @media (max-width: 360px) {
          .request-container {
            padding: 12px;
            padding-top: 24px;
          }

          .card-content {
            padding: 24px 16px;
          }

          h1 {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  )
}
