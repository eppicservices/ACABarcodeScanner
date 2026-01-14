'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Parent, Student } from '@/types/database'

interface ParentWithStudents extends Parent {
  students: Student[]
}

type SortField = 'name' | 'balance' | '131children'
type SortDirection = 'asc' | 'desc'

export default function ParentsPage() {
  const [parents, setParents] = useState<ParentWithStudents[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [generatingLink, setGeneratingLink] = useState<string | null>(null)
  const [linkMessage, setLinkMessage] = useState<{ parentId: string; url: string } | null>(null)
  const supabase = createClient()
  const router = useRouter()

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

  async function handleGenerateLink(parentId: string) {
    setGeneratingLink(parentId)
    setLinkMessage(null)

    try {
      const res = await fetch('/api/parent-portal/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: parentId })
      })

      const data = await res.json()

      if (data.success) {
        setLinkMessage({ parentId, url: data.portalUrl })
      } else {
        alert(data.error || 'Failed to generate link')
      }
    } catch {
      alert('Failed to generate link')
    }

    setGeneratingLink(null)
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url)
    alert('Link copied to clipboard!')
  }

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
        <Link href="/admin/parents/new" className="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Parent
        </Link>
      </div>

      <div className="stats-row">
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
                      {parent.students.length > 0 && (
                        <div className="student-names">
                          {parent.students.map((s, i) => (
                            <Link key={s.id} href={`/admin/students/${s.id}`} className="student-tag">
                              {s.name.split(' ')[0]}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {linkMessage?.parentId === parent.id ? (
                        <div className="link-generated">
                          <button onClick={() => copyLink(linkMessage.url)} className="action-btn copy-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            Copy Link
                          </button>
                          <button onClick={() => setLinkMessage(null)} className="action-btn dismiss-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleGenerateLink(parent.id)}
                          className="action-btn portal-btn"
                          disabled={generatingLink === parent.id}
                        >
                          {generatingLink === parent.id ? (
                            <span className="btn-spinner" />
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                          )}
                          Portal Link
                        </button>
                      )}
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
                  <div
                    key={parent.id}
                    className="list-item"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <Link href={`/admin/parents/${parent.id}`} className="list-item-main">
                      <div className="list-item-avatar">
                        {parent.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="list-item-content">
                        <div className="list-item-name">{parent.name}</div>
                        <div className="list-item-meta">
                          <span className="list-item-email">{parent.email}</span>
                        </div>
                        <div className="list-item-children">
                          {parent.students.length === 0 ? (
                            <span className="no-children">No children</span>
                          ) : (
                            parent.students.map((s) => (
                              <span key={s.id} className="child-tag">{s.name.split(' ')[0]}</span>
                            ))
                          )}
                        </div>
                      </div>
                      <svg className="list-item-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                    <div className="list-item-actions">
                      {linkMessage?.parentId === parent.id ? (
                        <button onClick={() => copyLink(linkMessage.url)} className="mobile-action-btn copy">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          Copy
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGenerateLink(parent.id)}
                          className="mobile-action-btn link"
                          disabled={generatingLink === parent.id}
                        >
                          {generatingLink === parent.id ? (
                            <span className="btn-spinner-sm" />
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                          )}
                          Link
                        </button>
                      )}
                      <Link href={`/admin/add-payment?parent=${parent.id}`} className="mobile-action-btn payment">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Pay
                      </Link>
                    </div>
                  </div>
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
              border-radius: var(--border-radius-lg);
              border: 1px solid var(--gray-100);
              overflow: hidden;
          }

          .parents-page .mobile-list .list-header {
              padding: 12px 16px;
              background: var(--gray-50);
              border-bottom: 1px solid var(--gray-100);
          }

          .parents-page .mobile-list .list-items {
              display: flex;
              flex-direction: column;
          }

          .parents-page .mobile-list .list-item {
              display: flex;
              flex-direction: column;
              border-bottom: 1px solid var(--gray-100);
              animation: listItemEnter 0.3s ease-out backwards;
          }

          .parents-page .mobile-list .list-item:last-child {
              border-bottom: none;
          }

          .parents-page .mobile-list .list-item-main {
              display: flex !important;
              align-items: center !important;
              gap: 12px;
              padding: 14px 16px;
              text-decoration: none;
              transition: background 0.15s ease;
          }

          .parents-page .mobile-list .list-item-main:active {
              background: var(--gray-50);
          }

          .parents-page .mobile-list .list-item-avatar {
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

          .parents-page .mobile-list .list-item-name {
              font-weight: 600;
              color: var(--gray-700);
              font-size: 15px;
              margin-bottom: 2px;
          }

          .parents-page .mobile-list .list-item-meta {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 6px;
          }

          .parents-page .mobile-list .list-item-email {
              font-size: 12px;
              color: var(--gray-400);
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
          }

          .parents-page .mobile-list .list-item-children {
              display: flex;
              flex-wrap: wrap;
              gap: 4px;
          }

          .parents-page .mobile-list .child-tag {
              padding: 2px 8px;
              background: var(--gray-100);
              border-radius: 8px;
              font-size: 11px;
              color: var(--gray-600);
              font-weight: 500;
          }

          .parents-page .mobile-list .no-children {
              font-size: 11px;
              color: var(--gray-400);
              font-style: italic;
          }

          .parents-page .mobile-list .list-item-chevron {
              color: var(--gray-300);
              flex-shrink: 0;
          }

          .parents-page .mobile-list .list-item-actions {
              display: flex;
              gap: 8px;
              padding: 0 16px 14px;
              margin-top: -4px;
          }

          .parents-page .mobile-list .mobile-action-btn {
              display: flex;
              align-items: center;
              gap: 6px;
              padding: 10px 14px;
              border-radius: var(--border-radius);
              font-size: 12px;
              font-weight: 600;
              text-decoration: none;
              transition: all var(--transition-fast);
              border: none;
              cursor: pointer;
              font-family: var(--font-body);
              min-height: 44px;
          }

          .parents-page .mobile-list .mobile-action-btn.link {
              background: var(--aca-gold-subtle);
              color: var(--aca-gold-dark);
          }

          .parents-page .mobile-list .mobile-action-btn.link:active {
              background: var(--aca-gold);
              color: var(--aca-navy);
          }

          .parents-page .mobile-list .mobile-action-btn.link:disabled {
              opacity: 0.6;
              cursor: wait;
          }

          .parents-page .mobile-list .mobile-action-btn.copy {
              background: var(--success-bg);
              color: var(--success);
          }

          .parents-page .mobile-list .mobile-action-btn.payment {
              background: var(--success-bg);
              color: var(--success);
          }

          .parents-page .mobile-list .mobile-action-btn.payment:active {
              background: #bbf7d0;
          }

          .parents-page .mobile-list .btn-spinner-sm {
              width: 14px;
              height: 14px;
              border: 2px solid var(--aca-gold);
              border-top-color: var(--aca-navy);
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
          }

          .parents-page .mobile-list .empty-state-mobile {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 48px 20px;
              color: var(--gray-400);
              gap: 12px;
          }

          .parents-page .mobile-list .empty-state-mobile p {
              margin: 0;
              font-size: 14px;
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

        .student-names {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .student-tag {
          display: inline-block;
          padding: 4px 10px;
          background: var(--gray-100);
          color: var(--gray-600);
          border-radius: 12px;
          font-size: 12px;
          text-decoration: none;
          transition: all var(--transition-fast);
        }

        .student-tag:hover {
          background: var(--aca-teal-subtle);
          color: var(--aca-teal);
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

        .portal-btn {
          background: var(--aca-gold-subtle);
          color: var(--aca-gold-dark);
        }

        .portal-btn:hover {
          background: var(--aca-gold);
          color: var(--aca-navy);
        }

        .portal-btn:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .payment-btn {
          background: var(--success-bg);
          color: var(--success);
        }

        .payment-btn:hover {
          background: #bbf7d0;
        }

        .link-generated {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .copy-btn {
          background: var(--success-bg);
          color: var(--success);
        }

        .copy-btn:hover {
          background: #bbf7d0;
        }

        .dismiss-btn {
          padding: 6px;
          min-width: 44px;
          min-height: 44px;
          color: var(--gray-400);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .dismiss-btn:hover {
          background: var(--gray-100);
          color: var(--gray-600);
        }

        .btn-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid var(--aca-gold);
          border-top-color: var(--aca-navy);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
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

        .results-count {
          font-size: 13px;
          color: var(--gray-500);
          font-weight: 500;
        }

        @keyframes listItemEnter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }

          .mobile-only {
            display: block !important;
          }
          .parents-page {
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
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }

          .stat-card {
            padding: 14px;
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .stat-icon {
            width: 36px;
            height: 36px;
          }

          .stat-value {
            font-size: 20px;
          }

          .stat-label {
            font-size: 11px;
          }

          .filters {
            flex-direction: column;
            gap: 10px;
          }

          .search-box {
            max-width: 100%;
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

          .portal-btn,
          .payment-btn {
            padding: 5px 8px;
          }

          .student-tag {
            font-size: 11px;
            padding: 3px 8px;
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
          }

          .stat-icon {
            width: 40px;
            height: 40px;
          }

          .stat-value {
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

          .contact-info {
            gap: 2px;
          }

          .email-link {
            font-size: 12px;
          }

          .phone {
            font-size: 11px;
          }

          .children-info {
            gap: 4px;
          }

          .student-count {
            font-size: 13px;
          }

          .student-names {
            gap: 4px;
          }
        }

        @media (max-width: 480px) {
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

          .copy-btn span {
            display: inline;
          }
        }
      `}</style>
    </div>
  )
}
