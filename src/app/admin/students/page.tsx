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

  return (
    <div className="students-page">
      <div className="page-header">
        <div>
          <h1>Students</h1>
          <p className="subtitle">{students.length} total students</p>
        </div>
        <Link href="/admin/students/new" className="btn btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Student
        </Link>
      </div>

      <div className="filters card">
        <div className="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <div className="loading">Loading students...</div>
      ) : (
        <div className="table-container card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Barcode</th>
                <th>Level</th>
                <th>Parent</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td className="name-cell">
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
                  <td>{student.parent.name}</td>
                  <td>
                    <span className={`balance ${getBalanceClass(student.balance)}`}>
                      ${student.balance.toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <Link href={`/admin/students/${student.id}`} className="action-btn">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No students found
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
          align-items: flex-start;
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

        .filters {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          align-items: center;
        }

        .search-box {
          flex: 1;
          position: relative;
        }

        .search-box svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gray-400);
        }

        .search-input {
          padding-left: 44px;
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

        .student-name {
          font-weight: 600;
          color: var(--gray-700);
        }

        .barcode {
          background: var(--gray-100);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 13px;
          color: var(--aca-blue);
        }

        .level-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .level-badge.elementary {
          background: #dbeafe;
          color: #1e40af;
        }

        .level-badge.high_school {
          background: #fef3c7;
          color: #92400e;
        }

        .balance {
          font-weight: 600;
          font-family: monospace;
        }

        .balance-good {
          color: var(--success);
        }

        .balance-warning {
          color: var(--warning);
        }

        .balance-danger {
          color: var(--error);
        }

        .action-btn {
          color: var(--aca-blue);
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
        }

        .action-btn:hover {
          text-decoration: underline;
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
