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
  const [balance, setBalance] = useState('0')

  const router = useRouter()

  useEffect(() => {
    async function fetchParents() {
      const supabase = createClient()
      const { data } = await supabase.from('parents').select('*').order('name')
      if (data) setParents(data)
      setLoading(false)
    }
    fetchParents()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase.from('students').insert({
      name,
      barcode,
      school_level: schoolLevel,
      parent_id: parentId,
      balance: parseInt(balance) || 0,
    })

    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      router.push('/admin/students')
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <span>Loading...</span>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 120px;
            gap: 16px;
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

  return (
    <div className="new-student-page">
      <div className="page-header">
        <Link href="/admin/students" className="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0, display: 'inline-block', verticalAlign: '-2px', marginRight: 8 }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back to Students</span>
        </Link>

        <div className="header-content">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <div>
            <h1>Add New Student</h1>
            <p className="subtitle">Create a new student account for lunch tracking</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card form-card">
        <div className="form-section">
          <h2>Student Details</h2>

          <div className="form-group">
            <label htmlFor="name">Student Name</label>
            <input
              id="name"
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
              <label htmlFor="barcode">Barcode / Student ID</label>
              <div className="input-with-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
                  <line x1="7" y1="8" x2="7" y2="16" />
                  <line x1="11" y1="8" x2="11" y2="16" />
                  <line x1="15" y1="8" x2="15" y2="12" />
                  <line x1="19" y1="8" x2="19" y2="16" />
                </svg>
                <input
                  id="barcode"
                  type="text"
                  className="input"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="1001"
                  required
                />
              </div>
              <p className="field-hint">This will be scanned during lunch check-in</p>
            </div>

            <div className="form-group">
              <label htmlFor="schoolLevel">School Level</label>
              <div className="level-select">
                <button
                  type="button"
                  className={`level-option ${schoolLevel === 'elementary' ? 'active' : ''}`}
                  onClick={() => setSchoolLevel('elementary')}
                >
                  <div className="level-dot elementary" />
                  Elementary
                </button>
                <button
                  type="button"
                  className={`level-option ${schoolLevel === 'high_school' ? 'active' : ''}`}
                  onClick={() => setSchoolLevel('high_school')}
                >
                  <div className="level-dot high_school" />
                  High School
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Account Setup</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="parentId">Parent / Guardian</label>
              <select
                id="parentId"
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
              <label htmlFor="balance">Starting Lunches</label>
              <div className="balance-input">
                <input
                  id="balance"
                  type="number"
                  className="input"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  step="1"
                  min="0"
                />
                <span className="balance-unit">lunches</span>
              </div>
            </div>
          </div>

          {parents.length === 0 && (
            <div className="alert alert-warning">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div>
                <strong>No parents available</strong>
                <p>You need to <Link href="/admin/parents/new">create a parent</Link> before adding students.</p>
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <Link href="/admin/students" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving || parents.length === 0}>
            {saving ? (
              <>
                <span className="btn-spinner" />
                Creating...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                Create Student
              </>
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .new-student-page {
          max-width: 640px;
        }

        .page-header {
          margin-bottom: 28px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--gray-400);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 20px;
          padding: 6px 12px;
          margin-left: -12px;
          border-radius: var(--border-radius);
          transition: all var(--transition-fast);
        }

        .back-link:hover {
          color: var(--aca-teal);
          background: var(--aca-teal-subtle);
        }

        .back-link:hover svg {
          transform: translateX(-2px);
        }

        .back-link svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          transition: transform var(--transition-fast);
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--aca-teal-subtle) 0%, var(--white) 100%);
          border: 1px solid var(--gray-100);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--aca-teal);
          box-shadow: var(--shadow-sm);
        }

        h1 {
          font-size: 26px;
          margin: 0;
          color: var(--aca-navy);
          letter-spacing: -0.02em;
        }

        .subtitle {
          color: var(--gray-400);
          margin: 2px 0 0 0;
          font-size: 14px;
        }

        .alert {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 18px;
          border-radius: var(--border-radius);
          margin-bottom: 20px;
          font-size: 14px;
        }

        .alert svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .alert-error {
          background: var(--error-bg);
          color: var(--error);
          border: 1px solid var(--error-border);
        }

        .alert-warning {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fcd34d;
        }

        .alert-warning strong {
          display: block;
          margin-bottom: 4px;
        }

        .alert-warning p {
          margin: 0;
          font-size: 13px;
          opacity: 0.9;
        }

        .alert-warning :global(a) {
          color: inherit;
          font-weight: 600;
        }

        .form-card {
          padding: 0;
        }

        .form-section {
          padding: 28px;
          border-bottom: 1px solid var(--gray-100);
        }

        .form-section:last-of-type {
          border-bottom: none;
        }

        .form-section h2 {
          font-size: 15px;
          font-weight: 600;
          color: var(--gray-700);
          margin: 0 0 20px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          font-size: 13px;
          color: var(--gray-600);
          margin-bottom: 8px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .input-with-icon {
          position: relative;
        }

        .input-with-icon svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray-400);
          pointer-events: none;
        }

        .input-with-icon .input {
          padding-left: 44px;
        }

        .field-hint {
          font-size: 12px;
          color: var(--gray-400);
          margin: 6px 0 0 0;
        }

        .level-select {
          display: flex;
          gap: 10px;
        }

        .level-option {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 16px;
          border: 2px solid var(--gray-200);
          border-radius: var(--border-radius);
          background: var(--white);
          color: var(--gray-600);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .level-option:hover {
          border-color: var(--gray-300);
        }

        .level-option.active {
          border-color: var(--aca-teal);
          background: var(--aca-teal-subtle);
          color: var(--aca-teal);
        }

        .level-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .level-dot.elementary {
          background: #3b82f6;
        }

        .level-dot.high_school {
          background: var(--aca-gold);
        }

        .balance-input {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .balance-input .input {
          width: 100px;
          font-size: 18px;
          font-weight: 600;
          font-family: 'SF Mono', Monaco, monospace;
          text-align: center;
        }

        .balance-unit {
          font-size: 14px;
          font-weight: 500;
          color: var(--gray-500);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          padding: 24px 28px;
          background: var(--gray-50);
          border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
        }

        .btn-outline {
          background: var(--white);
          border: 1px solid var(--gray-200);
          color: var(--gray-600);
        }

        .btn-outline:hover {
          border-color: var(--gray-300);
          background: var(--white);
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: var(--white);
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
