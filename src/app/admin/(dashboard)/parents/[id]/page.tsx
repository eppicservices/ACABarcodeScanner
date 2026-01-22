'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getParentById,
  updateParent,
  deleteParent,
} from '@/actions/parents'
import type { SchoolLevel } from '@prisma/client'

interface Student {
  id: string
  name: string
  barcode: string
  balance: number
  schoolLevel: SchoolLevel
  isActive: boolean
}

interface ParentWithStudents {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  isActive: boolean
  createdAt: Date
  students: Student[]
}

export default function ParentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [parent, setParent] = useState<ParentWithStudents | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [isActive, setIsActive] = useState(true)

  const router = useRouter()
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function fetchParent() {
      try {
        const data = await getParentById(id)

        if (isMounted) {
          if (data) {
            const p = data as ParentWithStudents
            setParent(p)
            setName(p.name)
            setEmail(p.email)
            setPhone(p.phone || '')
            setAddress(p.address || '')
            setIsActive(p.isActive)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to fetch parent:', error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchParent()

    return () => {
      isMounted = false
    }
  }, [id, refetchTrigger])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      await updateParent(id, {
        name,
        email,
        phone: phone || null,
        address: address || null,
        isActive,
      })

      setSuccess('Parent updated successfully')
      setIsEditing(false)
      setRefetchTrigger(prev => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update parent')
    } finally {
      setSaving(false)
    }
  }

  function handleCancelEdit() {
    if (parent) {
      setName(parent.name)
      setEmail(parent.email)
      setPhone(parent.phone || '')
      setAddress(parent.address || '')
      setIsActive(parent.isActive)
    }
    setIsEditing(false)
    setError(null)
  }

  async function handleDelete() {
    if (!parent) return

    if (!confirm('Are you sure you want to delete this parent?')) {
      return
    }

    try {
      await deleteParent(id)
      router.push('/admin/parents')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete parent')
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <span>Loading parent details...</span>
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

  if (!parent) {
    return (
      <div className="error-container">
        <div className="error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2>Parent not found</h2>
        <p>The parent you&apos;re looking for doesn&apos;t exist or has been deleted.</p>
        <Link href="/admin/parents" className="btn btn-primary">
          Back to Parents
        </Link>
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 120px;
            text-align: center;
          }
          .error-icon {
            width: 80px;
            height: 80px;
            background: var(--error-bg);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--error);
            margin-bottom: 20px;
          }
          h2 {
            margin: 0 0 8px 0;
            color: var(--gray-700);
          }
          p {
            color: var(--gray-400);
            margin: 0 0 24px 0;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="edit-parent-page">
      <div className="page-header">
        <Link href="/admin/parents" className="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0, display: 'inline-block', verticalAlign: '-2px', marginRight: 8 }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back to Parents</span>
        </Link>

        <div className="header-main">
          <div className="avatar-large">
            {parent.name.charAt(0).toUpperCase()}
          </div>
          <div className="header-info">
            <h1>{parent.name}</h1>
            <div className="header-meta">
              <span className="meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {parent.email}
              </span>
              {parent.students.length > 0 && (
                <span className="children-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                  </svg>
                  {parent.students.length} {parent.students.length === 1 ? 'child' : 'children'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="main-content">
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
          {success && (
            <div className="alert alert-success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {success}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSave} className="card form-card">
              <div className="form-header">
                <div className="form-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <h2>Edit Parent Information</h2>
                  <p className="form-desc">Update contact details for this parent</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="field-hint">Used for low balance notifications</p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    className="input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="555-123-4567"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    id="address"
                    type="text"
                    className="input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St, City, ST 12345"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <div className="status-toggle">
                  <button
                    type="button"
                    className={`status-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setIsActive(true)}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    className={`status-btn ${!isActive ? 'inactive' : ''}`}
                    onClick={() => setIsActive(false)}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="btn-spinner" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="card detail-card">
              <div className="detail-header">
                <div className="detail-header-left">
                  <div className="form-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <h2>Parent Information</h2>
                    <p className="form-desc">Contact details and family information</p>
                  </div>
                </div>
                <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{parent.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">
                    <a href={`mailto:${parent.email}`} className="email-link-detail">
                      {parent.email}
                    </a>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone Number</span>
                  <span className="detail-value">{parent.phone || <span className="not-set">Not set</span>}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Address</span>
                  <span className="detail-value">{parent.address || <span className="not-set">Not set</span>}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">
                    <span className={`status-badge ${parent.isActive ? 'active' : 'inactive'}`}>
                      {parent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="detail-actions">
                <button type="button" className="btn btn-danger-outline" onClick={handleDelete}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete Parent
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar">
          <div className="card students-card">
            <div className="card-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
              </svg>
              <h3>Children</h3>
            </div>

            {parent.students.length === 0 ? (
              <div className="empty-students">
                <div className="empty-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                </div>
                <p>No students assigned yet</p>
              </div>
            ) : (
              <ul className="students-list">
                {parent.students.map((student) => (
                  <li key={student.id} className="student-item">
                    <Link href={`/admin/students/${student.id}`} className="student-link">
                      <div className="student-avatar">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="student-details">
                        <span className="student-name">{student.name}</span>
                        <span className="student-info">
                          <span className={`level-dot ${student.schoolLevel}`} />
                          {student.schoolLevel === 'elementary' ? 'Elementary' : 'High School'}
                          <span className="balance">${student.balance.toFixed(2)}</span>
                        </span>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chevron">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <Link href="/admin/students/new" className="btn btn-outline btn-block">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Student
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .edit-parent-page {
          max-width: 1000px;
        }

        .page-header {
          margin-bottom: 32px;
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

        .header-main {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .avatar-large {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          background: linear-gradient(135deg, var(--aca-teal) 0%, var(--aca-teal-dark) 100%);
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 28px;
          box-shadow: 0 4px 12px rgba(0, 177, 193, 0.25);
        }

        .header-info {
          flex: 1;
        }

        h1 {
          font-size: 28px;
          margin: 0 0 8px 0;
          color: var(--aca-navy);
          letter-spacing: -0.02em;
        }

        .header-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: var(--gray-500);
        }

        .children-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--aca-teal-subtle);
          color: var(--aca-teal);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          border-radius: var(--border-radius);
          margin-bottom: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .alert-error {
          background: var(--error-bg);
          color: var(--error);
          border: 1px solid var(--error-border);
        }

        .alert-success {
          background: var(--success-bg);
          color: var(--success);
          border: 1px solid var(--success-border);
          animation: successPop 0.35s ease-out;
        }

        @keyframes successPop {
          0% { transform: scale(0.95); opacity: 0; }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }

        .form-card {
          padding: 28px;
        }

        .form-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--gray-100);
        }

        .form-icon {
          width: 44px;
          height: 44px;
          background: var(--aca-teal-subtle);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--aca-teal);
        }

        .form-header h2,
        .detail-header h2 {
          font-size: 17px;
          margin: 0;
          color: var(--gray-700);
        }

        .detail-card {
          padding: 28px;
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--gray-100);
        }

        .detail-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .detail-header .btn {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .detail-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--gray-400);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .detail-value {
          font-size: 15px;
          font-weight: 500;
          color: var(--gray-700);
        }

        .email-link-detail {
          color: var(--aca-teal);
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .email-link-detail:hover {
          color: var(--aca-teal-dark);
          text-decoration: underline;
        }

        .not-set {
          color: var(--gray-400);
          font-style: italic;
        }

        .detail-actions {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--gray-100);
        }

        .btn-danger-outline {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: transparent;
          color: var(--error);
          border: 1px solid var(--error-border);
          border-radius: var(--border-radius);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          font-family: var(--font-body);
        }

        .btn-danger-outline:hover {
          background: var(--error-bg);
          border-color: var(--error);
        }

        .form-desc {
          font-size: 13px;
          color: var(--gray-400);
          margin: 2px 0 0 0;
        }

        .form-group {
          margin-bottom: 20px;
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

        .status-toggle {
          display: flex;
          gap: 8px;
        }

        .status-btn {
          flex: 1;
          padding: 10px 16px;
          border: 1px solid var(--gray-200);
          border-radius: var(--border-radius);
          background: var(--white);
          color: var(--gray-500);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          font-family: var(--font-body);
        }

        .status-btn:hover {
          border-color: var(--gray-300);
          color: var(--gray-700);
        }

        .status-btn.active {
          background: var(--success-bg);
          border-color: var(--success);
          color: var(--success);
        }

        .status-btn.inactive {
          background: var(--gray-100);
          border-color: var(--gray-400);
          color: var(--gray-600);
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.active {
          background: var(--success-bg);
          color: var(--success);
        }

        .status-badge.inactive {
          background: var(--gray-100);
          color: var(--gray-500);
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

        .students-card {
          padding: 20px;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--gray-400);
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--gray-100);
        }

        .card-header h3 {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .empty-students {
          text-align: center;
          padding: 24px 16px;
        }

        .empty-icon {
          width: 56px;
          height: 56px;
          background: var(--gray-50);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gray-300);
          margin: 0 auto 12px;
        }

        .empty-students p {
          color: var(--gray-400);
          font-size: 14px;
          margin: 0 0 16px 0;
        }

        .students-list {
          list-style: none;
          padding: 0;
          margin: 0 0 16px 0;
        }

        .student-item {
          border-bottom: 1px solid var(--gray-100);
        }

        .student-item:last-child {
          border-bottom: none;
        }

        .student-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 4px;
          text-decoration: none;
          transition: all var(--transition-fast);
          border-radius: var(--border-radius);
          margin: 0 -4px;
        }

        .student-link:hover {
          background: var(--gray-50);
        }

        .student-link:hover .chevron {
          transform: translateX(2px);
          opacity: 1;
        }

        .student-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--aca-gold) 0%, var(--aca-gold-dark) 100%);
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .student-details {
          flex: 1;
          min-width: 0;
        }

        .student-name {
          display: block;
          font-weight: 600;
          color: var(--gray-700);
          font-size: 14px;
        }

        .student-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--gray-400);
        }

        .level-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .level-dot.elementary {
          background: #3b82f6;
        }

        .level-dot.high_school {
          background: var(--aca-gold);
        }

        .balance {
          margin-left: auto;
          font-weight: 600;
          color: var(--gray-600);
        }

        .chevron {
          color: var(--gray-300);
          opacity: 0;
          transition: all var(--transition-fast);
        }

        .btn-block {
          width: 100%;
          justify-content: center;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid var(--gray-200);
          color: var(--gray-600);
        }

        .btn-outline:hover {
          border-color: var(--aca-teal);
          color: var(--aca-teal);
          background: var(--aca-teal-subtle);
        }
      `}</style>
    </div>
  )
}
