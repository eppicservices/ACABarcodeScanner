'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { HorizontalTabs } from '../HorizontalTabs'
import SchoolCalendarSettings from '@/components/admin/SchoolCalendarSettings'
import { updateSettings } from '@/actions/settings'

function SchoolCalendarContent() {
  const { settings, fetchData, setMessage } = useSettings()

  return (
    <SchoolCalendarSettings
      settings={settings}
      onSettingsChange={async () => {
        await fetchData()
      }}
      onMessage={setMessage}
    />
  )
}

function MealCalendarContent() {
  const { settings, setMessage, fetchData } = useSettings()
  const [calendarUrl, setCalendarUrl] = useState('')
  const [calendarEnabled, setCalendarEnabled] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const hasAutoSynced = useRef(false)

  // Initialize form from settings
  useEffect(() => {
    if (settings) {
      setCalendarUrl(settings.calendarUrl || '')
      setCalendarEnabled(settings.calendarEnabled || false)
    }
  }, [settings])

  // Auto-sync calendar on load if enabled
  useEffect(() => {
    async function autoSync() {
      if (hasAutoSynced.current) return
      if (!settings?.calendarEnabled || !settings?.calendarUrl) return

      hasAutoSynced.current = true
      setSyncing(true)

      try {
        const response = await fetch('/api/admin/sync-calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ calendar_url: settings.calendarUrl })
        })

        const result = await response.json()

        if (response.ok && result.imported > 0) {
          setLastSynced(new Date())
        }
      } catch {
        console.error('Auto-sync failed')
      }

      setSyncing(false)
    }

    if (settings) {
      autoSync()
    }
  }, [settings])

  const handleSaveCalendarSettings = useCallback(async () => {
    setSaving(true)
    setMessage(null)

    try {
      await updateSettings({
        calendarUrl: calendarUrl || null,
        calendarEnabled: calendarEnabled,
      })
      setMessage({ type: 'success', text: 'Calendar settings saved' })
      fetchData()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save settings' })
    }

    setSaving(false)
  }, [calendarUrl, calendarEnabled, setMessage, fetchData])

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
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to sync calendar' })
    }

    setSyncing(false)
  }

  return (
    <div className="meal-calendar-settings">
      <h3>Calendar Integration</h3>
      <p className="section-desc">
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
        <span className="field-hint">When enabled, the meal calendar will sync automatically when the meal stats page loads.</span>
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
          Auto-sync is enabled. Calendar will sync when the meal stats page loads.
        </p>
      )}

      <style jsx>{`
        .meal-calendar-settings h3 {
          font-size: 16px;
          font-weight: 600;
          color: #002c5f;
          margin: 0 0 8px 0;
        }

        .section-desc {
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

        .form-group input[type="url"] {
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

        .field-hint {
          display: block;
          font-size: 12px;
          color: #64748b;
          margin-top: 6px;
          margin-left: 28px;
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

        @media (max-width: 767px) {
          .button-row {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export function CalendarTab() {
  const tabs = [
    {
      id: 'school',
      label: 'School Calendar',
      content: <SchoolCalendarContent />
    },
    {
      id: 'meal',
      label: 'Meal Calendar',
      content: <MealCalendarContent />
    }
  ]

  return (
    <div className="tab-panel">
      <h2>Calendar Settings</h2>
      <p className="section-desc">Configure school calendar dates and meal calendar integration.</p>

      <HorizontalTabs tabs={tabs} defaultTab="school" />
    </div>
  )
}
