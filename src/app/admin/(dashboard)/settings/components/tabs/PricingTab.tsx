'use client'

import { useSettings } from '../../context/SettingsContext'

export function PricingTab() {
  const { formData, updateField, saving, handleSave } = useSettings()

  return (
    <div className="tab-panel">
      <h2>Lunch Pricing</h2>
      <p className="section-desc">Set the prices for lunches and lunch cards.</p>

      <div className="form-grid">
        <div className="form-group">
          <label>Elementary Lunch Price</label>
          <div className="input-with-prefix">
            <span className="prefix">$</span>
            <input
              type="number"
              className="input"
              value={formData.elementary_lunch_price}
              onChange={e => updateField('elementary_lunch_price', e.target.value)}
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label>High School Lunch Price</label>
          <div className="input-with-prefix">
            <span className="prefix">$</span>
            <input
              type="number"
              className="input"
              value={formData.highschool_lunch_price}
              onChange={e => updateField('highschool_lunch_price', e.target.value)}
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Second Meal Price</label>
          <div className="input-with-prefix">
            <span className="prefix">$</span>
            <input
              type="number"
              className="input"
              value={formData.second_meal_price}
              onChange={e => updateField('second_meal_price', e.target.value)}
              step="0.01"
              min="0"
            />
          </div>
          <span className="hint">Price for additional meals in the same day</span>
        </div>
      </div>

      <h3>Lunch Cards</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>High School Lunch Card Price</label>
          <div className="input-with-prefix">
            <span className="prefix">$</span>
            <input
              type="number"
              className="input"
              value={formData.highschool_lunch_card_price}
              onChange={e => updateField('highschool_lunch_card_price', e.target.value)}
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Lunches per Card</label>
          <input
            type="number"
            className="input"
            value={formData.highschool_lunch_card_lunches}
            onChange={e => updateField('highschool_lunch_card_lunches', e.target.value)}
            min="1"
          />
          <span className="hint">Number of lunches included in a lunch card</span>
        </div>
      </div>

      <h3>Negative Balance Limits</h3>
      <p className="section-desc">How many lunches students can go negative before being blocked.</p>
      <div className="form-grid">
        <div className="form-group">
          <label>Elementary Limit</label>
          <input
            type="number"
            className="input"
            value={formData.elementary_negative_limit}
            onChange={e => updateField('elementary_negative_limit', e.target.value)}
            max="0"
          />
          <span className="hint">Use negative number (e.g., -5)</span>
        </div>

        <div className="form-group">
          <label>High School Limit</label>
          <input
            type="number"
            className="input"
            value={formData.highschool_negative_limit}
            onChange={e => updateField('highschool_negative_limit', e.target.value)}
            max="0"
          />
          <span className="hint">0 means no negative balance allowed</span>
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
