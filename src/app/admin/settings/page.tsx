'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AppSettings } from '@/types/database'

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [elementaryThreshold, setElementaryThreshold] = useState('10.00')
  const [highSchoolThreshold, setHighSchoolThreshold] = useState('15.00')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single()

    if (data) {
      setSettings(data)
      setElementaryThreshold(data.elementary_low_balance_threshold?.toString() || '10.00')
      setHighSchoolThreshold(data.high_school_low_balance_threshold?.toString() || '15.00')
      setNotificationsEnabled(data.notifications_enabled ?? true)
    }
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('app_settings')
      .update({
        elementary_low_balance_threshold: parseFloat(elementaryThreshold),
        high_school_low_balance_threshold: parseFloat(highSchoolThreshold),
        notifications_enabled: notificationsEnabled,
        updated_at: new Date().toISOString(),
        updated_by: user?.id || null,
      })
      .eq('id', 1)

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Settings saved successfully')
      fetchSettings()
    }

    setSaving(false)
  }

  if (loading) {
    return <div className="loading">Loading settings...</div>
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p className="subtitle">Configure notification thresholds and preferences</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSave}>
        <div className="card settings-card">
          <h2>Low Balance Notifications</h2>
          <p className="section-desc">
            Parents will receive an email notification when their child&apos;s account balance
            falls below these thresholds.
          </p>

          <div className="toggle-group">
            <label className="toggle-label">
              <span className="toggle-text">
                <strong>Enable Notifications</strong>
                <span className="toggle-desc">Send email alerts for low balances</span>
              </span>
              <button
                type="button"
                className={`toggle ${notificationsEnabled ? 'on' : ''}`}
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              >
                <span className="toggle-handle" />
              </button>
            </label>
          </div>

          <div className={`threshold-settings ${!notificationsEnabled ? 'disabled' : ''}`}>
            <div className="threshold-group">
              <div className="threshold-header">
                <span className="level-badge elementary">Elementary</span>
              </div>
              <div className="threshold-input">
                <span className="currency">$</span>
                <input
                  type="number"
                  className="input"
                  value={elementaryThreshold}
                  onChange={(e) => setElementaryThreshold(e.target.value)}
                  step="0.01"
                  min="0"
                  disabled={!notificationsEnabled}
                />
              </div>
              <p className="threshold-hint">
                Notify when balance drops below this amount
              </p>
            </div>

            <div className="threshold-group">
              <div className="threshold-header">
                <span className="level-badge high_school">High School</span>
              </div>
              <div className="threshold-input">
                <span className="currency">$</span>
                <input
                  type="number"
                  className="input"
                  value={highSchoolThreshold}
                  onChange={(e) => setHighSchoolThreshold(e.target.value)}
                  step="0.01"
                  min="0"
                  disabled={!notificationsEnabled}
                />
              </div>
              <p className="threshold-hint">
                Notify when balance drops below this amount
              </p>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {settings?.updated_at && (
        <p className="last-updated">
          Last updated: {new Date(settings.updated_at).toLocaleString()}
        </p>
      )}

      <style jsx>{`
        .settings-page {
          max-width: 700px;
        }

        .page-header {
          margin-bottom: 32px;
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

        .alert {
          padding: 12px 16px;
          border-radius: var(--border-radius);
          margin-bottom: 20px;
          font-size: 14px;
        }

        .alert-error {
          background: var(--error-bg);
          color: var(--error);
        }

        .alert-success {
          background: var(--success-bg);
          color: var(--success);
        }

        .settings-card {
          margin-bottom: 24px;
        }

        .settings-card h2 {
          font-size: 18px;
          margin: 0 0 8px 0;
        }

        .section-desc {
          color: var(--gray-500);
          font-size: 14px;
          margin: 0 0 24px 0;
        }

        .toggle-group {
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--gray-100);
        }

        .toggle-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
        }

        .toggle-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .toggle-text strong {
          color: var(--gray-700);
        }

        .toggle-desc {
          font-size: 13px;
          color: var(--gray-400);
        }

        .toggle {
          width: 50px;
          height: 28px;
          background: var(--gray-200);
          border-radius: 14px;
          border: none;
          cursor: pointer;
          position: relative;
          transition: background 0.2s ease;
        }

        .toggle.on {
          background: var(--aca-blue);
        }

        .toggle-handle {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 22px;
          height: 22px;
          background: var(--white);
          border-radius: 50%;
          box-shadow: var(--shadow-sm);
          transition: transform 0.2s ease;
        }

        .toggle.on .toggle-handle {
          transform: translateX(22px);
        }

        .threshold-settings {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .threshold-settings.disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        .threshold-group {
          background: var(--gray-50);
          border-radius: var(--border-radius);
          padding: 20px;
        }

        .threshold-header {
          margin-bottom: 12px;
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

        .threshold-input {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .currency {
          font-size: 20px;
          font-weight: 600;
          color: var(--gray-400);
        }

        .threshold-input .input {
          font-size: 24px;
          font-weight: 600;
          padding: 12px 16px;
        }

        .threshold-hint {
          font-size: 12px;
          color: var(--gray-400);
          margin: 8px 0 0 0;
        }

        .form-actions {
          display: flex;
          gap: 12px;
        }

        .last-updated {
          font-size: 12px;
          color: var(--gray-400);
          margin-top: 16px;
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
