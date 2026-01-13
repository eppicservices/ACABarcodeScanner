'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Parent } from '@/types/database'

export default function NewStudentPage() {
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [barcode, setBarcode] = useState('')
  const [schoolLevel, setSchoolLevel] = useState<'elementary' | 'high_school'>('elementary')
  const [parentId, setParentId] = useState('')
  const [balance, setBalance] = useState('0.00')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchParents() {
      const { data } = await supabase.from('parents').select('*').order('name')
      if (data) setParents(data)
      setLoading(false)
    }
    fetchParents()
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const { error } = await supabase.from('students').insert({
      name,
      barcode,
      school_level: schoolLevel,
      parent_id: parentId,
      balance: parseFloat(balance),
    })

    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      router.push('/admin/students')
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="new-student-page">
      <div className="page-header">
        <Link href="/admin/students" className="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Students
        </Link>
        <h1>Add New Student</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="card form-card">
        <div className="form-group">
          <label>Student Name</label>
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Barcode / ID</label>
            <input
              type="text"
              className="input"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="1001"
              required
            />
          </div>

          <div className="form-group">
            <label>School Level</label>
            <select
              className="input"
              value={schoolLevel}
              onChange={(e) => setSchoolLevel(e.target.value as 'elementary' | 'high_school')}
            >
              <option value="elementary">Elementary</option>
              <option value="high_school">High School</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Parent</label>
            <select
              className="input"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              required
            >
              <option value="">Select a parent...</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name} ({parent.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Starting Balance ($)</label>
            <input
              type="number"
              className="input"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              step="0.01"
              min="0"
            />
          </div>
        </div>

        {parents.length === 0 && (
          <div className="alert alert-warning">
            No parents exist yet. <Link href="/admin/parents/new">Create a parent first</Link>.
          </div>
        )}

        <div className="form-actions">
          <Link href="/admin/students" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving || parents.length === 0}>
            {saving ? 'Creating...' : 'Create Student'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .new-student-page {
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

        .alert-warning {
          background: var(--warning-bg);
          color: #92400e;
        }

        .alert-warning :global(a) {
          color: inherit;
          font-weight: 600;
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

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--gray-100);
        }

        .loading {
          text-align: center;
          padding: 60px;
          color: var(--gray-400);
        }
      `}</style>
    </div>
  )
}
