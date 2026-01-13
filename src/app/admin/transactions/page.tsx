'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { BalanceTransaction, Student } from '@/types/database'

interface TransactionWithStudent extends BalanceTransaction {
  student: Student
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'payment' | 'adjustment' | 'refund'>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    const { data, error } = await supabase
      .from('balance_transactions')
      .select('*, student:students(*)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setTransactions(data as TransactionWithStudent[])
    }
    setLoading(false)
  }

  const filteredTransactions = transactions.filter(
    (tx) => filter === 'all' || tx.transaction_type === filter
  )

  const totalPayments = transactions
    .filter((tx) => tx.transaction_type === 'payment')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalRefunds = transactions
    .filter((tx) => tx.transaction_type === 'refund')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  return (
    <div className="transactions-page">
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p className="subtitle">Balance history and payment records</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card card">
          <span className="stat-label">Total Payments</span>
          <span className="stat-value positive">${totalPayments.toFixed(2)}</span>
        </div>
        <div className="stat-card card">
          <span className="stat-label">Total Refunds</span>
          <span className="stat-value negative">${totalRefunds.toFixed(2)}</span>
        </div>
        <div className="stat-card card">
          <span className="stat-label">Total Transactions</span>
          <span className="stat-value">{transactions.length}</span>
        </div>
      </div>

      <div className="filters card">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'payment' ? 'active' : ''}`}
            onClick={() => setFilter('payment')}
          >
            Payments
          </button>
          <button
            className={`filter-btn ${filter === 'adjustment' ? 'active' : ''}`}
            onClick={() => setFilter('adjustment')}
          >
            Adjustments
          </button>
          <button
            className={`filter-btn ${filter === 'refund' ? 'active' : ''}`}
            onClick={() => setFilter('refund')}
          >
            Refunds
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading transactions...</div>
      ) : (
        <div className="table-container card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Balance</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="date-cell">
                    <span className="date">
                      {new Date(tx.created_at!).toLocaleDateString()}
                    </span>
                    <span className="time">
                      {new Date(tx.created_at!).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/students/${tx.student_id}`} className="student-link">
                      {tx.student.name}
                    </Link>
                    <span className="barcode">{tx.student.barcode}</span>
                  </td>
                  <td>
                    <span className={`type-badge ${tx.transaction_type}`}>
                      {tx.transaction_type}
                    </span>
                  </td>
                  <td>
                    <span className={`amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                      {tx.amount >= 0 ? '+' : ''}${tx.amount.toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span className="balance-change">
                      ${tx.previous_balance.toFixed(2)} → ${tx.new_balance.toFixed(2)}
                    </span>
                  </td>
                  <td className="notes-cell">
                    {tx.notes || '—'}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .transactions-page {
          max-width: 1200px;
        }

        .page-header {
          margin-bottom: 24px;
        }

        h1 {
          font-size: 32px;
          margin: 0;
          color: var(--aca-navy);
        }

        .subtitle {
          color: var(--gray-400);
          margin: 4px 0 0 0;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          text-align: center;
          padding: 20px;
        }

        .stat-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--gray-400);
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          font-family: monospace;
        }

        .stat-value.positive {
          color: var(--success);
        }

        .stat-value.negative {
          color: var(--error);
        }

        .filters {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          align-items: center;
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
        }

        .filter-btn {
          padding: 10px 16px;
          border: 2px solid var(--gray-200);
          border-radius: 8px;
          background: var(--white);
          color: var(--gray-500);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--font-body);
        }

        .filter-btn:hover {
          border-color: var(--aca-blue);
          color: var(--aca-blue);
        }

        .filter-btn.active {
          background: var(--aca-blue);
          border-color: var(--aca-blue);
          color: var(--white);
        }

        .table-container {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid var(--gray-100);
        }

        .data-table th {
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--gray-400);
          background: var(--gray-50);
        }

        .data-table tbody tr:hover {
          background: var(--gray-50);
        }

        .date-cell {
          white-space: nowrap;
        }

        .date {
          display: block;
          font-weight: 600;
          color: var(--gray-700);
        }

        .time {
          font-size: 12px;
          color: var(--gray-400);
        }

        .student-link {
          display: block;
          color: var(--aca-blue);
          text-decoration: none;
          font-weight: 600;
        }

        .student-link:hover {
          text-decoration: underline;
        }

        .barcode {
          display: block;
          font-size: 12px;
          color: var(--gray-400);
          font-family: monospace;
        }

        .type-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .type-badge.payment {
          background: var(--success-bg);
          color: var(--success);
        }

        .type-badge.refund {
          background: var(--error-bg);
          color: var(--error);
        }

        .type-badge.adjustment {
          background: #dbeafe;
          color: #1e40af;
        }

        .amount {
          font-family: monospace;
          font-weight: 600;
          font-size: 15px;
        }

        .amount.positive {
          color: var(--success);
        }

        .amount.negative {
          color: var(--error);
        }

        .balance-change {
          font-family: monospace;
          font-size: 13px;
          color: var(--gray-500);
        }

        .notes-cell {
          color: var(--gray-400);
          font-size: 14px;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .empty-state {
          text-align: center;
          color: var(--gray-400);
          padding: 40px !important;
        }

        .loading {
          text-align: center;
          padding: 60px;
          color: var(--gray-400);
        }
      `}</style>
    </div>
  )
}
