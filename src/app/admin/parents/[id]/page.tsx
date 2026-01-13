'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Parent, Student } from '@/types/database'

interface ParentWithStudents extends Parent {
  students: Student[]
}

export default function EditParentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [parent, setParent] = useState<ParentWithStudents | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchParent()
  }, [id])

  async function fetchParent() {
    const { data, error } = await supabase
      .from('parents')
      .select('*, students(*)')
      .eq('id', id)
      .single()

    if (data) {
      const p = data as ParentWithStudents
      setParent(p)
      setName(p.name)
      setEmail(p.email)
      setPhone(p.phone || '')
      setAddress(p.address || '')
    }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    const { error } = await supabase
      .from('parents')
      .update({
        name,
        email,
        phone: phone || null,
        address: address || null,
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Parent updated successfully')
      fetchParent()
    }

    setSaving(false)
  }

  async function handleDelete() {
    if (!parent) return

    if (parent.students.length > 0) {
      setError('Cannot delete parent with students. Please reassign or delete their students first.')
      return
    }

    if (!confirm('Are you sure you want to delete this parent?')) {
      return
    }

    const { error } = await supabase.from('parents').delete().eq('id', id)

    if (error) {
      setError('Failed to delete parent: ' + error.message)
    } else {
      router.push('/admin/parents')
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!parent) {
    return <div className="error">Parent not found</div>
  }

  return (
    <div className="edit-parent-page">
      <div className="page-header">
        <div>
          <Link href="/admin/parents" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Parents
          </Link>
          <h1>Edit Parent</h1>
        </div>
      </div>

      <div className="content-grid">
        <div className="main-content">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSave} className="card form-card">
            <h2>Parent Information</h2>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                required
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="555-123-4567"
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, ST 12345"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                Delete Parent
              </button>
            </div>
          </form>
        </div>

        <div className="sidebar">
          <div className="card students-card">
            <h3>Children</h3>
            {parent.students.length === 0 ? (
              <p className="no-students">No students assigned</p>
            ) : (
              <ul className="students-list">
                {parent.students.map((student) => (
                  <li key={student.id} className="student-item">
                    <Link href={`/admin/students/${student.id}`} className="student-link">
                      <span className="student-name">{student.name}</span>
                      <span className="student-info">
                        {student.school_level === 'elementary' ? 'Elementary' : 'High School'}
                        {' • '}
                        ${student.balance.toFixed(2)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/students/new" className="btn btn-outline btn-sm">
              Add Student
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .edit-parent-page {
          max-width: 900px;
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

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 24px;
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

        .alert-success {
          background: var(--success-bg);
          color: var(--success);
        }

        .form-card h2 {
          font-size: 18px;
          margin: 0 0 24px 0;
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

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--gray-100);
        }

        .students-card h3 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--gray-400);
          margin: 0 0 16px 0;
        }

        .no-students {
          color: var(--gray-400);
          font-size: 14px;
          margin-bottom: 16px;
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
          display: block;
          padding: 12px 0;
          text-decoration: none;
        }

        .student-link:hover .student-name {
          color: var(--aca-blue);
        }

        .student-name {
          display: block;
          font-weight: 600;
          color: var(--gray-700);
        }

        .student-info {
          font-size: 12px;
          color: var(--gray-400);
        }

        .btn-sm {
          padding: 8px 16px;
          font-size: 14px;
          width: 100%;
        }

        .loading, .error {
          text-align: center;
          padding: 60px;
          color: var(--gray-400);
        }
      `}</style>
    </div>
  )
}
