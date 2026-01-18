'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Student {
  id: string
  first_name: string
  last_name: string
  student_id: string
}

export default function NewParentPage() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  // Students state
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)

  // New student modal state
  const [showNewStudentModal, setShowNewStudentModal] = useState(false)
  const [newStudentFirstName, setNewStudentFirstName] = useState('')
  const [newStudentLastName, setNewStudentLastName] = useState('')
  const [newStudentId, setNewStudentId] = useState('')
  const [newStudentGrade, setNewStudentGrade] = useState('')
  const [creatingStudent, setCreatingStudent] = useState(false)
  const [studentError, setStudentError] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    async function fetchStudents() {
      const supabase = createClient()
      const { data } = await supabase
        .from('students')
        .select('id, first_name, last_name, student_id')
        .order('last_name')
      setStudents(data || [])
      setLoadingStudents(false)
    }
    fetchStudents()
  }, [])

  async function handleCreateStudent(e: React.FormEvent) {
    e.preventDefault()
    setStudentError(null)
    setCreatingStudent(true)

    const supabase = createClient()
    const { data, error } = await supabase
      .from('students')
      .insert({
        first_name: newStudentFirstName,
        last_name: newStudentLastName,
        student_id: newStudentId,
        grade: newStudentGrade || null,
        is_active: true,
        balance: 0,
      })
      .select()
      .single()

    if (error) {
      setStudentError(error.message)
      setCreatingStudent(false)
    } else if (data) {
      // Add new student to list and select them
      setStudents(prev => [...prev, data].sort((a, b) => a.last_name.localeCompare(b.last_name)))
      setSelectedStudentIds(prev => [...prev, data.id])
      // Reset modal state
      setNewStudentFirstName('')
      setNewStudentLastName('')
      setNewStudentId('')
      setNewStudentGrade('')
      setShowNewStudentModal(false)
      setCreatingStudent(false)
    }
  }

  function toggleStudentSelection(studentId: string) {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    const supabase = createClient()
    const { data: parentData, error } = await supabase
      .from('parents')
      .insert({
        name,
        email,
        phone: phone || null,
        address: address || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setSaving(false)
      return
    }

    // Link selected students to this parent
    if (parentData && selectedStudentIds.length > 0) {
      const { error: linkError } = await supabase
        .from('students')
        .update({ parent_id: parentData.id })
        .in('id', selectedStudentIds)

      if (linkError) {
        setError(`Parent created, but failed to link students: ${linkError.message}`)
        setSaving(false)
        return
      }
    }

    router.push('/admin/parents')
  }

  return (
    <div className="new-parent-page">
      <div className="page-header">
        <Link href="/admin/parents" className="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0, display: 'inline-block', verticalAlign: '-2px', marginRight: 8 }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back to Parents</span>
        </Link>

        <div className="header-content">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1>Add New Parent</h1>
            <p className="subtitle">Create a parent account for student management</p>
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
          <h2>Contact Information</h2>

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-with-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
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
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
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
                placeholder="parent@email.com"
                required
              />
            </div>
            <p className="field-hint">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
              </svg>
              This email will receive low balance notifications
            </p>
          </div>
        </div>

        <div className="form-section">
          <h2>Additional Details <span className="optional">(Optional)</span></h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className="input-with-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <input
                  id="phone"
                  type="tel"
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="555-123-4567"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Home Address</label>
              <div className="input-with-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
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
          </div>
        </div>

        <div className="form-section">
          <h2>
            Link Students <span className="optional">(Optional)</span>
          </h2>
          <p className="section-description">
            Select existing students to link to this parent, or create new ones.
          </p>

          {loadingStudents ? (
            <div className="loading-students">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="no-students-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <span>No students exist yet.</span>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setShowNewStudentModal(true)}
              >
                Create one now
              </button>
            </div>
          ) : (
            <>
              <div className="students-list">
                {students.map(student => (
                  <label key={student.id} className="student-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={() => toggleStudentSelection(student.id)}
                    />
                    <span className="student-info">
                      <span className="student-name">{student.last_name}, {student.first_name}</span>
                      <span className="student-id">ID: {student.student_id}</span>
                    </span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline add-student-btn"
                onClick={() => setShowNewStudentModal(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create New Student
              </button>
            </>
          )}

          {selectedStudentIds.length > 0 && (
            <div className="selected-count">
              {selectedStudentIds.length} student{selectedStudentIds.length > 1 ? 's' : ''} will be linked to this parent
            </div>
          )}
        </div>

        <div className="form-actions">
          <Link href="/admin/parents" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <span className="btn-spinner" />
                Creating...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Create Parent
              </>
            )}
          </button>
        </div>
      </form>

      {/* New Student Modal */}
      {showNewStudentModal && (
        <div className="modal-overlay" onClick={() => setShowNewStudentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Student</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowNewStudentModal(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateStudent}>
              <div className="modal-body">
                {studentError && (
                  <div className="modal-error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {studentError}
                  </div>
                )}
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label htmlFor="newStudentFirstName">First Name *</label>
                    <input
                      id="newStudentFirstName"
                      type="text"
                      className="input"
                      value={newStudentFirstName}
                      onChange={e => setNewStudentFirstName(e.target.value)}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="modal-form-group">
                    <label htmlFor="newStudentLastName">Last Name *</label>
                    <input
                      id="newStudentLastName"
                      type="text"
                      className="input"
                      value={newStudentLastName}
                      onChange={e => setNewStudentLastName(e.target.value)}
                      placeholder="Smith"
                      required
                    />
                  </div>
                </div>
                <div className="modal-form-row">
                  <div className="modal-form-group">
                    <label htmlFor="newStudentId">Student ID *</label>
                    <input
                      id="newStudentId"
                      type="text"
                      className="input"
                      value={newStudentId}
                      onChange={e => setNewStudentId(e.target.value)}
                      placeholder="STU001"
                      required
                    />
                  </div>
                  <div className="modal-form-group">
                    <label htmlFor="newStudentGrade">Grade</label>
                    <input
                      id="newStudentGrade"
                      type="text"
                      className="input"
                      value={newStudentGrade}
                      onChange={e => setNewStudentGrade(e.target.value)}
                      placeholder="5th"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowNewStudentModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creatingStudent}>
                  {creatingStudent ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .new-parent-page {
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
          align-items: center;
          gap: 12px;
          padding: 16px 18px;
          border-radius: var(--border-radius);
          margin-bottom: 20px;
          font-size: 14px;
        }

        .alert-error {
          background: var(--error-bg);
          color: var(--error);
          border: 1px solid var(--error-border);
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

        .optional {
          font-weight: 400;
          color: var(--gray-400);
          font-size: 13px;
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
          transition: color var(--transition-fast);
        }

        .input-with-icon .input {
          padding-left: 44px;
        }

        .input-with-icon:focus-within svg {
          color: var(--aca-teal);
        }

        .field-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--gray-400);
          margin: 8px 0 0 0;
        }

        .field-hint svg {
          flex-shrink: 0;
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

        /* Students Section Styles */
        .section-description {
          font-size: 14px;
          color: var(--gray-500);
          margin: -12px 0 20px 0;
        }

        .loading-students {
          font-size: 14px;
          color: var(--gray-400);
          padding: 16px;
          text-align: center;
        }

        .no-students-message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: var(--warning-bg);
          border: 1px solid var(--warning-border);
          border-radius: var(--border-radius);
          font-size: 14px;
          color: var(--warning);
        }

        .no-students-message .btn {
          margin-left: auto;
        }

        .students-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 240px;
          overflow-y: auto;
          padding: 4px;
          margin: 0 -4px;
        }

        .student-checkbox {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--border-radius);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .student-checkbox:hover {
          border-color: var(--aca-teal);
          background: var(--aca-teal-subtle);
        }

        .student-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: var(--aca-teal);
          cursor: pointer;
        }

        .student-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .student-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--gray-700);
        }

        .student-id {
          font-size: 12px;
          color: var(--gray-400);
        }

        .add-student-btn {
          margin-top: 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-sm {
          padding: 8px 14px;
          font-size: 13px;
        }

        .selected-count {
          margin-top: 16px;
          padding: 12px 14px;
          background: var(--aca-teal-subtle);
          border: 1px solid var(--aca-teal);
          border-radius: var(--border-radius);
          font-size: 13px;
          color: var(--aca-teal);
          font-weight: 500;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: var(--white);
          border-radius: var(--border-radius-lg);
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-lg);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--gray-100);
        }

        .modal-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--aca-navy);
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: var(--gray-400);
          border-radius: var(--border-radius);
          transition: all var(--transition-fast);
        }

        .modal-close:hover {
          background: var(--gray-100);
          color: var(--gray-600);
        }

        .modal-body {
          padding: 24px;
        }

        .modal-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: var(--error-bg);
          color: var(--error);
          border: 1px solid var(--error-border);
          border-radius: var(--border-radius);
          font-size: 13px;
          margin-bottom: 20px;
        }

        .modal-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .modal-form-row:last-child {
          margin-bottom: 0;
        }

        .modal-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .modal-form-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-600);
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 24px;
          border-top: 1px solid var(--gray-100);
          background: var(--gray-50);
        }

        @media (max-width: 640px) {
          .form-row,
          .modal-form-row {
            grid-template-columns: 1fr;
          }

          .no-students-message {
            flex-wrap: wrap;
          }

          .no-students-message .btn {
            margin-left: 0;
            margin-top: 8px;
            width: 100%;
          }

          .modal-content {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
