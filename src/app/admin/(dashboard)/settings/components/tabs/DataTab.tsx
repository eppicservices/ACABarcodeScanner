'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '../../context/SettingsContext'
import { HorizontalTabs } from '../HorizontalTabs'
import CsvImport from '@/components/admin/CsvImport'

function ImportContent() {
  return <CsvImport />
}

function ExportContent() {
  const { setMessage } = useSettings()
  const [exporting, setExporting] = useState<string | null>(null)

  async function exportData(type: 'students' | 'transactions' | 'parents') {
    setMessage(null)
    setExporting(type)

    const supabase = createClient()
    let query
    let filename

    if (type === 'students') {
      query = supabase.from('students').select('*, parent:parents(name, email)')
      filename = 'students.csv'
    } else if (type === 'transactions') {
      query = supabase.from('balance_transactions').select('*, student:students(name, barcode)')
      filename = 'transactions.csv'
    } else {
      query = supabase.from('parents').select('*')
      filename = 'parents.csv'
    }

    const { data, error } = await query

    if (error) {
      setMessage({ type: 'error', text: error.message })
      setExporting(null)
      return
    }

    if (!data || data.length === 0) {
      setMessage({ type: 'error', text: 'No data to export' })
      setExporting(null)
      return
    }

    // Convert to CSV
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const val = row[h as keyof typeof row]
          if (typeof val === 'object') return JSON.stringify(val)
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`
          return val
        }).join(',')
      )
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

    setMessage({ type: 'success', text: `${type} exported successfully` })
    setExporting(null)
  }

  return (
    <div className="export-grid">
      <div className="export-card">
        <div className="export-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        </div>
        <div className="export-info">
          <h4>Students</h4>
          <p>Export all students with their balances and parent info</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => exportData('students')}
          disabled={exporting !== null}
        >
          {exporting === 'students' ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="export-card">
        <div className="export-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div className="export-info">
          <h4>Parents</h4>
          <p>Export all parent contact information</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => exportData('parents')}
          disabled={exporting !== null}
        >
          {exporting === 'parents' ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="export-card">
        <div className="export-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
            <path d="M8 10h8" />
            <path d="M8 14h4" />
          </svg>
        </div>
        <div className="export-info">
          <h4>Transactions</h4>
          <p>Export complete transaction history</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => exportData('transactions')}
          disabled={exporting !== null}
        >
          {exporting === 'transactions' ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>
    </div>
  )
}

function PaymentsContent() {
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
    <>
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
    </>
  )
}

export function DataTab() {
  const tabs = [
    {
      id: 'import',
      label: 'Import',
      content: <ImportContent />
    },
    {
      id: 'export',
      label: 'Export',
      content: <ExportContent />
    },
    {
      id: 'payments',
      label: 'Pending Payments',
      content: <PaymentsContent />
    }
  ]

  return (
    <div className="tab-panel">
      <h2>Data Management</h2>
      <p className="section-desc">Import, export, and manage payment data.</p>

      <HorizontalTabs tabs={tabs} defaultTab="import" />
    </div>
  )
}
