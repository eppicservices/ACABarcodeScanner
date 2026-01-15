'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Pagination from '@/components/Pagination'
import type { DailyMeal, AppSettings } from '@/types/database'

interface DailyScanStats {
  date: string
  meal_name: string | null
  total_scans: number
  elementary_scans: number
  highschool_scans: number
}

const ITEMS_PER_PAGE = 25

export default function MealStatsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [dailyMeals, setDailyMeals] = useState<DailyMeal[]>([])
  const [scanStats, setScanStats] = useState<DailyScanStats[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Track if we've already auto-synced this session
  const hasAutoSynced = useRef(false)

  // Calendar form state
  const [calendarUrl, setCalendarUrl] = useState('')
  const [calendarEnabled, setCalendarEnabled] = useState(false)

  // Manual meal edit state
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editMealName, setEditMealName] = useState('')

  const fetchData = useCallback(async () => {
    const supabase = createClient()

    // Fetch settings, meals, and transactions
    const [settingsRes, mealsRes, transactionsRes] = await Promise.all([
      supabase.from('app_settings').select('*').eq('id', 1).single(),
      supabase.from('daily_meals').select('*').order('meal_date', { ascending: false }),
      supabase.from('balance_transactions')
        .select('created_at, students(school_level)')
        .eq('transaction_type', 'lunch_used')
        .order('created_at', { ascending: false })
    ])

    if (settingsRes.data) {
      setSettings(settingsRes.data as AppSettings)
      setCalendarUrl(settingsRes.data.calendar_url || '')
      setCalendarEnabled(settingsRes.data.calendar_enabled || false)
    }

    if (mealsRes.data) {
      setDailyMeals(mealsRes.data as DailyMeal[])
    }

    // Process transactions to create daily stats
    if (transactionsRes.data) {
      const statsMap = new Map<string, DailyScanStats>()

      for (const tx of transactionsRes.data) {
        const date = new Date(tx.created_at).toISOString().split('T')[0]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const students = tx.students as any
        const schoolLevel = students?.school_level as string | undefined

        if (!statsMap.has(date)) {
          // Find meal for this date
          const meal = mealsRes.data?.find((m: DailyMeal) => m.meal_date === date)
          statsMap.set(date, {
            date,
            meal_name: meal?.meal_name || null,
            total_scans: 0,
            elementary_scans: 0,
            highschool_scans: 0
          })
        }

        const stats = statsMap.get(date)!
        stats.total_scans++
        if (schoolLevel === 'elementary') {
          stats.elementary_scans++
        } else if (schoolLevel === 'high_school') {
          stats.highschool_scans++
        }
      }

      // Sort by date descending
      const sortedStats = Array.from(statsMap.values()).sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      setScanStats(sortedStats)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-sync calendar on page load if enabled
  useEffect(() => {
    async function autoSync() {
      if (hasAutoSynced.current) return
      if (!settings?.calendar_enabled || !settings?.calendar_url) return

      hasAutoSynced.current = true
      setSyncing(true)

      try {
        const response = await fetch('/api/admin/sync-calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ calendar_url: settings.calendar_url })
        })

        const result = await response.json()

        if (response.ok && result.imported > 0) {
          setLastSynced(new Date())
          fetchData() // Refresh data after sync
        }
      } catch {
        // Silent fail for auto-sync - don't interrupt user
        console.error('Auto-sync failed')
      }

      setSyncing(false)
    }

    if (settings && !loading) {
      autoSync()
    }
  }, [settings, loading, fetchData])

  async function handleSaveCalendarSettings() {
    setSaving(true)
    setMessage(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('app_settings')
      .update({
        calendar_url: calendarUrl || null,
        calendar_enabled: calendarEnabled,
        updated_at: new Date().toISOString(),
        updated_by: user?.id || null
      })
      .eq('id', 1)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Calendar settings saved' })
      fetchData()
    }

    setSaving(false)
  }

  async function handleSyncCalendar() {
    if (!calendarUrl) {
      setMessage({ type: 'error', text: 'Please enter a calendar URL first' })
      return
    }

    setSyncing(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/sync-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendar_url: calendarUrl })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync calendar')
      }

      setMessage({ type: 'success', text: `Synced ${result.imported} meals from calendar` })
      setLastSynced(new Date())
      fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to sync calendar' })
    }

    setSyncing(false)
  }

  async function handleSaveMeal(date: string) {
    if (!editMealName.trim()) {
      setEditingDate(null)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Check if meal already exists for this date
    const existingMeal = dailyMeals.find(m => m.meal_date === date)

    if (existingMeal) {
      await supabase
        .from('daily_meals')
        .update({
          meal_name: editMealName.trim(),
          source: 'manual',
          updated_by: user?.id || null
        })
        .eq('id', existingMeal.id)
    } else {
      await supabase
        .from('daily_meals')
        .insert({
          meal_date: date,
          meal_name: editMealName.trim(),
          source: 'manual',
          updated_by: user?.id || null
        })
    }

    setEditingDate(null)
    setEditMealName('')
    fetchData()
  }

  function startEditMeal(date: string, currentMeal: string | null) {
    setEditingDate(date)
    setEditMealName(currentMeal || '')
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Pagination helpers
  const totalPages = Math.ceil(scanStats.length / ITEMS_PER_PAGE)
  const paginatedStats = scanStats.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading meal stats...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            gap: 16px;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e5e7eb;
            border-top-color: #002c5f;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="meal-stats-page">
      <div className="page-header">
        <h1>Meal Statistics</h1>
        <p className="subtitle">View daily scan statistics and manage meal calendar</p>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="dismiss-btn">×</button>
        </div>
      )}

      {/* Calendar Settings */}
      <div className="settings-card">
        <h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Calendar Integration
        </h2>
        <p className="settings-desc">
          Connect a Google Calendar or iCal URL to automatically import daily meal names.
          Use the public iCal URL from your calendar settings.
        </p>

        <div className="form-group">
          <label htmlFor="calendar-url">Calendar URL (iCal/ICS format)</label>
          <input
            id="calendar-url"
            type="url"
            placeholder="https://calendar.google.com/calendar/ical/..."
            value={calendarUrl}
            onChange={(e) => setCalendarUrl(e.target.value)}
          />
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={calendarEnabled}
              onChange={(e) => setCalendarEnabled(e.target.checked)}
            />
            <span>Enable automatic calendar sync</span>
          </label>
        </div>

        <div className="button-row">
          <button
            onClick={handleSaveCalendarSettings}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            onClick={handleSyncCalendar}
            disabled={syncing || !calendarUrl}
            className="btn btn-secondary"
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {lastSynced && (
          <p className="last-synced">
            Last synced: {lastSynced.toLocaleTimeString()}
          </p>
        )}

        {calendarEnabled && calendarUrl && (
          <p className="auto-sync-note">
            Auto-sync is enabled. Calendar will sync when this page loads.
          </p>
        )}
      </div>

      {/* Stats Table */}
      <div className="stats-card">
        <h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 20V10" />
            <path d="M12 20V4" />
            <path d="M6 20v-6" />
          </svg>
          Daily Scan Statistics
        </h2>

        {scanStats.length === 0 ? (
          <div className="empty-state">
            <p>No scan data available yet.</p>
            <p className="hint">Statistics will appear here once students start scanning.</p>
          </div>
        ) : (
          <>
          <div className="table-container">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Meal</th>
                  <th className="num">Total</th>
                  <th className="num">Elementary</th>
                  <th className="num">High School</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStats.map((stat) => (
                  <tr key={stat.date}>
                    <td className="date-cell">{formatDate(stat.date)}</td>
                    <td className="meal-cell">
                      {editingDate === stat.date ? (
                        <div className="edit-meal-form">
                          <input
                            type="text"
                            value={editMealName}
                            onChange={(e) => setEditMealName(e.target.value)}
                            placeholder="Enter meal name"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveMeal(stat.date)
                              if (e.key === 'Escape') setEditingDate(null)
                            }}
                          />
                          <button onClick={() => handleSaveMeal(stat.date)} className="save-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                          <button onClick={() => setEditingDate(null)} className="cancel-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          className="meal-edit-btn"
                          onClick={() => startEditMeal(stat.date, stat.meal_name)}
                        >
                          {stat.meal_name || <span className="no-meal">Click to add meal</span>}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                      )}
                    </td>
                    <td className="num total-cell">{stat.total_scans}</td>
                    <td className="num elem-cell">{stat.elementary_scans}</td>
                    <td className="num hs-cell">{stat.highschool_scans}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={scanStats.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
            isLoading={loading}
          />
          </>
        )}
      </div>

      <style jsx>{`
        .meal-stats-page {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-header h1 {
          font-size: 24px;
          font-weight: 600;
          color: #002c5f;
          margin: 0 0 8px 0;
        }

        .subtitle {
          color: #64748b;
          margin: 0;
          font-size: 14px;
        }

        .message {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .message.success {
          background: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        }

        .message.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .dismiss-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          opacity: 0.7;
          color: inherit;
        }

        .dismiss-btn:hover {
          opacity: 1;
        }

        .settings-card, .stats-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
        }

        .settings-card h2, .stats-card h2 {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: 600;
          color: #002c5f;
          margin: 0 0 8px 0;
        }

        .settings-desc {
          color: #64748b;
          font-size: 14px;
          margin: 0 0 20px 0;
          line-height: 1.5;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }

        .form-group input[type="url"],
        .form-group input[type="text"] {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #002c5f;
          box-shadow: 0 0 0 3px rgba(0, 44, 95, 0.1);
        }

        .checkbox-group {
          margin-top: 16px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 14px;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #002c5f;
        }

        .button-row {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #002c5f;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #001d3d;
        }

        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #e2e8f0;
        }

        .last-synced {
          margin-top: 12px;
          font-size: 13px;
          color: #64748b;
        }

        .auto-sync-note {
          margin-top: 8px;
          font-size: 13px;
          color: #0ea5e9;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .auto-sync-note::before {
          content: '✓';
          font-weight: bold;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }

        .empty-state p {
          margin: 0 0 8px 0;
        }

        .hint {
          font-size: 13px;
          color: #94a3b8;
        }

        .table-container {
          overflow-x: auto;
          margin-top: 16px;
        }

        .stats-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .stats-table th {
          text-align: left;
          padding: 12px 16px;
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
        }

        .stats-table th.num {
          text-align: right;
        }

        .stats-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .stats-table td.num {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .date-cell {
          font-weight: 500;
          color: #374151;
          white-space: nowrap;
        }

        .meal-cell {
          min-width: 200px;
        }

        .meal-edit-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          transition: all 0.2s;
          text-align: left;
        }

        .meal-edit-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        .meal-edit-btn svg {
          color: #94a3b8;
          flex-shrink: 0;
        }

        .no-meal {
          color: #94a3b8;
          font-style: italic;
        }

        .edit-meal-form {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .edit-meal-form input {
          flex: 1;
          padding: 6px 10px;
          border: 1px solid #002c5f;
          border-radius: 6px;
          font-size: 14px;
          min-width: 150px;
        }

        .save-btn, .cancel-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .save-btn {
          background: #dcfce7;
          color: #166534;
        }

        .save-btn:hover {
          background: #bbf7d0;
        }

        .cancel-btn {
          background: #fef2f2;
          color: #dc2626;
        }

        .cancel-btn:hover {
          background: #fecaca;
        }

        .total-cell {
          font-weight: 600;
          color: #002c5f;
        }

        .elem-cell {
          color: #0ea5e9;
        }

        .hs-cell {
          color: #d4af37;
        }

        @media (max-width: 767px) {
          .meal-stats-page {
            padding: 16px;
            padding-top: 80px;
          }

          .settings-card, .stats-card {
            padding: 16px;
          }

          .button-row {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }

          .stats-table th, .stats-table td {
            padding: 10px 12px;
          }

          .meal-cell {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  )
}
