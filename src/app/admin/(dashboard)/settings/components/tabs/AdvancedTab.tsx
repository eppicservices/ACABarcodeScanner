'use client'

import { useSettings } from '../../context/SettingsContext'

export function AdvancedTab() {
  const { formData, updateField, saving, handleSave } = useSettings()

  return (
    <div className="tab-panel">
      <h2>Advanced Settings</h2>
      <p className="section-desc">Fine-tune timing and behavior settings.</p>

      <h3>Timing Settings</h3>
      <div className="form-stack">
        <div className="form-group">
          <label>Scan Result Display Time (ms)</label>
          <input
            type="number"
            className="input"
            value={formData.scan_display_duration}
            onChange={e => updateField('scan_display_duration', e.target.value)}
            min="1000"
            max="10000"
            step="500"
          />
          <span className="hint">How long the scan result stays on screen (default: 3000ms = 3 seconds)</span>
        </div>

        <div className="form-group">
          <label>Scanner Buffer Timeout (ms)</label>
          <input
            type="number"
            className="input"
            value={formData.scanner_buffer_timeout}
            onChange={e => updateField('scanner_buffer_timeout', e.target.value)}
            min="50"
            max="500"
            step="10"
          />
          <span className="hint">Time to wait for scanner input before clearing (default: 100ms)</span>
        </div>

        <div className="form-group">
          <label>Parent Portal Link Expiry (days)</label>
          <input
            type="number"
            className="input"
            value={formData.parent_token_expiry_days}
            onChange={e => updateField('parent_token_expiry_days', e.target.value)}
            min="1"
            max="90"
          />
          <span className="hint">How long parent portal links remain valid (default: 7 days)</span>
        </div>
      </div>

      <h3>Feature Toggles</h3>
      <div className="toggle-card">
        <div className="toggle-info">
          <strong>Parent Portal</strong>
          <span>Allow parents to view balances and submit payments online</span>
        </div>
        <button
          type="button"
          className={`toggle ${formData.parent_portal_enabled ? 'on' : ''}`}
          onClick={() => updateField('parent_portal_enabled', !formData.parent_portal_enabled)}
        >
          <span className="toggle-handle" />
        </button>
      </div>

      <div className="toggle-card">
        <div className="toggle-info">
          <strong>Manual Entry</strong>
          <span>Show manual barcode entry button on scanner screen</span>
        </div>
        <button
          type="button"
          className={`toggle ${formData.manual_entry_enabled ? 'on' : ''}`}
          onClick={() => updateField('manual_entry_enabled', !formData.manual_entry_enabled)}
        >
          <span className="toggle-handle" />
        </button>
      </div>

      <h3>Security & Performance</h3>
      <div className="form-stack">
        <div className="form-group">
          <label>Minimum Password Length</label>
          <input
            type="number"
            className="input"
            value={formData.password_min_length}
            onChange={e => updateField('password_min_length', e.target.value)}
            min="4"
            max="32"
          />
          <span className="hint">Minimum characters required for admin passwords (default: 6)</span>
        </div>

        <div className="form-group">
          <label>Settings Cache Duration (minutes)</label>
          <input
            type="number"
            className="input"
            value={formData.settings_cache_minutes}
            onChange={e => updateField('settings_cache_minutes', e.target.value)}
            min="1"
            max="60"
          />
          <span className="hint">How long to cache settings before refreshing from database (default: 5 minutes)</span>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
