'use client'

import { useSettings } from '../../context/SettingsContext'

export function SchoolInfoTab() {
  const { formData, updateField, saving, handleSave } = useSettings()

  return (
    <div className="tab-panel">
      <h2>School Information</h2>
      <p className="section-desc">Basic school details used in emails and the app.</p>

      <div className="form-grid">
        <div className="form-group">
          <label>School Name</label>
          <input
            type="text"
            className="input"
            value={formData.school_name}
            onChange={e => updateField('school_name', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>School Year</label>
          <input
            type="text"
            className="input"
            value={formData.school_year}
            onChange={e => updateField('school_year', e.target.value)}
            placeholder="2025-2026"
          />
        </div>

        <div className="form-group">
          <label>Contact Email</label>
          <input
            type="email"
            className="input"
            value={formData.contact_email}
            onChange={e => updateField('contact_email', e.target.value)}
            placeholder="lunch@school.edu"
          />
          <span className="hint">Email address for parents to contact with questions</span>
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
