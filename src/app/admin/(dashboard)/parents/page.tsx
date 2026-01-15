'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Parent, Student, ActiveFilter } from '@/types/database'

interface ParentWithStudents extends Parent {
  students: Student[]
}

type SortField = 'name' | 'balance' | 'children'
type SortDirection = 'asc' | 'desc'

export default function ParentsPage() {
  const [parents, setParents] = useState<ParentWithStudents[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ActiveFilter>('active')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [sendingEmailFor, setSendingEmailFor] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [selectedParents, setSelectedParents] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [showCascadeModal, setShowCascadeModal] = useState(false)
  const [pendingDeactivation, setPendingDeactivation] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = createClient()

  const sendBalanceEmail = async (parentId: string, parentEmail: string) => {
    setSendingEmailFor(parentId)
    setEmailSuccess(null)
    setEmailError(null)

    try {
      const response = await fetch('/api/admin/send-balance-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: parentId, force: true })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      setEmailSuccess(parentId)
      setTimeout(() => setEmailSuccess(null), 3000)
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to send email')
      setTimeout(() => setEmailError(null), 5000)
    } finally {
      setSendingEmailFor(null)
    }
  }

  const fetchParents = async () => {
    const { data, error } = await supabase
      .from('parents')
      .select('*, students(*)')
      .order('name')

    if (!error && data) {
      setParents(data as ParentWithStudents[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchParents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Bulk status update with cascade option for deactivation
  const handleBulkStatusUpdate = async (setActive: boolean, cascadeToStudents: boolean = false) => {
    if (selectedParents.size === 0) return

    setBulkUpdating(true)
    setShowCascadeModal(false)
    try {
      const parentIds = Array.from(selectedParents)

      // Update parents
      const { error: parentError } = await supabase
        .from('parents')
        .update({ is_active: setActive })
        .in('id', parentIds)

      if (parentError) throw parentError

      // If deactivating and cascade is requested, also deactivate students
      if (!setActive && cascadeToStudents) {
        const { error: studentError } = await supabase
          .from('students')
          .update({ is_active: false })
          .in('parent_id', parentIds)

        if (studentError) throw studentError
      }

      await fetchParents()
      setSelectedParents(new Set())
      setPendingDeactivation(new Set())
    } catch (error) {
      console.error('Failed to update parent status:', error)
      alert('Failed to update parent status')
    } finally {
      setBulkUpdating(false)
    }
  }

  // Handle deactivation - show modal to ask about cascading
  const initiateDeactivation = () => {
    setPendingDeactivation(selectedParents)
    setShowCascadeModal(true)
  }

  // Toggle single parent selection
  const toggleParentSelection = (parentId: string) => {
    setSelectedParents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(parentId)) {
        newSet.delete(parentId)
      } else {
        newSet.add(parentId)
      }
      return newSet
    })
  }

  // Select/deselect all visible parents
  const toggleSelectAll = () => {
    if (selectedParents.size === filteredParents.length) {
      setSelectedParents(new Set())
    } else {
      setSelectedParents(new Set(filteredParents.map(p => p.id)))
    }
  }

  const getFamilyBalance = (parent: ParentWithStudents) =>
    parent.students.reduce((sum, s) => sum + s.balance, 0)

  const filteredParents = parents
    .filter((parent) => {
      const matchesSearch =
        parent.name.toLowerCase().includes(search.toLowerCase()) ||
        parent.email.toLowerCase().includes(search.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && parent.is_active) ||
        (statusFilter === 'inactive' && !parent.is_active)

      return matchesSearch && matchesStatus
    })
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

  const activeParents = parents.filter(p => p.is_active)
  const inactiveCount = parents.filter(p => !p.is_active).length
  const totalStudents = activeParents.reduce((sum, p) => sum + p.students.filter(s => s.is_active).length, 0)
  const parentsWithMultipleKids = activeParents.filter(p => p.students.filter(s => s.is_active).length > 1).length

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

      {/* Error Toast */}
      {emailError && (
        <div className="error-toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {emailError}
        </div>
      )}

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
            <span className="stat-value">{activeParents.length}</span>
            <span className="stat-label">Active Parents</span>
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
            <span className="stat-label">Active Students</span>
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

        {inactiveCount > 0 && (
          <div className="stat-card inactive-card">
            <div className="stat-icon inactive">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{inactiveCount}</span>
              <span className="stat-label">Inactive</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Stats Pills */}
      <div className="stats-pills mobile-stats">
        <span className="stat-pill">{activeParents.length} Active</span>
        <span className="stat-pill students">{totalStudents} Students</span>
        {parentsWithMultipleKids > 0 && (
          <span className="stat-pill families">{parentsWithMultipleKids} Multi</span>
        )}
        {inactiveCount > 0 && (
          <span className="stat-pill inactive">{inactiveCount} Inactive</span>
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
        <div className="status-filter">
          <select
            className="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ActiveFilter)}
          >
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="all">All Parents</option>
          </select>
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
            <option value="children-desc">Children (Most First)</option>
            <option value="children-asc">Children (Least First)</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedParents.size > 0 && (
        <div className="bulk-actions card">
          <div className="bulk-info">
            <span className="bulk-count">{selectedParents.size} selected</span>
            <button className="bulk-clear" onClick={() => setSelectedParents(new Set())}>
              Clear selection
            </button>
          </div>
          <div className="bulk-buttons">
            <button
              className="bulk-btn activate"
              onClick={() => handleBulkStatusUpdate(true)}
              disabled={bulkUpdating}
            >
              {bulkUpdating ? 'Updating...' : 'Set Active'}
            </button>
            <button
              className="bulk-btn deactivate"
              onClick={initiateDeactivation}
              disabled={bulkUpdating}
            >
              {bulkUpdating ? 'Updating...' : 'Set Inactive'}
            </button>
          </div>
        </div>
      )}

      {/* Cascade Deactivation Modal */}
      {showCascadeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Deactivate Parents</h3>
            <p>
              You are about to set {pendingDeactivation.size} parent{pendingDeactivation.size > 1 ? 's' : ''} as inactive.
            </p>
            <p className="modal-warning">
              Would you also like to set their students as inactive?
            </p>
            <div className="modal-actions">
              <button
                className="modal-btn secondary"
                onClick={() => setShowCascadeModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn outline"
                onClick={() => handleBulkStatusUpdate(false, false)}
              >
                Parents Only
              </button>
              <button
                className="modal-btn primary"
                onClick={() => handleBulkStatusUpdate(false, true)}
              >
                Parents & Students
              </button>
            </div>
          </div>
        </div>
      )}

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
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    checked={filteredParents.length > 0 && selectedParents.size === filteredParents.length}
                    onChange={toggleSelectAll}
                    title="Select all"
                  />
                </th>
                <th>Parent</th>
                <th>Contact</th>
                <th>Children</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParents.map((parent, index) => (
                <tr key={parent.id} className={!parent.is_active ? 'inactive-row' : ''} style={{ animationDelay: `${index * 30}ms` }}>
                  <td className="checkbox-col" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedParents.has(parent.id)}
                      onChange={() => toggleParentSelection(parent.id)}
                    />
                  </td>
                  <td className="name-cell">
                    <div
                      className="parent-info clickable"
                      onClick={() => router.push(`/admin/parents/${parent.id}`)}
                    >
                      <div className={`avatar ${!parent.is_active ? 'inactive' : ''}`}>
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
                        {parent.students.filter(s => s.is_active).length} {parent.students.filter(s => s.is_active).length === 1 ? 'child' : 'children'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${parent.is_active ? 'active' : 'inactive'}`}>
                      {parent.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => sendBalanceEmail(parent.id, parent.email)}
                        disabled={sendingEmailFor === parent.id || !parent.is_active}
                        className={`action-btn email-btn ${emailSuccess === parent.id ? 'success' : ''} ${!parent.is_active ? 'disabled-action' : ''}`}
                        title={!parent.is_active ? 'Cannot email inactive parent' : ''}
                      >
                        {sendingEmailFor === parent.id ? (
                          <>
                            <span className="btn-spinner" />
                            Sending...
                          </>
                        ) : emailSuccess === parent.id ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Sent!
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                              <polyline points="22,6 12,13 2,6" />
                            </svg>
                            Email Balance
                          </>
                        )}
                      </button>
                      <Link href={`/admin/add-payment?parent=${parent.id}`} className={`action-btn payment-btn ${!parent.is_active ? 'disabled-action' : ''}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        Add Payment
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredParents.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="empty-state">
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
              {filteredParents.length > 0 && (
                <button className="mobile-select-all" onClick={toggleSelectAll}>
                  {selectedParents.size === filteredParents.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
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
                    className={`list-item ${!parent.is_active ? 'inactive-item' : ''}`}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <input
                      type="checkbox"
                      className="list-item-checkbox"
                      checked={selectedParents.has(parent.id)}
                      onChange={() => toggleParentSelection(parent.id)}
                    />
                    <Link href={`/admin/parents/${parent.id}`} className="list-item-link">
                      <div className={`list-item-avatar ${!parent.is_active ? 'inactive' : ''}`}>
                        {parent.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="list-item-content">
                        <div className="list-item-name">
                          {parent.name}
                          {!parent.is_active && <span className="inactive-badge-small">Inactive</span>}
                        </div>
                        <div className="list-item-meta">
                          <span className="list-item-children-count">
                            {parent.students.filter(s => s.is_active).length} {parent.students.filter(s => s.is_active).length === 1 ? 'child' : 'children'}
                          </span>
                          <span className="list-item-email">{parent.email}</span>
                        </div>
                      </div>
                      <svg className="list-item-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
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

          /* Inactive styles */
          .parents-page .mobile-list .list-item.inactive-item {
              opacity: 0.7;
              background: var(--gray-50);
          }

          .parents-page .mobile-list .list-item-avatar.inactive {
              background: linear-gradient(145deg, var(--gray-400) 0%, var(--gray-500) 100%);
              box-shadow: 0 2px 8px rgba(100, 116, 139, 0.25);
          }

          .parents-page .mobile-list .list-item-checkbox {
              width: 20px;
              height: 20px;
              flex-shrink: 0;
              accent-color: var(--aca-teal);
          }

          .parents-page .mobile-list .list-item-link {
              display: flex;
              flex-direction: row;
              align-items: center;
              gap: 14px;
              flex: 1;
              min-width: 0;
              text-decoration: none;
          }

          .parents-page .mobile-list .list-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
          }

          .parents-page .mobile-list .mobile-select-all {
              background: none;
              border: none;
              color: var(--aca-teal);
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
              padding: 4px 8px;
          }

          .inactive-badge-small {
              display: inline-block;
              background: var(--gray-200);
              color: var(--gray-600);
              font-size: 9px;
              padding: 2px 6px;
              border-radius: 4px;
              margin-left: 6px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.02em;
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

        .stat-icon.inactive {
          background: var(--gray-100);
          color: var(--gray-500);
        }

        .inactive-card {
          border-color: var(--gray-300);
        }

        .stat-pill.inactive {
          background: var(--gray-100);
          border-color: var(--gray-200);
          color: var(--gray-600);
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

        .status-filter {
          display: flex;
          align-items: center;
        }

        .status-select {
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

        .status-select:hover {
          border-color: var(--gray-300);
        }

        .status-select:focus {
          outline: none;
          border-color: var(--aca-teal);
          box-shadow: 0 0 0 3px var(--aca-teal-subtle);
        }

        /* Bulk Actions Bar */
        .bulk-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: linear-gradient(135deg, var(--aca-teal-subtle) 0%, var(--white) 100%);
          border: 2px solid var(--aca-teal);
          margin-bottom: 20px;
        }

        .bulk-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .bulk-count {
          font-weight: 600;
          color: var(--aca-teal-dark);
          font-size: 14px;
        }

        .bulk-clear {
          background: none;
          border: none;
          color: var(--gray-500);
          font-size: 13px;
          cursor: pointer;
          text-decoration: underline;
        }

        .bulk-clear:hover {
          color: var(--gray-700);
        }

        .bulk-buttons {
          display: flex;
          gap: 10px;
        }

        .bulk-btn {
          padding: 8px 16px;
          border-radius: var(--border-radius);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all var(--transition-fast);
          border: none;
        }

        .bulk-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .bulk-btn.activate {
          background: var(--success);
          color: var(--white);
        }

        .bulk-btn.activate:hover:not(:disabled) {
          background: #16a34a;
        }

        .bulk-btn.deactivate {
          background: var(--gray-500);
          color: var(--white);
        }

        .bulk-btn.deactivate:hover:not(:disabled) {
          background: var(--gray-600);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: var(--white);
          border-radius: var(--border-radius-lg);
          padding: 24px;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-content h3 {
          margin: 0 0 12px 0;
          font-size: 18px;
          color: var(--gray-800);
        }

        .modal-content p {
          margin: 0 0 8px 0;
          color: var(--gray-600);
          font-size: 14px;
          line-height: 1.5;
        }

        .modal-warning {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          color: #92400e;
          padding: 12px;
          border-radius: var(--border-radius);
          margin: 16px 0;
          font-weight: 500;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .modal-btn {
          padding: 10px 18px;
          border-radius: var(--border-radius);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .modal-btn.secondary {
          background: var(--gray-100);
          color: var(--gray-600);
          border: 1px solid var(--gray-200);
        }

        .modal-btn.secondary:hover {
          background: var(--gray-200);
        }

        .modal-btn.outline {
          background: var(--white);
          color: var(--gray-700);
          border: 2px solid var(--gray-300);
        }

        .modal-btn.outline:hover {
          border-color: var(--gray-400);
          background: var(--gray-50);
        }

        .modal-btn.primary {
          background: var(--error);
          color: var(--white);
          border: none;
        }

        .modal-btn.primary:hover {
          background: #dc2626;
        }

        /* Checkbox column */
        .checkbox-col {
          width: 40px;
          text-align: center;
        }

        .checkbox-col input {
          width: 18px;
          height: 18px;
          accent-color: var(--aca-teal);
          cursor: pointer;
        }

        /* Status badge */
        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .status-badge.active {
          background: var(--success-bg);
          color: var(--success);
        }

        .status-badge.inactive {
          background: var(--gray-100);
          color: var(--gray-500);
        }

        /* Inactive row styles */
        .inactive-row {
          opacity: 0.65;
          background: var(--gray-50);
        }

        .inactive-row:hover {
          opacity: 0.8;
        }

        .avatar.inactive {
          background: linear-gradient(135deg, var(--gray-400) 0%, var(--gray-500) 100%);
        }

        .disabled-action {
          opacity: 0.5;
          pointer-events: none;
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
          white-space: nowrap;
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
          border: none;
          cursor: pointer;
        }

        .email-btn:hover:not(:disabled) {
          background: var(--aca-teal);
          color: var(--white);
        }

        .email-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .email-btn.success {
          background: var(--success-bg);
          color: var(--success);
        }

        .btn-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid currentColor;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }

        .error-toast {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: var(--border-radius-lg);
          color: #dc2626;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 16px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
            display: none !important;
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
