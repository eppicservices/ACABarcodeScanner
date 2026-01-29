'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useSettings } from '../../context/SettingsContext'
import { HorizontalTabs } from '../HorizontalTabs'
import type { DayOfWeek } from '@prisma/client'

function EmailSetupContent() {
  const { formData, updateField, handleSave, setPreviewTemplate } = useSettings()
  const { data: session } = useSession()
  const [testingEmail, setTestingEmail] = useState(false)

  async function handleTestEmail() {
    setTestingEmail(true)

    // First save the current settings
    await handleSave()

    const userEmail = session?.user?.email
    if (!userEmail) {
      toast.error('Could not get your email address')
      setTestingEmail(false)
      return
    }

    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to send test email')
      } else {
        toast.success(`Test email sent to ${userEmail}`)
      }
    } catch {
      toast.error('Failed to send test email')
    }

    setTestingEmail(false)
  }

  return (
    <>
      <div className="form-group">
        <label>Email Provider</label>
        <select
          className="input"
          value={formData.email_provider}
          onChange={e => updateField('email_provider', e.target.value)}
        >
          <option value="none">None (Email Disabled)</option>
          <option value="gmail">Gmail</option>
          <option value="sendgrid">SendGrid</option>
          <option value="smtp">Custom SMTP</option>
        </select>
      </div>

      {formData.email_provider !== 'none' && (
        <>
          <h3>From Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>From Name</label>
              <input
                type="text"
                className="input"
                value={formData.email_from_name}
                onChange={e => updateField('email_from_name', e.target.value)}
                placeholder="ACA Lunch Program"
              />
              <span className="hint">Display name in emails</span>
            </div>
            <div className="form-group">
              <label>From Email</label>
              <input
                type="email"
                className="input"
                value={formData.email_from_address}
                onChange={e => updateField('email_from_address', e.target.value)}
                placeholder="lunch@school.edu"
              />
              <span className="hint">Sender email address</span>
            </div>
          </div>
        </>
      )}

      {formData.email_provider === 'gmail' && (
        <>
          <h3>Gmail Settings</h3>
          <div className="info-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <div>
              <strong>App Password Required</strong>
              <p>Gmail requires an App Password, not your regular password. Generate one at: Google Account → Security → 2-Step Verification → App passwords</p>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Gmail Address</label>
              <input
                type="email"
                className="input"
                value={formData.gmail_user}
                onChange={e => updateField('gmail_user', e.target.value)}
                placeholder="your.email@gmail.com"
              />
            </div>
            <div className="form-group">
              <label>App Password</label>
              <input
                type="password"
                className="input"
                value={formData.gmail_app_password}
                onChange={e => updateField('gmail_app_password', e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
              />
            </div>
          </div>
        </>
      )}

      {formData.email_provider === 'sendgrid' && (
        <>
          <h3>SendGrid Settings</h3>
          <div className="form-group">
            <label>API Key</label>
            <input
              type="password"
              className="input"
              value={formData.sendgrid_api_key}
              onChange={e => updateField('sendgrid_api_key', e.target.value)}
              placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <span className="hint">Find this in your SendGrid dashboard under Settings → API Keys</span>
          </div>
        </>
      )}

      {formData.email_provider === 'smtp' && (
        <>
          <h3>SMTP Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>SMTP Host</label>
              <input
                type="text"
                className="input"
                value={formData.smtp_host}
                onChange={e => updateField('smtp_host', e.target.value)}
                placeholder="smtp.example.com"
              />
            </div>
            <div className="form-group">
              <label>Port</label>
              <input
                type="number"
                className="input"
                value={formData.smtp_port}
                onChange={e => updateField('smtp_port', e.target.value)}
                placeholder="587"
              />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                className="input"
                value={formData.smtp_user}
                onChange={e => updateField('smtp_user', e.target.value)}
                placeholder="username"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="input"
                value={formData.smtp_password}
                onChange={e => updateField('smtp_password', e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="toggle-card">
            <div className="toggle-info">
              <strong>Use TLS/SSL</strong>
              <span>Enable secure connection (recommended)</span>
            </div>
            <button
              type="button"
              className={`toggle ${formData.smtp_secure ? 'on' : ''}`}
              onClick={() => updateField('smtp_secure', !formData.smtp_secure)}
            >
              <span className="toggle-handle" />
            </button>
          </div>
        </>
      )}

      {formData.email_provider !== 'none' && (
        <div className="test-email-section">
          <button
            className="btn btn-secondary"
            onClick={handleTestEmail}
            disabled={testingEmail}
          >
            {testingEmail ? 'Sending...' : 'Send Test Email'}
          </button>
          <span className="hint">Sends a test email to your admin email address</span>
        </div>
      )}

      <h3>Email Templates</h3>
      <p className="section-desc">Preview the email templates that are sent to parents.</p>

      <div className="template-cards">
        <div className="template-card">
          <div className="template-icon balance">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <div className="template-info">
            <h4>Balance Notification</h4>
            <p>Sent when using &quot;Email Balance&quot; button on the Parents page.</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPreviewTemplate('balance')}
          >
            Preview
          </button>
        </div>

        <div className="template-card">
          <div className="template-icon receipt">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
              <path d="M8 10h8" />
              <path d="M8 14h4" />
            </svg>
          </div>
          <div className="template-info">
            <h4>Payment Receipt</h4>
            <p>Sent automatically after a payment is processed.</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPreviewTemplate('receipt')}
          >
            Preview
          </button>
        </div>

        <div className="template-card">
          <div className="template-icon portal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <div className="template-info">
            <h4>Portal Access Link</h4>
            <p>Sent when a parent requests portal access.</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPreviewTemplate('portal')}
          >
            Preview
          </button>
        </div>
      </div>
    </>
  )
}

function NotificationsContent() {
  const { formData, updateField } = useSettings()

  return (
    <>
      <div className="toggle-card">
        <div className="toggle-info">
          <strong>Enable Notifications</strong>
          <span>Send email alerts to parents</span>
        </div>
        <button
          type="button"
          className={`toggle ${formData.notifications_enabled ? 'on' : ''}`}
          onClick={() => updateField('notifications_enabled', !formData.notifications_enabled)}
        >
          <span className="toggle-handle" />
        </button>
      </div>

      <div className={`notification-options ${!formData.notifications_enabled ? 'disabled' : ''}`}>
        <div className="toggle-card">
          <div className="toggle-info">
            <strong>Zero Balance Alerts</strong>
            <span>Notify when balance reaches zero</span>
          </div>
          <button
            type="button"
            className={`toggle ${formData.zero_balance_alerts ? 'on' : ''}`}
            onClick={() => updateField('zero_balance_alerts', !formData.zero_balance_alerts)}
            disabled={!formData.notifications_enabled}
          >
            <span className="toggle-handle" />
          </button>
        </div>

        <div className="toggle-card">
          <div className="toggle-info">
            <strong>Weekly Summary</strong>
            <span>Send weekly balance summaries to all parents</span>
          </div>
          <button
            type="button"
            className={`toggle ${formData.weekly_summary_enabled ? 'on' : ''}`}
            onClick={() => updateField('weekly_summary_enabled', !formData.weekly_summary_enabled)}
            disabled={!formData.notifications_enabled}
          >
            <span className="toggle-handle" />
          </button>
        </div>

        <div className="form-group">
          <label>Notification Frequency</label>
          <select
            className="input"
            value={formData.notification_frequency}
            onChange={e => updateField('notification_frequency', e.target.value)}
            disabled={!formData.notifications_enabled}
          >
            <option value="immediate">Immediate</option>
            <option value="daily">Daily Digest</option>
          </select>
          <span className="hint">When to send low balance alerts</span>
        </div>

        <h3>Low Balance Thresholds</h3>
        <p className="section-desc">Alert parents when lunches remaining falls below these amounts.</p>

        <div className="form-grid">
          <div className="form-group">
            <label>Elementary Threshold</label>
            <div className="input-with-suffix">
              <input
                type="number"
                className="input"
                value={formData.elementary_low_lunch_threshold}
                onChange={e => updateField('elementary_low_lunch_threshold', e.target.value)}
                min="0"
                disabled={!formData.notifications_enabled}
              />
              <span className="suffix">lunches</span>
            </div>
          </div>

          <div className="form-group">
            <label>High School Threshold</label>
            <div className="input-with-suffix">
              <input
                type="number"
                className="input"
                value={formData.highschool_low_lunch_threshold}
                onChange={e => updateField('highschool_low_lunch_threshold', e.target.value)}
                min="0"
                disabled={!formData.notifications_enabled}
              />
              <span className="suffix">lunches</span>
            </div>
          </div>
        </div>

        <h3>Email Scheduling</h3>
        <p className="section-desc">Control when low balance emails can be sent.</p>

        <div className="form-group">
          <label>Allowed Days</label>
          <div className="day-checkboxes">
            {(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as DayOfWeek[]).map(day => (
              <label key={day} className="day-checkbox">
                <input
                  type="checkbox"
                  checked={formData.email_allowed_days.includes(day)}
                  onChange={e => {
                    const newDays = e.target.checked
                      ? [...formData.email_allowed_days, day]
                      : formData.email_allowed_days.filter(d => d !== day)
                    updateField('email_allowed_days', newDays)
                  }}
                  disabled={!formData.notifications_enabled}
                />
                <span>{day.charAt(0).toUpperCase() + day.slice(1, 3)}</span>
              </label>
            ))}
          </div>
          <span className="hint">Days when emails can be sent</span>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Send Window Start</label>
            <input
              type="time"
              className="input"
              value={formData.email_window_start}
              onChange={e => updateField('email_window_start', e.target.value)}
              disabled={!formData.notifications_enabled}
            />
            <span className="hint">Earliest time to send emails</span>
          </div>

          <div className="form-group">
            <label>Send Window End</label>
            <input
              type="time"
              className="input"
              value={formData.email_window_end}
              onChange={e => updateField('email_window_end', e.target.value)}
              disabled={!formData.notifications_enabled}
            />
            <span className="hint">Latest time to send emails</span>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Timezone</label>
            <select
              className="input"
              value={formData.email_timezone}
              onChange={e => updateField('email_timezone', e.target.value)}
              disabled={!formData.notifications_enabled}
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/Anchorage">Alaska Time (AKT)</option>
              <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Min Days Between Emails</label>
            <div className="input-with-suffix">
              <input
                type="number"
                className="input"
                value={formData.min_days_between_emails}
                onChange={e => updateField('min_days_between_emails', e.target.value)}
                min="0"
                max="30"
                disabled={!formData.notifications_enabled}
              />
              <span className="suffix">days</span>
            </div>
            <span className="hint">Prevent emailing same parent too often</span>
          </div>
        </div>

        <h3>Automatic Sending</h3>
        <p className="section-desc">Automatically send low balance emails on a schedule.</p>

        <div className="toggle-card">
          <div className="toggle-info">
            <strong>Enable Auto-Send</strong>
            <span>Automatically send low balance emails</span>
          </div>
          <button
            type="button"
            className={`toggle ${formData.auto_send_enabled ? 'on' : ''}`}
            onClick={() => updateField('auto_send_enabled', !formData.auto_send_enabled)}
            disabled={!formData.notifications_enabled}
          >
            <span className="toggle-handle" />
          </button>
        </div>

        {formData.auto_send_enabled && (
          <div className="form-grid">
            <div className="form-group">
              <label>Schedule</label>
              <select
                className="input"
                value={formData.auto_send_schedule}
                onChange={e => updateField('auto_send_schedule', e.target.value)}
                disabled={!formData.notifications_enabled}
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays Only</option>
                <option value="weekly">Weekly (Mondays)</option>
              </select>
              <span className="hint">How often to send batch emails</span>
            </div>

            <div className="form-group">
              <label>Send Time</label>
              <input
                type="time"
                className="input"
                value={formData.auto_send_time}
                onChange={e => updateField('auto_send_time', e.target.value)}
                disabled={!formData.notifications_enabled}
              />
              <span className="hint">Time to send batch emails</span>
            </div>
          </div>
        )}

        {formData.auto_send_enabled && (
          <div className="info-box">
            <strong>Cron Setup Required</strong>
            <p>To enable automatic sending, configure a cron job to call:</p>
            <code>POST /api/cron/send-low-balance-emails</code>
            <p className="hint">Include header: <code>Authorization: Bearer YOUR_CRON_SECRET</code></p>
          </div>
        )}
      </div>
    </>
  )
}

export function CommunicationsTab() {
  const { saving, handleSave } = useSettings()

  const tabs = [
    {
      id: 'email',
      label: 'Email Setup',
      content: <EmailSetupContent />
    },
    {
      id: 'notifications',
      label: 'Notifications',
      content: <NotificationsContent />
    }
  ]

  return (
    <div className="tab-panel">
      <h2>Communications</h2>
      <p className="section-desc">Configure email settings and parent notifications.</p>

      <HorizontalTabs tabs={tabs} defaultTab="email" />

      <div className="form-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
