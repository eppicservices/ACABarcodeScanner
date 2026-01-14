'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { ParentWithStudents, AppSettings, Student, StudentPaymentItem } from '@/types/database'
import { getDaysUntilExpiry, calculateLunches } from '@/lib/parent-portal'

interface StudentAmount {
  student_id: string
  amount: string
  isLunchCard: boolean
}

export default function ParentPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [parent, setParent] = useState<ParentWithStudents | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [amounts, setAmounts] = useState<StudentAmount[]>([])
  const [submitting, setSubmitting] = useState(false)

  const validateToken = useCallback(async () => {
    try {
      const res = await fetch(`/api/parent-portal/validate/${token}`)
      const data = await res.json()

      if (!data.valid) {
        setError(data.error || 'Invalid link')
        setLoading(false)
        return
      }

      setParent(data.parent)
      setSettings(data.settings)
      setExpiresAt(data.expiresAt)

      // Initialize amounts for each student
      setAmounts(data.parent.students.map((s: Student) => ({
        student_id: s.id,
        amount: '',
        isLunchCard: false
      })))

      setLoading(false)
    } catch {
      setError('Failed to load. Please try again.')
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    validateToken()
  }, [validateToken])

  function updateAmount(studentId: string, value: string, isLunchCard: boolean = false) {
    setAmounts(prev => prev.map(a =>
      a.student_id === studentId
        ? { ...a, amount: value, isLunchCard }
        : a
    ))
  }

  function addQuickAmount(studentId: string, addValue: number) {
    setAmounts(prev => prev.map(a => {
      if (a.student_id !== studentId) return a
      const current = parseFloat(a.amount) || 0
      return { ...a, amount: (current + addValue).toFixed(2), isLunchCard: false }
    }))
  }

  function setLunchCard(studentId: string) {
    if (!settings) return
    setAmounts(prev => prev.map(a =>
      a.student_id === studentId
        ? { ...a, amount: settings.highschool_lunch_card_price.toFixed(2), isLunchCard: true }
        : a
    ))
  }

  function getStudentAmount(studentId: string): StudentAmount {
    return amounts.find(a => a.student_id === studentId) || { student_id: studentId, amount: '', isLunchCard: false }
  }

  function getTotal(): number {
    return amounts.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0)
  }

  // Calculate minimum payment required to cover negative balance
  function getMinimumPayment(student: Student): number {
    if (!settings || student.balance >= 0) return 0
    const pricePerLunch = student.school_level === 'elementary'
      ? settings.elementary_lunch_price
      : settings.highschool_lunch_price
    // Need enough to cover the negative balance (e.g., -3 lunches * $4 = $12 minimum)
    return Math.abs(student.balance) * pricePerLunch
  }

  // Check if all negative balances are covered
  function hasUnmetMinimums(): boolean {
    if (!parent || !settings) return false
    return parent.students.some(student => {
      if (student.balance >= 0) return false
      const studentAmount = getStudentAmount(student.id)
      const amount = parseFloat(studentAmount.amount) || 0
      const minimum = getMinimumPayment(student)
      return amount > 0 && amount < minimum
    })
  }

  function getPaymentItems(): StudentPaymentItem[] {
    if (!settings || !parent) return []

    return amounts
      .filter(a => parseFloat(a.amount) > 0)
      .map(a => {
        const student = parent.students.find(s => s.id === a.student_id)!
        const amount = parseFloat(a.amount)
        const lunches = calculateLunches(amount, student.school_level, settings, a.isLunchCard)
        return {
          student_id: a.student_id,
          student_name: student.name,
          amount,
          lunches_to_add: lunches,
          is_lunch_card: a.isLunchCard
        }
      })
  }

  async function handlePayNow() {
    const total = getTotal()
    if (total <= 0) return

    setSubmitting(true)

    try {
      // Create pending payment record
      const res = await fetch('/api/parent-portal/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          student_payments: getPaymentItems(),
          total_amount: total
        })
      })

      const data = await res.json()

      if (!data.success) {
        alert(data.error || 'Failed to process payment')
        setSubmitting(false)
        return
      }

      // Redirect to external payment form with URL parameters
      // TODO: Replace with actual payment URL
      const paymentUrl = new URL('https://your-payment-form.com/pay')
      paymentUrl.searchParams.set('amount', total.toFixed(2))
      paymentUrl.searchParams.set('payment_id', data.payment_id)
      paymentUrl.searchParams.set('parent_id', parent!.id)

      window.location.href = paymentUrl.toString()
    } catch {
      alert('Failed to process. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="portal-container">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading your account...</p>
        </div>
        <style jsx>{styles}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div className="portal-container">
        <div className="error-state">
          <div className="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1>Link Unavailable</h1>
          <p>{error}</p>
          <Link href="/parent/request-link" className="btn btn-primary">
            Request New Link
          </Link>
        </div>
        <style jsx>{styles}</style>
      </div>
    )
  }

  const daysLeft = expiresAt ? getDaysUntilExpiry(expiresAt) : 0
  const total = getTotal()
  const paymentItems = getPaymentItems()

  return (
    <div className="portal-container">
      <header className="portal-header">
        <Image
          src="https://www.aldersgatechristian.com/wp-content/uploads/2017/12/ACA-Logo_Horizontal_White_small.png"
          alt="Aldersgate Christian Academy"
          width={200}
          height={50}
          className="logo"
          priority
        />
      </header>

      <div className="welcome-card">
        <h2>Welcome, {parent?.name}!</h2>
        <p>View your children&apos;s lunch balances and add funds below.</p>
      </div>

      <div className="students-grid">
        {parent?.students.map(student => {
          const studentAmount = getStudentAmount(student.id)
          const amount = parseFloat(studentAmount.amount) || 0
          const lunches = amount > 0 && settings
            ? calculateLunches(amount, student.school_level, settings, studentAmount.isLunchCard)
            : 0
          const pricePerLunch = settings
            ? (student.school_level === 'elementary'
                ? settings.elementary_lunch_price
                : settings.highschool_lunch_price)
            : 0
          const newBalance = student.balance + lunches
          const minimumPayment = getMinimumPayment(student)
          const meetsMinimum = student.balance >= 0 || amount === 0 || amount >= minimumPayment

          return (
            <div key={student.id} className="student-card">
              <div className="student-header">
                <div className="student-avatar">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="student-info">
                  <h3>{student.name}</h3>
                  <span className="school-level">
                    {student.school_level === 'elementary' ? 'Elementary' : 'High School'}
                  </span>
                </div>
              </div>

              <div className="balance-display">
                <div className="balance-row">
                  <span className="balance-label">Current balance</span>
                  <span className="balance-dots"></span>
                  <span className={`balance-value ${student.balance <= 0 ? 'negative' : student.balance <= 3 ? 'low' : ''}`}>
                    {student.balance} {student.balance === 1 ? 'lunch' : 'lunches'}
                  </span>
                  <span className={`status-dot ${student.balance <= 0 ? 'negative' : student.balance <= 3 ? 'low' : 'good'}`}></span>
                </div>

                {lunches > 0 && (
                  <>
                    <div className="balance-row adding">
                      <span className="balance-label">Adding</span>
                      <span className="balance-dots"></span>
                      <span className="balance-value add">+{lunches} {lunches === 1 ? 'lunch' : 'lunches'}</span>
                      {studentAmount.isLunchCard && <span className="lunch-card-badge">Card</span>}
                    </div>

                    <div className="balance-divider"></div>

                    <div className="balance-row new">
                      <span className="balance-label">New balance</span>
                      <span className="balance-dots"></span>
                      <span className={`balance-value ${newBalance <= 0 ? 'negative' : newBalance <= 3 ? 'low' : ''}`}>
                        {newBalance} {newBalance === 1 ? 'lunch' : 'lunches'}
                      </span>
                      <span className={`status-dot ${newBalance <= 0 ? 'negative' : newBalance <= 3 ? 'low' : 'good'}`}></span>
                    </div>

                    <div className="balance-cost">
                      ${amount.toFixed(2)} · ${pricePerLunch.toFixed(2)}/lunch
                    </div>
                  </>
                )}

                {lunches === 0 && (
                  <div className="balance-price">${pricePerLunch.toFixed(2)} per lunch</div>
                )}
              </div>

              {student.balance < 0 && (
                <div className="minimum-notice">
                  Minimum ${minimumPayment.toFixed(2)} required to clear balance
                </div>
              )}

              <div className="add-funds">
                <label>Add Funds</label>
                <div className="amount-input-wrapper">
                  <span className="dollar-sign">$</span>
                  <input
                    type="number"
                    className={`amount-input ${!meetsMinimum ? 'error' : ''}`}
                    placeholder="0.00"
                    value={studentAmount.amount}
                    onChange={e => updateAmount(student.id, e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
                {!meetsMinimum && (
                  <span className="minimum-error">
                    Must be at least ${minimumPayment.toFixed(2)} to cover negative balance
                  </span>
                )}

                <div className="quick-amounts">
                  <button type="button" onClick={() => addQuickAmount(student.id, 20)}>+$20</button>
                  <button type="button" onClick={() => addQuickAmount(student.id, 50)}>+$50</button>
                  <button type="button" onClick={() => addQuickAmount(student.id, 100)}>+$100</button>
                  {student.school_level === 'high_school' && settings && (
                    <button
                      type="button"
                      className={`lunch-card-btn ${studentAmount.isLunchCard ? 'active' : ''}`}
                      onClick={() => setLunchCard(student.id)}
                    >
                      Lunch Card ${settings.highschool_lunch_card_price}
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
              <div key={item.student_id} className="summary-item">
                <span>{item.student_name}</span>
                <span>
                  ${item.amount.toFixed(2)} ({item.lunches_to_add} {item.lunches_to_add === 1 ? 'lunch' : 'lunches'})
                  {item.is_lunch_card && <span className="lunch-card-tag">Card</span>}
                </span>
              </div>
            ))}
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            className="btn btn-primary pay-btn"
            onClick={handlePayNow}
            disabled={submitting || hasUnmetMinimums()}
          >
            {submitting ? 'Processing...' : `Pay Now - $${total.toFixed(2)}`}
          </button>
          {hasUnmetMinimums() && (
            <p className="minimum-warning">Please meet minimum payment requirements above</p>
          )}
        </div>
      )}

      <footer className="portal-footer">
        <p className="link-expiry">
          This link expires in <strong>{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</strong>
        </p>
        <Link href="/parent/request-link" className="request-link">
          Request a new link
        </Link>
      </footer>

      <style jsx>{styles}</style>
    </div>
  )
}

const styles = `
  .portal-container {
    min-height: 100vh;
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    padding: 24px;
  }

  .loading-state,
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;
    gap: 16px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e2e8f0;
    border-top-color: #2e8bc0;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-icon {
    color: #ef4444;
    margin-bottom: 8px;
  }

  .error-state h1 {
    margin: 0;
    color: #1e293b;
  }

  .error-state p {
    color: #64748b;
    margin: 0 0 24px 0;
  }

  .portal-header {
    background: #002c5f;
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    margin-bottom: 24px;
  }

  .portal-header :global(.logo) {
    height: 44px;
    width: auto;
  }

  .welcome-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }

  .welcome-card h2 {
    margin: 0 0 4px 0;
    font-size: 18px;
    color: #002c5f;
  }

  .welcome-card p {
    margin: 0;
    color: #64748b;
    font-size: 14px;
  }

  .students-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  .student-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
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
    color: #1e293b;
  }

  .school-level {
    font-size: 13px;
    color: #64748b;
  }

  .balance-display {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px 20px;
    margin-bottom: 16px;
  }

  .balance-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
  }

  .balance-row.adding {
    opacity: 0.8;
  }

  .balance-row.new {
    font-weight: 600;
  }

  .balance-label {
    font-size: 14px;
    color: #475569;
    white-space: nowrap;
  }

  .balance-dots {
    flex: 1;
    border-bottom: 2px dotted #cbd5e1;
    margin: 0 4px;
    min-width: 20px;
  }

  .balance-value {
    font-size: 14px;
    font-weight: 600;
    color: #22c55e;
    white-space: nowrap;
  }

  .balance-value.add {
    color: #2e8bc0;
  }

  .balance-value.low {
    color: #ef4444;
  }

  .balance-value.negative {
    color: #ef4444;
  }

  .status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-dot.good {
    background: #22c55e;
  }

  .status-dot.low {
    background: #ef4444;
  }

  .status-dot.negative {
    background: #ef4444;
  }

  .balance-divider {
    height: 1px;
    background: #e2e8f0;
    margin: 4px 0;
  }

  .balance-cost {
    text-align: right;
    font-size: 13px;
    color: #64748b;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
  }

  .balance-price {
    font-size: 13px;
    color: #94a3b8;
    margin-top: 8px;
  }

  .minimum-notice {
    background: #fef3c7;
    border: 1px solid #fcd34d;
    color: #92400e;
    padding: 10px 14px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 13px;
    text-align: center;
  }

  .minimum-error {
    display: block;
    color: #dc2626;
    font-size: 12px;
    margin-top: -8px;
    margin-bottom: 12px;
  }

  .amount-input.error {
    border-color: #fca5a5;
    background: #fef2f2;
  }

  .minimum-warning {
    color: #dc2626;
    font-size: 13px;
    text-align: center;
    margin: 12px 0 0 0;
  }

  .add-funds {
    border-top: 1px solid #e2e8f0;
    padding-top: 16px;
  }

  .add-funds label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 8px;
  }

  .amount-input-wrapper {
    position: relative;
    margin-bottom: 12px;
  }

  .dollar-sign {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    font-size: 16px;
  }

  .amount-input {
    width: 100%;
    padding: 12px 14px 12px 32px;
    font-size: 18px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    outline: none;
    transition: border-color 0.15s ease;
  }

  .amount-input:focus {
    border-color: #2e8bc0;
  }

  .quick-amounts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .quick-amounts button {
    padding: 8px 16px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #475569;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .quick-amounts button:hover {
    background: #e2e8f0;
  }

  .lunch-card-btn {
    background: #fef3c7 !important;
    border-color: #fcd34d !important;
    color: #92400e !important;
  }

  .lunch-card-btn:hover {
    background: #fde68a !important;
  }

  .lunch-card-btn.active {
    background: #fcd34d !important;
    border-color: #f59e0b !important;
  }

  .lunches-preview {
    font-size: 14px;
    color: #22c55e;
    font-weight: 500;
  }

  .lunch-card-badge {
    display: inline-block;
    background: #fef3c7;
    color: #92400e;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    margin-left: 8px;
  }

  .payment-summary {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    margin-bottom: 24px;
    position: sticky;
    bottom: 24px;
  }

  .payment-summary h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
    color: #1e293b;
  }

  .summary-items {
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 12px;
    margin-bottom: 12px;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #475569;
    padding: 4px 0;
  }

  .lunch-card-tag {
    display: inline-block;
    background: #fef3c7;
    color: #92400e;
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 4px;
    margin-left: 6px;
  }

  .summary-total {
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 16px;
  }

  .pay-btn {
    width: 100%;
    padding: 16px;
    font-size: 16px;
    font-weight: 600;
    background: linear-gradient(135deg, #ffc82e 0%, #f59e0b 100%);
    color: #002c5f;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .pay-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 200, 46, 0.4);
  }

  .pay-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .portal-footer {
    text-align: center;
    padding: 24px 0;
  }

  .link-expiry {
    font-size: 13px;
    color: #64748b;
    margin: 0 0 8px 0;
  }

  .request-link {
    font-size: 14px;
    color: #2e8bc0;
    text-decoration: none;
  }

  .request-link:hover {
    text-decoration: underline;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 8px;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-primary {
    background: #2e8bc0;
    color: white;
    border: none;
  }

  .btn-primary:hover {
    background: #2577a6;
  }

  @media (min-width: 640px) {
    .portal-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 24px;
    }

    .students-grid {
      gap: 20px;
    }

    .student-card {
      padding: 24px;
    }
  }

  /* Mobile optimizations */
  @media (max-width: 480px) {
    .portal-container {
      padding: 16px;
    }

    .portal-header {
      padding: 18px 16px;
      margin-bottom: 16px;
    }

    .portal-header :global(.logo) {
      height: 36px;
    }

    .welcome-card {
      padding: 16px;
      margin-bottom: 16px;
    }

    .welcome-card h2 {
      font-size: 16px;
    }

    .welcome-card p {
      font-size: 13px;
    }

    .students-grid {
      gap: 12px;
      margin-bottom: 16px;
    }

    .student-card {
      padding: 16px;
    }

    .student-header {
      gap: 10px;
      margin-bottom: 14px;
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
      padding: 14px 16px;
      margin-bottom: 14px;
    }

    .balance-row {
      padding: 6px 0;
    }

    .balance-label {
      font-size: 13px;
    }

    .balance-value {
      font-size: 13px;
    }

    .balance-cost,
    .balance-price {
      font-size: 12px;
    }

    .minimum-notice {
      padding: 8px 12px;
      font-size: 12px;
      margin-bottom: 14px;
    }

    .add-funds {
      padding-top: 14px;
    }

    .add-funds label {
      font-size: 12px;
    }

    .amount-input {
      padding: 10px 12px 10px 30px;
      font-size: 16px;
    }

    .dollar-sign {
      left: 12px;
      font-size: 15px;
    }

    .quick-amounts {
      gap: 6px;
      margin-bottom: 10px;
    }

    .quick-amounts button {
      padding: 7px 12px;
      font-size: 13px;
    }

    .lunch-card-btn {
      font-size: 12px !important;
    }

    .payment-summary {
      padding: 16px;
      bottom: 16px;
    }

    .payment-summary h3 {
      font-size: 15px;
      margin-bottom: 14px;
    }

    .summary-item {
      font-size: 13px;
    }

    .summary-total {
      font-size: 16px;
      margin-bottom: 14px;
    }

    .pay-btn {
      padding: 14px;
      font-size: 15px;
    }

    .portal-footer {
      padding: 16px 0;
    }

    .link-expiry {
      font-size: 12px;
    }

    .request-link {
      font-size: 13px;
    }

    .loading-state p,
    .error-state p {
      font-size: 14px;
    }

    .error-state h1 {
      font-size: 20px;
    }
  }

  @media (max-width: 360px) {
    .portal-container {
      padding: 12px;
    }

    .student-card {
      padding: 14px;
    }

    .student-avatar {
      width: 38px;
      height: 38px;
      font-size: 16px;
    }

    .student-info h3 {
      font-size: 14px;
    }

    .quick-amounts button {
      padding: 6px 10px;
      font-size: 12px;
    }
  }
`
