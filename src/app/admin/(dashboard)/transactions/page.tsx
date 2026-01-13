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
  const [filter, setFilter] = useState<'all' | 'payment' | 'lunch_card' | 'adjustment' | 'lunch_used'>('all')
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

  const totalLunchesAdded = transactions
    .filter((tx) => tx.lunches_change > 0)
    .reduce((sum, tx) => sum + tx.lunches_change, 0)

  const totalLunchesUsed = transactions
    .filter((tx) => tx.transaction_type === 'lunch_used')
    .reduce((sum, tx) => sum + Math.abs(tx.lunches_change), 0)

  const paymentCount = transactions.filter((tx) => tx.transaction_type === 'payment' || tx.transaction_type === 'lunch_card').length
  const adjustmentCount = transactions.filter((tx) => tx.transaction_type === 'adjustment').length
  const usedCount = transactions.filter((tx) => tx.transaction_type === 'lunch_used').length

  return (
    <div className="transactions-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
              <path d="M8 10h8" />
              <path d="M8 14h4" />
            </svg>
          </div>
          <div>
            <h1>Transactions</h1>
            <p className="subtitle">Balance history and payment records</p>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card success-card">
          <div className="stat-icon success">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Lunches Added</span>
            <span className="stat-value positive">{totalLunchesAdded}</span>
            <span className="stat-count">{paymentCount} payments</span>
          </div>
        </div>
        <div className="stat-card danger-card">
          <div className="stat-icon danger">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Lunches Used</span>
            <span className="stat-value negative">{totalLunchesUsed}</span>
            <span className="stat-count">{usedCount} check-ins</span>
          </div>
        </div>
        <div className="stat-card info-card">
          <div className="stat-icon info">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Transactions</span>
            <span className="stat-value">{transactions.length}</span>
            <span className="stat-count">{adjustmentCount} adjustments</span>
          </div>
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
            className={`filter-btn ${filter === 'lunch_card' ? 'active' : ''}`}
            onClick={() => setFilter('lunch_card')}
          >
            Lunch Cards
          </button>
          <button
            className={`filter-btn ${filter === 'lunch_used' ? 'active' : ''}`}
            onClick={() => setFilter('lunch_used')}
          >
            Used
          </button>
          <button
            className={`filter-btn ${filter === 'adjustment' ? 'active' : ''}`}
            onClick={() => setFilter('adjustment')}
          >
            Adjustments
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
                <th>Lunches</th>
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
                      {tx.transaction_type === 'lunch_used' ? 'used' : tx.transaction_type === 'lunch_card' ? 'lunch card' : tx.transaction_type}
                    </span>
                  </td>
                  <td>
                    <span className={`amount ${tx.lunches_change >= 0 ? 'positive' : 'negative'}`}>
                      {tx.lunches_change >= 0 ? '+' : ''}{tx.lunches_change}
                    </span>
                  </td>
                  <td>
                    <span className="balance-change">
                      {tx.previous_lunches} → {tx.new_lunches}
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
          margin-bottom: 28px;
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

        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: var(--white);
          border-radius: var(--border-radius-lg);
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid var(--gray-100);
          box-shadow: var(--shadow-xs);
          transition: all var(--transition-fast);
        }

        .stat-card:hover {
          box-shadow: var(--shadow-sm);
          transform: translateY(-1px);
        }

        .success-card {
          border-color: var(--success-border);
        }

        .danger-card {
          border-color: var(--error-border);
        }

        .info-card {
          border-color: var(--gray-200);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-icon.success {
          background: var(--success-bg);
          color: var(--success);
        }

        .stat-icon.danger {
          background: var(--error-bg);
          color: var(--error);
        }

        .stat-icon.info {
          background: var(--aca-teal-subtle);
          color: var(--aca-teal);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--gray-400);
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          font-family: 'SF Mono', Monaco, monospace;
          line-height: 1;
        }

        .stat-value.positive {
          color: var(--success);
        }

        .stat-value.negative {
          color: var(--error);
        }

        .stat-count {
          font-size: 12px;
          color: var(--gray-400);
          margin-top: 4px;
        }

        .filters {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          align-items: center;
          padding: 16px 20px;
        }

        .filter-buttons {
          display: flex;
          gap: 6px;
          background: var(--gray-50);
          padding: 4px;
          border-radius: var(--border-radius);
        }

        .filter-btn {
          padding: 8px 16px;
          border: none;
          border-radius: var(--border-radius-sm);
          background: transparent;
          color: var(--gray-500);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all var(--transition-fast);
          font-family: var(--font-body);
        }

        .filter-btn:hover {
          color: var(--gray-700);
          background: var(--white);
        }

        .filter-btn.active {
          background: var(--white);
          color: var(--aca-teal);
          box-shadow: var(--shadow-sm);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
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

        .table-container {
          overflow: hidden;
          padding: 0;
        }

        .table-header {
          padding: 14px 20px;
          border-bottom: 1px solid var(--gray-100);
          background: var(--gray-50);
        }

        .results-count {
          font-size: 13px;
          color: var(--gray-500);
          font-weight: 500;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 14px 20px;
          text-align: left;
          border-bottom: 1px solid var(--gray-100);
        }

        .data-table th {
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--gray-400);
          background: var(--gray-50);
        }

        .data-table tbody tr {
          animation: tableRowEnter 0.3s ease-out backwards;
          transition: background var(--transition-fast);
        }

        .data-table tbody tr:hover {
          background: var(--gray-50);
        }

        .data-table tbody tr:last-child td {
          border-bottom: none;
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
          font-size: 11px;
          color: var(--gray-400);
        }

        .student-link {
          display: block;
          color: var(--aca-teal);
          text-decoration: none;
          font-weight: 600;
        }

        .student-link:hover {
          text-decoration: underline;
        }

        .barcode {
          display: block;
          font-size: 11px;
          color: var(--gray-400);
          font-family: 'SF Mono', Monaco, monospace;
        }

        .type-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
          letter-spacing: 0.02em;
        }

        .type-badge.payment, .type-badge.lunch_card {
          background: var(--success-bg);
          color: var(--success);
        }

        .type-badge.lunch_used {
          background: var(--error-bg);
          color: var(--error);
        }

        .type-badge.adjustment {
          background: var(--aca-teal-subtle);
          color: var(--aca-teal);
        }

        .amount {
          font-family: 'SF Mono', Monaco, monospace;
          font-weight: 700;
          font-size: 14px;
          padding: 4px 10px;
          border-radius: var(--border-radius-sm);
        }

        .amount.positive {
          color: var(--success);
          background: var(--success-bg);
        }

        .amount.negative {
          color: var(--error);
          background: var(--error-bg);
        }

        .balance-change {
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 12px;
          color: var(--gray-500);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .balance-change::before {
          content: '';
          display: inline-block;
          width: 16px;
          height: 2px;
          background: var(--gray-300);
        }

        .notes-cell {
          color: var(--gray-400);
          font-size: 13px;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px !important;
        }

        .empty-icon {
          color: var(--gray-300);
          margin-bottom: 16px;
        }

        .empty-title {
          font-weight: 600;
          color: var(--gray-600);
          margin: 0 0 4px 0;
        }

        .empty-desc {
          color: var(--gray-400);
          font-size: 14px;
          margin: 0;
        }

        .loading {
          text-align: center;
          padding: 60px;
          color: var(--gray-400);
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .transactions-page {
            max-width: 100%;
            overflow-x: hidden;
          }

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

          .stats-row {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }

          .stat-card {
            padding: 14px;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .stat-icon {
            width: 36px;
            height: 36px;
          }

          .stat-icon svg {
            width: 18px;
            height: 18px;
          }

          .stat-label {
            font-size: 10px;
          }

          .stat-value {
            font-size: 18px;
          }

          .stat-count {
            font-size: 10px;
          }

          .filters {
            padding: 12px;
          }

          .filter-buttons {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .filter-buttons::-webkit-scrollbar {
            display: none;
          }

          .filter-btn {
            flex-shrink: 0;
            padding: 8px 12px;
            font-size: 12px;
          }

          .table-container {
            margin: 0;
            border-radius: var(--border-radius-lg);
            overflow: hidden;
          }

          .data-table {
            display: block;
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .data-table th,
          .data-table td {
            padding: 12px 14px;
            font-size: 12px;
            white-space: nowrap;
          }

          .data-table th:first-child,
          .data-table td:first-child {
            position: sticky;
            left: 0;
            background: var(--white);
            z-index: 1;
            box-shadow: 2px 0 4px rgba(0,0,0,0.05);
          }

          .data-table th:first-child {
            background: var(--gray-50);
          }

          .data-table tbody tr:hover td:first-child {
            background: var(--gray-50);
          }

          .date {
            font-size: 13px;
          }

          .time {
            font-size: 10px;
          }

          .student-link {
            font-size: 13px;
          }

          .barcode {
            font-size: 10px;
          }

          .type-badge {
            padding: 4px 10px;
            font-size: 10px;
          }

          .amount {
            font-size: 12px;
            padding: 3px 8px;
          }

          .balance-change {
            font-size: 11px;
          }

          .notes-cell {
            font-size: 11px;
            max-width: 120px;
          }
        }

        @media (max-width: 600px) {
          .stats-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .stat-card {
            flex-direction: row;
            align-items: center;
            padding: 12px 16px;
            gap: 14px;
          }

          .stat-icon {
            width: 40px;
            height: 40px;
          }

          .stat-label {
            font-size: 11px;
          }

          .stat-value {
            font-size: 22px;
          }

          .stat-count {
            font-size: 11px;
          }
        }

        @media (max-width: 480px) {
          .data-table th:nth-child(5),
          .data-table td:nth-child(5),
          .data-table th:nth-child(6),
          .data-table td:nth-child(6) {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
