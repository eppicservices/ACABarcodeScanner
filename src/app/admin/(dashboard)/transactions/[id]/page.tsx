'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getTransactionById, type TransactionWithStudent } from '@/actions/transactions'

export default function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [transaction, setTransaction] = useState<TransactionWithStudent | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchTransaction() {
      const data = await getTransactionById(id)
      setTransaction(data)
      setLoading(false)
    }
    fetchTransaction()
  }, [id])

  if (loading) {
    return (
      <div className="detail-page">
        <div className="loading">Loading transaction...</div>
        <style jsx>{styles}</style>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="detail-page">
        <div className="not-found">
          <h2>Transaction Not Found</h2>
          <p>The transaction you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/admin/transactions" className="btn btn-primary">
            Back to Transactions
          </Link>
        </div>
        <style jsx>{styles}</style>
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'payment':
        return 'Payment'
      case 'lunch_card':
        return 'Lunch Card'
      case 'lunch_used':
        return 'Lunch Used'
      case 'adjustment':
        return 'Adjustment'
      default:
        return type
    }
  }

  return (
    <div className="detail-page">
      {/* Header */}
      <div className="page-header">
        <button onClick={() => router.back()} className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <div className="header-content">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
              <path d="M8 10h8" />
              <path d="M8 14h4" />
            </svg>
          </div>
          <div>
            <h1>Transaction Details</h1>
            <p className="subtitle">
              {formatDate(transaction.createdAt)} at {formatTime(transaction.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-grid">
        {/* Transaction Info Card */}
        <div className="card main-card">
          <div className="amount-display">
            <span className={`amount ${transaction.lunchesChange >= 0 ? 'positive' : 'negative'}`}>
              {transaction.lunchesChange >= 0 ? '+' : ''}{transaction.lunchesChange}
            </span>
            <span className="amount-label">lunches</span>
          </div>

          <div className={`type-badge ${transaction.transactionType}`}>
            {getTypeLabel(transaction.transactionType)}
          </div>

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Balance Change</span>
              <span className="info-value balance-change">
                {transaction.previousLunches} → {transaction.newLunches}
              </span>
            </div>

            {transaction.amountPaid !== null && (
              <div className="info-item">
                <span className="info-label">Amount Paid</span>
                <span className="info-value">${transaction.amountPaid.toFixed(2)}</span>
              </div>
            )}

            {transaction.lunchesAdded !== null && (
              <div className="info-item">
                <span className="info-label">Lunches Added</span>
                <span className="info-value">{transaction.lunchesAdded}</span>
              </div>
            )}

            {transaction.createdBy && (
              <div className="info-item">
                <span className="info-label">Created By</span>
                <span className="info-value">{transaction.createdBy}</span>
              </div>
            )}
          </div>

          {transaction.notes && (
            <div className="notes-section">
              <span className="info-label">Notes</span>
              <p className="notes-text">{transaction.notes}</p>
            </div>
          )}
        </div>

        {/* Student & Parent Card */}
        <div className="card">
          <h3>Related Records</h3>

          <div className="related-item">
            <div className="related-icon student">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="related-info">
              <span className="related-type">Student</span>
              <Link href={`/admin/students/${transaction.studentId}`} className="related-name">
                {transaction.student.name}
              </Link>
              <span className="related-meta">
                {transaction.student.schoolLevel === 'elementary' ? 'Elementary' : 'High School'} • {transaction.student.barcode}
              </span>
            </div>
            <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          <div className="related-item">
            <div className="related-icon parent">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="related-info">
              <span className="related-type">Parent</span>
              <Link href={`/admin/parents/${transaction.student.parent.id}`} className="related-name">
                {transaction.student.parent.name}
              </Link>
            </div>
            <svg className="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>

      <style jsx>{styles}</style>
    </div>
  )
}

const styles = `
  .detail-page {
    max-width: 800px;
  }

  .loading, .not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
    gap: 16px;
  }

  .not-found h2 {
    margin: 0;
    color: var(--gray-700);
  }

  .not-found p {
    margin: 0;
    color: var(--gray-500);
  }

  .page-header {
    margin-bottom: 28px;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    margin-bottom: 16px;
    background: transparent;
    border: none;
    color: var(--gray-500);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border-radius: var(--border-radius);
    transition: all var(--transition-fast);
    font-family: var(--font-body);
  }

  .back-btn:hover {
    background: var(--gray-100);
    color: var(--gray-700);
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
    font-size: 24px;
    margin: 0;
    color: var(--aca-navy);
    letter-spacing: -0.02em;
  }

  .subtitle {
    color: var(--gray-400);
    margin: 2px 0 0 0;
    font-size: 14px;
  }

  .content-grid {
    display: grid;
    gap: 20px;
  }

  .card {
    background: var(--white);
    border: 1px solid var(--gray-100);
    border-radius: var(--border-radius-lg);
    padding: 24px;
  }

  .main-card {
    text-align: center;
  }

  .amount-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    margin-bottom: 16px;
  }

  .amount {
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 48px;
    font-weight: 700;
    line-height: 1;
  }

  .amount.positive {
    color: var(--success);
  }

  .amount.negative {
    color: var(--error);
  }

  .amount-label {
    font-size: 14px;
    color: var(--gray-400);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .type-badge {
    display: inline-flex;
    padding: 8px 20px;
    border-radius: 24px;
    font-size: 13px;
    font-weight: 600;
    text-transform: capitalize;
    margin-bottom: 24px;
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

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 20px;
    text-align: left;
    padding: 20px 0;
    border-top: 1px solid var(--gray-100);
    border-bottom: 1px solid var(--gray-100);
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .info-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--gray-400);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .info-value {
    font-size: 15px;
    font-weight: 600;
    color: var(--gray-700);
  }

  .balance-change {
    font-family: 'SF Mono', Monaco, monospace;
  }

  .notes-section {
    text-align: left;
    margin-top: 20px;
  }

  .notes-text {
    margin: 8px 0 0 0;
    color: var(--gray-600);
    font-size: 14px;
    line-height: 1.6;
    background: var(--gray-50);
    padding: 12px 16px;
    border-radius: var(--border-radius);
  }

  .card h3 {
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-500);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .related-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px;
    margin: -14px;
    margin-bottom: 0;
    border-radius: var(--border-radius);
    transition: background var(--transition-fast);
    cursor: pointer;
  }

  .related-item:hover {
    background: var(--gray-50);
  }

  .related-item + .related-item {
    margin-top: 8px;
  }

  .related-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .related-icon.student {
    background: var(--aca-blue-subtle);
    color: var(--aca-blue);
  }

  .related-icon.parent {
    background: var(--aca-teal-subtle);
    color: var(--aca-teal);
  }

  .related-info {
    flex: 1;
    min-width: 0;
  }

  .related-type {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: var(--gray-400);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 2px;
  }

  .related-name {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: var(--aca-teal);
    text-decoration: none;
  }

  .related-name:hover {
    text-decoration: underline;
  }

  .related-meta {
    display: block;
    font-size: 12px;
    color: var(--gray-400);
    margin-top: 2px;
  }

  .chevron {
    color: var(--gray-300);
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 20px;
    }

    .header-icon {
      width: 40px;
      height: 40px;
    }

    .header-icon svg {
      width: 20px;
      height: 20px;
    }

    .amount {
      font-size: 40px;
    }

    .card {
      padding: 20px;
    }

    .info-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 480px) {
    .info-grid {
      grid-template-columns: 1fr;
    }
  }
`
