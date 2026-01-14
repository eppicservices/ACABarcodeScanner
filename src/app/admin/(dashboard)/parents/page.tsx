'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Parent, Student } from '@/types/database'

interface ParentWithStudents extends Parent {
  students: Student[]
}

type SortField = 'name' | 'balance' | 'children'
type SortDirection = 'asc' | 'desc'

export default function ParentsPage() {
  const [parents, setParents] = useState<ParentWithStudents[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true

    async function fetchParents() {
      const { data, error } = await supabase
        .from('parents')
        .select('*, students(*)')
        .order('name')

      if (isMounted) {
        if (!error && data) {
          setParents(data as ParentWithStudents[])
        }
        setLoading(false)
      }
    }

    fetchParents()

    return () => {
      isMounted = false
    }
  }, [])

  const getFamilyBalance = (parent: ParentWithStudents) =>
    parent.students.reduce((sum, s) => sum + s.balance, 0)

  const filteredParents = parents
    .filter((parent) =>
      parent.name.toLowerCase().includes(search.toLowerCase()) ||
      parent.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'balance':
          comparison = getFamilyBalance(a) - getFamilyBalance(b)
          break
        case 'children':
          comparison = a.students.length - b.students.length
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

  const totalStudents = parents.reduce((sum, p) => sum + p.students.length, 0)
  const parentsWithMultipleKids = parents.filter(p => p.students.length > 1).length

  return (
    <div className="parents-page">
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
            <h1>Parents</h1>
            <p className="subtitle">Manage parent contact information</p>
          </div>
        </div>
        <Link href="/admin/parents/new" className="btn btn-primary desktop-only">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Parent
        </Link>
      </div>

      {/* Desktop Stats Grid */}
      <div className="stats-row desktop-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{parents.length}</span>
            <span className="stat-label">Total Parents</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon students">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{totalStudents}</span>
            <span className="stat-label">Total Students</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon families">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <div className="stat-content">
            <span className="stat-value">{parentsWithMultipleKids}</span>
            <span className="stat-label">Multiple Children</span>
          </div>
        </div>
      </div>

      {/* Mobile Stats Pills */}
      <div className="stats-pills mobile-stats">
        <span className="stat-pill">{parents.length} Parents</span>
        <span className="stat-pill students">{totalStudents} Students</span>
        {parentsWithMultipleKids > 0 && (
          <span className="stat-pill families">{parentsWithMultipleKids} Multi</span>
        )}
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
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        {search && (
          <span className="search-results">
            {filteredParents.length} result{filteredParents.length !== 1 ? 's' : ''}
          </span>
        )}
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
            <option value="children-desc">Children (Most First)</option>
            <option value="children-asc">Children (Least First)</option>
          </select>
        </div>
      </div>

      {/* Mobile Action Bar */}
      <div className="mobile-action-bar mobile-only">
        <Link href="/admin/parents/new" className="action-bar-btn primary">
          <div className="action-bar-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <span>Add Parent</span>
        </Link>
        <Link href="/admin/add-payment" className="action-bar-btn secondary">
          <div className="action-bar-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <span>Add Payment</span>
        </Link>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <span>Loading parents...</span>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-container card desktop-only">
            <table className="data-table">
            <thead>
              <tr>
                <th>Parent</th>
                <th>Contact</th>
                <th>Children</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParents.map((parent, index) => (
                <tr key={parent.id} style={{ animationDelay: `${index * 30}ms` }}>
                  <td className="name-cell">
                    <div
                      className="parent-info clickable"
                      onClick={() => router.push(`/admin/parents/${parent.id}`)}
                    >
                      <div className="avatar">
                        {parent.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="parent-name">{parent.name}</span>
                      <svg className="name-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <a href={`mailto:${parent.email}`} className="email-link">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        {parent.email}
                      </a>
                      {parent.phone && (
                        <span className="phone">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          {parent.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="children-info">
                      <span className="student-count">
                        {parent.students.length} {parent.students.length === 1 ? 'child' : 'children'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <a
                        href={`mailto:${parent.email}?subject=Lunch Balance Update&body=Hello ${parent.name},%0D%0A%0D%0AYour current family lunch balance is $${getFamilyBalance(parent).toFixed(2)}.%0D%0A%0D%0AThank you!`}
                        className="action-btn email-btn"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        Email Balance
                      </a>
                      <Link href={`/admin/add-payment?parent=${parent.id}`} className="action-btn payment-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Payment
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredParents.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="empty-state">
                    <div className="empty-content">
                      <div className="empty-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </div>
                      {search ? (
                        <>
                          <p className="empty-title">No parents match &ldquo;{search}&rdquo;</p>
                          <p className="empty-desc">Try a different search term</p>
                        </>
                      ) : (
                        <>
                          <p className="empty-title">No parents yet</p>
                          <p className="empty-desc">Add your first parent to get started</p>
                          <Link href="/admin/parents/new" className="btn btn-primary btn-sm">
                            Add Parent
                          </Link>
                        </>
                      )}
                    </div>
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
                {filteredParents.length} {filteredParents.length === 1 ? 'parent' : 'parents'}
              </span>
            </div>
            {filteredParents.length === 0 ? (
              <div className="empty-state-mobile">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <p>{search ? `No parents match "${search}"` : 'No parents yet'}</p>
              </div>
            ) : (
              <div className="list-items">
                {filteredParents.map((parent, index) => (
                  <Link
                    key={parent.id}
                    href={`/admin/parents/${parent.id}`}
                    className="list-item"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className="list-item-avatar">
                      {parent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="list-item-content">
                      <div className="list-item-name">{parent.name}</div>
                      <div className="list-item-meta">
                        <span className="list-item-children-count">
                          {parent.students.length} {parent.students.length === 1 ? 'child' : 'children'}
                        </span>
                        <span className="list-item-email">{parent.email}</span>
                      </div>
                    </div>
                    <svg className="list-item-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <style jsx global>{`
          /* Mobile List Styles - Global to work with Link components */
          .parents-page .mobile-list {
              background: var(--white);
              border-radius: 14px;
              border: 1px solid var(--gray-100);
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 44, 95, 0.04);
          }

          .parents-page .mobile-list .list-header {
              padding: 12px 16px;
              background: var(--gray-50);
              border-bottom: 1px solid var(--gray-100);
          }

          .parents-page .mobile-list .results-count {
              font-size: 12px;
              font-weight: 600;
              color: var(--gray-500);
              letter-spacing: 0.02em;
          }

          .parents-page .mobile-list .list-items {
              display: flex;
              flex-direction: column;
          }

          .parents-page .mobile-list .list-item {
              display: flex !important;
              flex-direction: row !important;
              align-items: center !important;
              gap: 14px;
              padding: 14px 16px;
              text-decoration: none;
              border-bottom: 1px solid var(--gray-100);
              transition: all 0.15s ease;
              animation: listItemFadeIn 0.3s ease-out backwards;
          }

          @keyframes listItemFadeIn {
              from {
                  opacity: 0;
                  transform: translateY(8px);
              }
              to {
                  opacity: 1;
                  transform: translateY(0);
              }
          }

          .parents-page .mobile-list .list-item:last-child {
              border-bottom: none;
          }

          .parents-page .mobile-list .list-item:active {
              background: var(--gray-50);
              transform: scale(0.99);
          }

          .parents-page .mobile-list .list-item-avatar {
              width: 46px;
              height: 46px;
              min-width: 46px;
              background: linear-gradient(145deg, var(--aca-teal) 0%, var(--aca-teal-dark) 100%);
              border-radius: 13px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: var(--white);
              font-weight: 700;
              font-size: 17px;
              flex-shrink: 0;
              box-shadow: 0 2px 8px rgba(0, 177, 193, 0.25);
              letter-spacing: -0.02em;
          }

          .parents-page .mobile-list .list-item-content {
              flex: 1;
              min-width: 0;
          }

          .parents-page .mobile-list .list-item-name {
              font-weight: 600;
              color: var(--gray-700);
              font-size: 15px;
              margin-bottom: 5px;
              letter-spacing: -0.01em;
          }

          .parents-page .mobile-list .list-item-meta {
              display: flex;
              align-items: center;
              gap: 10px;
              font-size: 12px;
              color: var(--gray-400);
          }

          .parents-page .mobile-list .list-item-children-count {
              padding: 3px 9px;
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
              border-radius: 8px;
              font-weight: 700;
              font-size: 10px;
              color: #1e40af;
              text-transform: uppercase;
              letter-spacing: 0.04em;
          }

          .parents-page .mobile-list .list-item-email {
              font-size: 12px;
              color: var(--gray-400);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
          }

          .parents-page .mobile-list .list-item-chevron {
              color: var(--gray-300);
              flex-shrink: 0;
              opacity: 0.4;
          }

          .parents-page .mobile-list .empty-state-mobile {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 56px 24px;
              color: var(--gray-400);
              gap: 14px;
          }

          .parents-page .mobile-list .empty-state-mobile svg {
              opacity: 0.5;
          }

          .parents-page .mobile-list .empty-state-mobile p {
              margin: 0;
              font-size: 14px;
              font-weight: 500;
          }
      `}</style>

      <style jsx>{`
        .parents-page {
          max-width: 1200px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
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
          border: 1px solid var(--gray-100);
          border-radius: var(--border-radius-lg);
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all var(--transition-fast);
        }

        .stat-card:hover {
          border-color: var(--gray-200);
          box-shadow: var(--shadow-sm);
        }

        .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.total {
          background: var(--aca-teal-subtle);
          color: var(--aca-teal);
        }

        .stat-icon.students {
          background: #dbeafe;
          color: #1e40af;
        }

        .stat-icon.families {
          background: var(--aca-gold-subtle);
          color: var(--aca-gold-dark);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--gray-700);
          line-height: 1.2;
        }

        .stat-label {
          font-size: 13px;
          color: var(--gray-400);
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
          max-width: 400px;
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

        .search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--gray-400);
          cursor: pointer;
          padding: 4px;
          display: flex;
          border-radius: 4px;
          transition: all var(--transition-fast);
        }

        .search-clear:hover {
          color: var(--gray-600);
          background: var(--gray-100);
        }

        .search-results {
          font-size: 14px;
          color: var(--gray-400);
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

        .table-container {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 16px 18px;
          text-align: left;
          border-bottom: 1px solid var(--gray-100);
        }

        .data-table th {
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--gray-400);
          background: linear-gradient(to bottom, var(--gray-50) 0%, var(--white) 100%);
        }

        .data-table tbody tr {
          animation: tableRowEnter 0.3s ease-out backwards;
        }

        @keyframes tableRowEnter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .data-table tbody tr:hover {
          background: var(--gray-50);
        }

        .data-table tbody tr:last-child td {
          border-bottom: none;
        }

        .parent-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .parent-info.clickable {
          cursor: pointer;
          padding: 8px 12px;
          margin: -8px -12px;
          border-radius: var(--border-radius);
          transition: all var(--transition-fast);
        }

        .parent-info.clickable:hover {
          background: var(--gray-50);
        }

        .parent-info.clickable:active {
          background: var(--gray-100);
        }

        .name-chevron {
          color: var(--gray-300);
          opacity: 0;
          transition: all var(--transition-fast);
          margin-left: auto;
        }

        .parent-info.clickable:hover .name-chevron {
          opacity: 1;
          transform: translateX(2px);
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--aca-teal) 0%, var(--aca-teal-dark) 100%);
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
        }

        .parent-name {
          font-weight: 600;
          color: var(--gray-700);
        }

        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .email-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--aca-teal);
          text-decoration: none;
          font-size: 14px;
          transition: color var(--transition-fast);
        }

        .email-link:hover {
          color: var(--aca-teal-dark);
        }

        .phone {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--gray-400);
        }

        .children-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .student-count {
          font-weight: 600;
          font-size: 14px;
          color: var(--gray-600);
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--aca-teal);
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          padding: 6px 12px;
          border-radius: var(--border-radius);
          transition: all var(--transition-fast);
        }

        .action-btn:hover {
          background: var(--aca-teal-subtle);
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .email-btn {
          background: var(--aca-teal-subtle);
          color: var(--aca-teal);
        }

        .email-btn:hover {
          background: var(--aca-teal);
          color: var(--white);
        }

        .payment-btn {
          background: var(--success-bg);
          color: var(--success);
        }

        .payment-btn:hover {
          background: #bbf7d0;
        }

        .empty-state {
          padding: 60px 20px !important;
        }

        .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          background: var(--gray-50);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
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
          margin: 0 0 16px 0;
        }

        .btn-sm {
          padding: 10px 20px;
          font-size: 14px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px;
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

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Desktop/Mobile visibility */
        .desktop-only {
          display: block;
        }

        .mobile-only {
          display: none;
        }

        /* Mobile stats pills - hidden on desktop */
        .mobile-stats {
          display: none;
        }

        .desktop-stats {
          display: grid;
        }

        /* Mobile action bar - hidden on desktop */
        .mobile-action-bar {
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

          /* Hide desktop stats, show mobile pills */
          .desktop-stats {
            display: none !important;
          }

          .mobile-stats {
            display: flex !important;
          }

          /* Mobile action bar */
          .mobile-action-bar {
            display: flex !important;
            gap: 10px;
            margin-bottom: 16px;
          }

          .action-bar-btn {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 16px 12px;
            border-radius: 14px;
            text-decoration: none;
            font-weight: 600;
            font-size: 13px;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
          }

          .action-bar-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            opacity: 0;
            transition: opacity 0.2s ease;
          }

          .action-bar-btn.primary {
            background: linear-gradient(145deg, var(--aca-teal) 0%, var(--aca-teal-dark) 100%);
            color: var(--white);
            box-shadow: 0 4px 14px rgba(0, 177, 193, 0.35);
          }

          .action-bar-btn.primary::before {
            background: linear-gradient(145deg, rgba(255,255,255,0.15) 0%, transparent 100%);
          }

          .action-bar-btn.primary:active {
            transform: scale(0.97);
            box-shadow: 0 2px 8px rgba(0, 177, 193, 0.25);
          }

          .action-bar-btn.primary:active::before {
            opacity: 1;
          }

          .action-bar-btn.secondary {
            background: linear-gradient(145deg, #22c55e 0%, #16a34a 100%);
            color: var(--white);
            box-shadow: 0 4px 14px rgba(34, 197, 94, 0.35);
          }

          .action-bar-btn.secondary::before {
            background: linear-gradient(145deg, rgba(255,255,255,0.15) 0%, transparent 100%);
          }

          .action-bar-btn.secondary:active {
            transform: scale(0.97);
            box-shadow: 0 2px 8px rgba(34, 197, 94, 0.25);
          }

          .action-bar-btn.secondary:active::before {
            opacity: 1;
          }

          .action-bar-icon {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(4px);
          }

          .action-bar-btn span {
            letter-spacing: 0.01em;
          }

          .parents-page {
            max-width: 100%;
            width: 100%;
            overflow-x: hidden;
            box-sizing: border-box;
          }

          .page-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
            margin-bottom: 20px;
          }

          .header-content {
            gap: 12px;
          }

          .header-icon {
            width: 42px;
            height: 42px;
            border-radius: 12px;
          }

          .page-header .btn {
            width: 100%;
            justify-content: center;
            padding: 14px 24px;
          }

          h1 {
            font-size: 20px;
            letter-spacing: -0.01em;
          }

          .subtitle {
            font-size: 13px;
            display: none;
          }

          /* Mini Pills Stats */
          .stats-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 16px;
            align-items: center;
            justify-content: center;
          }

          .stat-pill {
            display: inline-flex;
            align-items: center;
            padding: 6px 12px;
            background: var(--white);
            border: 1px solid var(--gray-200);
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
            color: var(--gray-600);
            white-space: nowrap;
          }

          .stat-pill.students {
            background: #dbeafe;
            border-color: #bfdbfe;
            color: #1e40af;
          }

          .stat-pill.families {
            background: var(--aca-gold-subtle);
            border-color: #fde68a;
            color: var(--aca-gold-dark);
          }

          /* Refined filters card */
          .filters {
            flex-direction: column;
            padding: 14px;
            gap: 14px;
            margin-bottom: 16px;
            border-radius: 14px;
            background: var(--white);
            border: 1px solid var(--gray-100);
            box-shadow: 0 2px 8px rgba(0, 44, 95, 0.04);
          }

          .search-box {
            width: 100%;
            max-width: 100%;
          }

          .search-input {
            font-size: 15px;
            padding: 12px 40px 12px 44px;
            border-radius: 10px;
            background: var(--gray-50);
            border: 1px solid transparent;
            transition: all 0.2s ease;
          }

          .search-input:focus {
            background: var(--white);
            border-color: var(--aca-teal);
            box-shadow: 0 0 0 3px var(--aca-teal-subtle);
          }

          .search-input::placeholder {
            color: var(--gray-400);
            font-size: 14px;
          }

          /* Compact sort dropdown */
          .sort-dropdown {
            width: 100%;
            margin-left: 0;
            padding-top: 14px;
            border-top: 1px solid var(--gray-100);
          }

          .sort-label {
            font-size: 12px;
            color: var(--gray-400);
          }

          .sort-select {
            flex: 1;
            width: 100%;
            padding: 10px 36px 10px 14px;
            font-size: 13px;
            border-radius: 10px;
            background-color: var(--gray-50);
            border: 1px solid transparent;
          }

          .sort-select:focus {
            background-color: var(--white);
            border-color: var(--aca-teal);
          }

          /* Mobile list refinements */
          .mobile-list {
            width: 100%;
            max-width: 100%;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 44, 95, 0.04);
          }

          .table-container {
            margin: 0;
            border-radius: 14px;
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
            background: linear-gradient(to bottom, var(--gray-50) 0%, var(--white) 100%);
          }

          .data-table tbody tr:hover td:first-child {
            background: var(--gray-50);
          }

          .avatar {
            width: 36px;
            height: 36px;
            font-size: 14px;
          }

          .action-buttons {
            flex-wrap: nowrap;
            gap: 4px;
          }

          .action-btn {
            padding: 5px 8px;
            font-size: 12px;
            white-space: nowrap;
          }

          .action-btn svg {
            width: 12px;
            height: 12px;
          }

          .email-btn,
          .payment-btn {
            padding: 5px 8px;
          }
        }

        @media (max-width: 480px) {
          .page-header {
            gap: 14px;
          }

          .header-icon {
            width: 38px;
            height: 38px;
          }

          .header-icon svg {
            width: 18px;
            height: 18px;
          }

          h1 {
            font-size: 18px;
          }

          .stats-pills {
            gap: 6px;
          }

          .stat-pill {
            padding: 5px 10px;
            font-size: 12px;
          }

          .filters {
            padding: 12px;
            gap: 12px;
          }

          .search-input {
            font-size: 14px;
            padding: 11px 38px 11px 42px;
          }

          .sort-dropdown {
            padding-top: 12px;
          }

          .sort-select {
            padding: 9px 32px 9px 12px;
            font-size: 12px;
          }

          .action-btn span {
            display: none;
          }

          .action-btn {
            padding: 6px;
          }

          .action-btn svg {
            width: 14px;
            height: 14px;
          }
        }

        @media (max-width: 360px) {
          .stats-pills {
            gap: 5px;
          }

          .stat-pill {
            padding: 4px 8px;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  )
}
