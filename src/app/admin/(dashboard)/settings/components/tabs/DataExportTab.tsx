'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSettings } from '../../context/SettingsContext'

export function DataExportTab() {
  const { setMessage } = useSettings()
  const [exporting, setExporting] = useState<string | null>(null)

  async function exportData(type: 'students' | 'transactions' | 'parents') {
    setMessage(null)
    setExporting(type)

    const supabase = createClient()
    let query
    let filename

    if (type === 'students') {
      query = supabase.from('students').select('*, parent:parents(name, email)')
      filename = 'students.csv'
    } else if (type === 'transactions') {
      query = supabase.from('balance_transactions').select('*, student:students(name, barcode)')
      filename = 'transactions.csv'
    } else {
      query = supabase.from('parents').select('*')
      filename = 'parents.csv'
    }

    const { data, error } = await query

    if (error) {
      setMessage({ type: 'error', text: error.message })
      setExporting(null)
      return
    }

    if (!data || data.length === 0) {
      setMessage({ type: 'error', text: 'No data to export' })
      setExporting(null)
      return
    }

    // Convert to CSV
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const val = row[h as keyof typeof row]
          if (typeof val === 'object') return JSON.stringify(val)
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`
          return val
        }).join(',')
      )
    ].join('\n')

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

    setMessage({ type: 'success', text: `${type} exported successfully` })
    setExporting(null)
  }

  return (
    <div className="tab-panel">
      <h2>Data & Export</h2>
      <p className="section-desc">Export your data for backup or analysis.</p>

      <div className="export-grid">
        <div className="export-card">
          <div className="export-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div className="export-info">
            <h4>Students</h4>
            <p>Export all students with their balances and parent info</p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => exportData('students')}
            disabled={exporting !== null}
          >
            {exporting === 'students' ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        <div className="export-card">
          <div className="export-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="export-info">
            <h4>Parents</h4>
            <p>Export all parent contact information</p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => exportData('parents')}
            disabled={exporting !== null}
          >
            {exporting === 'parents' ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        <div className="export-card">
          <div className="export-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
              <path d="M8 10h8" />
              <path d="M8 14h4" />
            </svg>
          </div>
          <div className="export-info">
            <h4>Transactions</h4>
            <p>Export complete transaction history</p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => exportData('transactions')}
            disabled={exporting !== null}
          >
            {exporting === 'transactions' ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>
    </div>
  )
}
