'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewParentPage() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const { error } = await supabase.from('parents').insert({
      name,
      email,
      phone: phone || null,
      address: address || null,
    })

    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      router.push('/admin/parents')
    }
  }

  return (
    <div className="new-parent-page">
      <div className="page-header">
        <Link href="/admin/parents" className="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Parents
        </Link>
        <h1>Add New Parent</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="card form-card">
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            required
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="parent@email.com"
            required
          />
          <p className="field-hint">This email will receive low balance notifications</p>
        </div>

        <div className="form-group">
          <label>Phone (optional)</label>
          <input
            type="tel"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="555-123-4567"
          />
        </div>

        <div className="form-group">
          <label>Address (optional)</label>
          <input
            type="text"
            className="input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, City, ST 12345"
          />
        </div>

        <div className="form-actions">
          <Link href="/admin/parents" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create Parent'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .new-parent-page {
          max-width: 600px;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--gray-400);
          text-decoration: none;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .back-link:hover {
          color: var(--aca-blue);
        }

        h1 {
          font-size: 32px;
          margin: 0;
          color: var(--aca-navy);
        }

        .alert {
          padding: 12px 16px;
          border-radius: var(--border-radius);
          margin-bottom: 20px;
          font-size: 14px;
        }

        .alert-error {
          background: var(--error-bg);
          color: var(--error);
        }

        .form-card {
          padding: 32px;
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

        .field-hint {
          font-size: 12px;
          color: var(--gray-400);
          margin: 6px 0 0 0;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--gray-100);
        }
      `}</style>
    </div>
  )
}
