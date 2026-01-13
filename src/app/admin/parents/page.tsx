'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Parent, Student } from '@/types/database'

interface ParentWithStudents extends Parent {
  students: Student[]
}

export default function ParentsPage() {
  const [parents, setParents] = useState<ParentWithStudents[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchParents()
  }, [])

  async function fetchParents() {
    const { data, error } = await supabase
      .from('parents')
      .select('*, students(*)')
      .order('name')

    if (!error && data) {
      setParents(data as ParentWithStudents[])
    }
    setLoading(false)
  }

  const filteredParents = parents.filter((parent) =>
    parent.name.toLowerCase().includes(search.toLowerCase()) ||
    parent.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="parents-page">
      <div className="page-header">
        <div>
          <h1>Parents</h1>
          <p className="subtitle">{parents.length} total parents</p>
        </div>
        <Link href="/admin/parents/new" className="btn btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Parent
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
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading parents...</div>
      ) : (
        <div className="table-container card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Students</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParents.map((parent) => (
                <tr key={parent.id}>
                  <td className="name-cell">
                    <span className="parent-name">{parent.name}</span>
                  </td>
                  <td>
                    <a href={`mailto:${parent.email}`} className="email-link">
                      {parent.email}
                    </a>
                  </td>
                  <td>{parent.phone || '—'}</td>
                  <td>
                    <span className="student-count">
                      {parent.students.length} student{parent.students.length !== 1 ? 's' : ''}
                    </span>
                    {parent.students.length > 0 && (
                      <span className="student-names">
                        {parent.students.map((s) => s.name).join(', ')}
                      </span>
                    )}
                  </td>
                  <td>
                    <Link href={`/admin/parents/${parent.id}`} className="action-btn">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredParents.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No parents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .parents-page {
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

        .parent-name {
          font-weight: 600;
          color: var(--gray-700);
        }

        .email-link {
          color: var(--aca-blue);
          text-decoration: none;
        }

        .email-link:hover {
          text-decoration: underline;
        }

        .student-count {
          font-weight: 600;
          color: var(--gray-600);
        }

        .student-names {
          display: block;
          font-size: 12px;
          color: var(--gray-400);
          margin-top: 2px;
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
