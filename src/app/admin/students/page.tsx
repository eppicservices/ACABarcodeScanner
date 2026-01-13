'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Student, Parent } from '@/types/database'

interface StudentWithParent extends Student {
  parent: Parent
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentWithParent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'elementary' | 'high_school'>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchStudents()
  }, [])

  async function fetchStudents() {
    const { data, error } = await supabase
      .from('students')
      .select('*, parent:parents(*)')
      .order('name')

    if (!error && data) {
      setStudents(data as StudentWithParent[])
    }
    setLoading(false)
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.barcode.toLowerCase().includes(search.toLowerCase()) ||
      student.parent.name.toLowerCase().includes(search.toLowerCase())

    const matchesFilter = filter === 'all' || student.school_level === filter

    return matchesSearch && matchesFilter
  })

  const getBalanceClass = (balance: number) => {
    if (balance <= 0) return 'balance-danger'
    if (balance < 10) return 'balance-warning'
    return 'balance-good'
  }

  const lowBalanceCount = students.filter(s => s.balance < 10).length
  const elementaryCount = students.filter(s => s.school_level === 'elementary').length
  const highSchoolCount = students.filter(s => s.school_level === 'high_school').length

  return (
    <div className="students-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1>Students</h1>
            <p className="subtitle">Manage student accounts and balances</p>
          </div>
        </div>
        <Link href="/admin/students/new" className="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Student
        </Link>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon total">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{students.length}</span>
            <span className="stat-label">Total Students</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon elementary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{elementaryCount}</span>
            <span className="stat-label">Elementary</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon highschool">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{highSchoolCount}</span>
            <span className="stat-label">High School</span>
          </div>
        </div>
        <div className="stat-card warning-card">
          <div className="stat-icon warning">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{lowBalanceCount}</span>
            <span className="stat-label">Low Balance</span>
          </div>
        </div>
      </div>

      <div className="filters card">
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="input search-input"
            placeholder="Search by name, barcode, or parent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'elementary' ? 'active' : ''}`}
            onClick={() => setFilter('elementary')}
          >
            Elementary
          </button>
          <button
            className={`filter-btn ${filter === 'high_school' ? 'active' : ''}`}
            onClick={() => setFilter('high_school')}
          >
            High School
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container card">
          <div className="loading-spinner" />
          <span>Loading students...</span>
        </div>
      ) : (
        <div className="table-container card">
          <div className="table-header">
            <span className="results-count">
              {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
              {search && ` matching "${search}"`}
            </span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Barcode</th>
                <th>Level</th>
                <th>Parent</th>
                <th>Balance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => (
                <tr key={student.id} style={{ animationDelay: `${index * 0.02}s` }}>
                  <td className="name-cell">
                    <div className="student-avatar">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="student-name">{student.name}</span>
                  </td>
                  <td>
                    <code className="barcode">{student.barcode}</code>
                  </td>
                  <td>
                    <span className={`level-badge ${student.school_level}`}>
                      {student.school_level === 'elementary' ? 'Elementary' : 'High School'}
                    </span>
                  </td>
                  <td className="parent-cell">{student.parent.name}</td>
                  <td>
                    <span className={`balance ${getBalanceClass(student.balance)}`}>
                      {student.balance} {student.balance === 1 ? 'lunch' : 'lunches'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <Link href={`/admin/students/${student.id}`} className="action-btn">
                      <span>Edit</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    <div className="empty-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <p className="empty-title">No students found</p>
                    <p className="empty-desc">Try adjusting your search or filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .students-page {
          max-width: 1200px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
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
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: var(--white);
          border-radius: var(--border-radius-lg);
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          border: 1px solid var(--gray-100);
          box-shadow: var(--shadow-xs);
          transition: all var(--transition-fast);
        }

        .stat-card:hover {
          box-shadow: var(--shadow-sm);
          transform: translateY(-1px);
        }

        .stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-icon.total {
          background: var(--aca-teal-subtle);
          color: var(--aca-teal);
        }

        .stat-icon.elementary {
          background: #dbeafe;
          color: #2563eb;
        }

        .stat-icon.highschool {
          background: var(--aca-gold-subtle);
          color: var(--aca-gold-dark);
        }

        .stat-icon.warning {
          background: var(--warning-bg);
          color: var(--warning);
        }

        .warning-card {
          border-color: var(--warning-border);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 22px;
          font-weight: 700;
          color: var(--gray-700);
          line-height: 1;
        }

        .stat-label {
          font-size: 12px;
          color: var(--gray-400);
          margin-top: 4px;
          font-weight: 500;
        }

        .filters {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          align-items: center;
          padding: 16px 20px;
        }

        .search-box {
          flex: 1;
          position: relative;
        }

        .search-box > svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray-400);
          pointer-events: none;
        }

        .search-input {
          padding-left: 44px;
          padding-right: 40px;
        }

        .clear-search {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: var(--gray-400);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .clear-search:hover {
          background: var(--gray-100);
          color: var(--gray-600);
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

        .name-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .student-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--aca-teal) 0%, var(--aca-teal-dark) 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--white);
          font-weight: 600;
          font-size: 14px;
          flex-shrink: 0;
        }

        .student-name {
          font-weight: 600;
          color: var(--gray-700);
        }

        .barcode {
          background: var(--gray-100);
          padding: 5px 10px;
          border-radius: var(--border-radius-sm);
          font-size: 12px;
          color: var(--aca-teal);
          font-family: 'SF Mono', Monaco, 'Courier New', monospace;
          letter-spacing: 0.02em;
        }

        .level-badge {
          display: inline-block;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .level-badge.elementary {
          background: #dbeafe;
          color: #1e40af;
        }

        .level-badge.high_school {
          background: var(--aca-gold-subtle);
          color: var(--aca-gold-dark);
        }

        .parent-cell {
          color: var(--gray-500);
        }

        .balance {
          font-weight: 700;
          font-family: 'SF Mono', Monaco, 'Courier New', monospace;
          font-size: 14px;
          padding: 4px 10px;
          border-radius: var(--border-radius-sm);
        }

        .balance-good {
          color: var(--success);
          background: var(--success-bg);
        }

        .balance-warning {
          color: var(--warning);
          background: var(--warning-bg);
        }

        .balance-danger {
          color: var(--error);
          background: var(--error-bg);
        }

        .actions-cell {
          text-align: right;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--aca-teal);
          text-decoration: none;
          font-weight: 600;
          font-size: 13px;
          padding: 6px 12px;
          border-radius: var(--border-radius-sm);
          transition: all var(--transition-fast);
        }

        .action-btn:hover {
          background: var(--aca-teal-subtle);
          color: var(--aca-teal-dark);
        }

        .action-btn svg {
          transition: transform var(--transition-fast);
        }

        .action-btn:hover svg {
          transform: translateX(2px);
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
      `}</style>
    </div>
  )
}
