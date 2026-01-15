'use client'

import { useSettings } from '../../context/SettingsContext'
import type { DayOfWeek } from '@/types/database'

export function NotificationsTab() {
  const { formData, updateField, saving, handleSave } = useSettings()

  return (
    <div className="tab-panel">
      <h2>Notification Settings</h2>
      <p className="section-desc">Configure how and when parents receive notifications.</p>

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

      <div className="form-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
