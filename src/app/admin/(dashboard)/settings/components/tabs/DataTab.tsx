'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useSettings } from '../../context/SettingsContext'
import { HorizontalTabs } from '../HorizontalTabs'
import CsvImport from '@/components/admin/CsvImport'
import { getStudentsForExport } from '@/actions/students'
import { getParentsForExport } from '@/actions/parents'
import {
  getTransactionsForExport,
  completePendingPayment,
  cancelPendingPayment,
  type StudentPaymentItem,
} from '@/actions/transactions'

function ImportContent() {
  return <CsvImport />
}

function ExportContent() {
  const [exporting, setExporting] = useState<string | null>(null)

  async function exportData(type: 'students' | 'transactions' | 'parents') {
    setExporting(type)

    try {
      let data: Record<string, unknown>[]
      let filename: string

      if (type === 'students') {
        data = await getStudentsForExport()
        filename = 'students.csv'
      } else if (type === 'transactions') {
        data = await getTransactionsForExport()
        filename = 'transactions.csv'
      } else {
        data = await getParentsForExport()
        filename = 'parents.csv'
      }

      if (!data || data.length === 0) {
        toast.error('No data to export')
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

      toast.success(`${type} exported successfully`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed')
    }

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

// Type for student payments stored in JSON
interface StoredStudentPayment {
  student_id: string
  student_name: string
  amount: number
  lunches_to_add: number
  is_lunch_card: boolean
}

function PaymentsContent() {
  const { pendingPayments, fetchData } = useSettings()
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)

  async function handleCompletePayment(paymentId: string) {
    if (!confirm('Mark this payment as completed? This will add lunches to the students\' accounts.')) return

    setProcessingPayment(paymentId)

    const payment = pendingPayments.find(p => p.id === paymentId)
    if (!payment) return

    // Convert student payments from JSON format to action format
    const storedPayments = payment.studentPayments as StoredStudentPayment[]
    const studentPayments: StudentPaymentItem[] = storedPayments.map(sp => ({
      studentId: sp.student_id,
      studentName: sp.student_name,
      amount: sp.amount,
      lunchesToAdd: sp.lunches_to_add,
      isLunchCard: sp.is_lunch_card,
    }))

    // Process the payment using server action
    const result = await completePendingPayment(paymentId, studentPayments)

    if (!result.success) {
      toast.error(result.error || 'Failed to process payment')
      setProcessingPayment(null)
      return
    }

    // Send receipt email (keep API call for now - will be migrated later)
    try {
      await fetch('/api/admin/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: payment.parentId,
          payment_method: 'online',
          items: result.receiptItems?.map(item => ({
            student_name: item.studentName,
            amount: item.amount,
            lunches: item.lunches,
            is_lunch_card: item.isLunchCard,
            new_balance: item.newBalance,
          })),
          total: payment.totalAmount
        })
      })
    } catch {
      // Don't fail if email fails, just log it
      console.error('Failed to send receipt email')
    }

    toast.success('Payment completed and lunches added!')
    setProcessingPayment(null)
    fetchData()
  }

  async function handleCancelPayment(paymentId: string) {
    if (!confirm('Cancel this pending payment?')) return

    await cancelPendingPayment(paymentId)

    toast.success('Payment cancelled')
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
          {pendingPayments.map(payment => {
            const storedPayments = payment.studentPayments as StoredStudentPayment[]
            return (
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
                  {storedPayments.map((sp, idx) => (
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
            )
          })}
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
