'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getParentsWithStudents, type ParentWithStudents } from '@/actions/parents'
import { getSettingsForClient, type SerializedAppSettings } from '@/actions/settings'
import { calculateLunches } from '@/lib/parent-portal'
import type { SchoolLevel } from '@prisma/client'

interface StudentAmount {
  studentId: string
  amount: string
  isLunchCard: boolean
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'cashapp', label: 'Cash App' },
  { value: 'zeffy', label: 'Zeffy' },
  { value: 'other', label: 'Other' },
]

function AddPaymentContent() {
  const searchParams = useSearchParams()
  const preselectedParentId = searchParams.get('parent')

  const [parents, setParents] = useState<ParentWithStudents[]>([])
  const [selectedParent, setSelectedParent] = useState<ParentWithStudents | null>(null)
  const [settings, setSettings] = useState<SerializedAppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [amounts, setAmounts] = useState<StudentAmount[]>([])
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSelectParent = useCallback((parent: ParentWithStudents) => {
    setSelectedParent(parent)
    // Only set amounts for active students
    const activeStudents = parent.students.filter(s => s.isActive)
    setAmounts(activeStudents.map(s => ({
      studentId: s.id,
      amount: '',
      isLunchCard: false
    })))
    setMessage(null)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [parentsData, settingsData] = await Promise.all([
        getParentsWithStudents(),
        getSettingsForClient()
      ])

      setParents(parentsData)
      // Update selected parent with fresh data
      setSelectedParent(prev => {
        if (prev) {
          const updatedParent = parentsData.find((p) => p.id === prev.id)
          if (updatedParent) {
            return updatedParent
          }
        }
        return prev
      })

      if (settingsData) {
        setSettings(settingsData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (preselectedParentId && parents.length > 0 && !selectedParent) {
      const parent = parents.find(p => p.id === preselectedParentId)
      if (parent) {
        handleSelectParent(parent)
      }
    }
  }, [preselectedParentId, parents, selectedParent, handleSelectParent])

  function updateAmount(studentId: string, value: string, isLunchCard: boolean = false) {
    setAmounts(prev => prev.map(a =>
      a.studentId === studentId
        ? { ...a, amount: value, isLunchCard }
        : a
    ))
  }

  function addQuickAmount(studentId: string, addValue: number) {
    setAmounts(prev => prev.map(a => {
      if (a.studentId !== studentId) return a
      const current = parseFloat(a.amount) || 0
      return { ...a, amount: (current + addValue).toFixed(2), isLunchCard: false }
    }))
  }

  function setLunchCard(studentId: string) {
    if (!settings) return
    setAmounts(prev => prev.map(a =>
      a.studentId === studentId
        ? { ...a, amount: Number(settings.highschoolLunchCardPrice).toFixed(2), isLunchCard: true }
        : a
    ))
  }

  function getStudentAmount(studentId: string): StudentAmount {
    return amounts.find(a => a.studentId === studentId) || { studentId: studentId, amount: '', isLunchCard: false }
  }

  function getTotal(): number {
    return amounts.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)
  }

  function getPaymentItems() {
    if (!selectedParent || !settings) return []

    return amounts
      .filter(a => parseFloat(a.amount) > 0)
      .map(a => {
        const student = selectedParent.students.find(s => s.id === a.studentId)!
        const amount = parseFloat(a.amount)
        const lunches = calculateLunches(amount, student.schoolLevel as 'elementary' | 'high_school', settings, a.isLunchCard)
        return {
          studentId: a.studentId,
          studentName: student.name,
          amount,
          lunchesToAdd: lunches,
          isLunchCard: a.isLunchCard,
          newBalance: student.balance + lunches
        }
      })
  }

  async function handleSubmit() {
    if (!selectedParent || getTotal() === 0) return

    setSubmitting(true)
    setMessage(null)

    try {
      // Convert to API format (snake_case for backwards compatibility until API is migrated)
      const paymentItems = getPaymentItems().map(item => ({
        student_id: item.studentId,
        student_name: item.studentName,
        amount: item.amount,
        lunches_to_add: item.lunchesToAdd,
        is_lunch_card: item.isLunchCard,
        new_balance: item.newBalance
      }))

      const res = await fetch('/api/admin/cash-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: selectedParent.id,
          student_payments: paymentItems,
          total_amount: getTotal(),
          payment_method: paymentMethod,
          notes: notes || null
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to process payment' })
        setSubmitting(false)
        return
      }

      setMessage({ type: 'success', text: 'Payment recorded successfully! Receipt email sent to parent.' })

      // Reset form (only active students)
      setAmounts(selectedParent.students.filter(s => s.isActive).map(s => ({
        studentId: s.id,
        amount: '',
        isLunchCard: false
      })))
      setNotes('')
      setPaymentMethod('cash')

      // Refresh data to show updated balances
      fetchData()
    } catch {
      setMessage({ type: 'error', text: 'Failed to process payment. Please try again.' })
    }

    setSubmitting(false)
  }

  // Only show active parents with active students
  const filteredParents = parents.filter(p =>
    p.isActive &&
    p.students.some(s => s.isActive) &&
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const total = getTotal()
  const paymentItems = getPaymentItems()

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
            padding: 80px;
            gap: 16px;
            color: var(--gray-400);
          }
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid var(--gray-100);
            border-top-color: var(--aca-blue);
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
    <div className="add-payment-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <h1>Add Payment</h1>
            <p className="subtitle">Record payments received from parents</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="payment-layout">
        <div className="parent-selector">
          <h2>Select Parent</h2>
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="parent-list">
            {filteredParents.map(parent => (
              <button
                key={parent.id}
                className={`parent-item ${selectedParent?.id === parent.id ? 'selected' : ''}`}
                onClick={() => handleSelectParent(parent)}
              >
                <div className="parent-avatar">
                  {parent.name.charAt(0).toUpperCase()}
                </div>
                <div className="parent-info">
                  <span className="parent-name">{parent.name}</span>
                  <span className="parent-email">{parent.email}</span>
                  <span className="student-count">{parent.students.filter(s => s.isActive).length} student{parent.students.filter(s => s.isActive).length !== 1 ? 's' : ''}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="payment-form">
          {!selectedParent ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p>Select a parent to enter payment</p>
            </div>
          ) : (
            <>
              <div className="selected-parent-header">
                <h2>Payment for {selectedParent.name}</h2>
                <button className="btn-link" onClick={() => setSelectedParent(null)}>
                  Change Parent
                </button>
              </div>

              <div className="students-list">
                {selectedParent.students.filter(s => s.isActive).map(student => {
                  const studentAmount = getStudentAmount(student.id)
                  const amount = parseFloat(studentAmount.amount) || 0
                  const lunches = amount > 0 && settings
                    ? calculateLunches(amount, student.schoolLevel as 'elementary' | 'high_school', settings, studentAmount.isLunchCard)
                    : 0
                  const pricePerLunch = settings
                    ? (student.schoolLevel === 'elementary'
                        ? Number(settings.elementaryLunchPrice)
                        : Number(settings.highschoolLunchPrice))
                    : 0
                  const newBalance = student.balance + lunches

                  return (
                    <div key={student.id} className="student-card">
                      <div className="student-header">
                        <div className="student-avatar">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="student-info">
                          <h3>{student.name}</h3>
                          <span className="school-level">
                            {student.schoolLevel === 'elementary' ? 'Elementary' : 'High School'} • ${pricePerLunch.toFixed(2)}/lunch
                          </span>
                        </div>
                      </div>

                      <div className="balance-display">
                        <div className="balance-row">
                          <span className="balance-label">Current balance</span>
                          <span className="balance-dots"></span>
                          <span className={`balance-value ${student.balance <= 0 ? 'negative' : ''}`}>
                            {student.balance} lunches
                          </span>
                          <span className={`status-dot ${student.balance <= 0 ? 'negative' : 'good'}`}></span>
                        </div>
                        {lunches > 0 && (
                          <>
                            <div className="balance-row adding">
                              <span className="balance-label">Adding</span>
                              <span className="balance-dots"></span>
                              <span className="balance-value add">+{lunches} lunches</span>
                            </div>
                            <div className="balance-divider"></div>
                            <div className="balance-row new">
                              <span className="balance-label">New balance</span>
                              <span className="balance-dots"></span>
                              <span className="balance-value">{newBalance} lunches</span>
                              <span className="status-dot good"></span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="add-funds">
                        <label>Amount</label>
                        <div className="amount-input-wrapper">
                          <span className="dollar-sign">$</span>
                          <input
                            type="number"
                            className="amount-input"
                            placeholder="0.00"
                            value={studentAmount.amount}
                            onChange={e => updateAmount(student.id, e.target.value)}
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div className="quick-amounts">
                          <button type="button" onClick={() => addQuickAmount(student.id, 20)}>+$20</button>
                          <button type="button" onClick={() => addQuickAmount(student.id, 50)}>+$50</button>
                          <button type="button" onClick={() => addQuickAmount(student.id, 100)}>+$100</button>
                          {student.schoolLevel === 'high_school' && settings && (
                            <button
                              type="button"
                              className={`lunch-card-btn ${studentAmount.isLunchCard ? 'active' : ''}`}
                              onClick={() => setLunchCard(student.id)}
                            >
                              Lunch Card ${Number(settings.highschoolLunchCardPrice)}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {total > 0 && (
                <div className="payment-summary">
                  <h3>Payment Summary</h3>
                  <div className="summary-items">
                    {paymentItems.map(item => (
                      <div key={item.studentId} className="summary-item">
                        <span>{item.studentName}</span>
                        <span>
                          ${item.amount.toFixed(2)} ({item.lunchesToAdd} {item.lunchesToAdd === 1 ? 'lunch' : 'lunches'})
                          {item.isLunchCard && <span className="lunch-card-tag">Card</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="summary-total">
                    <span>Total Payment</span>
                    <span>${total.toFixed(2)}</span>
                  </div>

                  <div className="payment-method-field">
                    <label>Payment Method</label>
                    <div className="payment-method-options">
                      {PAYMENT_METHODS.map(method => (
                        <button
                          key={method.value}
                          type="button"
                          className={`method-btn ${paymentMethod === method.value ? 'active' : ''}`}
                          onClick={() => setPaymentMethod(method.value)}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="notes-field">
                    <label>Notes (optional)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g., Check #1234, Receipt #567"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>

                  <button
                    className="btn btn-primary submit-btn"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? 'Processing...' : `Record Payment - $${total.toFixed(2)}`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .add-payment-page {
          max-width: 1200px;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--success-bg) 0%, var(--white) 100%);
          border: 1px solid var(--success-border);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--success);
        }

        h1 {
          font-size: 26px;
          margin: 0;
          color: var(--aca-navy);
        }

        .subtitle {
          color: var(--gray-400);
          margin: 2px 0 0 0;
          font-size: 14px;
        }

        .alert {
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
        }

        .payment-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 24px;
        }

        .parent-selector {
          background: var(--white);
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--gray-200);
          padding: 20px;
          height: fit-content;
        }

        .parent-selector h2 {
          font-size: 16px;
          margin: 0 0 16px 0;
          color: var(--gray-700);
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--gray-50);
          border: 1px solid var(--gray-200);
          border-radius: var(--border-radius);
          padding: 10px 14px;
          margin-bottom: 16px;
        }

        .search-box svg {
          color: var(--gray-400);
          flex-shrink: 0;
        }

        .search-input {
          border: none;
          background: transparent;
          width: 100%;
          font-size: 14px;
          outline: none;
          color: var(--gray-700);
        }

        .search-input::placeholder {
          color: var(--gray-400);
        }

        .parent-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 500px;
          overflow-y: auto;
        }

        .parent-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--gray-50);
          border: 2px solid transparent;
          border-radius: var(--border-radius);
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .parent-item:hover {
          background: var(--gray-100);
        }

        .parent-item.selected {
          background: var(--aca-blue-subtle);
          border-color: var(--aca-blue);
        }

        .parent-avatar {
          width: 40px;
          height: 40px;
          background: var(--aca-blue);
          color: var(--white);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          flex-shrink: 0;
        }

        .parent-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .parent-name {
          font-weight: 600;
          color: var(--gray-700);
          font-size: 14px;
        }

        .parent-email {
          font-size: 12px;
          color: var(--gray-500);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .student-count {
          font-size: 11px;
          color: var(--gray-400);
          margin-top: 2px;
        }

        .payment-form {
          background: var(--white);
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--gray-200);
          padding: 24px;
          min-height: 400px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: var(--gray-400);
          gap: 16px;
        }

        .empty-state p {
          margin: 0;
          font-size: 15px;
        }

        .selected-parent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .selected-parent-header h2 {
          font-size: 18px;
          margin: 0;
          color: var(--aca-navy);
        }

        .btn-link {
          background: none;
          border: none;
          color: var(--aca-blue);
          cursor: pointer;
          font-size: 14px;
        }

        .btn-link:hover {
          text-decoration: underline;
        }

        .students-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .student-card {
          background: var(--gray-50);
          border-radius: var(--border-radius);
          padding: 20px;
        }

        .student-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .student-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #002c5f 0%, #1e4a7a 100%);
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 600;
        }

        .student-info h3 {
          margin: 0;
          font-size: 16px;
          color: var(--gray-700);
        }

        .school-level {
          font-size: 13px;
          color: var(--gray-500);
        }

        .balance-display {
          background: var(--white);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .balance-row {
          display: flex;
          align-items: center;
          padding: 6px 0;
        }

        .balance-label {
          font-size: 13px;
          color: var(--gray-600);
          flex-shrink: 0;
        }

        .balance-dots {
          flex: 1;
          border-bottom: 2px dotted var(--gray-200);
          margin: 0 12px;
          min-width: 20px;
        }

        .balance-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-700);
          flex-shrink: 0;
        }

        .balance-value.negative {
          color: var(--error);
        }

        .balance-value.add {
          color: var(--success);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-left: 8px;
          flex-shrink: 0;
        }

        .status-dot.good {
          background: var(--success);
        }

        .status-dot.negative {
          background: var(--error);
        }

        .balance-row.adding {
          opacity: 0.8;
        }

        .balance-divider {
          height: 1px;
          background: var(--gray-200);
          margin: 8px 0;
        }

        .balance-row.new .balance-value {
          font-size: 15px;
        }

        .add-funds label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-600);
          margin-bottom: 8px;
        }

        .amount-input-wrapper {
          display: flex;
          align-items: center;
          background: var(--white);
          border: 2px solid var(--gray-200);
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .dollar-sign {
          padding: 12px 0 12px 14px;
          color: var(--gray-400);
          font-weight: 500;
        }

        .amount-input {
          flex: 1;
          border: none;
          padding: 12px 14px 12px 4px;
          font-size: 18px;
          font-weight: 600;
          outline: none;
          width: 100%;
        }

        .quick-amounts {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .quick-amounts button {
          padding: 8px 16px;
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-600);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .quick-amounts button:hover {
          background: var(--gray-100);
          border-color: var(--gray-300);
        }

        .lunch-card-btn {
          background: var(--aca-gold-subtle) !important;
          border-color: var(--aca-gold) !important;
          color: var(--aca-gold-dark) !important;
        }

        .lunch-card-btn.active {
          background: var(--aca-gold) !important;
          color: white !important;
        }

        .payment-summary {
          background: var(--gray-50);
          border-radius: var(--border-radius);
          padding: 20px;
          margin-top: 24px;
        }

        .payment-summary h3 {
          margin: 0 0 16px 0;
          font-size: 15px;
          color: var(--gray-700);
        }

        .summary-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: var(--gray-600);
        }

        .lunch-card-tag {
          display: inline-block;
          background: var(--aca-gold-subtle);
          color: var(--aca-gold-dark);
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 6px;
        }

        .summary-total {
          display: flex;
          justify-content: space-between;
          padding-top: 16px;
          border-top: 1px solid var(--gray-200);
          font-weight: 700;
          font-size: 16px;
          color: var(--gray-700);
        }

        .payment-method-field {
          margin-top: 16px;
        }

        .payment-method-field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-600);
          margin-bottom: 8px;
        }

        .payment-method-options {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .method-btn {
          padding: 8px 16px;
          background: var(--white);
          border: 2px solid var(--gray-200);
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-600);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .method-btn:hover {
          background: var(--gray-50);
          border-color: var(--gray-300);
        }

        .method-btn.active {
          background: var(--aca-blue-subtle);
          border-color: var(--aca-blue);
          color: var(--aca-blue);
        }

        .notes-field {
          margin-top: 16px;
        }

        .notes-field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-600);
          margin-bottom: 6px;
        }

        .submit-btn {
          width: 100%;
          margin-top: 20px;
          padding: 14px;
          font-size: 15px;
        }

        @media (max-width: 900px) {
          .payment-layout {
            grid-template-columns: 1fr;
          }

          .parent-list {
            max-height: 200px;
          }
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 22px;
          }

          .header-icon {
            width: 40px;
            height: 40px;
          }

          .header-icon svg {
            width: 20px;
            height: 20px;
          }

          .parent-selector,
          .payment-form {
            padding: 16px;
          }

          .student-card {
            padding: 16px;
          }

          .student-header {
            gap: 10px;
          }

          .student-avatar {
            width: 42px;
            height: 42px;
            font-size: 18px;
          }

          .student-info h3 {
            font-size: 15px;
          }

          .school-level {
            font-size: 12px;
          }

          .balance-display {
            padding: 14px;
          }

          .balance-label {
            font-size: 12px;
          }

          .balance-value {
            font-size: 13px;
          }

          .quick-amounts {
            gap: 6px;
          }

          .quick-amounts button {
            padding: 7px 12px;
            font-size: 12px;
          }

          .payment-summary {
            padding: 16px;
          }

          .payment-summary h3 {
            font-size: 14px;
          }

          .summary-item {
            font-size: 13px;
          }

          .summary-total {
            font-size: 15px;
          }

          .payment-method-options {
            gap: 6px;
          }

          .method-btn {
            padding: 7px 12px;
            font-size: 12px;
          }

          .selected-parent-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .selected-parent-header h2 {
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .parent-selector,
          .payment-form {
            padding: 12px;
          }

          .parent-item {
            padding: 10px;
          }

          .parent-avatar {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }

          .parent-name {
            font-size: 13px;
          }

          .parent-email {
            font-size: 11px;
          }

          .student-card {
            padding: 14px;
          }

          .student-avatar {
            width: 38px;
            height: 38px;
            font-size: 16px;
          }

          .amount-input {
            font-size: 16px;
          }

          .quick-amounts button {
            padding: 6px 10px;
            font-size: 11px;
          }

          .lunch-card-btn {
            font-size: 10px !important;
          }

          .submit-btn {
            font-size: 14px;
            padding: 12px;
          }
        }
      `}</style>
    </div>
  )
}

export default function AddPaymentPage() {
  return (
    <Suspense fallback={
      <div className="loading-container">
        <div className="loading-spinner" />
        <span>Loading...</span>
        <style jsx>{`
          .loading-container {
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
            border-top-color: var(--aca-blue);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    }>
      <AddPaymentContent />
    </Suspense>
  )
}
