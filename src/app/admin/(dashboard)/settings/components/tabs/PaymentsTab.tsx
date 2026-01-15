'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '../../context/SettingsContext'

export function PaymentsTab() {
  const { pendingPayments, setMessage, fetchData } = useSettings()
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)

  async function handleCompletePayment(paymentId: string) {
    if (!confirm('Mark this payment as completed? This will add lunches to the students\' accounts.')) return

    setProcessingPayment(paymentId)
    setMessage(null)

    const payment = pendingPayments.find(p => p.id === paymentId)
    if (!payment) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Track new balances for receipt
    const receiptItems: { student_name: string; amount: number; lunches: number; is_lunch_card: boolean; new_balance: number }[] = []

    // Process each student payment
    for (const sp of payment.student_payments) {
      // Get current student balance
      const { data: student } = await supabase
        .from('students')
        .select('balance')
        .eq('id', sp.student_id)
        .single()

      if (!student) continue

      const previousBalance = student.balance
      const newBalance = previousBalance + sp.lunches_to_add

      // Update student balance
      await supabase
        .from('students')
        .update({ balance: newBalance })
        .eq('id', sp.student_id)

      // Create transaction record
      await supabase
        .from('balance_transactions')
        .insert({
          student_id: sp.student_id,
          lunches_change: sp.lunches_to_add,
          previous_lunches: previousBalance,
          new_lunches: newBalance,
          amount_paid: sp.amount,
          lunches_added: sp.lunches_to_add,
          transaction_type: sp.is_lunch_card ? 'lunch_card' : 'payment',
          notes: 'Online payment via parent portal',
          created_by: user?.id || null
        })

      // Add to receipt items
      receiptItems.push({
        student_name: sp.student_name,
        amount: sp.amount,
        lunches: sp.lunches_to_add,
        is_lunch_card: sp.is_lunch_card,
        new_balance: newBalance
      })
    }

    // Mark payment as completed
    await supabase
      .from('pending_payments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: user?.id || null
      })
      .eq('id', paymentId)

    // Send receipt email
    try {
      await fetch('/api/admin/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: payment.parent_id,
          payment_method: 'online',
          items: receiptItems,
          total: payment.total_amount
        })
      })
    } catch {
      // Don't fail if email fails, just log it
      console.error('Failed to send receipt email')
    }

    setMessage({ type: 'success', text: 'Payment completed and lunches added!' })
    setProcessingPayment(null)
    fetchData()
  }

  async function handleCancelPayment(paymentId: string) {
    if (!confirm('Cancel this pending payment?')) return

    const supabase = createClient()
    await supabase
      .from('pending_payments')
      .update({ status: 'cancelled' })
      .eq('id', paymentId)

    setMessage({ type: 'success', text: 'Payment cancelled' })
    fetchData()
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
                  <strong>{payment.parent_name || 'Unknown Parent'}</strong>
                  <span className="payment-date">
                    {new Date(payment.created_at).toLocaleDateString()} at {new Date(payment.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="payment-total">${payment.total_amount.toFixed(2)}</div>
              </div>

              <div className="payment-students">
                {payment.student_payments.map((sp, idx) => (
                  <div key={idx} className="student-payment">
                    <span className="student-name">{sp.student_name}</span>
                    <span className="student-amount">
                      ${sp.amount.toFixed(2)} → {sp.lunches_to_add} {sp.lunches_to_add === 1 ? 'lunch' : 'lunches'}
                      {sp.is_lunch_card && <span className="lunch-card-tag">Card</span>}
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
