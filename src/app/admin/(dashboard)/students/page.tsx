'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Student, Parent } from '@/types/database'

interface StudentWithParent extends Student {
  parent: Parent
}

type SortField = 'name' | 'balance' | 'level'
type SortDirection = 'asc' | 'desc'

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentWithParent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'elementary' | 'high_school'>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const supabase = createClient()
  const router = useRouter()

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection(field === 'balance' ? 'desc' : 'asc') // Default to desc for balance (high first)
    }
  }

  const filteredStudents = students
    .filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.barcode.toLowerCase().includes(search.toLowerCase()) ||
        student.parent.name.toLowerCase().includes(search.toLowerCase())

      const matchesFilter = filter === 'all' || student.school_level === filter

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'balance':
          comparison = a.balance - b.balance
          break
        case 'level':
          comparison = a.school_level.localeCompare(b.school_level)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
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
        <div className="sort-dropdown">
          <label className="sort-label">Sort:</label>
          <select
            className="sort-select"
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split('-') as [SortField, SortDirection]
              setSortField(field)
              setSortDirection(dir)
            }}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="balance-desc">Balance (High-Low)</option>
            <option value="balance-asc">Balance (Low-High)</option>
            <option value="level-asc">Level (Elem First)</option>
            <option value="level-desc">Level (HS First)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-container card">
          <div className="loading-spinner" />
          <span>Loading students...</span>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-container card desktop-only">
            <div className="table-header">
              <span className="results-count">
                {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
                {search && ` matching "${search}"`}
              </span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('name')}>
                    Student
                    {sortField === 'name' && (
                      <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th>Barcode</th>
                  <th className="sortable" onClick={() => handleSort('level')}>
                    Level
                    {sortField === 'level' && (
                      <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th>Parent</th>
                  <th className="sortable" onClick={() => handleSort('balance')}>
                    Balance
                    {sortField === 'balance' && (
                      <span className="sort-icon">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    className="clickable-row"
                    style={{ animationDelay: `${index * 0.02}s` }}
                    onClick={() => router.push(`/admin/students/${student.id}`)}
                  >
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
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-state">
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

          {/* Mobile List View */}
          <div className="mobile-list mobile-only">
            <div className="list-header">
              <span className="results-count">
                {filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'}
              </span>
            </div>
            {filteredStudents.length === 0 ? (
              <div className="empty-state-mobile">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p>No students found</p>
              </div>
            ) : (
              <div className="list-items">
                {filteredStudents.map((student, index) => (
                  <Link
                    key={student.id}
                    href={`/admin/students/${student.id}`}
                    className="list-item"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className="list-item-avatar">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="list-item-content">
                      <div className="list-item-name">{student.name}</div>
                      <div className="list-item-meta">
                        <span className={`list-item-level ${student.school_level}`}>
                          {student.school_level === 'elementary' ? 'Elem' : 'HS'}
                        </span>
                        <span className="list-item-barcode">{student.barcode}</span>
                      </div>
                    </div>
                    <div className="list-item-balance-wrap">
                      <span className={`list-item-balance ${getBalanceClass(student.balance)}`}>
                        {student.balance}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <style jsx global>{`
        /* Mobile List Styles - Global to work with Link components */
        .mobile-list {
          background: var(--white);
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--gray-100);
          overflow: hidden;
        }

        .mobile-list .list-header {
          padding: 12px 16px;
          background: var(--gray-50);
          border-bottom: 1px solid var(--gray-100);
        }

        .mobile-list .list-items {
          display: flex;
          flex-direction: column;
        }

        .mobile-list .list-item {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 12px;
          padding: 14px 16px;
          text-decoration: none;
          border-bottom: 1px solid var(--gray-100);
          transition: background 0.15s ease;
        }

        .mobile-list .list-item:last-child {
          border-bottom: none;
        }

        .mobile-list .list-item:active {
          background: var(--gray-50);
        }

        .mobile-list .list-item-avatar {
          width: 44px;
          height: 44px;
          min-width: 44px;
          background: linear-gradient(135deg, var(--aca-teal) 0%, var(--aca-teal-dark) 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--white);
          font-weight: 600;
          font-size: 16px;
          flex-shrink: 0;
        }

        .mobile-list .list-item-content {
          flex: 1;
          min-width: 0;
        }

        .mobile-list .list-item-name {
          font-weight: 600;
          color: var(--gray-700);
          font-size: 15px;
          margin-bottom: 4px;
        }

        .mobile-list .list-item-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--gray-400);
        }

        .mobile-list .list-item-level {
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .mobile-list .list-item-level.elementary {
          background: #dbeafe;
          color: #1e40af;
        }

        .mobile-list .list-item-level.high_school {
          background: var(--aca-gold-subtle);
          color: var(--aca-gold-dark);
        }

        .mobile-list .list-item-barcode {
          font-family: 'SF Mono', Monaco, monospace;
          color: var(--gray-400);
        }

        .mobile-list .list-item-balance-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--gray-300);
          flex-shrink: 0;
        }

        .mobile-list .list-item-balance {
          font-family: 'SF Mono', Monaco, monospace;
          font-weight: 700;
          font-size: 18px;
          min-width: 28px;
          text-align: right;
        }

        .mobile-list .list-item-balance.balance-good {
          color: var(--success);
        }

        .mobile-list .list-item-balance.balance-warning {
          color: var(--warning);
        }

        .mobile-list .list-item-balance.balance-danger {
          color: var(--error);
        }

        .mobile-list .empty-state-mobile {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 20px;
          color: var(--gray-400);
          gap: 12px;
        }

        .mobile-list .empty-state-mobile p {
          margin: 0;
          font-size: 14px;
        }
      `}</style>

      <style jsx>{`
        .students-page {
          max-width: 1200px;
          width: 100%;
          box-sizing: border-box;
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

        .sort-dropdown {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
        }

        .sort-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--gray-400);
          white-space: nowrap;
        }

        .sort-select {
          padding: 8px 32px 8px 12px;
          border: 1px solid var(--gray-200);
          border-radius: var(--border-radius);
          background: var(--white);
          color: var(--gray-700);
          font-size: 13px;
          font-weight: 500;
          font-family: var(--font-body);
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 8px center;
          transition: all var(--transition-fast);
        }

        .sort-select:hover {
          border-color: var(--gray-300);
        }

        .sort-select:focus {
          outline: none;
          border-color: var(--aca-teal);
          box-shadow: 0 0 0 3px var(--aca-teal-subtle);
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

        .data-table th.sortable {
          cursor: pointer;
          user-select: none;
          transition: all var(--transition-fast);
        }

        .data-table th.sortable:hover {
          color: var(--aca-teal);
          background: var(--gray-100);
        }

        .sort-icon {
          margin-left: 6px;
          color: var(--aca-teal);
          font-weight: 700;
        }

        .data-table tbody tr {
          animation: tableRowEnter 0.3s ease-out backwards;
          transition: background var(--transition-fast);
        }

        .data-table tbody tr.clickable-row {
          cursor: pointer;
        }

        .data-table tbody tr:hover {
          background: var(--gray-50);
        }

        .data-table tbody tr.clickable-row:active {
          background: var(--gray-100);
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

        /* Desktop/Mobile visibility */
        .desktop-only {
          display: block;
        }

        .mobile-only {
          display: none;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }

          .mobile-only {
            display: block !important;
          }

          .students-page {
            max-width: 100%;
            width: 100%;
            overflow-x: hidden;
            box-sizing: border-box;
          }

          .stats-row {
            width: 100%;
            max-width: 100%;
          }

          .filters {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }

          .mobile-list {
            width: 100%;
            max-width: 100%;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .page-header .btn {
            width: 100%;
            justify-content: center;
          }

          h1 {
            font-size: 22px;
          }

          .stats-row {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .stat-card {
            padding: 14px 16px;
          }

          .stat-icon {
            width: 36px;
            height: 36px;
          }

          .stat-value {
            font-size: 18px;
          }

          .stat-label {
            font-size: 11px;
          }

          .filters {
            flex-direction: column;
            padding: 12px;
            gap: 12px;
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
            padding: 8px 14px;
            font-size: 12px;
          }

          .sort-dropdown {
            width: 100%;
            margin-left: 0;
          }

          .sort-select {
            flex: 1;
            width: 100%;
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
            font-size: 13px;
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

          .name-cell {
            min-width: 150px;
          }

          .student-avatar {
            width: 32px;
            height: 32px;
            font-size: 12px;
          }

          .barcode {
            font-size: 11px;
            padding: 4px 8px;
          }

          .level-badge {
            font-size: 10px;
            padding: 4px 10px;
          }

          .balance {
            font-size: 12px;
            padding: 3px 8px;
          }

          .action-btn {
            padding: 5px 10px;
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .stats-row {
            grid-template-columns: 1fr 1fr;
          }

          .stat-card {
            padding: 12px 14px;
            gap: 10px;
          }

          .stat-icon {
            width: 32px;
            height: 32px;
          }

          .stat-icon svg {
            width: 16px;
            height: 16px;
          }

          .stat-value {
            font-size: 16px;
          }

          .header-icon {
            width: 40px;
            height: 40px;
          }

          .header-icon svg {
            width: 20px;
            height: 20px;
          }

          .search-input {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
}
