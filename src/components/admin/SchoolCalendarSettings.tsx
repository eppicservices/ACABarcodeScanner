'use client'

import { useState, useEffect, useCallback } from 'react'
import { updateCalendarSettings } from '@/actions/settings'
import type { AppSettings, EmailBlackoutPeriod } from '@prisma/client'

interface SchoolCalendarSettingsProps {
  settings: AppSettings | null
  onSettingsChange: (updates: Partial<AppSettings>) => void
  onMessage: (message: { type: 'success' | 'error'; text: string }) => void
}

interface CalendarStatus {
  canSendEmail: boolean
  reason: string
  isWithinSemester: boolean
  isBlackoutPeriod: boolean
  currentBlackout?: EmailBlackoutPeriod
  nextSchoolDay?: string
}

export default function SchoolCalendarSettings({ settings, onSettingsChange, onMessage }: SchoolCalendarSettingsProps) {
  const [blackoutPeriods, setBlackoutPeriods] = useState<EmailBlackoutPeriod[]>([])
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state for new blackout period
  const [newBlackout, setNewBlackout] = useState({
    name: '',
    start_date: '',
    end_date: '',
    description: ''
  })

  // Local form state for semester dates
  const [localSettings, setLocalSettings] = useState({
    school_calendar_enabled: false,
    fall_semester_start: '',
    fall_semester_end: '',
    spring_semester_start: '',
    spring_semester_end: ''
  })

  const fetchBlackoutPeriods = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/blackout-periods')
      const data = await res.json()
      if (data.periods) {
        setBlackoutPeriods(data.periods)
      }
    } catch (error) {
      console.error('Error fetching blackout periods:', error)
    }
  }, [])

  const fetchCalendarStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/school-calendar-status')
      const data = await res.json()
      if (data.status) {
        setCalendarStatus(data.status)
      }
    } catch (error) {
      console.error('Error fetching calendar status:', error)
    }
  }, [])

  useEffect(() => {
    if (settings) {
      // Convert Date objects to date strings for form inputs
      const formatDateForInput = (date: Date | string | null): string => {
        if (!date) return ''
        if (typeof date === 'string') return date.split('T')[0]
        return date.toISOString().split('T')[0]
      }
      setLocalSettings({
        school_calendar_enabled: settings.schoolCalendarEnabled ?? false,
        fall_semester_start: formatDateForInput(settings.fallSemesterStart),
        fall_semester_end: formatDateForInput(settings.fallSemesterEnd),
        spring_semester_start: formatDateForInput(settings.springSemesterStart),
        spring_semester_end: formatDateForInput(settings.springSemesterEnd)
      })
    }
  }, [settings])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchBlackoutPeriods(), fetchCalendarStatus()])
      setLoading(false)
    }
    loadData()
  }, [fetchBlackoutPeriods, fetchCalendarStatus])

  const handleLocalSettingChange = (field: string, value: string | boolean) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveCalendarSettings = async () => {
    setSaving(true)
    try {
      const result = await updateCalendarSettings({
        schoolCalendarEnabled: localSettings.school_calendar_enabled,
        fallSemesterStart: localSettings.fall_semester_start || null,
        fallSemesterEnd: localSettings.fall_semester_end || null,
        springSemesterStart: localSettings.spring_semester_start || null,
        springSemesterEnd: localSettings.spring_semester_end || null,
      })

      if (!result.success) {
        onMessage({ type: 'error', text: result.error || 'Failed to save settings' })
      } else {
        onMessage({ type: 'success', text: 'School calendar settings saved' })
        // Update parent settings
        onSettingsChange({
          schoolCalendarEnabled: localSettings.school_calendar_enabled,
          fallSemesterStart: localSettings.fall_semester_start ? new Date(localSettings.fall_semester_start) : null,
          fallSemesterEnd: localSettings.fall_semester_end ? new Date(localSettings.fall_semester_end) : null,
          springSemesterStart: localSettings.spring_semester_start ? new Date(localSettings.spring_semester_start) : null,
          springSemesterEnd: localSettings.spring_semester_end ? new Date(localSettings.spring_semester_end) : null
        })
        // Refresh status
        await fetchCalendarStatus()
      }
    } catch {
      onMessage({ type: 'error', text: 'Failed to save settings' })
    }
    setSaving(false)
  }

  const handleAddBlackout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBlackout.name || !newBlackout.start_date || !newBlackout.end_date) {
      onMessage({ type: 'error', text: 'Please fill in all required fields' })
      return
    }

    try {
      const res = await fetch('/api/admin/blackout-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlackout)
      })

      const data = await res.json()

      if (!res.ok) {
        onMessage({ type: 'error', text: data.error || 'Failed to add blackout period' })
      } else {
        onMessage({ type: 'success', text: 'Blackout period added' })
        setNewBlackout({ name: '', start_date: '', end_date: '', description: '' })
        await Promise.all([fetchBlackoutPeriods(), fetchCalendarStatus()])
      }
    } catch {
      onMessage({ type: 'error', text: 'Failed to add blackout period' })
    }
  }

  const handleDeleteBlackout = async (id: string) => {
    if (!confirm('Delete this blackout period?')) return

    try {
      const res = await fetch('/api/admin/blackout-periods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (!res.ok) {
        const data = await res.json()
        onMessage({ type: 'error', text: data.error || 'Failed to delete blackout period' })
      } else {
        onMessage({ type: 'success', text: 'Blackout period deleted' })
        await Promise.all([fetchBlackoutPeriods(), fetchCalendarStatus()])
      }
    } catch {
      onMessage({ type: 'error', text: 'Failed to delete blackout period' })
    }
  }

  const formatDate = (dateInput: Date | string) => {
    if (!dateInput) return ''
    const date = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : dateInput
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="tab-panel">
        <div className="loading-state">Loading school calendar settings...</div>
      </div>
    )
  }

  return (
    <div className="tab-panel">
      <h2>School Calendar</h2>
      <p className="section-desc">Control when balance notification emails are sent based on your school schedule.</p>

      {/* Status Card */}
      {calendarStatus && localSettings.school_calendar_enabled && (
        <div className={`status-card ${calendarStatus.canSendEmail ? 'status-active' : 'status-paused'}`}>
          <div className="status-header">
            <span className={`status-indicator ${calendarStatus.canSendEmail ? 'active' : 'paused'}`}></span>
            <strong>Email Status: {calendarStatus.canSendEmail ? 'Active' : 'Paused'}</strong>
          </div>
          <p className="status-reason">{calendarStatus.reason}</p>
          {calendarStatus.nextSchoolDay && !calendarStatus.canSendEmail && (
            <p className="status-next">Next school day: {formatDate(calendarStatus.nextSchoolDay)}</p>
          )}
        </div>
      )}

      {/* Enable/Disable Toggle */}
      <div className="form-stack">
        <div className="toggle-group">
          <label className="toggle">
            <input
              type="checkbox"
              checked={localSettings.school_calendar_enabled}
              onChange={e => handleLocalSettingChange('school_calendar_enabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
          <div className="toggle-content">
            <span className="toggle-label">Enable School Calendar Control</span>
            <span className="hint">When enabled, emails will only be sent during active semester dates and outside of blackout periods</span>
          </div>
        </div>

        {localSettings.school_calendar_enabled && (
          <>
            {/* Semester Dates */}
            <div className="semester-section">
              <h3>Semester Dates</h3>
              <p className="hint">Define when each semester begins and ends. Emails will only be sent during these periods.</p>

              <div className="semester-grid">
                <div className="semester-card">
                  <h4>Fall Semester</h4>
                  <div className="date-range">
                    <div className="form-group">
                      <label>Start Date</label>
                      <input
                        type="date"
                        className="input"
                        value={localSettings.fall_semester_start}
                        onChange={e => handleLocalSettingChange('fall_semester_start', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input
                        type="date"
                        className="input"
                        value={localSettings.fall_semester_end}
                        onChange={e => handleLocalSettingChange('fall_semester_end', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="semester-card">
                  <h4>Spring Semester</h4>
                  <div className="date-range">
                    <div className="form-group">
                      <label>Start Date</label>
                      <input
                        type="date"
                        className="input"
                        value={localSettings.spring_semester_start}
                        onChange={e => handleLocalSettingChange('spring_semester_start', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input
                        type="date"
                        className="input"
                        value={localSettings.spring_semester_end}
                        onChange={e => handleLocalSettingChange('spring_semester_end', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Blackout Periods */}
            <div className="blackout-section">
              <h3>Blackout Periods</h3>
              <p className="hint">Add breaks or holidays when emails should not be sent, even if within a semester.</p>

              {/* Add New Blackout Form */}
              <form onSubmit={handleAddBlackout} className="blackout-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g., Winter Break"
                      value={newBlackout.name}
                      onChange={e => setNewBlackout(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      className="input"
                      value={newBlackout.start_date}
                      onChange={e => setNewBlackout(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date *</label>
                    <input
                      type="date"
                      className="input"
                      value={newBlackout.end_date}
                      onChange={e => setNewBlackout(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group flex-grow">
                    <label>Description (optional)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Optional notes about this break"
                      value={newBlackout.description}
                      onChange={e => setNewBlackout(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary add-btn">
                    Add Period
                  </button>
                </div>
              </form>

              {/* Blackout Periods List */}
              {blackoutPeriods.length === 0 ? (
                <div className="empty-state">
                  <p>No blackout periods defined yet.</p>
                  <p className="hint">Add breaks like Winter Break, Spring Break, or holidays above.</p>
                </div>
              ) : (
                <div className="blackout-list">
                  {blackoutPeriods.map(period => (
                    <div key={period.id} className="blackout-item">
                      <div className="blackout-info">
                        <strong>{period.name}</strong>
                        <span className="blackout-dates">
                          {formatDate(period.startDate)} - {formatDate(period.endDate)}
                        </span>
                        {period.description && (
                          <span className="blackout-desc">{period.description}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteBlackout(period.id)}
                        className="btn btn-ghost btn-sm delete-btn"
                        title="Delete this blackout period"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="form-actions">
          <button
            onClick={handleSaveCalendarSettings}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : 'Save Calendar Settings'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .status-card {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }
        .status-active {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .status-paused {
          background: rgba(234, 179, 8, 0.1);
          border: 1px solid rgba(234, 179, 8, 0.3);
        }
        .status-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .status-indicator.active {
          background: #22c55e;
        }
        .status-indicator.paused {
          background: #eab308;
        }
        .status-reason {
          margin: 0;
          color: var(--gray-500);
          font-size: 0.875rem;
        }
        .status-next {
          margin: 0.5rem 0 0 0;
          font-size: 0.875rem;
          color: var(--gray-500);
        }
        .toggle-group {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          background: var(--gray-50);
          border-radius: 8px;
        }
        .toggle {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
          flex-shrink: 0;
        }
        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--gray-200);
          transition: 0.3s;
          border-radius: 26px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }
        .toggle input:checked + .toggle-slider {
          background-color: var(--aca-navy);
        }
        .toggle input:checked + .toggle-slider:before {
          transform: translateX(22px);
        }
        .toggle-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .toggle-label {
          font-weight: 500;
        }
        .semester-section, .blackout-section {
          margin-top: 1.5rem;
        }
        .semester-section h3, .blackout-section h3 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }
        .semester-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        .semester-card {
          padding: 1rem;
          background: var(--gray-50);
          border-radius: 8px;
          border: 1px solid var(--gray-200);
        }
        .semester-card h4 {
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          color: var(--gray-500);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .date-range {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .blackout-form {
          background: var(--gray-50);
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .form-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: flex-end;
        }
        .form-row .form-group {
          flex: 1;
          min-width: 140px;
        }
        .form-row .flex-grow {
          flex: 2;
        }
        .add-btn {
          height: 38px;
          white-space: nowrap;
        }
        .blackout-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .blackout-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: var(--gray-50);
          border-radius: 8px;
          border: 1px solid var(--gray-200);
        }
        .blackout-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .blackout-dates {
          font-size: 0.875rem;
          color: var(--gray-500);
        }
        .blackout-desc {
          font-size: 0.75rem;
          color: var(--gray-400);
        }
        .delete-btn {
          color: var(--gray-500);
          padding: 0.5rem;
        }
        .delete-btn:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }
        .empty-state {
          padding: 2rem;
          text-align: center;
          background: var(--gray-50);
          border-radius: 8px;
          margin-top: 1rem;
        }
        .empty-state p {
          margin: 0;
        }
        .form-actions {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--gray-200);
        }
        .loading-state {
          padding: 2rem;
          text-align: center;
          color: var(--gray-500);
        }
      `}</style>
    </div>
  )
}
