'use client'

import { useSettings } from '../../context/SettingsContext'

export function ScannerTab() {
  const { formData, updateField, saving, handleSave } = useSettings()

  return (
    <div className="tab-panel">
      <h2>Scanner Settings</h2>
      <p className="section-desc">Configure barcode scanner behavior.</p>

      <div className="toggle-card">
        <div className="toggle-info">
          <strong>Sound Effects</strong>
          <span>Play sounds on successful and failed scans</span>
        </div>
        <button
          type="button"
          className={`toggle ${formData.scanner_sound_enabled ? 'on' : ''}`}
          onClick={() => updateField('scanner_sound_enabled', !formData.scanner_sound_enabled)}
        >
          <span className="toggle-handle" />
        </button>
      </div>

      <div className="toggle-card">
        <div className="toggle-info">
          <strong>Auto-Deduct Lunch</strong>
          <span>Automatically deduct a lunch on scan</span>
        </div>
        <button
          type="button"
          className={`toggle ${formData.scanner_auto_deduct ? 'on' : ''}`}
          onClick={() => updateField('scanner_auto_deduct', !formData.scanner_auto_deduct)}
        >
          <span className="toggle-handle" />
        </button>
      </div>

      <div className="toggle-card">
        <div className="toggle-info">
          <strong>Show Student Photo</strong>
          <span>Display student photo after scan (if available)</span>
        </div>
        <button
          type="button"
          className={`toggle ${formData.show_student_photo ? 'on' : ''}`}
          onClick={() => updateField('show_student_photo', !formData.show_student_photo)}
        >
          <span className="toggle-handle" />
        </button>
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
