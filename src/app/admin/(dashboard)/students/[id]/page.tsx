'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { addLunchesFromPayment, getSettings, LunchSettings } from '@/lib/supabase'
import type { Student, Parent, BalanceTransaction } from '@/types/database'

interface StudentWithParent extends Student {
  parent: Parent
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [student, setStudent] = useState<StudentWithParent | null>(null)
  const [parents, setParents] = useState<Parent[]>([])
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([])
  const [settings, setSettings] = useState<LunchSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [barcode, setBarcode] = useState('')
  const [schoolLevel, setSchoolLevel] = useState<'elementary' | 'high_school'>('elementary')
  const [parentId, setParentId] = useState('')

  // Balance update
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentType, setPaymentType] = useState<'payment' | 'lunch_card' | 'adjustment'>('payment')
  const [paymentNotes, setPaymentNotes] = useState('')

  const router = useRouter()

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const [studentRes, parentsRes, transactionsRes, settingsData] = await Promise.all([
      supabase.from('students').select('*, parent:parents(*)').eq('id', id).single(),
      supabase.from('parents').select('*').order('name'),
      supabase.from('balance_transactions').select('*').eq('student_id', id).order('created_at', { ascending: false }).limit(10),
      getSettings(),
    ])

    if (studentRes.data) {
      const s = studentRes.data as StudentWithParent
      setStudent(s)
      setName(s.name)
      setBarcode(s.barcode)
      setSchoolLevel(s.school_level)
      setParentId(s.parent_id)
    }

    if (parentsRes.data) {
      setParents(parentsRes.data)
    }

    if (transactionsRes.data) {
      setTransactions(transactionsRes.data)
    }

    if (settingsData) {
      setSettings(settingsData)
    }

    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('students')
      .update({
        name,
        barcode,
        school_level: schoolLevel,
        parent_id: parentId,
      })
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Student updated successfully')
      setIsEditing(false)
      fetchData()
    }

    setSaving(false)
  }

  const handleCancelEdit = () => {
    // Reset form fields to original values
    if (student) {
      setName(student.name)
      setBarcode(student.barcode)
      setSchoolLevel(student.school_level)
      setParentId(student.parent_id)
    }
    setIsEditing(false)
    setError(null)
  }

  async function handleBalanceUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!student || !settings) return

    let amount = parseFloat(paymentAmount)

    // For lunch card, use the fixed price
    if (paymentType === 'lunch_card') {
      amount = settings.highschool_lunch_card_price
    }

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    const result = await addLunchesFromPayment(
      student.id,
      student.school_level,
      student.balance,
      amount,
      paymentType === 'lunch_card'
    )

    if (!result.success) {
      setError(result.error || 'Failed to update balance')
      return
    }

    setShowBalanceModal(false)
    setPaymentAmount('')
    setPaymentNotes('')
    setPaymentType('payment')
    setSuccess(`Added ${result.lunchesAdded} lunches (paid $${amount.toFixed(2)})`)
    fetchData()
  }

  async function handleManualAdjustment(e: React.FormEvent) {
    e.preventDefault()
    if (!student) return

    const lunches = parseInt(paymentAmount)
    if (isNaN(lunches) || lunches === 0) {
      setError('Please enter a valid number of lunches')
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const previousBalance = student.balance
    const newBalance = previousBalance + lunches

    // Create transaction record
    const { error: txError } = await supabase
      .from('balance_transactions')
      .insert({
        student_id: id,
        lunches_change: lunches,
        previous_lunches: previousBalance,
        new_lunches: newBalance,
        transaction_type: 'adjustment',
        notes: paymentNotes || 'Manual adjustment',
        created_by: user?.id || null,
      })

    if (txError) {
      setError('Failed to create transaction: ' + txError.message)
      return
    }

    // Update student balance
    const { error: updateError } = await supabase
      .from('students')
      .update({ balance: newBalance })
      .eq('id', id)

    if (updateError) {
      setError('Failed to update balance: ' + updateError.message)
      return
    }

    setShowBalanceModal(false)
    setPaymentAmount('')
    setPaymentNotes('')
    setPaymentType('payment')
    setSuccess(`Balance adjusted by ${lunches > 0 ? '+' : ''}${lunches} lunches`)
    fetchData()
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from('students').delete().eq('id', id)

    if (error) {
      setError('Failed to delete student: ' + error.message)
    } else {
      router.push('/admin/students')
    }
  }

  // Calculate lunches from payment amount
  const calculateLunches = () => {
    if (!settings || !student) return 0
    if (paymentType === 'lunch_card') return settings.highschool_lunch_card_lunches
    const amount = parseFloat(paymentAmount) || 0
    const price = student.school_level === 'elementary'
      ? settings.elementary_lunch_price
      : settings.highschool_lunch_price
    return Math.floor(amount / price)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <span>Loading student...</span>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="error-container">
        <div className="error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p>Student not found</p>
        <Link href="/admin/students" className="btn btn-outline">Back to Students</Link>
      </div>
    )
  }

  const lunchPrice = settings
    ? (student.school_level === 'elementary' ? settings.elementary_lunch_price : settings.highschool_lunch_price)
    : 0

  return (
    <div className="edit-student-page">
      <div className="page-header">
        <div className="header-content">
          <Link href="/admin/students" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0, display: 'inline-block', verticalAlign: '-2px', marginRight: 8 }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Back to Students</span>
          </Link>
          <div className="header-title-row">
            <div className="student-avatar-large">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1>{student.name}</h1>
              <p className="subtitle">
                <span className={`level-badge ${student.school_level}`}>
                  {student.school_level === 'elementary' ? 'Elementary' : 'High School'}
                </span>
                <span className="barcode-badge">{student.barcode}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="main-content">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {isEditing ? (
            <form onSubmit={handleSave} className="card form-card">
              <h2>Edit Student Information</h2>

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

              <div className="form-row">
                <div className="form-group">
                  <label>Barcode</label>
                  <input
                    type="text"
                    className="input"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
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

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="card detail-card">
              <div className="detail-header">
                <h2>Student Information</h2>
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
                  <span className="detail-value">{student.name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Barcode</span>
                  <span className="detail-value">
                    <code className="barcode-display">{student.barcode}</code>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">School Level</span>
                  <span className="detail-value">
                    <span className={`level-badge ${student.school_level}`}>
                      {student.school_level === 'elementary' ? 'Elementary' : 'High School'}
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Parent</span>
                  <span className="detail-value">
                    <Link href={`/admin/parents/${student.parent_id}`} className="parent-link">
                      {student.parent.name}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </span>
                </div>
              </div>

              <div className="detail-actions">
                <button type="button" className="btn btn-danger-outline" onClick={handleDelete}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete Student
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar">
          <div className="card balance-card">
            <h3>Lunch Balance</h3>
            <div className={`balance-display ${student.balance <= 0 ? 'negative' : student.balance <= 3 ? 'low' : ''}`}>
              {student.balance}
              <span className="balance-unit">{student.balance === 1 ? 'lunch' : 'lunches'}</span>
            </div>
            <p className="price-info">${lunchPrice.toFixed(2)} per lunch</p>
            <button
              className="btn btn-primary btn-full"
              onClick={() => setShowBalanceModal(true)}
            >
              Add Lunches
            </button>
          </div>

          <div className="card transactions-card">
            <h3>Recent Transactions</h3>
            {transactions.length === 0 ? (
              <p className="no-transactions">No transactions yet</p>
            ) : (
              <ul className="transactions-list">
                {transactions.map((tx) => (
                  <li key={tx.id} className="transaction-item">
                    <div className="tx-info">
                      <span className={`tx-type ${tx.transaction_type}`}>
                        {tx.transaction_type === 'lunch_used' ? 'Used' : tx.transaction_type}
                      </span>
                      <span className="tx-date">
                        {new Date(tx.created_at!).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`tx-amount ${tx.lunches_change >= 0 ? 'positive' : 'negative'}`}>
                      {tx.lunches_change >= 0 ? '+' : ''}{tx.lunches_change}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {showBalanceModal && settings && (
        <div className="modal-overlay" onClick={() => setShowBalanceModal(false)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h2>Add Lunches</h2>
            <p className="current-balance">
              Current balance: <strong>{student.balance} {student.balance === 1 ? 'lunch' : 'lunches'}</strong>
            </p>

            <form onSubmit={paymentType === 'adjustment' ? handleManualAdjustment : handleBalanceUpdate}>
              <div className="form-group">
                <label>Payment Type</label>
                <select
                  className="input"
                  value={paymentType}
                  onChange={(e) => {
                    setPaymentType(e.target.value as 'payment' | 'lunch_card' | 'adjustment')
                    setPaymentAmount('')
                  }}
                >
                  <option value="payment">Cash Payment</option>
                  {student.school_level === 'high_school' && (
                    <option value="lunch_card">Lunch Card ($50 for 10 lunches)</option>
                  )}
                  <option value="adjustment">Manual Adjustment</option>
                </select>
              </div>

              {paymentType === 'payment' && (
                <div className="form-group">
                  <label>Amount Paid ($)</label>
                  <input
                    type="number"
                    className="input"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    required
                  />
                  {parseFloat(paymentAmount) > 0 && (
                    <p className="lunch-preview">
                      = <strong>{calculateLunches()} lunches</strong> at ${lunchPrice.toFixed(2)} each
                    </p>
                  )}
                </div>
              )}

              {paymentType === 'lunch_card' && (
                <div className="lunch-card-info">
                  <div className="lunch-card-details">
                    <span className="lunch-card-price">${settings.highschool_lunch_card_price.toFixed(2)}</span>
                    <span className="lunch-card-value">{settings.highschool_lunch_card_lunches} lunches</span>
                  </div>
                  <p className="lunch-card-savings">
                    ${(settings.highschool_lunch_card_price / settings.highschool_lunch_card_lunches).toFixed(2)} per lunch (save ${(settings.highschool_lunch_price - settings.highschool_lunch_card_price / settings.highschool_lunch_card_lunches).toFixed(2)} per lunch)
                  </p>
                </div>
              )}

              {paymentType === 'adjustment' && (
                <div className="form-group">
                  <label>Lunches to Add/Remove</label>
                  <input
                    type="number"
                    className="input"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter positive or negative number"
                    required
                  />
                  <p className="adjustment-hint">Use negative number to remove lunches</p>
                </div>
              )}

              <div className="form-group">
                <label>Notes (optional)</label>
                <input
                  type="text"
                  className="input"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g., Cash payment"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowBalanceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {paymentType === 'adjustment' ? 'Adjust Balance' : 'Add Lunches'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .edit-student-page {
          max-width: 1000px;
        }

        .loading-container,
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px;
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

        .error-icon {
          color: var(--gray-300);
          margin-bottom: 8px;
        }

        .page-header {
          margin-bottom: 28px;
        }

        .header-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--gray-400);
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          padding: 6px 12px;
          margin: -6px -12px;
          border-radius: var(--border-radius-sm);
          transition: all var(--transition-fast);
        }

        .back-link:hover {
          color: var(--aca-teal);
          background: var(--aca-teal-subtle);
        }

        .back-link svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          transition: transform var(--transition-fast);
        }

        .back-link:hover svg {
          transform: translateX(-3px);
        }

        .header-title-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .student-avatar-large {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, var(--aca-teal) 0%, var(--aca-teal-dark) 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--white);
          font-weight: 600;
          font-size: 22px;
          box-shadow: 0 4px 12px rgba(0, 177, 193, 0.3);
        }

        h1 {
          font-size: 26px;
          margin: 0;
          color: var(--aca-navy);
          letter-spacing: -0.02em;
        }

        .subtitle {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 6px 0 0 0;
        }

        .level-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 600;
        }

        .level-badge.elementary {
          background: #dbeafe;
          color: #1e40af;
        }

        .level-badge.high_school {
          background: var(--aca-gold-subtle);
          color: var(--aca-gold-dark);
        }

        .barcode-badge {
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 12px;
          color: var(--gray-400);
          background: var(--gray-100);
          padding: 4px 10px;
          border-radius: var(--border-radius-sm);
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

        .form-card h2,
        .detail-card h2 {
          font-size: 17px;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .detail-card {
          padding: 24px;
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--gray-100);
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

        .barcode-display {
          background: var(--gray-100);
          padding: 6px 12px;
          border-radius: var(--border-radius-sm);
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 14px;
          color: var(--aca-teal);
        }

        .parent-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--aca-teal);
          text-decoration: none;
          font-weight: 500;
          transition: all var(--transition-fast);
        }

        .parent-link:hover {
          color: var(--aca-teal-dark);
        }

        .parent-link svg {
          transition: transform var(--transition-fast);
        }

        .parent-link:hover svg {
          transform: translateX(2px);
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

        .form-card h2 {
          margin-bottom: 24px;
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

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--gray-100);
        }

        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .balance-card {
          text-align: center;
          padding: 28px 24px;
          background: linear-gradient(135deg, var(--gray-50) 0%, var(--white) 100%);
        }

        .balance-card h3 {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--gray-400);
          margin: 0 0 16px 0;
          font-weight: 600;
        }

        .balance-display {
          font-size: 48px;
          font-weight: 700;
          color: var(--success);
          margin-bottom: 4px;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .balance-unit {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: var(--gray-400);
          margin-top: 4px;
        }

        .balance-display.low {
          color: var(--error);
        }

        .balance-display.negative {
          color: var(--error);
        }

        .price-info {
          font-size: 13px;
          color: var(--gray-400);
          margin: 12px 0 20px;
        }

        .btn-full {
          width: 100%;
        }

        .transactions-card {
          padding: 20px;
        }

        .transactions-card h3 {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--gray-400);
          margin: 0 0 16px 0;
          font-weight: 600;
        }

        .no-transactions {
          color: var(--gray-400);
          font-size: 14px;
          text-align: center;
          padding: 20px;
        }

        .transactions-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .transaction-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--gray-100);
        }

        .transaction-item:last-child {
          border-bottom: none;
        }

        .tx-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .tx-type {
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .tx-type.payment, .tx-type.lunch_card {
          color: var(--success);
        }

        .tx-type.refund, .tx-type.lunch_used {
          color: var(--error);
        }

        .tx-type.adjustment {
          color: var(--aca-teal);
        }

        .tx-date {
          font-size: 11px;
          color: var(--gray-400);
        }

        .tx-amount {
          font-family: 'SF Mono', Monaco, monospace;
          font-weight: 600;
          font-size: 14px;
          padding: 4px 8px;
          border-radius: var(--border-radius-sm);
        }

        .tx-amount.positive {
          color: var(--success);
          background: var(--success-bg);
        }

        .tx-amount.negative {
          color: var(--error);
          background: var(--error-bg);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: overlayEnter 0.2s ease-out;
        }

        .modal {
          width: 100%;
          max-width: 440px;
          animation: modalEnter 0.3s ease-out;
          padding: 32px;
        }

        .modal h2 {
          margin: 0 0 8px 0;
          font-size: 20px;
          color: var(--aca-navy);
        }

        .current-balance {
          color: var(--gray-500);
          margin: 0 0 28px 0;
          font-size: 15px;
        }

        .current-balance strong {
          color: var(--gray-700);
        }

        .lunch-preview {
          margin: 8px 0 0;
          font-size: 14px;
          color: var(--success);
        }

        .lunch-preview strong {
          font-weight: 600;
        }

        .lunch-card-info {
          background: linear-gradient(135deg, var(--aca-gold-subtle) 0%, #fef3c7 100%);
          border: 2px solid var(--aca-gold);
          border-radius: var(--border-radius);
          padding: 20px;
          margin-bottom: 20px;
        }

        .lunch-card-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .lunch-card-price {
          font-size: 24px;
          font-weight: 700;
          color: var(--aca-gold-dark);
        }

        .lunch-card-value {
          font-size: 18px;
          font-weight: 600;
          color: var(--aca-navy);
        }

        .lunch-card-savings {
          font-size: 13px;
          color: var(--success);
          margin: 0;
        }

        .adjustment-hint {
          font-size: 12px;
          color: var(--gray-400);
          margin: 6px 0 0;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 28px;
        }

        .modal-actions .btn {
          flex: 1;
          padding: 14px 24px;
        }
      `}</style>
    </div>
  )
}
