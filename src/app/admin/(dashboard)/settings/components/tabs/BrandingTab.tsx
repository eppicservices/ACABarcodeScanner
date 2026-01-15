'use client'

import { useSettings } from '../../context/SettingsContext'

export function BrandingTab() {
  const { formData, updateField, saving, handleSave } = useSettings()

  return (
    <div className="tab-panel">
      <h2>Branding & Appearance</h2>
      <p className="section-desc">Customize the look and feel of your lunch program.</p>

      <div className="form-stack">
        <div className="form-group">
          <label>School Logo URL</label>
          <input
            type="url"
            className="input"
            value={formData.school_logo_url}
            onChange={e => updateField('school_logo_url', e.target.value)}
            placeholder="https://your-school.com/logo.png"
          />
          <span className="hint">Used in the scanner header and emails. Leave blank to use default.</span>
        </div>

        {formData.school_logo_url && (
          <div className="logo-preview">
            <label>Logo Preview</label>
            <div className="preview-box">
              <img
                src={formData.school_logo_url}
                alt="School logo preview"
                style={{ maxHeight: '60px', maxWidth: '100%' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Primary Color</label>
          <div className="color-input-row">
            <input
              type="color"
              value={formData.primary_color}
              onChange={e => updateField('primary_color', e.target.value)}
              className="color-picker"
            />
            <input
              type="text"
              className="input"
              value={formData.primary_color}
              onChange={e => updateField('primary_color', e.target.value)}
              placeholder="#002c5f"
            />
          </div>
          <span className="hint">Main brand color used in headers and buttons (default: navy #002c5f)</span>
        </div>

        <div className="form-group">
          <label>Secondary Color</label>
          <div className="color-input-row">
            <input
              type="color"
              value={formData.secondary_color}
              onChange={e => updateField('secondary_color', e.target.value)}
              className="color-picker"
            />
            <input
              type="text"
              className="input"
              value={formData.secondary_color}
              onChange={e => updateField('secondary_color', e.target.value)}
              placeholder="#ffc82e"
            />
          </div>
          <span className="hint">Accent color for highlights (default: gold #ffc82e)</span>
        </div>

        <div className="form-group">
          <label>Accent Color</label>
          <div className="color-input-row">
            <input
              type="color"
              value={formData.accent_color}
              onChange={e => updateField('accent_color', e.target.value)}
              className="color-picker"
            />
            <input
              type="text"
              className="input"
              value={formData.accent_color}
              onChange={e => updateField('accent_color', e.target.value)}
              placeholder="#00b1c1"
            />
          </div>
          <span className="hint">Used for call-to-action buttons (default: teal #00b1c1)</span>
        </div>

        <div className="color-preview">
          <label>Color Preview</label>
          <div className="preview-swatches">
            <div className="swatch" style={{ backgroundColor: formData.primary_color }}>
              <span>Primary</span>
            </div>
            <div className="swatch" style={{ backgroundColor: formData.secondary_color }}>
              <span>Secondary</span>
            </div>
            <div className="swatch" style={{ backgroundColor: formData.accent_color }}>
              <span>Accent</span>
            </div>
          </div>
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
