'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Student, Parent, BalanceTransaction } from '@/types/database'

interface StudentWithParent extends Student {
  parent: Parent
}

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [student, setStudent] = useState<StudentWithParent | null>(null)
  const [parents, setParents] = useState<Parent[]>([])
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [barcode, setBarcode] = useState('')
  const [schoolLevel, setSchoolLevel] = useState<'elementary' | 'high_school'>('elementary')
  const [parentId, setParentId] = useState('')

  // Balance update
  const [showBalanceModal, setShowBalanceModal] = useState(false)
  const [balanceAmount, setBalanceAmount] = useState('')
  const [balanceType, setBalanceType] = useState<'payment' | 'adjustment' | 'refund'>('payment')
  const [balanceNotes, setBalanceNotes] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    const [studentRes, parentsRes, transactionsRes] = await Promise.all([
      supabase.from('students').select('*, parent:parents(*)').eq('id', id).single(),
      supabase.from('parents').select('*').order('name'),
      supabase.from('balance_transactions').select('*').eq('student_id', id).order('created_at', { ascending: false }).limit(10),
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

    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

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
      fetchData()
    }

    setSaving(false)
  }

  async function handleBalanceUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!student) return

    const amount = parseFloat(balanceAmount)
    if (isNaN(amount) || amount === 0) {
      setError('Please enter a valid amount')
      return
    }

    const previousBalance = student.balance
    const newBalance = balanceType === 'refund'
      ? previousBalance - Math.abs(amount)
      : previousBalance + Math.abs(amount)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Create transaction record
    const { error: txError } = await supabase
      .from('balance_transactions')
      .insert({
        student_id: id,
        amount: balanceType === 'refund' ? -Math.abs(amount) : Math.abs(amount),
        previous_balance: previousBalance,
        new_balance: newBalance,
        transaction_type: balanceType,
        notes: balanceNotes || null,
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
    setBalanceAmount('')
    setBalanceNotes('')
    setSuccess('Balance updated successfully')
    fetchData()
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return
    }

    const { error } = await supabase.from('students').delete().eq('id', id)

    if (error) {
      setError('Failed to delete student: ' + error.message)
    } else {
      router.push('/admin/students')
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!student) {
    return <div className="error">Student not found</div>
  }

  return (
    <div className="edit-student-page">
      <div className="page-header">
        <div>
          <Link href="/admin/students" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Students
          </Link>
          <h1>Edit Student</h1>
        </div>
      </div>

      <div className="content-grid">
        <div className="main-content">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSave} className="card form-card">
            <h2>Student Information</h2>

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
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                Delete Student
              </button>
            </div>
          </form>
        </div>

        <div className="sidebar">
          <div className="card balance-card">
            <h3>Account Balance</h3>
            <div className={`balance-display ${student.balance <= 0 ? 'negative' : student.balance < 10 ? 'low' : ''}`}>
              ${student.balance.toFixed(2)}
            </div>
            <button
              className="btn btn-primary btn-full"
              onClick={() => setShowBalanceModal(true)}
            >
              Update Balance
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
                        {tx.transaction_type}
                      </span>
                      <span className="tx-date">
                        {new Date(tx.created_at!).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`tx-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                      {tx.amount >= 0 ? '+' : ''}${tx.amount.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {showBalanceModal && (
        <div className="modal-overlay" onClick={() => setShowBalanceModal(false)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h2>Update Balance</h2>
            <p className="current-balance">Current balance: <strong>${student.balance.toFixed(2)}</strong></p>

            <form onSubmit={handleBalanceUpdate}>
              <div className="form-group">
                <label>Transaction Type</label>
                <select
                  className="input"
                  value={balanceType}
                  onChange={(e) => setBalanceType(e.target.value as 'payment' | 'adjustment' | 'refund')}
                >
                  <option value="payment">Payment (Add Funds)</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="refund">Refund (Remove Funds)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Amount ($)</label>
                <input
                  type="number"
                  className="input"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Notes (optional)</label>
                <input
                  type="text"
                  className="input"
                  value={balanceNotes}
                  onChange={(e) => setBalanceNotes(e.target.value)}
                  placeholder="e.g., Cash payment"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowBalanceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Balance
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
          grid-template-columns: 1fr 300px;
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

        .balance-card {
          text-align: center;
        }

        .balance-card h3 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--gray-400);
          margin: 0 0 12px 0;
        }

        .balance-display {
          font-size: 36px;
          font-weight: 700;
          font-family: monospace;
          color: var(--success);
          margin-bottom: 16px;
        }

        .balance-display.low {
          color: var(--warning);
        }

        .balance-display.negative {
          color: var(--error);
        }

        .btn-full {
          width: 100%;
        }

        .transactions-card h3 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--gray-400);
          margin: 0 0 16px 0;
        }

        .no-transactions {
          color: var(--gray-400);
          font-size: 14px;
          text-align: center;
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
          padding: 10px 0;
          border-bottom: 1px solid var(--gray-100);
        }

        .transaction-item:last-child {
          border-bottom: none;
        }

        .tx-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tx-type {
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .tx-type.payment {
          color: var(--success);
        }

        .tx-type.refund {
          color: var(--error);
        }

        .tx-type.adjustment {
          color: var(--aca-blue);
        }

        .tx-date {
          font-size: 11px;
          color: var(--gray-400);
        }

        .tx-amount {
          font-family: monospace;
          font-weight: 600;
        }

        .tx-amount.positive {
          color: var(--success);
        }

        .tx-amount.negative {
          color: var(--error);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          width: 100%;
          max-width: 420px;
          animation: fadeIn 0.2s ease;
        }

        .modal h2 {
          margin: 0 0 8px 0;
          font-size: 20px;
        }

        .current-balance {
          color: var(--gray-500);
          margin: 0 0 24px 0;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .modal-actions .btn {
          flex: 1;
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
