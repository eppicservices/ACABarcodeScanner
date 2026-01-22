'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSettings } from '../../context/SettingsContext'
import { completePendingPayment, cancelPendingPayment, type StudentPaymentItem } from '@/actions/transactions'

export function PaymentsTab() {
  const { pendingPayments, setMessage, fetchData } = useSettings()
  const { data: session } = useSession()
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)

  async function handleCompletePayment(paymentId: string) {
    if (!confirm('Mark this payment as completed? This will add lunches to the students\' accounts.')) return

    setProcessingPayment(paymentId)
    setMessage(null)

    const payment = pendingPayments.find(p => p.id === paymentId)
    if (!payment) return

    try {
      // Convert studentPayments to the expected format
      const studentPayments: StudentPaymentItem[] = (payment.studentPayments as StudentPaymentItem[]).map(sp => ({
        studentId: sp.studentId,
        studentName: sp.studentName,
        amount: sp.amount,
        lunchesToAdd: sp.lunchesToAdd,
        isLunchCard: sp.isLunchCard || false
      }))

      const result = await completePendingPayment(paymentId, studentPayments, session?.user?.email || undefined)

      // Send receipt email
      try {
        await fetch('/api/admin/send-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parent_id: payment.parentId,
            payment_method: 'online',
            items: result.receiptItems,
            total: payment.totalAmount
          })
        })
      } catch {
        // Don't fail if email fails, just log it
        console.error('Failed to send receipt email')
      }

      setMessage({ type: 'success', text: 'Payment completed and lunches added!' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to complete payment' })
    }

    setProcessingPayment(null)
    fetchData()
  }

  async function handleCancelPayment(paymentId: string) {
    if (!confirm('Cancel this pending payment?')) return

    try {
      await cancelPendingPayment(paymentId)
      setMessage({ type: 'success', text: 'Payment cancelled' })
      fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to cancel payment' })
    }
  }

  return (
    <div className="tab-panel">
      <h2>Pending Payments</h2>
      <p className="section-desc">Review and complete payments from the parent portal.</p>

      {pendingPayments.length === 0 ? (
        <div className="empty-payments">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <p>No pending payments</p>
          <span className="empty-hint">Payments from the parent portal will appear here</span>
        </div>
      ) : (
        <div className="payments-list">
          {pendingPayments.map(payment => (
            <div key={payment.id} className="payment-card">
              <div className="payment-header">
                <div className="payment-info">
                  <strong>{payment.parentName || 'Unknown Parent'}</strong>
                  <span className="payment-date">
                    {new Date(payment.createdAt).toLocaleDateString()} at {new Date(payment.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="payment-total">${payment.totalAmount.toFixed(2)}</div>
              </div>

              <div className="payment-students">
                {(payment.studentPayments as StudentPaymentItem[]).map((sp, idx) => (
                  <div key={idx} className="student-payment">
                    <span className="student-name">{sp.studentName}</span>
                    <span className="student-amount">
                      ${sp.amount.toFixed(2)} → {sp.lunchesToAdd} {sp.lunchesToAdd === 1 ? 'lunch' : 'lunches'}
                      {sp.isLunchCard && <span className="lunch-card-tag">Card</span>}
                    </span>
                  </div>
                ))}
              </div>

              <div className="payment-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleCompletePayment(payment.id)}
                  disabled={processingPayment === payment.id}
                >
                  {processingPayment === payment.id ? 'Processing...' : 'Mark as Paid'}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleCancelPayment(payment.id)}
                  disabled={processingPayment === payment.id}
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
